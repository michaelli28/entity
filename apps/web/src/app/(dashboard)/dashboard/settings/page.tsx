import { SignOutButton } from "@clerk/nextjs";

import { InviteCofounderSection } from "@/components/invite-cofounder-section";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Settings</h1>
      <section className="space-y-4">
        <InviteCofounderSection />
        <div className="rounded-lg border border-white/10 p-4">
          <h2 className="mb-2 font-medium">Privacy</h2>
          <p className="text-sm text-white/60">
            Your conversations are processed by Anthropic and stored encrypted.
            See our{" "}
            <a href="/privacy" className="underline">
              privacy policy
            </a>
            .
          </p>
        </div>
        <div className="rounded-lg border border-white/10 p-4">
          <h2 className="mb-2 font-medium">Account</h2>
          <SignOutButton>Sign out</SignOutButton>
        </div>
      </section>
    </div>
  );
}
