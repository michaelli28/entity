"use client";
import { useEffect, useRef, useState } from "react";

type Quote = {
  text: React.ReactNode;
  attribution: string;
};

const QUOTES: readonly Quote[] = [
  {
    text: (
      <>
        A good session ends with the founder <em>clearer</em> and energized to
        work. Not praised. Not entertained.
      </>
    ),
    attribution: "Entity — operating principle",
  },
  {
    text: (
      <>
        The mentor is a peer-reviewer for your <em>next move</em>, not a
        cheerleader for your last one.
      </>
    ),
    attribution: "Entity — operating principle",
  },
  {
    text: (
      <>
        Replace doom-scrolling founder Twitter at 11pm with something that
        actually <em>sharpens</em> the narrative.
      </>
    ),
    attribution: "Entity — what we&rsquo;re for",
  },
];

const ROTATE_MS = 7500;

export function AuthQuote() {
  const [index, setIndex] = useState(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setIndex(Math.floor(Math.random() * QUOTES.length));
      return;
    }
    const id = window.setInterval(() => {
      if (pausedRef.current) return;
      setIndex((i) => (i + 1) % QUOTES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <figure
      className="en-auth-quote"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      <span className="en-auth-quote__mark" aria-hidden="true">&ldquo;</span>
      <div className="en-auth-quote__slides" aria-live="polite">
        {QUOTES.map((q, i) => (
          <div
            key={i}
            className="en-auth-quote__slide"
            data-active={i === index || undefined}
            aria-hidden={i === index ? undefined : true}
          >
            <p className="en-auth-quote__text">{q.text}</p>
            <figcaption className="en-auth-quote__attrib">
              {q.attribution}
            </figcaption>
          </div>
        ))}
      </div>
      <div className="en-auth-quote__dots" role="tablist" aria-label="Quotes">
        {QUOTES.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            className="en-auth-quote__dot"
            data-active={i === index || undefined}
            aria-selected={i === index}
            aria-label={`Quote ${i + 1} of ${QUOTES.length}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </figure>
  );
}
