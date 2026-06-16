import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// The marketing landing (/) and auth pages stay public; the app + API routes
// require a signed-in Clerk session.
const isProtected = createRouteMatcher([
  "/composer(.*)",
  "/arena(.*)",
  "/evals(.*)",
  "/library(.*)",
  "/settings(.*)",
  "/api/(.*)",
]);

// Public API routes that must NOT require a Clerk session (Stripe can't carry one).
const isPublicApi = createRouteMatcher(["/api/stripe/webhook"]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtected(request) && !isPublicApi(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
