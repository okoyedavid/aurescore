"use client";

import { FormEvent, useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/FormField";
import { getApiErrorMessage, normalizeApiError } from "@/lib/api/errors";
import { useUpdatePreferences } from "../hooks";
import { accountPreferences, type AccountUser } from "../types";
import { AsyncMessage, SettingsHeading, SettingsPanel, Toggle } from "./shared";

export default function SecuritySettings({ user }: { user: AccountUser }) {
  const update = useUpdatePreferences();
  const submitting = useRef(false);
  const [open, setOpen] = useState(false);
  const [desired, setDesired] = useState(false);
  const [password, setPassword] = useState("");
  const preferences = accountPreferences(user);
  const apiError = update.isError ? normalizeApiError(update.error) : null;
  const passwordError =
    apiError?.fieldErrors?.currentPassword?.[0] ??
    (apiError?.status === 401
      ? "The current password is incorrect."
      : undefined);

  const close = useCallback(() => {
    if (update.isPending) return;
    setOpen(false);
    setPassword("");
    update.reset();
  }, [update]);

  function requestChange() {
    setDesired(!preferences.twoFactorEnabled);
    setPassword("");
    update.reset();
    setOpen(true);
  }

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password || submitting.current || update.isPending) return;
    submitting.current = true;
    try {
      await update.mutateAsync({
        twoFactorEnabled: desired,
        currentPassword: password,
      });
      setPassword("");
      setOpen(false);
    } catch {
      setPassword("");
    } finally {
      submitting.current = false;
    }
  }

  return (
    <>
      <SettingsPanel>
        <SettingsHeading
          title="Security"
          copy="Control email-based verification for new login attempts."
        />
        <div className="mt-7 flex items-center justify-between gap-5 border-y border-[var(--app-border)] py-5">
          <div>
            <p className="text-sm font-semibold">Email login verification</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--app-muted)]">
              When enabled, AureScore emails a six-digit code after your
              password is accepted.
            </p>
          </div>
          <Toggle
            label="Email login verification"
            checked={preferences.twoFactorEnabled}
            onChange={requestChange}
          />
        </div>
        <p className="mt-5 text-xs text-[var(--app-muted)]">
          Current status:{" "}
          <span className="font-semibold text-[var(--app-text)]">
            {preferences.twoFactorEnabled ? "Enabled" : "Disabled"}
          </span>
        </p>
      </SettingsPanel>
      <Dialog
        open={open}
        onClose={close}
        title={
          desired ? "Enable login verification" : "Disable login verification"
        }
        description="Confirm with your current password. This password is sent only with this request and is never stored."
      >
        <form onSubmit={confirm} className="space-y-5" noValidate>
          <div className="flex items-center justify-between rounded-md border border-[var(--app-border)] p-4">
            <div>
              <p className="text-sm font-semibold">Desired setting</p>
              <p className="mt-1 text-xs text-[var(--app-muted)]">
                {desired ? "Require an email code" : "Use password-only login"}
              </p>
            </div>
            <Toggle
              label="Desired email login verification setting"
              checked={desired}
              onChange={() => setDesired((value) => !value)}
            />
          </div>
          <label
            htmlFor="two-factor-password"
            className="block text-sm font-semibold"
          >
            Current password
            <Input
              id="two-factor-password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value.slice(0, 128));
                update.reset();
              }}
              maxLength={128}
              autoComplete="current-password"
              autoFocus
              aria-invalid={Boolean(passwordError)}
              aria-describedby={
                passwordError ? "two-factor-password-error" : undefined
              }
              className="mt-2"
            />
            {passwordError && (
              <span
                id="two-factor-password-error"
                className="mt-2 block text-xs text-red-500"
              >
                {passwordError}
              </span>
            )}
          </label>
          <AsyncMessage
            error={
              apiError && !passwordError ? getApiErrorMessage(apiError) : ""
            }
          />
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={update.isPending}
              onClick={close}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!password || update.isPending}>
              {update.isPending ? "Confirming…" : "Confirm change"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
