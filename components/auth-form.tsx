"use client";

import { useSignIn, useSignUp } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
    <main className="gp-auth">
      <div className="gp-auth__card">
        <a href="/" className="gp-auth__brand">
          <span className="gp-mark" aria-hidden="true">
            GP
          </span>
          <span>Ghost Palette</span>
        </a>

        {pendingVerification ? (
          <>
            <div className="gp-auth__head">
              <h1>Check your email</h1>
              <p>
                Enter the 6-digit code we sent to <strong>{email}</strong>.
              </p>
            </div>
            <form className="gp-auth__form" onSubmit={handleVerify}>
              <div className="gp-auth__field">
                <label htmlFor="code">Verification code</label>
                <input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="123456"
                  required
                />
              </div>
              {error ? (
                <p className="gp-auth__error" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                className="gp-button gp-button--primary gp-auth__submit"
                type="submit"
                disabled={submitting}
                aria-busy={submitting}
              >
                {submitting ? (
                  <Loader2 className="gp-spin" size={18} aria-hidden="true" />
                ) : null}
                Verify email
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="gp-auth__head">
              <h1>{isSignUp ? "Create your account" : "Welcome back"}</h1>
              <p>
                {isSignUp
                  ? "Save favorites and runs across your devices."
                  : "Sign in to your Ghost Palette account."}
              </p>
            </div>

            <button
              type="button"
              className="gp-button gp-button--ghost gp-auth__oauth"
              onClick={handleGoogle}
              disabled={submitting}
            >
              <GoogleGlyph />
              Continue with Google
            </button>

            <div className="gp-auth__divider">
              <span>or</span>
            </div>

            <form className="gp-auth__form" onSubmit={handleSubmit}>
              <div className="gp-auth__field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@studio.com"
                  required
                />
              </div>
              <div className="gp-auth__field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                />
              </div>
              {error ? (
                <p className="gp-auth__error" role="alert">
                  {error}
                </p>
              ) : null}
              {/* Clerk Smart CAPTCHA mounts here during sign-up (bot protection). */}
              {isSignUp ? (
                <div id="clerk-captcha" className="gp-auth__captcha" />
              ) : null}
              <button
                className="gp-button gp-button--primary gp-auth__submit"
                type="submit"
                disabled={submitting}
                aria-busy={submitting}
              >
                {submitting ? (
                  <Loader2 className="gp-spin" size={18} aria-hidden="true" />
                ) : null}
                {isSignUp ? "Create account" : "Sign in"}
              </button>
            </form>

            <p className="gp-auth__alt">
              {isSignUp ? (
                <>
                  Already have an account? <a href="/sign-in">Sign in</a>
                </>
              ) : (
                <>
                  New to Ghost Palette? <a href="/sign-up">Create one</a>
                </>
              )}
            </p>
          </>
        )}
      </div>
    </main>
  );
}
