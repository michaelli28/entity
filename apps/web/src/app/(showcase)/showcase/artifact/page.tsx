import "../../../(dashboard)/surfaces.css";

export default function ArtifactPreviewPage() {
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
          <p>
            You&rsquo;re building a tool that replaces weekly investor updates
            for seed-stage founders. Your wedge is saving 90 minutes per update
            by auto-summarizing Linear, Notion, and Slack activity into a
            report that matches the founder&rsquo;s voice. You have six design
            partners, none paying yet, and you&rsquo;re two months out from
            your next fundraise.
          </p>
        </div>

        <div>
          <p className="zs-prose__eyebrow">What investors will push on</p>
          <ul>
            <li>
              <span>
                Why not a Zapier recipe? Your differentiation story isn&rsquo;t
                crisp enough to survive a five-minute challenge.
              </span>
            </li>
            <li>
              <span>
                Six design partners, zero paying. What&rsquo;s blocking the
                conversion? If it&rsquo;s price, what does paid conversion look
                like at $0, $99, $499?
              </span>
            </li>
            <li>
              <span>
                Your TAM calc is top-down. Build a bottoms-up version anchored
                on seed-stage founders raising annually.
              </span>
            </li>
          </ul>
        </div>

        <div>
          <p className="zs-prose__eyebrow">Three questions you can&rsquo;t yet answer</p>
          <ul>
            <li>
              <span>
                What&rsquo;s the 90-day retention on a paid customer, measured
                against a cohort who stops using the tool entirely?
              </span>
            </li>
            <li>
              <span>
                If OpenAI ships this as a feature tomorrow, what&rsquo;s the
                moat that survives?
              </span>
            </li>
            <li>
              <span>
                How do you price once the founder has a VA doing 70% of the
                work already?
              </span>
            </li>
          </ul>
        </div>

        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            letterSpacing: "0.08em",
            color: "var(--color-text-dim)",
          }}
        >
          Share link · <code>zstar.ai/cold-read/happy-raven-01</code>
        </p>
      </section>
    </article>
  );
}
