const challengeKey = "aurescore.pending-email-change-challenge";
const emailKey = "aurescore.pending-email-change-address";
const changedEvent = "aurescore:email-change-updated";

function storage() {
  return typeof window === "undefined" ? null : window.sessionStorage;
}

function notify() {
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event(changedEvent));
}

export function setPendingEmailChange(challengeId: string, email: string) {
  storage()?.setItem(challengeKey, challengeId);
  storage()?.setItem(emailKey, email.trim().toLowerCase());
  notify();
}

export function clearPendingEmailChange() {
  storage()?.removeItem(challengeKey);
  storage()?.removeItem(emailKey);
  notify();
}

export function getPendingEmailChange() {
  return {
    challengeId: storage()?.getItem(challengeKey) ?? "",
    email: storage()?.getItem(emailKey) ?? "",
  };
}

export function getPendingEmailChangeSnapshot() {
  const pending = getPendingEmailChange();
  return `${pending.challengeId}\n${pending.email}`;
}

export function subscribePendingEmailChange(onChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(changedEvent, onChange);
  return () => window.removeEventListener(changedEvent, onChange);
}

export function parsePendingEmailChange(snapshot: string) {
  const separator = snapshot.indexOf("\n");
  return separator < 0
    ? { challengeId: "", email: "" }
    : {
        challengeId: snapshot.slice(0, separator),
        email: snapshot.slice(separator + 1),
      };
}
