import type { AuditEvent, UserSession } from "./types";

export function formatLocalDate(value: string | null | undefined) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function approximateLocation(value: {
  city: string | null;
  region: string | null;
  country: string | null;
}) {
  return (
    [value.city, value.region, value.country]
      .filter((part, index, all): part is string =>
        Boolean(part && all.indexOf(part) === index),
      )
      .join(", ") || "Location unavailable"
  );
}

export function readableDevice(value: {
  deviceName: string | null;
  userAgent: string | null;
}) {
  if (value.deviceName?.trim()) return value.deviceName.trim();
  const agent = value.userAgent ?? "";
  const browser = /Edg\//i.test(agent)
    ? "Edge browser"
    : /Firefox\//i.test(agent)
      ? "Firefox browser"
      : /Chrome\//i.test(agent)
        ? "Chrome browser"
        : /Safari\//i.test(agent)
          ? "Safari browser"
          : "Browser session";
  const platform = /Windows/i.test(agent)
    ? " on Windows"
    : /Android/i.test(agent)
      ? " on Android"
      : /iPhone|iPad/i.test(agent)
        ? " on an Apple mobile device"
        : /Macintosh/i.test(agent)
          ? " on macOS"
          : /Linux/i.test(agent)
            ? " on Linux"
            : "";
  return `${browser}${platform}`;
}

export function sessionState(session: UserSession) {
  if (session.revokedAt) return "revoked" as const;
  if (
    session.expiresAt &&
    new Date(session.expiresAt).getTime() <= Date.now()
  ) {
    return "expired" as const;
  }
  if (session.isCurrent) return "current" as const;
  return "active" as const;
}

const auditLabels: Record<string, string> = {
  "account.registered": "Account registered",
  "account.profile.updated": "Profile updated",
  "account.preferences.updated": "Preferences changed",
  "account.password.changed": "Password changed",
  "account.email_change.code_sent": "Email change requested",
  "account.email.changed": "Email address changed",
  "authentication.email_verification.code_sent": "Email verification code sent",
  "authentication.email_verification.failed": "Email verification failed",
  "authentication.email_verification.succeeded": "Email verified",
  "authentication.login.failed": "Failed login attempt",
  "authentication.login.succeeded": "Successful login",
  "authentication.login_verification.code_sent": "Login verification code sent",
  "authentication.login_verification.failed": "Login verification failed",
  "session.refresh.rejected": "Session refresh rejected",
  "session.refresh.succeeded": "Session refreshed",
  "session.revoked": "Session signed out",
  "security.refresh_token.replay_detected":
    "Suspicious session activity detected",
};

export function auditEventLabel(event: Pick<AuditEvent, "eventType">) {
  const known = auditLabels[event.eventType];
  if (known) return known;
  const words = event.eventType.replace(/[._-]+/g, " ").trim();
  return words
    ? `${words.charAt(0).toUpperCase()}${words.slice(1)}`
    : "Account activity";
}
