import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Image generation workflows — require a signed-in Clerk session.
const isProtected = createRouteMatcher([
  "/composer(.*)",
  "/arena(.*)",
  "/evals(.*)",
  "/library(.*)",
  "/settings(.*)",
]);

// Generation APIs only (benchmark suite runs generate + grade images).
const isProtectedApi = createRouteMatcher([
  "/api/credits(.*)",
  "/api/generate(.*)",
  "/api/benchmark/(.*)",
  "/api/stripe/checkout(.*)",
  "/api/stripe/portal(.*)",
]);

// Public API routes that must NOT require a Clerk session (Stripe can't carry one).
const isPublicApi = createRouteMatcher([
  "/api/stripe/webhook",
  "/api/clerk/webhook",
]);

export default clerkMiddleware(async (auth, request) => {
  const needsAuth =
    (isProtected(request) || isProtectedApi(request)) && !isPublicApi(request);

  if (needsAuth) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
