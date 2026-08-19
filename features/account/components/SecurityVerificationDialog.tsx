"use client";

import { FormEvent, useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import OtpInput from "@/features/auth/components/OtpInput";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useVerifySecurityVerification } from "../hooks";

export default function SecurityVerificationDialog({
  challengeId,
  message,
  title,
  operationPending,
  operationError,
  onClose,
  onVerified,
}: {
  challengeId: string | null;
  message?: string;
  title: string;
  operationPending: boolean;
  operationError?: string;
  onClose: () => void;
  onVerified: (reauthToken: string) => Promise<void>;
}) {
  const [code, setCode] = useState("");
  const verify = useVerifySecurityVerification(challengeId, code, onVerified);
  const [localError, setLocalError] = useState("");
  const submitting = useRef(false);
  const close = useCallback(() => {
    if (verify.isPending || operationPending) return;
    setCode("");
    setLocalError("");
    verify.reset();
    onClose();
  }, [onClose, operationPending, verify]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !challengeId ||
      code.length !== 6 ||
      submitting.current ||
      verify.isPending ||
      operationPending
    ) {
      if (code.length !== 6)
        setLocalError("Enter all six digits of the security code.");
      return;
    }
    submitting.current = true;
    setLocalError("");
    try {
      await verify.mutateAsync();
      setCode("");
    } catch {
      // Verification and intended-action errors are rendered without retaining the token.
    } finally {
      submitting.current = false;
    }
  }

  const error =
    localError ||
    (verify.isError ? getApiErrorMessage(verify.error) : "") ||
    operationError;
  return (
    <Dialog
      open={Boolean(challengeId)}
      onClose={close}
      title={title}
      description="Enter the six-digit code sent to your verified email. The approval is single-use and expires within five minutes."
    >
      {message && (
        <p
          role="status"
          className="mb-5 rounded-md border border-blue-500/25 bg-blue-500/10 p-3 text-sm text-blue-500"
        >
          {message}
        </p>
      )}
      <form onSubmit={submit} className="space-y-5" noValidate>
        <OtpInput
          value={code}
          onChange={(value) => {
            setCode(value);
            setLocalError("");
            verify.reset();
          }}
          error={error}
          disabled={verify.isPending || operationPending}
        />
        {error && (
          <p
            id="verification-error"
            role="alert"
            aria-live="assertive"
            className="rounded-md border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-500"
          >
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={verify.isPending || operationPending}
            onClick={close}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={verify.isPending || operationPending || code.length !== 6}
          >
            {verify.isPending
              ? "Verifying…"
              : operationPending
                ? "Applying change…"
                : "Verify and continue"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
