import { MotionItem, MotionSurface } from "@/components/motion/motion-surface";
import { SessionGrid } from "@/components/sessions/session-grid";

export default function Page() {
  return (
    <MotionSurface className="zs-surface">
      <header className="zs-surface__head">
        <MotionItem>
          <p className="zs-surface__eyebrow">Mentor sessions</p>
        </MotionItem>
        <MotionItem>
          <h1 className="zs-surface__title">
            Work through your pitch, <em>one session at a time</em>.
          </h1>
        </MotionItem>
        <MotionItem>
          <p className="zs-surface__subtitle">
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
