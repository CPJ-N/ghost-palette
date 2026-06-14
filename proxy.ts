import { clerkMiddleware } from "@clerk/nextjs/server";

// Clerk runs on every matched route to provide session context, but nothing is
// force-protected yet — the landing page and workbench stay public for the MVP.
// To gate an area later, add createRouteMatcher + auth.protect() back here.
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
