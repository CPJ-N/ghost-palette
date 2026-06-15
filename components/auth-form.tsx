"use client";

import { useSignIn, useSignUp } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthBackdrop } from "@/components/auth-backdrop";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type Mode = "sign-in" | "sign-up";

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

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignUp = mode === "sign-up";

  async function handleGoogle() {
    setError(null);
    const ssoParams = {
      strategy: "oauth_google" as const,
      redirectUrl: "/sso-callback",
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
        router.push("/");
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
      router.push("/");
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
            <a
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
            </a>
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
                onClick={handleGoogle}
                disabled={submitting}
              >
                <GoogleGlyph />
                Continue with Google
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
                    <a
                      href="/sign-in"
                      className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
                    >
                      Sign in
                    </a>
                  </>
                ) : (
                  <>
                    New to Ghost Palette?{" "}
                    <a
                      href="/sign-up"
                      className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
                    >
                      Create one
                    </a>
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
