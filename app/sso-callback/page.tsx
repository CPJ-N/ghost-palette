"use client";

import { AuthenticateWithRedirectCallback, useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import posthog from "posthog-js";
import { useEffect, useRef } from "react";

import { Card, CardContent } from "@/components/ui/card";

// New-account heuristic: Clerk's OAuth flow doesn't expose "was this a
// sign-up or sign-in" once we land back here, so treat an account created
// moments ago as a signup — mirrors how the email/password flow distinguishes
// the two via separate handlers, just inferred instead of explicit.
const NEW_ACCOUNT_WINDOW_MS = 60_000;

export default function SSOCallbackPage() {
  const { isSignedIn, user } = useUser();
  const tracked = useRef(false);

  useEffect(() => {
    if (!isSignedIn || !user || tracked.current) return;
    tracked.current = true;

    const email = user.primaryEmailAddress?.emailAddress;
    if (email) posthog.identify(email, { email });

    const provider = user.externalAccounts?.[0]?.provider ?? "oauth";
    const isNewAccount =
      Date.now() - new Date(user.createdAt ?? 0).getTime() < NEW_ACCOUNT_WINDOW_MS;
    posthog.capture(isNewAccount ? "user_signed_up" : "user_signed_in", {
      method: provider,
    });
  }, [isSignedIn, user]);

  return (
    <main className="grid min-h-svh place-items-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-3 py-4 text-center">
          <Loader2
            className="size-6 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">Finishing sign-in…</p>
        </CardContent>
      </Card>
      {/* Mount point for Clerk Smart CAPTCHA during OAuth sign-up (bot protection). */}
      <div id="clerk-captcha" />
      {/* Processes the OAuth redirect, then sends the user to "/". */}
      <AuthenticateWithRedirectCallback />
    </main>
  );
}
