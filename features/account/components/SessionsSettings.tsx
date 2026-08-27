"use client";

import { useCallback, useState } from "react";
import { Monitor, RefreshCw, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { clearAuthenticatedUser } from "@/features/auth/auth-state";
import { getApiErrorMessage, normalizeApiError } from "@/lib/api/errors";
import {
  useRevokeOtherSessions,
  useRevokeSession,
  useSessions,
} from "../hooks";
import {
  approximateLocation,
  formatLocalDate,
  readableDevice,
  sessionState,
} from "../presentation";
import type { UserSession } from "../types";
import { AsyncMessage, SettingsHeading, SettingsPanel } from "./shared";

const stateStyles = {
  current: "bg-emerald-500/10 text-emerald-500",
  active: "bg-blue-500/10 text-blue-500",
  revoked: "bg-red-500/10 text-red-500",
  expired: "bg-orange/10 text-orange",
};

export default function SessionsSettings() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessions = useSessions();
  const revoke = useRevokeSession();
  const revokeOthers = useRevokeOtherSessions();
  const [selected, setSelected] = useState<UserSession | null>(null);
  const [confirmOthers, setConfirmOthers] = useState(false);
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const closeSessionDialog = useCallback(() => {
    if (!revoke.isPending) setSelected(null);
  }, [revoke.isPending]);
  const closeOthersDialog = useCallback(() => {
    if (!revokeOthers.isPending) setConfirmOthers(false);
  }, [revokeOthers.isPending]);
  const otherActive =
    sessions.data?.filter(
      (session) => !session.isCurrent && sessionState(session) === "active",
    ).length ?? 0;

  async function revokeSelected() {
    if (!selected || revoke.isPending) return;
    setActionError("");
    setMessage("");
    try {
      const response = await revoke.mutateAsync(selected.userSessionId);
      setSelected(null);
      if (response.currentSessionRevoked) {
        clearAuthenticatedUser(queryClient);
        router.replace("/sign-in?reason=session-revoked");
        return;
      }
      setMessage(response.message);
    } catch (error) {
      const normalized = normalizeApiError(error);
      setActionError(
        normalized.status === 404
          ? "That session no longer exists. Refresh the list and try again."
          : getApiErrorMessage(normalized),
      );
    }
  }

  async function revokeAllOthers() {
    if (!otherActive || revokeOthers.isPending) return;
    setActionError("");
    setMessage("");
    try {
      const response = await revokeOthers.mutateAsync();
      setConfirmOthers(false);
      setMessage(
        `${response.message}. ${response.revoked} session${response.revoked === 1 ? "" : "s"} revoked.`,
      );
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    }
  }

  return (
    <>
      <SettingsPanel>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <SettingsHeading
            title="Sessions and devices"
            copy="Review authentication sessions. Device descriptions are estimates based on the supplied name or browser user agent."
          />
          <Button
            type="button"
            variant="outline"
            disabled={!otherActive || sessions.isPending}
            onClick={() => setConfirmOthers(true)}
          >
            Sign out all other devices
          </Button>
        </div>
        {sessions.isFetching && !sessions.isPending && (
          <p
            role="status"
            className="mt-4 flex items-center gap-2 text-xs text-blue-500"
          >
            <RefreshCw size={13} className="animate-spin" />
            Refreshing sessions…
          </p>
        )}
        <div className="mt-6">
          <AsyncMessage
            error={
              actionError ||
              (sessions.isError ? getApiErrorMessage(sessions.error) : "")
            }
            success={message}
          />
        </div>
        {sessions.isPending ? (
          <div
            className="mt-6 space-y-3"
            role="status"
            aria-label="Loading sessions"
          >
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {sessions.data?.map((session) => {
              const state = sessionState(session);
              return (
                <article
                  key={session.userSessionId}
                  className="border border-[var(--app-border)] p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--app-hover)]">
                      <Monitor size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold">
                          {readableDevice(session)}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${stateStyles[state]}`}
                        >
                          {state === "current" ? "Current session" : state}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-[var(--app-muted)]">
                        {approximateLocation(session)}
                        {session.ipAddress ? ` · ${session.ipAddress}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-[var(--app-muted)]">
                        Last active {formatLocalDate(session.lastSeenAt)} ·
                        Started {formatLocalDate(session.createdAt)}
                      </p>
                      {session.expiresAt && (
                        <p className="mt-1 text-xs text-[var(--app-muted)]">
                          Expires {formatLocalDate(session.expiresAt)}
                        </p>
                      )}
                    </div>
                    {state !== "revoked" && state !== "expired" && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(session);
                          setActionError("");
                        }}
                        className="focus-ring w-fit rounded text-xs font-semibold text-red-500"
                      >
                        {session.isCurrent
                          ? "Sign out this device"
                          : "Revoke session"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
            {sessions.data?.length === 0 && (
              <p className="py-8 text-center text-sm text-[var(--app-muted)]">
                No sessions are available.
              </p>
            )}
          </div>
        )}
      </SettingsPanel>
      <Dialog
        open={Boolean(selected)}
        onClose={closeSessionDialog}
        title={
          selected?.isCurrent ? "Sign out this device?" : "Revoke this session?"
        }
        description={
          selected?.isCurrent
            ? "This explicitly revokes your current session and returns you to sign in."
            : "The selected device will need to sign in again. Your current session remains active."
        }
      >
        <div className="flex items-start gap-3 rounded-md bg-red-500/10 p-4 text-sm text-red-500">
          <ShieldAlert size={18} className="mt-0.5 shrink-0" />
          <p>{selected ? readableDevice(selected) : "Selected session"}</p>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={revoke.isPending}
            onClick={closeSessionDialog}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={revoke.isPending}
            onClick={() => void revokeSelected()}
          >
            {revoke.isPending ? "Revoking…" : "Revoke session"}
          </Button>
        </div>
      </Dialog>
      <Dialog
        open={confirmOthers}
        onClose={closeOthersDialog}
        title="Sign out all other devices?"
        description={`This will revoke ${otherActive} active session${otherActive === 1 ? "" : "s"}. This device remains signed in.`}
      >
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={revokeOthers.isPending}
            onClick={closeOthersDialog}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={revokeOthers.isPending}
            onClick={() => void revokeAllOthers()}
          >
            {revokeOthers.isPending ? "Signing out…" : "Sign out other devices"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
