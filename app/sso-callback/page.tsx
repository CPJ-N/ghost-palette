"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

export default function SSOCallbackPage() {
  return (
    <main className="gp-auth">
      <div className="gp-auth__callback">
        <Loader2 className="gp-spin" size={22} aria-hidden="true" />
        <p>Finishing sign-in…</p>
      </div>
      {/* Mount point for Clerk Smart CAPTCHA during OAuth sign-up (bot protection). */}
      <div id="clerk-captcha" />
      {/* Processes the OAuth redirect, then sends the user to "/". */}
      <AuthenticateWithRedirectCallback />
    </main>
  );
}
