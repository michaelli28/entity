"use client";
import "../../../(dashboard)/surfaces.css";

export default function SettingsPreviewPage() {
  return (
    <div className="zs-surface zs-surface--narrow">
      <header className="zs-surface__head">
        <p className="zs-surface__eyebrow">Settings</p>
        <h1 className="zs-surface__title">
          Configure <em>how the mentor sees you</em>.
        </h1>
      </header>

      <form className="zs-card zs-surface-form">
        <div>
          <h2 className="zs-card__title">Public links</h2>
          <p className="zs-card__subtitle">
            Share where your mentor should look. These get passed into the
            mentor&rsquo;s system prompt so it can reason about your background.
          </p>
        </div>
        <label className="zs-input-field">
          <span className="zs-input-field__label">LinkedIn URL</span>
          <input
            type="url"
            defaultValue="https://linkedin.com/in/ada-lovelace"
            className="zs-input"
          />
        </label>
        <label className="zs-input-field">
          <span className="zs-input-field__label">GitHub username</span>
          <input type="text" defaultValue="adalovelace" className="zs-input" />
          <span className="zs-input-field__hint">
            We&rsquo;ll fetch your public GitHub profile and top repos.
          </span>
        </label>
        <label className="zs-input-field">
          <span className="zs-input-field__label">Website URL</span>
          <input
            type="url"
            defaultValue="https://analytical-engine.co"
            className="zs-input"
          />
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
          <button type="button" className="zs-button" data-variant="primary">
            Save
          </button>
          <span className="zs-input-ok">Saved</span>
        </div>
      </form>

      <section className="zs-card">
        <div>
          <h2 className="zs-card__title">Co-founder</h2>
          <p className="zs-card__subtitle">
            Invite a co-founder to join your workspace. They&rsquo;ll have
            access to the same mentor and signal dashboard.
          </p>
        </div>
        <button
          type="button"
          className="zs-button"
          data-variant="ghost"
          style={{ alignSelf: "flex-start" }}
        >
          Invite co-founder
        </button>
      </section>

      <section className="zs-card">
        <div>
          <h2 className="zs-card__title">Privacy</h2>
          <p className="zs-card__subtitle">
            Your conversations are processed by Anthropic and stored encrypted.
            See our{" "}
            <a
              href="/privacy"
              style={{ color: "var(--color-accent)", textDecoration: "underline" }}
            >
              privacy policy
            </a>
            .
          </p>
        </div>
      </section>

      <section className="zs-card">
        <div>
          <h2 className="zs-card__title">Account</h2>
          <p className="zs-card__subtitle">
            Signed in via Clerk. Sign out ends your session on this device.
          </p>
        </div>
        <button
          type="button"
          className="zs-button"
          data-variant="ghost"
          style={{ alignSelf: "flex-start" }}
        >
          Sign out
        </button>
      </section>

      <section className="zs-card zs-card--danger">
        <div>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.625rem",
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--color-signal-neg)",
              margin: 0,
            }}
          >
            Danger zone
          </p>
          <h2 className="zs-card__title" style={{ marginTop: "0.375rem" }}>
            Hard reset
          </h2>
          <p className="zs-card__subtitle">
            Wipes every mentor session, message, score, cold read, and summary
            tied to your account. Your profile stays so you can start fresh.
          </p>
        </div>
        <button
          type="button"
          className="zs-button"
          data-variant="danger"
          style={{ alignSelf: "flex-start" }}
        >
          Hard reset my account
        </button>
      </section>
    </div>
  );
}
