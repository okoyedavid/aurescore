"use client";

import Image from "next/image";
import { useState } from "react";
import { ExternalLink, PlugZap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useOAuthGrants, useRevokeOAuthGrant } from "../hooks";
import type { OAuthGrant } from "../types";
import { AsyncMessage, SettingsHeading, SettingsPanel } from "./shared";

function date(value: string | null) {
  return value
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Never";
}
export default function ConnectedApplications() {
  const grants = useOAuthGrants();
  const revoke = useRevokeOAuthGrant();
  const [selected, setSelected] = useState<OAuthGrant | null>(null);
  const [success, setSuccess] = useState("");
  async function confirm() {
    if (!selected || revoke.isPending) return;
    try {
      const response = await revoke.mutateAsync(selected.grantId);
      setSuccess(response.message);
      setSelected(null);
    } catch {}
  }
  return (
    <SettingsPanel>
      <SettingsHeading
        title="Connected applications"
        copy="Review external applications that can access your AureScore account and revoke access at any time."
      />
      {grants.isPending ? (
        <div className="mt-7 space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : grants.isError ? (
        <div className="mt-6">
          <AsyncMessage error={getApiErrorMessage(grants.error)} />
          <button
            className="focus-ring mt-3 rounded text-sm font-semibold text-blue-500"
            onClick={() => void grants.refetch()}
          >
            Try again
          </button>
        </div>
      ) : grants.data?.length ? (
        <div className="mt-7 divide-y divide-[var(--app-border)] border-y border-[var(--app-border)]">
          {grants.data.map((grant) => (
            <article
              key={grant.grantId}
              className="flex flex-col gap-4 py-5 sm:flex-row sm:items-start"
            >
              <div className="flex min-w-0 flex-1 gap-4">
                {grant.client.logoUrl ? (
                  <Image
                    src={grant.client.logoUrl}
                    alt=""
                    width={44}
                    height={44}
                    unoptimized
                    className="h-11 w-11 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--app-hover)]">
                    <PlugZap size={20} />
                  </span>
                )}
                <div className="min-w-0">
                  <h3 className="font-semibold">{grant.client.name}</h3>
                  {grant.client.homepageUrl && (
                    <a
                      href={grant.client.homepageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="focus-ring mt-1 inline-flex items-center gap-1 rounded text-xs text-blue-500"
                    >
                      Visit homepage <ExternalLink size={12} />
                    </a>
                  )}
                  <p className="mt-2 text-xs text-[var(--app-muted)]">
                    Scopes: {grant.scopes.join(", ")}
                  </p>
                  <p className="mt-1 text-xs text-[var(--app-muted)]">
                    Granted {date(grant.createdAt)} · Last used{" "}
                    {date(grant.lastUsedAt)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                disabled={revoke.isPending}
                onClick={() => {
                  setSuccess("");
                  revoke.reset();
                  setSelected(grant);
                }}
              >
                Revoke access
              </Button>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-7 rounded-lg border border-dashed border-[var(--app-border)] p-8 text-center">
          <PlugZap className="mx-auto text-[var(--app-muted)]" />
          <p className="mt-3 font-semibold">No connected applications</p>
          <p className="mt-1 text-sm text-[var(--app-muted)]">
            Applications you authorize will appear here.
          </p>
        </div>
      )}
      <div className="mt-5">
        <AsyncMessage
          error={revoke.isError ? getApiErrorMessage(revoke.error) : ""}
          success={success}
        />
      </div>
      <Dialog
        open={Boolean(selected)}
        onClose={() => !revoke.isPending && setSelected(null)}
        title="Revoke application access?"
        description={`${selected?.client.name ?? "This application"} will lose access to your AureScore account. You can authorize it again later.`}
      >
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            disabled={revoke.isPending}
            onClick={() => setSelected(null)}
          >
            Cancel
          </Button>
          <Button
            className="bg-red-700 hover:bg-red-600"
            disabled={revoke.isPending}
            onClick={() => void confirm()}
          >
            {revoke.isPending ? "Revoking…" : "Revoke access"}
          </Button>
        </div>
      </Dialog>
    </SettingsPanel>
  );
}
