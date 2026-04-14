import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

import { clerkAuthAppearance } from "../../_components/clerk-appearance";

export default function SignUpPage() {
  return (
    <>
      <p className="zs-auth-widget__eyebrow">Create account</p>
      <h1 className="zs-auth-widget__title">
        Start your <em>first session</em>.
      </h1>
      <p className="zs-auth-widget__lede">
        Two minutes to set up. Free while we&rsquo;re in early access.
      </p>

      <SignUp
        appearance={clerkAuthAppearance}
        forceRedirectUrl="/onboarding"
      />

      <p className="zs-auth-widget__switch">
        Already have an account? <Link href="/sign-in">Sign in →</Link>
      </p>
    </>
  );
}
