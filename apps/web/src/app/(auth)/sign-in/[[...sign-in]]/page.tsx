import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

import { clerkAuthAppearance } from "../../_components/clerk-appearance";

export default function SignInPage() {
  return (
    <>
      <p className="zs-auth-widget__eyebrow">Sign in</p>
      <h1 className="zs-auth-widget__title">
        Welcome <em>back</em>.
      </h1>
      <p className="zs-auth-widget__lede">
        Pick up where you left off. Your last session is still there.
      </p>

      <SignIn
        appearance={clerkAuthAppearance}
        forceRedirectUrl="/dashboard"
        signUpForceRedirectUrl="/onboarding"
      />

      <p className="zs-auth-widget__switch">
        New here? <Link href="/sign-up">Create an account →</Link>
      </p>
    </>
  );
}
