import { MotionItem, MotionSurface } from "@/components/motion/motion-surface";
import { SessionGrid } from "@/components/sessions/session-grid";

export default function Page() {
  return (
    <MotionSurface className="en-surface">
      <header className="en-surface__head">
        <MotionItem>
          <p className="en-surface__eyebrow">Mentor sessions</p>
        </MotionItem>
        <MotionItem>
          <h1 className="en-surface__title">
            Work through your pitch, <em>one session at a time</em>.
          </h1>
        </MotionItem>
        <MotionItem>
          <p className="en-surface__subtitle">
            Four structured conversations cover the ground investors press on.
            Finish one, the mentor picks the next.
          </p>
        </MotionItem>
      </header>
      <MotionItem>
        <SessionGrid />
      </MotionItem>
    </MotionSurface>
  );
}
