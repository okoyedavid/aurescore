"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useResendEmailVerification, useVerifyEmail } from "./hooks";
import {
  clearPendingEmail,
  consumeAutomaticEmailResend,
  getPendingEmail,
} from "./session";
import { useResendCooldown } from "./useResendCooldown";
import OtpInput from "./components/OtpInput";

export default function EmailVerificationPage() {
  const router = useRouter();
  const verify = useVerifyEmail();
  const resend = useResendEmailVerification();
  const { seconds, restart } = useResendCooldown("email");
  const email = useSyncExternalStore(
    () => () => undefined,
    getPendingEmail,
    () => null,
  );
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState("");
  const verifying = useRef(false);
  const resending = useRef(false);
  const automaticResendStarted = useRef(false);

  useEffect(() => {
    if (
      !email ||
      automaticResendStarted.current ||
      !consumeAutomaticEmailResend()
    ) {
      return;
    }

    automaticResendStarted.current = true;
    resending.current = true;
    void resend
      .mutateAsync(email)
      .then(restart)
      .catch(() => undefined)
      .finally(() => {
        resending.current = false;
      });
  }, [email, resend, restart]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email || verifying.current || verify.isPending || code.length !== 6) {
      if (code.length !== 6)
        setLocalError("Enter all six digits of the verification code.");
      return;
    }
    setLocalError("");
    verifying.current = true;
    try {
      await verify.mutateAsync({ email, code });
      clearPendingEmail();
      router.replace("/sign-in?verified=1");
    } catch {
      // The normalized mutation error is rendered below.
    } finally {
      verifying.current = false;
    }
  }

  async function resendCode() {
    if (!email || resending.current || resend.isPending || seconds > 0) return;
    resending.current = true;
    try {
      await resend.mutateAsync(email);
      restart();
    } catch {
      // The normalized mutation error is rendered below.
    } finally {
      resending.current = false;
    }
  }

  if (email === null) {
    return (
      <p role="status" className="mt-8 text-sm text-muted">
        Loading verification…
      </p>
    );
  }

  if (!email) {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
          Email verification
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold">
          Start from registration.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          We could not find a pending email verification on this device.
        </p>
        <Link
          href="/register"
          className="focus-ring mt-7 inline-flex rounded font-semibold text-blue-700 underline underline-offset-4"
        >
          Return to registration
        </Link>
      </div>
    );
  }

  const verificationError =
    localError || (verify.isError ? getApiErrorMessage(verify.error) : "");
  const resendError = resend.isError ? getApiErrorMessage(resend.error) : "";

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
        Email verification
      </p>
      <h1 className="mt-4 font-display text-4xl font-semibold">
        Check your email.
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Enter the six-digit code sent for{" "}
        <span className="font-semibold text-ink">{email}</span>. For privacy,
        the response is the same whether or not an address is registered.
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
          {verify.isPending ? "Verifying…" : "Verify email"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-muted">
        <p>Didn&apos;t receive the code?</p>
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
