import { auth } from "@clerk/nextjs/server";

import {
  MotionItem,
  MotionStagger,
  MotionStaggerItem,
  MotionSurface,
} from "@/components/motion/motion-surface";

type ColdRead = {
  id: string;
  what_i_heard: string;
  investor_pushback: string[];
  three_unanswered_questions: string[];
  public_slug?: string | null;
};

export default async function ArtifactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { getToken } = await auth();
  const token = await getToken({ template: "backend" });
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!token || !apiUrl) {
    return (
      <div className="zs-surface zs-surface--narrow">
        <p className="zs-surface__eyebrow">Not found</p>
      </div>
    );
  }
  const res = await fetch(`${apiUrl}/api/cold-reads/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return (
      <div className="zs-surface zs-surface--narrow">
        <p className="zs-surface__eyebrow">Not found</p>
      </div>
    );
  }
  const cr = (await res.json()) as ColdRead;

  return (
    <MotionSurface className="zs-surface zs-surface--narrow">
      <header className="zs-surface__head">
        <MotionItem>
          <p className="zs-surface__eyebrow">Cold read</p>
        </MotionItem>
        <MotionItem>
          <h1 className="zs-surface__title">
            Your mentor&rsquo;s first <em>read</em>.
          </h1>
        </MotionItem>
        <MotionItem>
          <p className="zs-surface__subtitle">
            What I heard, what investors will press on, and what you
            can&rsquo;t yet answer.
          </p>
        </MotionItem>
      </header>

      <MotionItem>
        <section className="zs-prose">
          <MotionStagger stagger={0.07} delay={0.1}>
            <MotionStaggerItem>
              <div>
                <p className="zs-prose__eyebrow">What I heard</p>
                <p>{cr.what_i_heard}</p>
              </div>
            </MotionStaggerItem>

            <MotionStaggerItem>
              <div>
                <p className="zs-prose__eyebrow">What investors will push on</p>
                <ul>
                  {cr.investor_pushback.map((p) => (
                    <li key={p}>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </MotionStaggerItem>

            <MotionStaggerItem>
              <div>
                <p className="zs-prose__eyebrow">
                  Three questions you can&rsquo;t yet answer
                </p>
                <ul>
                  {cr.three_unanswered_questions.map((q) => (
                    <li key={q}>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </MotionStaggerItem>

            {cr.public_slug && (
              <MotionStaggerItem>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6875rem",
                    letterSpacing: "0.08em",
                    color: "var(--color-text-dim)",
                  }}
                >
                  Share link · <code>zstar.ai/cold-read/{cr.public_slug}</code>
                </p>
              </MotionStaggerItem>
            )}
          </MotionStagger>
        </section>
      </MotionItem>
    </MotionSurface>
  );
}
