"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button, ButtonLink } from "@/components/ui/Button";
import { resetAuthFailureRedirect } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  hydrateAuthenticatedUser,
  invalidateAuthenticatedQueries,
} from "./auth-state";
import GoogleSignInButton from "./components/GoogleSignInButton";
import OtpInput from "./components/OtpInput";
import type { GoogleCallbackState } from "./google-callback";
import { useResendLoginVerification, useVerifyLogin } from "./hooks";
import {
  clearOAuthInteraction,
  takeOAuthContinuationUrl,
} from "./oauth-interaction";

const callbackErrorMessage =
  "Google sign-in could not be completed. Please try again.";

function CallbackHeading({ title, copy }: { title: string; copy: string }) {
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
        Google sign-in
      </p>
      <h1 className="mt-4 font-display text-4xl font-semibold">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">{copy}</p>
    </>
  );
}

function LoadingCallback() {
  return (
    <div role="status" aria-live="polite">
      <CallbackHeading
        title="Finishing your sign-in."
        copy="Google has returned you to AureScore. We are confirming your secure session."
      />
      <span className="mt-8 block h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
    </div>
  );
}

function FailedCallback({ retry }: { retry?: () => void }) {
  return (
    <div role="alert">
      <CallbackHeading
        title="We couldn’t sign you in."
        copy={callbackErrorMessage}
      />
      <div className="mt-8 space-y-3">
        {retry ? (
          <Button type="button" className="w-full" onClick={retry}>
            Retry session check
          </Button>
        ) : (
          <GoogleSignInButton />
        )}
        <ButtonLink href="/sign-in" variant="outline" className="w-full">
          Return to login
        </ButtonLink>
      </div>
    </div>
  );
}

export default function GoogleAuthCallbackPage({
  state,
  initialResendSeconds = 60,
}: {
  state: GoogleCallbackState;
  initialResendSeconds?: number;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const verify = useVerifyLogin();
  const resend = useResendLoginVerification();
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState("");
  const [seconds, setSeconds] = useState(
    state.kind === "verification-required" ? initialResendSeconds : 0,
  );
  const [hydrationFailed, setHydrationFailed] = useState(false);
  const [verificationAccepted, setVerificationAccepted] = useState(false);
  const [finishing, setFinishing] = useState(state.kind === "success");
  const callbackProcessed = useRef(false);
  const hydrationPromise = useRef<Promise<void> | null>(null);
  const verifying = useRef(false);
  const resending = useRef(false);

  useEffect(() => {
    if (window.location.search) {
      window.history.replaceState(window.history.state, "", "/auth/callback");
    }
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setTimeout(
      () => setSeconds((current) => Math.max(0, current - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [seconds]);

  const confirmSession = useCallback(() => {
    if (!hydrationPromise.current) {
      setHydrationFailed(false);
      setFinishing(true);
      resetAuthFailureRedirect();
      hydrationPromise.current = (async () => {
        await hydrateAuthenticatedUser(queryClient);
        await invalidateAuthenticatedQueries(queryClient);
        const continuation = takeOAuthContinuationUrl();
        if (continuation) {
          window.location.assign(continuation);
          return;
        }
        router.replace("/dashboard");
      })()
        .catch(() => {
          setHydrationFailed(true);
          setFinishing(false);
        })
        .finally(() => {
          hydrationPromise.current = null;
        });
    }
    return hydrationPromise.current;
  }, [queryClient, router]);

  useEffect(() => {
    if (state.kind !== "success" || callbackProcessed.current) return;
    callbackProcessed.current = true;
    void confirmSession();
  }, [confirmSession, state.kind]);

  async function submitVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      state.kind !== "verification-required" ||
      verifying.current ||
      verify.isPending ||
      code.length !== 6
    ) {
      if (code.length !== 6) {
        setLocalError("Enter all six digits of the verification code.");
      }
      return;
    }

    setLocalError("");
    verifying.current = true;
    try {
      await verify.mutateAsync({ challengeId: state.challengeId, code });
      setVerificationAccepted(true);
      await confirmSession();
    } catch {
      // The normalized mutation error is rendered below.
    } finally {
      verifying.current = false;
    }
  }

  async function resendCode() {
    if (
      state.kind !== "verification-required" ||
      resending.current ||
      resend.isPending ||
      seconds > 0
    ) {
      return;
    }

    resending.current = true;
    try {
      await resend.mutateAsync(state.challengeId);
      setSeconds(60);
    } catch {
      // The normalized mutation error is rendered below.
    } finally {
      resending.current = false;
    }
  }

  if (state.kind === "failed") {
    clearOAuthInteraction();
    return <FailedCallback />;
  }

  if (state.kind === "account-link-required") {
    return (
      <div>
        <CallbackHeading
          title="Sign in to link Google."
          copy="An AureScore account already uses this email, but Google has not been linked to it yet. Sign in with your password to continue."
        />
        <div className="mt-8 space-y-3">
          <ButtonLink
            href="/sign-in?reason=account-link-required"
            className="w-full"
          >
            Sign in with password
          </ButtonLink>
          <Link
            href="/sign-in"
            className="focus-ring block rounded text-center text-sm font-semibold text-blue-700"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  if (hydrationFailed) {
    return <FailedCallback retry={() => void confirmSession()} />;
  }

  if (state.kind === "success" || verificationAccepted || finishing) {
    return <LoadingCallback />;
  }

  const verificationError =
    localError || (verify.isError ? getApiErrorMessage(verify.error) : "");
  const resendError = resend.isError ? getApiErrorMessage(resend.error) : "";

  return (
    <div>
      <CallbackHeading
        title="Confirm it’s you."
        copy="Enter the six-digit code sent to your email to finish signing in with Google."
      />
      <form onSubmit={submitVerification} className="mt-8 space-y-5" noValidate>
        <OtpInput
          value={code}
          onChange={(value) => {
            setCode(value);
            setLocalError("");
            verify.reset();
          }}
          error={verificationError}
          disabled={verify.isPending}
        />
        {verificationError && (
          <p
            id="verification-error"
            role="alert"
            aria-live="assertive"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {verificationError}
          </p>
        )}
        <Button
          type="submit"
          disabled={verify.isPending || code.length !== 6}
          className="w-full"
        >
          {verify.isPending ? "Verifying…" : "Verify and continue"}
        </Button>
      </form>
      <div className="mt-6 text-center text-sm text-muted">
        <p>Didn’t receive the code?</p>
        <button
          type="button"
          onClick={resendCode}
          disabled={resend.isPending || seconds > 0}
          className="focus-ring mt-2 rounded font-semibold text-blue-700 disabled:cursor-not-allowed disabled:text-muted"
        >
          {resend.isPending
            ? "Sending…"
            : seconds > 0
              ? `Send again in ${seconds}s`
              : "Send a new code"}
        </button>
        <div aria-live="polite" className="mt-3 text-xs">
          {resend.isSuccess && (
            <p className="text-emerald-700">{resend.data.message}</p>
          )}
          {resendError && (
            <p role="alert" className="text-red-600">
              {resendError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
