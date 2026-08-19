"use client";

import { FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormField";
import { getApiErrorMessage, normalizeApiError } from "@/lib/api/errors";
import {
  useChangePassword,
  useCurrentUser,
  useRequestSecurityVerification,
} from "../hooks";
import type { AccountUser } from "../types";
import { AsyncMessage, SettingsHeading, SettingsPanel } from "./shared";
import SecurityVerificationDialog from "./SecurityVerificationDialog";

export default function PasswordSettings({ user }: { user?: AccountUser }) {
  const currentUser = useCurrentUser();
  const changePassword = useChangePassword();
  const requestVerification = useRequestSecurityVerification();
  const submitting = useRef(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [challenge, setChallenge] = useState<{
    id: string;
    message: string;
  } | null>(null);
  const hasPassword = (user ?? currentUser.data)?.hasPassword !== false;
  const apiError = changePassword.isError
    ? normalizeApiError(changePassword.error)
    : null;
  const currentError =
    apiError?.fieldErrors?.currentPassword?.[0] ??
    (apiError?.status === 401
      ? "The current password is incorrect."
      : undefined);
  function validate() {
    setLocalError("");
    if (newPassword.length < 8 || newPassword.length > 128) {
      setLocalError(
        "The new password must contain between 8 and 128 characters.",
      );
      return false;
    }
    if (newPassword !== confirmPassword) {
      setLocalError("The new password and confirmation do not match.");
      return false;
    }
    if (hasPassword && newPassword === currentPassword) {
      setLocalError(
        "Choose a new password that differs from the current password.",
      );
      return false;
    }
    return true;
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      submitting.current ||
      changePassword.isPending ||
      requestVerification.isPending ||
      !validate()
    )
      return;
    if (!hasPassword) {
      try {
        const response = await requestVerification.mutateAsync("set-password");
        setChallenge({ id: response.challengeId, message: response.message });
      } catch {}
      return;
    }
    submitting.current = true;
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
    } finally {
      submitting.current = false;
    }
  }
  async function setProviderPassword(reauthToken: string) {
    try {
      await changePassword.mutateAsync({ newPassword, reauthToken });
      setNewPassword("");
      setConfirmPassword("");
      setChallenge(null);
    } catch (error) {
      setChallenge(null);
      throw error;
    }
  }
  return (
    <SettingsPanel>
      <SettingsHeading
        title={hasPassword ? "Password" : "Set a password"}
        copy={
          hasPassword
            ? "Changing your password keeps this session active and signs out every other device."
            : "Confirm with a code sent to your verified email, then create your first AureScore password."
        }
      />
      <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
        {hasPassword && (
          <label
            htmlFor="current-password"
            className="block text-sm font-semibold"
          >
            Current password
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(event) => {
                setCurrentPassword(event.target.value.slice(0, 128));
                changePassword.reset();
              }}
              maxLength={128}
              autoComplete="current-password"
              aria-invalid={Boolean(currentError)}
              aria-describedby={
                currentError ? "current-password-error" : undefined
              }
              className="mt-2"
            />
            {currentError && (
              <span
                id="current-password-error"
                className="mt-2 block text-xs text-red-500"
              >
                {currentError}
              </span>
            )}
          </label>
        )}
        <label htmlFor="new-password" className="block text-sm font-semibold">
          New password
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(event) =>
              setNewPassword(event.target.value.slice(0, 128))
            }
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            className="mt-2"
          />
        </label>
        <label
          htmlFor="confirm-new-password"
          className="block text-sm font-semibold"
        >
          Confirm new password
          <Input
            id="confirm-new-password"
            type="password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value.slice(0, 128))
            }
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            aria-invalid={Boolean(localError)}
            aria-describedby={localError ? "password-change-error" : undefined}
            className="mt-2"
          />
        </label>
        <AsyncMessage
          error={
            localError ||
            (apiError && !currentError ? getApiErrorMessage(apiError) : "")
          }
          success={
            changePassword.isSuccess
              ? "Password saved successfully. Every other device was signed out; this session remains active."
              : ""
          }
        />
        {localError && (
          <span id="password-change-error" className="sr-only">
            {localError}
          </span>
        )}
        <Button
          type="submit"
          disabled={
            changePassword.isPending ||
            requestVerification.isPending ||
            (hasPassword && !currentPassword) ||
            !newPassword ||
            !confirmPassword
          }
        >
          {changePassword.isPending
            ? "Saving password…"
            : requestVerification.isPending
              ? "Sending security code…"
              : hasPassword
                ? "Change password"
                : "Set password"}
        </Button>
      </form>
      <div className="mt-4">
        <AsyncMessage
          error={
            requestVerification.isError
              ? getApiErrorMessage(requestVerification.error)
              : ""
          }
        />
      </div>
      <SecurityVerificationDialog
        challengeId={challenge?.id ?? null}
        message={challenge?.message}
        title="Confirm before setting a password"
        operationPending={changePassword.isPending}
        operationError={
          changePassword.isError ? getApiErrorMessage(changePassword.error) : ""
        }
        onClose={() => setChallenge(null)}
        onVerified={setProviderPassword}
      />
    </SettingsPanel>
  );
}
