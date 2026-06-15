"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export default function SSOCallbackPage() {
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
