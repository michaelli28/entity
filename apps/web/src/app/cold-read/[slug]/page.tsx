type PublicColdRead = {
  what_i_heard: string;
  investor_pushback: string[];
  three_unanswered_questions: string[];
  founder_name?: string;
  company_name?: string;
};

export default async function PublicColdReadPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return <div className="p-8">Not found</div>;
  const res = await fetch(`${apiUrl}/api/cold-reads/public/${slug}`, {
    cache: "no-store",
  });
  if (!res.ok) return <div className="p-8">Not found</div>;
  const cr = (await res.json()) as PublicColdRead;
  return (
    <article className="mx-auto max-w-2xl space-y-6 p-8">
      <h1 className="text-3xl font-semibold">
        {cr.company_name ?? "Untitled"} — Cold Read
      </h1>
      {cr.founder_name && <p className="text-white/60">by {cr.founder_name}</p>}
      <section>
        <h2 className="text-lg font-medium">What the mentor heard</h2>
        <p>{cr.what_i_heard}</p>
      </section>
      <section>
        <h2 className="text-lg font-medium">Investor pushback</h2>
        <ul className="list-disc pl-5">
          {cr.investor_pushback.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-medium">Unanswered questions</h2>
        <ul className="list-disc pl-5">
          {cr.three_unanswered_questions.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}
