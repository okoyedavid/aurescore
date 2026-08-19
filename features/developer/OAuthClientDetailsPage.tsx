"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Copy, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  useDisableOAuthClient,
  useOAuthClient,
  useRotateOAuthSecret,
} from "./hooks";
import OneTimeSecretDialog from "./components/OneTimeSecretDialog";

function date(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Not available";
}
function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
        {label}
      </dt>
      <dd className="mt-2 break-words text-sm">{children}</dd>
    </div>
  );
}

export default function OAuthClientDetailsPage({
  clientId,
}: {
  clientId: string;
}) {
  const query = useOAuthClient(clientId);
  const [confirm, setConfirm] = useState<"rotate" | "disable" | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const rotate = useRotateOAuthSecret(clientId, setSecret);
  const disable = useDisableOAuthClient(clientId);
  if (query.isPending)
    return (
      <div className="mx-auto max-w-5xl space-y-5 px-5 py-12 md:px-8">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  if (query.isError || !query.data)
    return (
      <div className="mx-auto max-w-3xl px-5 py-12">
        <div
          role="alert"
          className="app-panel rounded-xl border border-[var(--app-border)] p-6"
        >
          <h1 className="font-display text-2xl font-semibold">
            Application unavailable
          </h1>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            {getApiErrorMessage(query.error)}
          </p>
          <button
            onClick={() => void query.refetch()}
            className="focus-ring mt-4 rounded font-semibold text-blue-600"
          >
            Try again
          </button>
        </div>
      </div>
    );
  const client = query.data;
  async function rotateNow() {
    try {
      await rotate.mutateAsync();
      setConfirm(null);
    } catch {}
  }
  async function disableNow() {
    try {
      await disable.mutateAsync();
      setConfirm(null);
      setNotice(
        "Application disabled. New sign-ins are blocked and all grants have been revoked.",
      );
    } catch {}
  }
  const actionError =
    (rotate.isError && getApiErrorMessage(rotate.error)) ||
    (disable.isError && getApiErrorMessage(disable.error));
  return (
    <div className="mx-auto max-w-5xl px-5 py-8 md:px-8 md:py-12">
      <Link
        href="/api"
        className="focus-ring rounded text-sm font-semibold text-blue-600"
      >
        ← OAuth applications
      </Link>
      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-semibold">{client.name}</h1>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            {client.description || "No description provided."}
          </p>
        </div>
        <span className="rounded-full bg-[var(--app-hover)] px-3 py-1 text-xs font-semibold">
          {client.state}
        </span>
      </div>
      {notice && (
        <p
          role="status"
          className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {notice}
        </p>
      )}
      {actionError && (
        <p
          role="alert"
          className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {actionError}
        </p>
      )}
      <dl className="app-panel mt-8 grid gap-7 rounded-xl border border-[var(--app-border)] p-6 sm:grid-cols-2 md:p-8">
        <Detail label="Client ID">
          <span className="inline-flex items-center gap-2">
            <code>{client.clientId}</code>
            <button
              aria-label="Copy client ID"
              onClick={() =>
                void navigator.clipboard.writeText(client.clientId)
              }
              className="app-icon-button"
            >
              <Copy size={15} />
            </button>
          </span>
        </Detail>
        <Detail label="Secret hint">
          <code>{client.clientSecretHint || "Not available"}</code>
        </Detail>
        <Detail label="Homepage">
          {client.homepageUrl ? (
            <a className="text-blue-600 underline" href={client.homepageUrl}>
              {client.homepageUrl}
            </a>
          ) : (
            "Not provided"
          )}
        </Detail>
        <Detail label="Logo URL">{client.logoUrl || "Not provided"}</Detail>
        <Detail label="Secret created">
          {date(client.clientSecretCreatedAt)}
        </Detail>
        <Detail label="Created">{date(client.createdAt)}</Detail>
        <Detail label="Updated">{date(client.updatedAt)}</Detail>
        <Detail label="Disabled">{date(client.disabledAt)}</Detail>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
            Allowed scopes
          </dt>
          <dd className="mt-2 flex flex-wrap gap-2">
            {client.allowedScopes.map((scope) => (
              <code
                key={scope}
                className="rounded bg-[var(--app-hover)] px-2 py-1 text-xs"
              >
                {scope}
              </code>
            ))}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
            Exact redirect URIs
          </dt>
          <dd className="mt-2 space-y-2">
            {client.redirectUris.map((uri) => (
              <code
                key={uri}
                className="block break-all rounded bg-[var(--app-hover)] p-3 text-xs"
              >
                {uri}
              </code>
            ))}
          </dd>
        </div>
      </dl>
      <section className="mt-8 rounded-xl border border-red-300/60 p-6">
        <h2 className="font-display text-2xl font-semibold">
          Sensitive actions
        </h2>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={() => setConfirm("rotate")}>
            <RotateCw size={16} />
            Rotate secret
          </Button>
          <Button
            className="bg-red-700 hover:bg-red-600"
            onClick={() => setConfirm("disable")}
          >
            <AlertTriangle size={16} />
            Disable application
          </Button>
        </div>
      </section>
      <Dialog
        open={confirm !== null}
        onClose={() =>
          !rotate.isPending && !disable.isPending && setConfirm(null)
        }
        title={
          confirm === "rotate"
            ? "Rotate client secret?"
            : "Disable this application?"
        }
        description={
          confirm === "rotate"
            ? "The current secret will stop working. The replacement is shown only once."
            : "This blocks sign-in and revokes every existing grant for this application."
        }
      >
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            disabled={rotate.isPending || disable.isPending}
            onClick={() => setConfirm(null)}
          >
            Cancel
          </Button>
          <Button
            disabled={rotate.isPending || disable.isPending}
            className={
              confirm === "disable" ? "bg-red-700 hover:bg-red-600" : ""
            }
            onClick={() =>
              void (confirm === "rotate" ? rotateNow() : disableNow())
            }
          >
            {rotate.isPending || disable.isPending
              ? "Working…"
              : confirm === "rotate"
                ? "Rotate secret"
                : "Disable application"}
          </Button>
        </div>
      </Dialog>
      <OneTimeSecretDialog
        secret={secret}
        onAcknowledge={() => setSecret(null)}
      />
    </div>
  );
}
