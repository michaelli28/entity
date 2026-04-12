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
    return <div className="p-8">Not found</div>;
  }
  const res = await fetch(`${apiUrl}/api/cold-reads/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return <div className="p-8">Not found</div>;
  const cr = (await res.json()) as ColdRead;
  return (
    <article className="mx-auto max-w-2xl space-y-6 p-8">
      <h1 className="text-3xl font-semibold">Your Cold Read</h1>
      <section>
        <h2 className="mb-2 text-sm uppercase tracking-wide text-white/60">
          What I heard
        </h2>
        <p>{cr.what_i_heard}</p>
      </section>
      <section>
        <h2 className="mb-2 text-sm uppercase tracking-wide text-white/60">
          What investors will push on
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          {cr.investor_pushback.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="mb-2 text-sm uppercase tracking-wide text-white/60">
          Three questions you can&apos;t yet answer
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          {cr.three_unanswered_questions.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      </section>
      {cr.public_slug && (
        <p className="text-xs text-white/50">
          Share link: <code>zstar.ai/cold-read/{cr.public_slug}</code>
        </p>
      )}
    </article>
  );
}
