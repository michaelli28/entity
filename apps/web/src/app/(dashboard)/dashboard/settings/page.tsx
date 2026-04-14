import { SignOutButton } from "@clerk/nextjs";

import { InviteCofounderSection } from "@/components/invite-cofounder-section";
import { HardResetSection } from "@/components/settings/hard-reset-section";
import { ProfileLinksForm } from "@/components/settings/profile-links-form";

export default function SettingsPage() {
  return (
    <div className="zs-surface zs-surface--narrow">
      <header className="zs-surface__head">
        <p className="zs-surface__eyebrow">Settings</p>
        <h1 className="zs-surface__title">
          Configure <em>how the mentor sees you</em>.
        </h1>
      </header>

      <ProfileLinksForm />

      <InviteCofounderSection />

      <section className="zs-card">
        <div>
          <h2 className="zs-card__title">Privacy</h2>
          <p className="zs-card__subtitle">
            Your conversations are processed by Anthropic and stored encrypted.
            See our{" "}
            <a
              href="/privacy"
              style={{
                color: "var(--color-accent)",
                textDecoration: "underline",
              }}
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
        <SignOutButton>
          <button
            type="button"
            className="zs-button"
            data-variant="ghost"
            style={{ alignSelf: "flex-start" }}
          >
            Sign out
          </button>
        </SignOutButton>
      </section>

      <HardResetSection />
    </div>
  );
}
