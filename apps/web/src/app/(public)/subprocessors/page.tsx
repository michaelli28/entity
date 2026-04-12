const PROCESSORS = [
  { name: "Clerk", purpose: "Authentication", data: "Email, OAuth profile" },
  {
    name: "Anthropic",
    purpose: "LLM processing (Claude)",
    data: "Conversation content",
  },
  {
    name: "Supabase",
    purpose: "Database + storage",
    data: "All account data",
  },
  { name: "Vercel", purpose: "Frontend hosting", data: "Request logs, IP" },
  { name: "Railway", purpose: "Backend hosting", data: "Request logs, IP" },
  {
    name: "Sentry",
    purpose: "Error monitoring",
    data: "Stack traces (PII scrubbed)",
  },
  {
    name: "PostHog",
    purpose: "Product analytics",
    data: "Events, user ID (no message content)",
  },
  {
    name: "Resend",
    purpose: "Transactional email",
    data: "Email address, name",
  },
];

export default function Subprocessors() {
  return (
    <article>
      <h1>Sub-processors</h1>
      <p>We use these third parties to run ZStar:</p>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Purpose</th>
            <th>Data shared</th>
          </tr>
        </thead>
        <tbody>
          {PROCESSORS.map((p) => (
            <tr key={p.name}>
              <td>{p.name}</td>
              <td>{p.purpose}</td>
              <td>{p.data}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
