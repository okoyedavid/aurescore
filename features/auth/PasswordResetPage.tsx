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
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormField";
import { clearAuthenticatedUser } from "./auth-state";
import OtpInput from "./components/OtpInput";
import { useConfirmPasswordReset, useRequestPasswordReset } from "./hooks";
import { getApiErrorMessage, normalizeApiError } from "@/lib/api/errors";
import {
  clearPasswordResetState,
  getPasswordResetSnapshot,
  normalizeEmail,
  setPasswordResetState,
} from "./session";
import { useResendCooldown } from "./useResendCooldown";
import {
  captureOAuthInteraction,
  persistOAuthInteraction,
} from "./oauth-interaction";

type ResetState = { email: string; challengeId: string };
const genericCodeError =
  "That code could not be accepted. Request a new code and try again.";

function PasswordField({
  id,
  name,
  label,
  shown,
  toggle,
  error,
  inputRef,
}: {
  id: string;
  name: string;
  label: string;
  shown: boolean;
  toggle: () => void;
  error?: string;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <label htmlFor={id} className="block text-sm font-semibold">
      {label}
      <span className="relative mt-2 block">
        <Input
          ref={inputRef}
          id={id}
          name={name}
          type={shown ? "text" : "password"}
          minLength={8}
          maxLength={128}
          required
          autoComplete="new-password"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="pr-12"
        />
        <button
          type="button"
          onClick={toggle}
          aria-label={
            shown
              ? `Hide ${label.toLowerCase()}`
              : `Show ${label.toLowerCase()}`
          }
          className="focus-ring absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-md text-muted hover:text-ink"
        >
          {shown ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
      {error && (
        <span id={`${id}-error`} className="mt-2 block text-xs text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}

export default function PasswordResetPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const request = useRequestPasswordReset();
  const resend = useRequestPasswordReset();
  const confirm = useConfirmPasswordReset();
  const { seconds, restart } = useResendCooldown("password-reset");
  const storedSnapshot = useSyncExternalStore(
    () => () => undefined,
    getPasswordResetSnapshot,
    () => "",
  );
  const storedResetState = storedSnapshot
    ? (JSON.parse(storedSnapshot) as ResetState)
    : null;
  const [resetOverride, setResetOverride] = useState<
    ResetState | null | undefined
  >(undefined);
  const [completed, setCompleted] = useState(false);
  const resetState =
    resetOverride === undefined ? storedResetState : resetOverride;
  const stage = completed ? "complete" : resetState ? "confirm" : "request";
  const [serverMessage, setServerMessage] = useState("");
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmationError, setConfirmationError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const submitting = useRef(false);
  const resending = useRef(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmationRef = useRef<HTMLInputElement>(null);
  const confirmForm = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const interaction = captureOAuthInteraction();
    if (interaction) persistOAuthInteraction(interaction);
  }, []);

  useEffect(() => {
    if (stage !== "complete") return;
    const timer = window.setTimeout(
      () => router.replace("/login?reason=password-reset-complete"),
      1800,
    );
    return () => window.clearTimeout(timer);
  }, [router, stage]);

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || request.isPending) return;
    const email = normalizeEmail(
      String(new FormData(event.currentTarget).get("email") ?? ""),
    );
    request.reset();
    setLocalError("");
    submitting.current = true;
    clearPasswordResetState();
    try {
      const response = await request.mutateAsync({ email });
      if (!response.challengeId || response.challengeId.length > 2048) {
        setLocalError(
          "We could not start password recovery. Please try again.",
        );
        window.requestAnimationFrame(() => emailRef.current?.focus());
        return;
      }
      const next = { email, challengeId: response.challengeId };
      setPasswordResetState(email, response.challengeId);
      setResetOverride(next);
      setServerMessage(response.message);
      restart();
    } catch {
      window.requestAnimationFrame(() => emailRef.current?.focus());
    } finally {
      submitting.current = false;
    }
  }

  async function confirmReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resetState || submitting.current || confirm.isPending) return;
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmation = String(form.get("confirmPassword") ?? "");
    setLocalError("");
    setPasswordError("");
    setConfirmationError("");
    confirm.reset();
    if (code.length !== 6) {
      setLocalError("Enter all six digits of the verification code.");
      confirmForm.current
        ?.querySelector<HTMLInputElement>("[name=code]")
        ?.focus();
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
      setPasswordError("Password must be between 8 and 128 characters.");
      newPasswordRef.current?.focus();
      return;
    }
    if (newPassword !== confirmation) {
      setConfirmationError("Passwords do not match.");
      confirmationRef.current?.focus();
      return;
    }
    submitting.current = true;
    const formElement = event.currentTarget;
    try {
      await confirm.mutateAsync({
        challengeId: resetState.challengeId,
        code,
        newPassword,
      });
      clearPasswordResetState();
      clearAuthenticatedUser(queryClient);
      setCode("");
      formElement.reset();
      setCompleted(true);
    } catch (error) {
      const normalized = normalizeApiError(error);
      if (normalized.fieldErrors?.newPassword?.[0]) {
        setPasswordError(normalized.fieldErrors.newPassword[0]);
        newPasswordRef.current?.focus();
      } else {
        setLocalError(
          normalized.status === 429 ? normalized.message : genericCodeError,
        );
        confirmForm.current
          ?.querySelector<HTMLInputElement>("[name=code]")
          ?.focus();
        if (normalized.status !== 429) {
          clearPasswordResetState();
          setResetOverride(null);
          window.requestAnimationFrame(() => emailRef.current?.focus());
        }
      }
    } finally {
      submitting.current = false;
    }
  }

  async function resendCode() {
    if (!resetState || resending.current || resend.isPending || seconds > 0)
      return;
    resending.current = true;
    resend.reset();
    setLocalError("");
    try {
      const response = await resend.mutateAsync({ email: resetState.email });
      if (!response.challengeId || response.challengeId.length > 2048) {
        setLocalError("We could not send another code. Please try again.");
        return;
      }
      const next = {
        email: resetState.email,
        challengeId: response.challengeId,
      };
      setPasswordResetState(next.email, next.challengeId);
      setResetOverride(next);
      setCode("");
      setServerMessage(response.message);
      restart();
      confirmForm.current
        ?.querySelector<HTMLInputElement>("[name=code]")
        ?.focus();
    } catch (error) {
      const normalized = normalizeApiError(error);
      if (normalized.status === 429) restart();
    } finally {
      resending.current = false;
    }
  }

  function cancel() {
    clearPasswordResetState();
  }

  if (stage === "complete")
    return (
      <div role="status" aria-live="polite">
        <CheckCircle2 size={38} className="text-emerald-600" />
        <h1 className="mt-5 font-display text-4xl font-semibold">
          Password reset complete.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Your password was changed and every previous session was signed out.
          Sign in again with your new password.
        </p>
        <Button
          className="mt-8 w-full"
          onClick={() =>
            router.replace("/login?reason=password-reset-complete")
          }
        >
          Continue to login <ArrowRight size={16} />
        </Button>
      </div>
    );

  if (stage === "request" || !resetState) {
    const requestError = request.isError
      ? normalizeApiError(request.error)
      : null;
    const error =
      localError ||
      (requestError
        ? requestError.status === 429
          ? requestError.message
          : "We could not start password recovery. Please try again."
        : "");
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
          Password recovery
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold">
          Reset your password.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Enter your email address. If it can receive a reset code, we’ll send
          one.
        </p>
        <form onSubmit={requestReset} className="mt-8 space-y-5" noValidate>
          <label htmlFor="reset-email" className="block text-sm font-semibold">
            Email address
            <Input
              ref={emailRef}
              id="reset-email"
              name="email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              className="mt-2"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "reset-request-error" : undefined}
            />
          </label>
          {error && (
            <p
              id="reset-request-error"
              role="alert"
              aria-live="assertive"
              className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          <Button type="submit" disabled={request.isPending} className="w-full">
            {request.isPending ? "Sending reset code…" : "Send reset code"}
          </Button>
        </form>
        <Link
          href="/login?reason=password-reset-cancelled"
          onClick={cancel}
          className="focus-ring mt-6 block rounded text-center text-sm font-semibold text-blue-700"
        >
          Return to login
        </Link>
      </div>
    );
  }

  const resendError = resend.isError ? getApiErrorMessage(resend.error) : "";
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
        Password recovery
      </p>
      <h1 className="mt-4 font-display text-4xl font-semibold">
        Create a new password.
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Enter the six-digit code sent for <strong>{resetState.email}</strong>.
      </p>
      {serverMessage && (
        <p
          role="status"
          aria-live="polite"
          className="mt-5 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800"
        >
          {serverMessage}
        </p>
      )}
      <form
        ref={confirmForm}
        onSubmit={confirmReset}
        className="mt-7 space-y-5"
        noValidate
      >
        <OtpInput
          value={code}
          onChange={(value) => {
            setCode(value);
            setLocalError("");
            confirm.reset();
          }}
          error={localError}
          disabled={confirm.isPending}
        />
        <PasswordField
          id="new-password"
          name="newPassword"
          label="New password"
          shown={showPassword}
          toggle={() => setShowPassword((value) => !value)}
          error={passwordError}
          inputRef={newPasswordRef}
        />
        <PasswordField
          id="confirm-new-password"
          name="confirmPassword"
          label="Confirm new password"
          shown={showConfirmation}
          toggle={() => setShowConfirmation((value) => !value)}
          error={confirmationError}
          inputRef={confirmationRef}
        />
        {localError && (
          <p
            id="verification-error"
            role="alert"
            aria-live="assertive"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {localError}
          </p>
        )}
        <Button type="submit" disabled={confirm.isPending} className="w-full">
          {confirm.isPending ? "Resetting password…" : "Reset password"}
        </Button>
      </form>
      <div className="mt-6 text-center text-sm text-muted">
        <p>Need another code?</p>
        <button
          type="button"
          onClick={() => void resendCode()}
          disabled={resend.isPending || seconds > 0}
          aria-describedby="password-reset-resend-help"
          className="focus-ring mt-2 rounded font-semibold text-blue-700 disabled:cursor-not-allowed disabled:text-muted"
        >
          {resend.isPending
            ? "Sending…"
            : seconds > 0
              ? `Resend available in ${seconds} seconds`
              : "Resend code"}
        </button>
        <p id="password-reset-resend-help" className="sr-only">
          The resend button shows the remaining cooldown. You can continue
          filling in the form while you wait.
        </p>
        {resendError && (
          <p
            role="alert"
            aria-live="assertive"
            className="mt-3 text-xs text-red-600"
          >
            {resendError}
          </p>
        )}
      </div>
      <Link
        href="/login?reason=password-reset-cancelled"
        onClick={cancel}
        className="focus-ring mt-6 block rounded text-center text-sm font-semibold text-blue-700"
      >
        Cancel and return to login
      </Link>
    </div>
  );
}
