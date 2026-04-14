import { ContinueSessionsWidget } from "@/components/sessions/continue-sessions-widget";

export default function Page() {
  return (
    <div className="zs-surface">
      <header className="zs-surface__head">
        <p className="zs-surface__eyebrow">Dashboard</p>
        <h1 className="zs-surface__title">
          Welcome <em>back</em>.
        </h1>
        <p className="zs-surface__subtitle">
          Pick up where you left off, or start a new session.
        </p>
      </header>
      <ContinueSessionsWidget />
    </div>
  );
}
