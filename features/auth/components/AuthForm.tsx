"use client";

import Link from "next/link";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormField";
import GoogleSignInButton from "./GoogleSignInButton";
import {
  getApiErrorMessage,
  isEmailVerificationRequired,
  normalizeApiError,
} from "@/lib/api/errors";
import { resetAuthFailureRedirect } from "@/lib/api/client";
import {
  cacheAuthenticatedUser,
  invalidateAuthenticatedQueries,
} from "../auth-state";
import { useLogin, useRegister } from "../hooks";
import {
  clearPendingChallenge,
  getReturnToFromLocation,
  normalizeEmail,
  requestAutomaticEmailResend,
  setPendingChallenge,
  setPendingEmail,
} from "../session";
import {
  preserveOAuthInteractionFromLocation,
  takeOAuthContinuationUrl,
} from "../oauth-interaction";

export default function AuthForm({ mode }: { mode: "register" | "sign-in" }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const register = useRegister();
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [localError, setLocalError] = useState("");
  const submitting = useRef(false);
  const registering = mode === "register";
  const mutation = registering ? register : login;
  const backendError = mutation.isError
    ? normalizeApiError(mutation.error)
    : null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || mutation.isPending) return;

    const data = new FormData(event.currentTarget);
    const email = normalizeEmail(String(data.get("email") ?? ""));
    const password = String(data.get("password") ?? "");
    const name = String(data.get("name") ?? "").trim();

    mutation.reset();
    setLocalError("");

    if (registering && password !== data.get("confirmPassword")) {
      setLocalError("Passwords do not match.");
      return;
    }

    if (registering) {
      submitting.current = true;
      try {
        await register.mutateAsync({ email, name, password });
        setPendingEmail(email);
        router.push("/email-verification");
      } catch {
        // The normalized mutation error is rendered below.
      } finally {
        submitting.current = false;
      }
      return;
    }

    const returnTo = getReturnToFromLocation();
    const oauthInteraction = preserveOAuthInteractionFromLocation();
    clearPendingChallenge();
    submitting.current = true;
    try {
      const response = await login.mutateAsync({ email, password });
      if (response.requiresTwoFactor === true) {
        if (oauthInteraction) preserveOAuthInteractionFromLocation();
        setPendingChallenge(response.challengeId, returnTo);
        router.push("/login-verification");
        return;
      }

      resetAuthFailureRedirect();
      cacheAuthenticatedUser(queryClient, response.user);
      await invalidateAuthenticatedQueries(queryClient);
      const continuation = takeOAuthContinuationUrl();
      if (continuation) {
        window.location.assign(continuation);
        return;
      }
      router.replace(returnTo);
    } catch (error) {
      if (isEmailVerificationRequired(error)) {
        requestAutomaticEmailResend(email);
        login.reset();
        router.push("/email-verification");
      }
    } finally {
      submitting.current = false;
    }
  }

  const error =
    localError || (backendError ? getApiErrorMessage(backendError) : "");
  const passwordError = localError || backendError?.fieldErrors?.password?.[0];
  const emailError = backendError?.fieldErrors?.email?.[0];
  const nameError = backendError?.fieldErrors?.name?.[0];

  return (
    <div className="mt-8">
      <GoogleSignInButton />
      <div className="my-6 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
          Or continue with email
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <form onSubmit={submit} className="space-y-5" noValidate>
        {registering && (
          <label htmlFor="name" className="block text-sm font-semibold">
            Full name
            <Input
              id="name"
              name="name"
              required
              minLength={2}
              autoComplete="name"
              autoFocus
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? "name-error" : undefined}
              className="mt-2"
              placeholder="Your full name"
            />
            {nameError && (
              <span id="name-error" className="mt-2 block text-xs text-red-600">
                {nameError}
              </span>
            )}
          </label>
        )}
        <label htmlFor="email" className="block text-sm font-semibold">
          Email address
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoFocus={!registering}
            autoComplete="email"
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? "email-error" : undefined}
            className="mt-2"
            placeholder="you@example.com"
          />
          {emailError && (
            <span id="email-error" className="mt-2 block text-xs text-red-600">
              {emailError}
            </span>
          )}
        </label>
        <div className="block text-sm font-semibold">
          <span className="flex items-center justify-between">
            <label htmlFor="password">Password</label>
            {!registering && (
              <Link
                href="/forgot-password"
                onClick={() => preserveOAuthInteractionFromLocation()}
                className="focus-ring rounded text-xs font-semibold text-blue-700"
              >
                Forgot password?
              </Link>
            )}
          </span>
          <span className="relative mt-2 block">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete={registering ? "new-password" : "current-password"}
              aria-invalid={Boolean(passwordError)}
              aria-describedby={passwordError ? "password-error" : undefined}
              className="pr-12"
              placeholder="Minimum 8 characters"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((value) => !value)}
              className="focus-ring absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-md text-muted hover:text-ink"
            >
              {showPassword ? (
                <EyeOff size={18} aria-hidden="true" />
              ) : (
                <Eye size={18} aria-hidden="true" />
              )}
            </button>
          </span>
        </div>
        {registering && (
          <label
            htmlFor="confirm-password"
            className="block text-sm font-semibold"
          >
            Confirm password
            <span className="relative mt-2 block">
              <Input
                id="confirm-password"
                name="confirmPassword"
                type={showConfirmation ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                aria-invalid={Boolean(localError)}
                aria-describedby={localError ? "password-error" : undefined}
                className="pr-12"
                placeholder="Enter password again"
                onChange={() => setLocalError("")}
              />
              <button
                type="button"
                aria-label={
                  showConfirmation
                    ? "Hide confirmation password"
                    : "Show confirmation password"
                }
                onClick={() => setShowConfirmation((value) => !value)}
                className="focus-ring absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-md text-muted hover:text-ink"
              >
                {showConfirmation ? (
                  <EyeOff size={18} aria-hidden="true" />
                ) : (
                  <Eye size={18} aria-hidden="true" />
                )}
              </button>
            </span>
          </label>
        )}
        {passwordError && (
          <p id="password-error" className="text-xs text-red-600">
            {passwordError}
          </p>
        )}
        {error && (
          <p
            role="alert"
            aria-live="assertive"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {error}
          </p>
        )}
        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending
            ? registering
              ? "Creating account…"
              : "Signing in…"
            : registering
              ? "Create account"
              : "Continue to workspace"}
          {!mutation.isPending && <ArrowRight size={16} aria-hidden="true" />}
        </Button>
        <p className="text-center text-sm text-muted">
          {registering ? "Already have an account?" : "New to AureScore?"}{" "}
          <Link
            href={registering ? "/sign-in" : "/register"}
            className="focus-ring rounded font-semibold text-ink underline decoration-line underline-offset-4"
          >
            {registering ? "Sign in" : "Register account"}
          </Link>
        </p>
      </form>
    </div>
  );
}
