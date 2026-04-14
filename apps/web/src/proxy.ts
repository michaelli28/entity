import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/privacy",
  "/terms",
  "/subprocessors",
  "/showcase(.*)",
  "/cold-read/(.*)",
  "/api/webhooks(.*)",
]);

/**
 * Clerk auth middleware — blocks unauthenticated access to non-public routes.
 *
 * Onboarding enforcement lives in the dashboard layout via a
 * GET /api/founders/me call (see app/dashboard/layout.tsx) rather than
 * middleware, so the backend remains the source of truth for
 * onboarding_completed_at without requiring a Clerk JWT-template claim.
 */
export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
