"use client";

import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";

export default function OneTimeSecretDialog({
  secret,
  onAcknowledge,
}: {
  secret: string | null;
  onAcknowledge: () => void;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(secret ?? "");
    setCopied(true);
  }
  return (
    <Dialog
      open={Boolean(secret)}
      dismissible={false}
      title="Save your client secret"
      description="This is the only time AureScore will show the complete secret. Store it in your server-side secret manager."
      onClose={() => undefined}
    >
      <div className="rounded-sm border border-[var(--app-border)] bg-[var(--app-hover)] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <KeyRound size={17} />
          Client secret
        </div>
        <code
          className="mt-3 block break-all rounded-md bg-[var(--app-bg)] p-3 text-sm"
          data-testid="client-secret"
        >
          {secret}
        </code>
      </div>
      <p className="mt-3 text-xs text-[var(--app-muted)]" aria-live="polite">
        {copied
          ? "Copied to clipboard."
          : "It cannot be recovered later. Rotating it invalidates the previous secret."}
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button type="button" variant="outline" onClick={copy}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button type="button" onClick={onAcknowledge}>
          I have saved it
        </Button>
      </div>
    </Dialog>
  );
}
