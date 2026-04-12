import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <h1 className="mb-4 text-2xl font-semibold">ZStar is invite-only</h1>
      <p className="mb-6 text-sm text-white/60">
        If you have an invite link, click it to continue. Otherwise,{" "}
        <a href="/waitlist" className="underline">
          join the waitlist
        </a>
        .
      </p>
      <SignUp appearance={{ baseTheme: undefined }} />
    </div>
  );
}
