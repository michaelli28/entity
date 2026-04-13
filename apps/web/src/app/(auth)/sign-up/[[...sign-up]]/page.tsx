import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <h1 className="mb-4 text-2xl font-semibold">Create your ZStar account</h1>
      <p className="mb-6 text-sm text-white/60">
        Sign up to start your first mentor session.
      </p>
      <SignUp
        appearance={{ baseTheme: undefined }}
        fallbackRedirectUrl="/onboarding"
      />
    </div>
  );
}
