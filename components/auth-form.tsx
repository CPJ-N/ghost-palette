"use client";

import { useSignIn, useSignUp } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { AuthBackdrop } from "@/components/auth-backdrop";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type Mode = "sign-in" | "sign-up";
type OAuthProvider = "oauth_google" | "oauth_apple";

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
      />
    </svg>
  );
}

function AppleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.365 1.43c0 1.14-.42 2.18-1.26 3.12-.98 1.1-2.12 1.73-3.31 1.63-.14-1.1.42-2.3 1.18-3.15.84-.95 2.28-1.64 3.39-1.6Zm3.6 16.84c-.55 1.27-.82 1.84-1.53 2.96-.99 1.51-2.38 3.39-4.1 3.41-1.53.02-1.93-.99-4.01-.98-2.08.01-2.52 1-4.05.98-1.72-.02-3.03-1.71-4.02-3.22-2.77-4.24-3.06-9.21-1.35-11.85 1.22-1.88 3.15-2.98 4.96-2.98 1.84 0 3 .99 4.52.99 1.47 0 2.37-.99 4.5-.99 1.61 0 3.32.88 4.53 2.39-3.98 2.18-3.33 7.86.55 9.29Z"
      />
    </svg>
  );
}

// Clerk's Future-API methods resolve to `{ error }` rather than throwing.
function readClerkError(error: unknown): string {
  const e = error as {
    message?: string;
    errors?: Array<{ longMessage?: string; message?: string }>;
  };
  return (
    e?.errors?.[0]?.longMessage ??
    e?.errors?.[0]?.message ??
    e?.message ??
    "Something went wrong. Please try again."
  );
}

function Divider() {
  return (
    <div className="relative my-1 text-center">
      <Separator className="absolute inset-0 top-1/2" />
      <span className="relative bg-card px-2 text-xs text-muted-foreground">or</span>
    </div>
  );
}

function redirectTarget(value: string | null, currentOrigin?: string | null): string {
  if (!value) return "/studio";
  if (value.startsWith("/")) return value;

  try {
    const url = new URL(value);
    if (currentOrigin && url.origin === currentOrigin) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return "/studio";
  }

  return "/studio";
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignUp = mode === "sign-up";
  const currentOrigin =
    typeof window === "undefined" ? null : window.location.origin;
  const afterAuthUrl = redirectTarget(searchParams.get("redirect_url"), currentOrigin);

  async function handleSSO(strategy: OAuthProvider) {
    setError(null);
    const ssoParams = {
      strategy,
      redirectUrl: afterAuthUrl,
      redirectCallbackUrl: "/sso-callback",
    };
    try {
      const { error: ssoError } = isSignUp
        ? await signUp.sso(ssoParams)
        : await signIn.sso(ssoParams);
      if (ssoError) {
        setError(readClerkError(ssoError));
      }
    } catch (err) {
      setError(readClerkError(err));
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error: createError } = await signUp.password({
          emailAddress: email,
          password,
        });
        if (createError) {
          setError(readClerkError(createError));
          return;
        }
        const { error: sendError } = await signUp.verifications.sendEmailCode();
        if (sendError) {
          setError(readClerkError(sendError));
          return;
        }
        setPendingVerification(true);
      } else {
        const { error: signInError } = await signIn.password({
          identifier: email,
          password,
        });
        if (signInError) {
          setError(readClerkError(signInError));
          return;
        }
        const { error: finalizeError } = await signIn.finalize();
        if (finalizeError) {
          setError(readClerkError(finalizeError));
          return;
        }
        router.push(afterAuthUrl);
      }
    } catch (err) {
      setError(readClerkError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const { error: verifyError } = await signUp.verifications.verifyEmailCode({
        code,
      });
      if (verifyError) {
        setError(readClerkError(verifyError));
        return;
      }
      const { error: finalizeError } = await signUp.finalize();
      if (finalizeError) {
        setError(readClerkError(finalizeError));
        return;
      }
      router.push(afterAuthUrl);
    } catch (err) {
      setError(readClerkError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative isolate grid min-h-svh place-items-center overflow-hidden bg-background px-4 py-10">
      <AuthBackdrop />
      <Card className="relative z-10 w-full max-w-sm shadow-2xl">
        <CardContent className="space-y-5">
          <div className="flex flex-col items-center gap-3 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-semibold tracking-tight"
            >
              <span
                aria-hidden="true"
                className="grid size-8 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-foreground"
              >
                GP
              </span>
              Ghost Palette
            </Link>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold tracking-tight">
                {pendingVerification
                  ? "Check your email"
                  : isSignUp
                    ? "Create your account"
                    : "Welcome back"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {pendingVerification ? (
                  <>
                    Enter the 6-digit code we sent to <strong>{email}</strong>.
                  </>
                ) : isSignUp ? (
                  "Save favorites and runs across your devices."
                ) : (
                  "Sign in to your Ghost Palette account."
                )}
              </p>
            </div>
          </div>

          {pendingVerification ? (
            <form onSubmit={handleVerify}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="code">Verification code</FieldLabel>
                  <Input
                    id="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    placeholder="123456"
                    required
                  />
                </Field>
                {error ? <FieldError>{error}</FieldError> : null}
                <Button type="submit" className="w-full" disabled={submitting} aria-busy={submitting}>
                  {submitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
                  Verify email
                </Button>
              </FieldGroup>
            </form>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleSSO("oauth_google")}
                disabled={submitting}
              >
                <GoogleGlyph />
                Continue with Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleSSO("oauth_apple")}
                disabled={submitting}
              >
                <AppleGlyph />
                Continue with Apple
              </Button>

              <Divider />

              <form onSubmit={handleSubmit}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@studio.com"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      autoComplete={isSignUp ? "new-password" : "current-password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="At least 8 characters"
                      minLength={8}
                      required
                    />
                  </Field>
                  {error ? <FieldError>{error}</FieldError> : null}
                  {/* Clerk Smart CAPTCHA mounts here during sign-up (bot protection). */}
                  {isSignUp ? <div id="clerk-captcha" /> : null}
                  <Button type="submit" className="w-full" disabled={submitting} aria-busy={submitting}>
                    {submitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
                    {isSignUp ? "Create account" : "Sign in"}
                  </Button>
                </FieldGroup>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                {isSignUp ? (
                  <>
                    Already have an account?{" "}
                    <Link
                      href="/sign-in"
                      className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
                    >
                      Sign in
                    </Link>
                  </>
                ) : (
                  <>
                    New to Ghost Palette?{" "}
                    <Link
                      href="/sign-up"
                      className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
                    >
                      Create one
                    </Link>
                  </>
                )}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
