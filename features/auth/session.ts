const keys = {
  email: "aurescore.pending-verification-email",
  emailSentAt: "aurescore.pending-verification-sent-at",
  emailAutoResend: "aurescore.pending-verification-auto-resend",
  challenge: "aurescore.pending-login-challenge",
  challengeSentAt: "aurescore.pending-login-sent-at",
  returnTo: "aurescore.pending-return-to",
  passwordResetEmail: "aurescore.pending-password-reset-email",
  passwordResetChallenge: "aurescore.pending-password-reset-challenge",
  passwordResetSentAt: "aurescore.pending-password-reset-sent-at",
} as const;

function storage() {
  return typeof window === "undefined" ? null : window.sessionStorage;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function sanitizeReturnTo(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//"))
    return "/dashboard";
  try {
    const url = new URL(value, "https://aurescore.local");
    return url.origin === "https://aurescore.local"
      ? `${url.pathname}${url.search}${url.hash}`
      : "/dashboard";
  } catch {
    return "/dashboard";
  }
}

export function getReturnToFromLocation() {
  if (typeof window === "undefined") return "/dashboard";
  return sanitizeReturnTo(
    new URLSearchParams(window.location.search).get("returnTo"),
  );
}

export function setPendingEmail(email: string) {
  storage()?.setItem(keys.email, normalizeEmail(email));
  storage()?.setItem(keys.emailSentAt, String(Date.now()));
  storage()?.removeItem(keys.emailAutoResend);
}

export function requestAutomaticEmailResend(email: string) {
  storage()?.setItem(keys.email, normalizeEmail(email));
  storage()?.setItem(keys.emailSentAt, "0");
  storage()?.setItem(keys.emailAutoResend, "true");
}

export function consumeAutomaticEmailResend() {
  const pending = storage()?.getItem(keys.emailAutoResend) === "true";
  storage()?.removeItem(keys.emailAutoResend);
  return pending;
}

export function getPendingEmail() {
  return storage()?.getItem(keys.email) ?? "";
}

export function clearPendingEmail() {
  storage()?.removeItem(keys.email);
  storage()?.removeItem(keys.emailSentAt);
  storage()?.removeItem(keys.emailAutoResend);
}

export function setPendingChallenge(challengeId: string, returnTo: string) {
  storage()?.setItem(keys.challenge, challengeId);
  storage()?.setItem(keys.challengeSentAt, String(Date.now()));
  storage()?.setItem(keys.returnTo, sanitizeReturnTo(returnTo));
}

export function getPendingChallenge() {
  return storage()?.getItem(keys.challenge) ?? "";
}

export function clearPendingChallenge() {
  storage()?.removeItem(keys.challenge);
  storage()?.removeItem(keys.challengeSentAt);
  storage()?.removeItem(keys.returnTo);
}

export function getPendingReturnTo() {
  return sanitizeReturnTo(storage()?.getItem(keys.returnTo));
}

export function clearChallengeOnly() {
  storage()?.removeItem(keys.challenge);
  storage()?.removeItem(keys.challengeSentAt);
}

export function getCooldownSeconds(kind: "email" | "login" | "password-reset") {
  const key =
    kind === "email"
      ? keys.emailSentAt
      : kind === "login"
        ? keys.challengeSentAt
        : keys.passwordResetSentAt;
  const sentAt = Number(storage()?.getItem(key) ?? 0);
  return Math.max(0, 60 - Math.floor((Date.now() - sentAt) / 1000));
}

export function restartCooldown(kind: "email" | "login" | "password-reset") {
  storage()?.setItem(
    kind === "email"
      ? keys.emailSentAt
      : kind === "login"
        ? keys.challengeSentAt
        : keys.passwordResetSentAt,
    String(Date.now()),
  );
}

export function setPasswordResetState(email: string, challengeId: string) {
  storage()?.setItem(keys.passwordResetEmail, normalizeEmail(email));
  storage()?.setItem(keys.passwordResetChallenge, challengeId);
  storage()?.setItem(keys.passwordResetSentAt, String(Date.now()));
}

export function getPasswordResetState() {
  const email = storage()?.getItem(keys.passwordResetEmail) ?? "";
  const challengeId = storage()?.getItem(keys.passwordResetChallenge) ?? "";
  if (!email || !challengeId || challengeId.length > 2048) {
    clearPasswordResetState();
    return null;
  }
  return { email: normalizeEmail(email), challengeId };
}

export function getPasswordResetSnapshot() {
  const state = getPasswordResetState();
  return state ? JSON.stringify(state) : "";
}

export function clearPasswordResetState() {
  storage()?.removeItem(keys.passwordResetEmail);
  storage()?.removeItem(keys.passwordResetChallenge);
  storage()?.removeItem(keys.passwordResetSentAt);
}
