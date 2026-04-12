import { ContinueSessionsWidget } from "@/components/sessions/continue-sessions-widget";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </div>
      <ContinueSessionsWidget />
    </div>
  );
}
