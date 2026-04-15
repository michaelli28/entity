import { MotionItem, MotionSurface } from "@/components/motion/motion-surface";
import { ContinueSessionsWidget } from "@/components/sessions/continue-sessions-widget";

export default function Page() {
  return (
    <MotionSurface className="en-surface">
      <header className="en-surface__head">
        <MotionItem>
          <p className="en-surface__eyebrow">Dashboard</p>
        </MotionItem>
        <MotionItem>
          <h1 className="en-surface__title">
            Welcome <em>back</em>.
          </h1>
        </MotionItem>
        <MotionItem>
          <p className="en-surface__subtitle">
            Pick up where you left off, or start a new session.
          </p>
        </MotionItem>
      </header>
      <MotionItem>
        <ContinueSessionsWidget />
      </MotionItem>
    </MotionSurface>
  );
}
