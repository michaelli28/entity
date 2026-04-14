import { auth } from "@clerk/nextjs/server";

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
    <article className="zs-surface zs-surface--narrow">
      <header className="zs-surface__head">
        <p className="zs-surface__eyebrow">Cold read</p>
        <h1 className="zs-surface__title">
          Your mentor&rsquo;s first <em>read</em>.
        </h1>
        <p className="zs-surface__subtitle">
          What I heard, what investors will press on, and what you can&rsquo;t
          yet answer.
        </p>
      </header>

      <section className="zs-prose">
        <div>
          <p className="zs-prose__eyebrow">What I heard</p>
          <p>{cr.what_i_heard}</p>
        </div>

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

        <div>
          <p className="zs-prose__eyebrow">Three questions you can&rsquo;t yet answer</p>
          <ul>
            {cr.three_unanswered_questions.map((q) => (
              <li key={q}>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>

        {cr.public_slug && (
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
        )}
      </section>
    </article>
  );
}
