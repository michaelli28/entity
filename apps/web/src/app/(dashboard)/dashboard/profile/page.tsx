import { MotionSurface } from "@/components/motion/motion-surface";
import { ProfileAnalysis } from "@/components/profile/profile-analysis";

export default function Page() {
  return (
    <MotionSurface className="en-surface">
      <ProfileAnalysis />
    </MotionSurface>
  );
}
