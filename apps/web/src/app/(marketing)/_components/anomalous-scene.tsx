"use client";

/*
 * Anomalous-matter shader scene — adapted from a 21st.dev concept.
 *
 * Adaptations from the original snippet:
 *  - Retuned to Entity violet palette (sRGB output mapped to OKLCH-ish target)
 *  - Fixed a uniform-name mismatch bug (vertex declared pointLightPos,
 *    fragment expected pointLightPosition — unified to uLightPos)
 *  - Capped devicePixelRatio at 1.5 to keep marketing CWV healthy
 *  - Pauses animation when off-screen (IntersectionObserver) and when tab
 *    is hidden (visibilitychange) — saves battery on long-scroll dwell
 *  - Honours prefers-reduced-motion: renders a single static frame, no RAF
 *  - Uses local listeners on the wrapper, not window — no scroll jank
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface AnomalousSceneProps {
  className?: string;
}

const VERTEX = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vPosition;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  void main() {
    vNormal = normal;
    vPosition = position;
    float displacement = snoise(position * 1.6 + uTime * 0.45) * 0.22;
    vec3 newPosition = position + normal * displacement;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uColorDark;   // unlit / ambient base
  uniform vec3 uColorLit;    // hot illuminated colour
  uniform vec3 uColorRim;    // rim glow
  uniform vec3 uLightPos;    // orbiting light position (world space)
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 toLight = uLightPos - vPosition;
    float dist = length(toLight);
    vec3 lightDir = toLight / max(dist, 0.0001);

    // Diffuse with quadratic falloff — gives the light a real "hot spot"
    // that traces around the geometry as the orbit advances.
    float diffuse = max(dot(normal, lightDir), 0.0);
    float falloff = 1.0 / (1.0 + dist * dist * 0.45);
    float litness = clamp(diffuse * falloff * 5.0, 0.0, 1.6);

    // Re-colour the surface: dark base → hot lit colour where the light hits
    vec3 surface = mix(uColorDark, uColorLit, min(litness, 1.0));

    // Overdrive pass for very intensely-lit patches
    surface += uColorLit * max(litness - 1.0, 0.0) * 0.4;

    // Soft rim glow — present always, gives silhouette
    float fresnel = 1.0 - dot(normal, vec3(0.0, 0.0, 1.0));
    fresnel = pow(fresnel, 2.6);
    surface += uColorRim * fresnel * 0.35;

    gl_FragColor = vec4(surface, 0.85);
  }
`;

export function AnomalousScene({ className }: AnomalousSceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      mount.clientWidth / Math.max(mount.clientHeight, 1),
      0.1,
      100,
    );
    camera.position.z = 3.2;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Violet ramp — dark unlit base, hot lit accent, soft rim
    const colorDark = new THREE.Color().setHSL(0.74, 0.55, 0.10); // near-black violet
    const colorLit = new THREE.Color().setHSL(0.81, 1.0, 0.70);   // hot luminous pink-violet
    const colorRim = new THREE.Color().setHSL(0.76, 0.7, 0.40);   // restrained mid violet

    // Detail 16 gives ~5k triangles — plenty of vertex density for the
    // snoise displacement (frequency 1.6 → ~12 samples per wavelength, well
    // above Nyquist) at ~25× less GPU load than the original detail=80.
    // Heavy geometry here caused visible hitches on scroll near the
    // pin-stage opacity fade and sticky release.
    const geometry = new THREE.IcosahedronGeometry(1.5, 16);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorDark: { value: colorDark },
        uColorLit: { value: colorLit },
        uColorRim: { value: colorRim },
        uLightPos: { value: new THREE.Vector3(2.5, 0, 1.2) },
      },
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      wireframe: true,
      transparent: true,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    // Anchor the geometry toward the TOP of the viewport so it reads as
    // "perched at the top of the page" rather than centred. Some clipping
    // above the viewport is intentional — implies the shape extends beyond.
    mesh.position.y = 0.65;
    scene.add(mesh);

    // ── Lifecycle: pause on offscreen / hidden tab ─────────────────────
    let frameId: number | null = null;
    let visible = true;
    let inView = true;

    const renderOnce = () => {
      renderer.render(scene, camera);
    };

    // Orbiting light state — the light traces a circle in front of the
    // geometry. Radius chosen so the hot spot visibly crosses the whole
    // silhouette; speed tuned slow so the motion feels ambient, not frantic.
    const ORBIT_RADIUS_X = 2.6;
    const ORBIT_RADIUS_Y = 1.3;
    const ORBIT_SPEED = 0.35; // radians per second
    const ORBIT_Z = 1.2;       // in front of the geometry (which is at z≈0)

    const animate = (t: number) => {
      const time = t * 0.001; // seconds
      material.uniforms.uTime.value = time * 0.3;

      const angle = time * ORBIT_SPEED;
      material.uniforms.uLightPos.value.set(
        Math.cos(angle) * ORBIT_RADIUS_X,
        // Raise the orbit slightly so the hot spot tracks near the visible
        // portion of the mesh (which is anchored at y=0.65)
        Math.sin(angle) * ORBIT_RADIUS_Y + 0.4,
        ORBIT_Z,
      );

      mesh.rotation.y += 0.0008;
      mesh.rotation.x += 0.0003;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    const start = () => {
      if (frameId !== null) return;
      if (reducedMotion) {
        renderOnce();
        return;
      }
      frameId = requestAnimationFrame(animate);
    };

    const stop = () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
    };

    start();

    // ── Resize ─────────────────────────────────────────────────────────
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    ro.observe(mount);

    // ── Visibility: pause when tab hidden ──────────────────────────────
    const onVisibility = () => {
      visible = document.visibilityState === "visible";
      if (visible && inView) start();
      else stop();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // ── IntersectionObserver: pause when scrolled off-screen ───────────
    // rootMargin wakes the RAF ~40% of viewport before the canvas re-enters
    // view, so the first rendered frame on scroll-up happens off-screen
    // rather than stuttering visibly at the transition boundary.
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView && visible) start();
        else stop();
      },
      { threshold: 0, rootMargin: "40% 0px 40% 0px" },
    );
    io.observe(mount);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
      aria-hidden="true"
    />
  );
}
