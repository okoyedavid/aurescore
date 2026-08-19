"use client";

import { useRef } from "react";
import { useAppShell } from "@/features/app-shell/AppShellContext";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useUpdatePreferences } from "../hooks";
import { accountPreferences, type AccountUser } from "../types";
import { AsyncMessage, SettingsHeading, SettingsPanel, Toggle } from "./shared";

export default function PreferencesSettings({ user }: { user: AccountUser }) {
  const { theme, toggleTheme } = useAppShell();
  const update = useUpdatePreferences();
  const changing = useRef(false);
  const preferences = accountPreferences(user);

  async function changeDesktopNotifications() {
    if (changing.current || update.isPending) return;
    changing.current = true;
    try {
      await update.mutateAsync({
        desktopNotifications: !preferences.desktopNotifications,
      });
    } catch {
      // The normalized mutation error is rendered below.
    } finally {
      changing.current = false;
    }
  }

  return (
    <SettingsPanel>
      <SettingsHeading
        title="Preferences"
        copy="Choose account notifications and the appearance of this device."
      />
      <div className="mt-7 divide-y divide-[var(--app-border)] border-y border-[var(--app-border)]">
        <div className="flex items-center justify-between gap-5 py-5">
          <div>
            <p className="text-sm font-semibold">Desktop notifications</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--app-muted)]">
              Allow AureScore to use desktop notification features when they are
              available.
            </p>
          </div>
          <Toggle
            label="Desktop notifications"
            checked={preferences.desktopNotifications}
            disabled={update.isPending}
            onChange={() => void changeDesktopNotifications()}
          />
        </div>
        <div className="flex items-center justify-between gap-5 py-5">
          <div>
            <p className="text-sm font-semibold">Dark appearance</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--app-muted)]">
              Stored only on this browser and not sent to your account.
            </p>
          </div>
          <Toggle
            label="Dark appearance"
            checked={theme === "dark"}
            onChange={toggleTheme}
          />
        </div>
      </div>
      <div className="mt-5">
        <AsyncMessage
          error={update.isError ? getApiErrorMessage(update.error) : ""}
          success={update.isSuccess ? "Preferences saved." : ""}
        />
        {update.isPending && (
          <p role="status" className="mt-3 text-xs text-blue-500">
            Updating desktop notifications…
          </p>
        )}
      </div>
    </SettingsPanel>
  );
}
