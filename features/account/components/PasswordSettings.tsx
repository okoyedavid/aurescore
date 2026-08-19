"use client";

import { FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormField";
import { getApiErrorMessage, normalizeApiError } from "@/lib/api/errors";
import { useChangePassword } from "../hooks";
import { AsyncMessage, SettingsHeading, SettingsPanel } from "./shared";

export default function PasswordSettings() {
  const changePassword = useChangePassword();
  const submitting = useRef(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const apiError = changePassword.isError
    ? normalizeApiError(changePassword.error)
    : null;
  const currentError =
    apiError?.fieldErrors?.currentPassword?.[0] ??
    (apiError?.status === 401
      ? "The current password is incorrect."
      : undefined);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || changePassword.isPending) return;
    setLocalError("");
    if (newPassword.length < 8) {
      setLocalError("The new password must contain at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError("The new password and confirmation do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setLocalError(
        "Choose a new password that differs from the current password.",
      );
      return;
    }

    submitting.current = true;
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      // Preserve the fields so the user can correct only what is necessary.
    } finally {
      submitting.current = false;
    }
  }

  return (
    <SettingsPanel>
      <SettingsHeading
        title="Password"
        copy="Changing your password keeps this session active and signs out every other device."
      />
      <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
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
              ? "Password changed successfully. Every other device was signed out; this session remains active."
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
            !currentPassword ||
            !newPassword ||
            !confirmPassword
          }
        >
          {changePassword.isPending ? "Changing password…" : "Change password"}
        </Button>
      </form>
    </SettingsPanel>
  );
}
