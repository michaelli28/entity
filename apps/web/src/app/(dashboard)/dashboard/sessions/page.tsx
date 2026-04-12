import { SessionGrid } from "@/components/sessions/session-grid";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mentor sessions</h1>
        <p className="text-neutral-400 mt-1">
          Work through your pitch, one session at a time.
        </p>
      </div>
      <SessionGrid />
    </div>
  );
}
