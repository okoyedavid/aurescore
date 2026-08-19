"use client";

import { useSyncExternalStore } from "react";

const notices: Record<string, string> = {
  verified: "Your email has been verified. You can now sign in.",
  "missing-challenge":
    "Your login verification session is missing or has ended. Please sign in again.",
  "session-expired": "Your session has ended. Please sign in again.",
  "session-revoked": "This device was signed out successfully.",
  "password-reset-complete":
    "Your password was reset and previous sessions were signed out. Sign in with your new password.",
};

export default function AuthNotice() {
  const notice = useSyncExternalStore(
    () => () => undefined,
    () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("verified") === "1") return notices.verified;
      return notices[params.get("reason") ?? ""] ?? "";
    },
    () => "",
  );

  return notice ? (
    <p
      role="status"
      aria-live="polite"
      className="mt-5 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800"
    >
      {notice}
    </p>
  ) : null;
}
