"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/FormField";
import { getApiErrorMessage, normalizeApiError } from "@/lib/api/errors";
import { accountKeys } from "../query-keys";
import { accountApi } from "../api";
import {
  useLinkGoogle,
  useRequestSecurityVerification,
  useUpdatePreferences,
} from "../hooks";
import { accountPreferences, type AccountUser } from "../types";
import { AsyncMessage, SettingsHeading, SettingsPanel, Toggle } from "./shared";
import SecurityVerificationDialog from "./SecurityVerificationDialog";

export default function SecuritySettings({
  user,
  navigate,
}: {
  user: AccountUser;
  navigate?: (url: string) => void;
}) {
  const queryClient = useQueryClient();
  const update = useUpdatePreferences();
  const requestVerification = useRequestSecurityVerification();
  const linkGoogle = useLinkGoogle();
  const submitting = useRef(false);
  const callbackHandled = useRef(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [desired, setDesired] = useState(false);
  const [password, setPassword] = useState("");
  const [challenge, setChallenge] = useState<{
    id: string;
    message: string;
  } | null>(null);
  const preferences = accountPreferences(user);
  const hasPassword = user.hasPassword !== false;
  const googleProvider = (user.authProviders ?? []).find(
    (item) => item.provider.toUpperCase() === "GOOGLE",
  );
  const googleLinked = Boolean(googleProvider);
  const linkStatus = useSyncExternalStore(
    () => () => undefined,
    () => new URLSearchParams(window.location.search).get("googleLink") ?? "",
    () => "",
  );
  useEffect(() => {
    if (callbackHandled.current || !linkStatus) return;
    callbackHandled.current = true;
    window.history.replaceState(window.history.state, "", "/settings/security");
    if (linkStatus === "success") {
      void queryClient
        .invalidateQueries({ queryKey: accountKeys.me, refetchType: "none" })
        .then(() =>
          queryClient.fetchQuery({
            queryKey: accountKeys.me,
            queryFn: ({ signal }) => accountApi.currentUser(signal),
            staleTime: 0,
          }),
        );
    }
  }, [linkStatus, queryClient]);
  const apiError = update.isError ? normalizeApiError(update.error) : null;
  const passwordError =
    apiError?.fieldErrors?.currentPassword?.[0] ??
    (apiError?.status === 401
      ? "The current password is incorrect."
      : undefined);
  const closePassword = useCallback(() => {
    if (update.isPending) return;
    setPasswordOpen(false);
    setPassword("");
    update.reset();
  }, [update]);
  async function requestChange() {
    const next = !preferences.twoFactorEnabled;
    setDesired(next);
    update.reset();
    requestVerification.reset();
    if (hasPassword) {
      setPassword("");
      setPasswordOpen(true);
      return;
    }
    try {
      const response =
        await requestVerification.mutateAsync("change-two-factor");
      setChallenge({ id: response.challengeId, message: response.message });
    } catch {}
  }
  async function apply(input: {
    currentPassword?: string;
    reauthToken?: string;
  }) {
    await update.mutateAsync({ twoFactorEnabled: desired, ...input });
  }
  async function confirmPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password || submitting.current || update.isPending) return;
    submitting.current = true;
    try {
      await apply({ currentPassword: password });
      setPassword("");
      setPasswordOpen(false);
    } catch {
      setPassword("");
    } finally {
      submitting.current = false;
    }
  }
  async function confirmProvider(reauthToken: string) {
    try {
      await apply({ reauthToken });
      setChallenge(null);
    } catch (error) {
      setChallenge(null);
      throw error;
    }
  }
  async function startGoogleLink() {
    if (linkGoogle.isPending) return;
    try {
      const response = await linkGoogle.mutateAsync();
      const url = new URL(response.url);
      if (!["http:", "https:"].includes(url.protocol))
        throw new Error("Invalid link URL");
      (navigate ?? ((value: string) => window.location.assign(value)))(
        url.toString(),
      );
    } catch {}
  }
  return (
    <>
      <SettingsPanel>
        <SettingsHeading
          title="Security"
          copy="Control email-based login verification and the identity providers connected to your account."
        />
        <div className="mt-7 divide-y divide-[var(--app-border)] border-y border-[var(--app-border)]">
          <div className="flex items-center justify-between gap-5 py-5">
            <div>
              <p className="text-sm font-semibold">Email login verification</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--app-muted)]">
                When enabled, AureScore emails a six-digit code after primary
                sign-in succeeds.
              </p>
            </div>
            <Toggle
              label="Email login verification"
              checked={preferences.twoFactorEnabled}
              disabled={update.isPending || requestVerification.isPending}
              onChange={() => void requestChange()}
            />
          </div>
          <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Google</p>
              <p className="mt-1 text-xs text-[var(--app-muted)]">
                {googleLinked
                  ? `Google was linked ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(googleProvider!.linkedAt))}.`
                  : "Connect Google to sign in more quickly."}
              </p>
            </div>
            {googleLinked ? (
              <span className="text-sm font-semibold text-emerald-500">
                Connected
              </span>
            ) : (
              <Button
                variant="outline"
                disabled={linkGoogle.isPending}
                onClick={() => void startGoogleLink()}
              >
                {linkGoogle.isPending ? "Starting Google…" : "Link Google"}
              </Button>
            )}
          </div>
        </div>
        <div className="mt-5">
          <AsyncMessage
            error={
              requestVerification.isError
                ? getApiErrorMessage(requestVerification.error)
                : update.isError
                  ? getApiErrorMessage(update.error)
                  : linkGoogle.isError
                    ? "Google could not be linked. Please try again."
                    : ""
            }
            success={
              linkStatus === "success" ? "Google was linked successfully." : ""
            }
          />
          {linkStatus === "failed" && (
            <div>
              <AsyncMessage error="Google could not be linked. Please try again." />
              {!googleLinked && (
                <button
                  type="button"
                  className="focus-ring mt-3 rounded text-sm font-semibold text-blue-500"
                  onClick={() => void startGoogleLink()}
                >
                  Retry Google linking
                </button>
              )}
            </div>
          )}
        </div>
      </SettingsPanel>
      <Dialog
        open={passwordOpen}
        onClose={closePassword}
        title={
          desired ? "Enable login verification" : "Disable login verification"
        }
        description="Confirm with your current password. It is used only for this request."
      >
        <form onSubmit={confirmPassword} className="space-y-5" noValidate>
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
              onClick={closePassword}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!password || update.isPending}>
              {update.isPending ? "Confirming…" : "Confirm change"}
            </Button>
          </div>
        </form>
      </Dialog>
      <SecurityVerificationDialog
        challengeId={challenge?.id ?? null}
        message={challenge?.message}
        title="Confirm this security change"
        operationPending={update.isPending}
        operationError={update.isError ? getApiErrorMessage(update.error) : ""}
        onClose={() => setChallenge(null)}
        onVerified={confirmProvider}
      />
    </>
  );
}
