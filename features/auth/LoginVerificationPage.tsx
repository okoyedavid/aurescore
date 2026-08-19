"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { resetAuthFailureRedirect } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  cacheAuthenticatedUser,
  invalidateAuthenticatedQueries,
} from "./auth-state";
import OtpInput from "./components/OtpInput";
import { useResendLoginVerification, useVerifyLogin } from "./hooks";
import {
  clearPendingChallenge,
  getPendingChallenge,
  getPendingReturnTo,
} from "./session";
import { useResendCooldown } from "./useResendCooldown";

export default function LoginVerificationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const verify = useVerifyLogin();
  const resend = useResendLoginVerification();
  const { seconds, restart } = useResendCooldown("login");
  const challengeId = useSyncExternalStore(
    () => () => undefined,
    getPendingChallenge,
    () => null,
  );
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState("");
  const verificationCompleted = useRef(false);
  const verifying = useRef(false);
  const resending = useRef(false);

  useEffect(() => {
    if (challengeId === "" && !verificationCompleted.current) {
      router.replace("/sign-in?reason=missing-challenge");
    }
  }, [challengeId, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !challengeId ||
      verifying.current ||
      verify.isPending ||
      code.length !== 6
    ) {
      if (code.length !== 6)
        setLocalError("Enter all six digits of the verification code.");
      return;
    }

    setLocalError("");
    verifying.current = true;
    try {
      const response = await verify.mutateAsync({ challengeId, code });
      const returnTo = getPendingReturnTo();
      verificationCompleted.current = true;
      clearPendingChallenge();
      resetAuthFailureRedirect();
      cacheAuthenticatedUser(queryClient, response.user);
      await invalidateAuthenticatedQueries(queryClient);
      router.replace(returnTo);
    } catch {
      // The normalized mutation error is rendered below.
    } finally {
      verifying.current = false;
    }
  }

  async function resendCode() {
    if (!challengeId || resending.current || resend.isPending || seconds > 0)
      return;
    resending.current = true;
    try {
      await resend.mutateAsync(challengeId);
      restart();
    } catch {
      // The normalized mutation error is rendered below.
    } finally {
      resending.current = false;
    }
  }

  if (!challengeId) {
    return (
      <p role="status" className="mt-8 text-sm text-muted">
        Returning to sign in…
      </p>
    );
  }

  const verificationError =
    localError || (verify.isError ? getApiErrorMessage(verify.error) : "");
  const resendError = resend.isError ? getApiErrorMessage(resend.error) : "";

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
        Login verification
      </p>
      <h1 className="mt-4 font-display text-4xl font-semibold">
        Confirm it&apos;s you.
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Your password was accepted, but no session has been created yet. Enter
        the six-digit login code to continue.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
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
          {verify.isPending ? "Verifying login…" : "Verify and sign in"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-muted">
        <p>Didn&apos;t receive the login code?</p>
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
