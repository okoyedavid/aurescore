"use client";

import { FormEvent, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormField";
import OtpInput from "@/features/auth/components/OtpInput";
import { getApiErrorMessage, normalizeApiError } from "@/lib/api/errors";
import {
  clearPendingEmailChange,
  getPendingEmailChangeSnapshot,
  parsePendingEmailChange,
  setPendingEmailChange,
  subscribePendingEmailChange,
} from "../email-change-session";
import { useConfirmEmailChange, useRequestEmailChange } from "../hooks";
import type { AccountUser } from "../types";
import { AsyncMessage, SettingsHeading, SettingsPanel } from "./shared";

export default function EmailSettings({ user }: { user: AccountUser }) {
  const requestChange = useRequestEmailChange();
  const confirmChange = useConfirmEmailChange();
  const requesting = useRef(false);
  const confirming = useRef(false);
  const snapshot = useSyncExternalStore(
    subscribePendingEmailChange,
    getPendingEmailChangeSnapshot,
    () => "\n",
  );
  const pending = parsePendingEmailChange(snapshot);
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState("");
  const [success, setSuccess] = useState("");
  const requestError = requestChange.isError
    ? normalizeApiError(requestChange.error)
    : null;
  const requestPasswordError =
    requestError?.fieldErrors?.currentPassword?.[0] ??
    (requestError?.status === 401
      ? "The current password is incorrect."
      : undefined);
  const emailError =
    requestError?.status === 409
      ? "That email address is unavailable."
      : requestError?.fieldErrors?.newEmail?.[0];
  const confirmationError = confirmChange.isError
    ? getApiErrorMessage(confirmChange.error)
    : "";

  async function request(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requesting.current || requestChange.isPending) return;
    const normalizedEmail = newEmail.trim().toLowerCase();
    setLocalError("");
    setSuccess("");
    clearPendingEmailChange();
    if (!normalizedEmail || normalizedEmail === user.email.toLowerCase()) {
      setLocalError(
        "Enter a new email address that differs from your current email.",
      );
      return;
    }

    requesting.current = true;
    try {
      const response = await requestChange.mutateAsync({
        newEmail: normalizedEmail,
        currentPassword,
      });
      setCurrentPassword("");
      setPendingEmailChange(response.challengeId, normalizedEmail);
    } catch {
      // The normalized mutation error is rendered below.
    } finally {
      requesting.current = false;
    }
  }

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !pending.challengeId ||
      code.length !== 6 ||
      confirming.current ||
      confirmChange.isPending
    ) {
      if (code.length !== 6)
        setLocalError("Enter all six digits of the confirmation code.");
      return;
    }
    setLocalError("");
    confirming.current = true;
    try {
      const response = await confirmChange.mutateAsync({
        challengeId: pending.challengeId,
        code,
      });
      setCode("");
      clearPendingEmailChange();
      setNewEmail("");
      setSuccess(
        `${response.message}. Every other session was revoked; this session remains active.`,
      );
    } catch {
      // The normalized mutation error is rendered below.
    } finally {
      confirming.current = false;
    }
  }

  if (pending.challengeId) {
    return (
      <SettingsPanel>
        <SettingsHeading
          title="Confirm email address"
          copy={`Enter the six-digit code sent to ${pending.email}. The code expires after five minutes.`}
        />
        <form onSubmit={confirm} className="mt-7 space-y-5" noValidate>
          <OtpInput
            value={code}
            onChange={(value) => {
              setCode(value);
              setLocalError("");
              confirmChange.reset();
            }}
            error={localError || confirmationError}
            disabled={confirmChange.isPending}
          />
          <AsyncMessage error={localError || confirmationError} />
          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              disabled={confirmChange.isPending || code.length !== 6}
            >
              {confirmChange.isPending ? "Confirming…" : "Confirm email change"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={confirmChange.isPending}
              onClick={() => {
                clearPendingEmailChange();
                setCode("");
                confirmChange.reset();
              }}
            >
              Cancel request
            </Button>
          </div>
        </form>
      </SettingsPanel>
    );
  }

  return (
    <SettingsPanel>
      <SettingsHeading
        title="Email address"
        copy="Request a code at your new address. Your current email remains unchanged until that code is confirmed."
      />
      <div className="mt-6 rounded-md border border-[var(--app-border)] p-4">
        <p className="text-xs text-[var(--app-muted)]">Current email</p>
        <p className="mt-1 text-sm font-semibold">{user.email}</p>
      </div>
      <form onSubmit={request} className="mt-6 space-y-5" noValidate>
        <label htmlFor="new-email" className="block text-sm font-semibold">
          New email address
          <Input
            id="new-email"
            type="email"
            value={newEmail}
            onChange={(event) => {
              setNewEmail(event.target.value);
              requestChange.reset();
            }}
            autoComplete="email"
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? "new-email-error" : "new-email-help"}
            className="mt-2"
          />
          <span
            id="new-email-help"
            className="mt-2 block text-xs font-normal text-[var(--app-muted)]"
          >
            The verification code is delivered to this new address.
          </span>
          {emailError && (
            <span
              id="new-email-error"
              className="mt-2 block text-xs text-red-500"
            >
              {emailError}
            </span>
          )}
        </label>
        <label
          htmlFor="email-change-password"
          className="block text-sm font-semibold"
        >
          Current password
          <Input
            id="email-change-password"
            type="password"
            value={currentPassword}
            onChange={(event) => {
              setCurrentPassword(event.target.value.slice(0, 128));
              requestChange.reset();
            }}
            maxLength={128}
            autoComplete="current-password"
            aria-invalid={Boolean(requestPasswordError)}
            aria-describedby={
              requestPasswordError ? "email-change-password-error" : undefined
            }
            className="mt-2"
          />
          {requestPasswordError && (
            <span
              id="email-change-password-error"
              className="mt-2 block text-xs text-red-500"
            >
              {requestPasswordError}
            </span>
          )}
        </label>
        <AsyncMessage
          error={
            localError ||
            (requestError && !emailError && !requestPasswordError
              ? getApiErrorMessage(requestError)
              : "")
          }
          success={success}
        />
        <Button
          type="submit"
          disabled={requestChange.isPending || !newEmail || !currentPassword}
        >
          {requestChange.isPending ? "Sending code…" : "Send confirmation code"}
        </Button>
      </form>
    </SettingsPanel>
  );
}
