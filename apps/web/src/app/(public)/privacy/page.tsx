export default function Privacy() {
  return (
    <article>
      <h1>Privacy Policy</h1>
      <p>Last updated: 2026-04-12</p>
      <h2>What we collect</h2>
      <ul>
        <li>
          Account info via Clerk: email, name, OAuth profile (LinkedIn, GitHub)
        </li>
        <li>Conversations with the AI mentor (stored encrypted in Supabase)</li>
        <li>
          Startup profile you enter (company name, stage, one-liner, etc.)
        </li>
        <li>
          Usage telemetry via PostHog (page views, feature usage — no message
          content)
        </li>
        <li>Errors via Sentry (stack traces — message content redacted)</li>
      </ul>
      <h2>How we process conversations</h2>
      <p>
        Your messages are sent to Anthropic&apos;s Claude API for processing. We
        have requested Zero Data Retention from Anthropic. Anthropic does not
        train on API customer data.
      </p>
      <h2>Your rights (GDPR / CCPA)</h2>
      <p>
        You can request export of your data at{" "}
        <code>/api/founders/me/export</code>. Deletion requests via your Clerk
        account or <a href="mailto:privacy@entity.ai">privacy@entity.ai</a>. We
        hard-delete within 30 days.
      </p>
      <h2>Third parties</h2>
      <p>
        See our <a href="/subprocessors">sub-processors list</a>.
      </p>
    </article>
  );
}
