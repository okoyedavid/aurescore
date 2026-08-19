const storageKey = "aurescore.oauth-interaction";
const maxLength = 2048;
let interactionInMemory: string | null = null;

function store() {
  return typeof window === "undefined" ? null : window.sessionStorage;
}
export function validateOAuthInteraction(value: string | null | undefined) {
  return typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maxLength
    ? value
    : null;
}
export function captureOAuthInteraction() {
  if (typeof window === "undefined") return null;
  const value = validateOAuthInteraction(
    new URLSearchParams(window.location.search).get("oauthInteraction"),
  );
  if (value) interactionInMemory = value;
  return value;
}
export function persistOAuthInteraction(value = interactionInMemory) {
  const valid = validateOAuthInteraction(value);
  if (valid) store()?.setItem(storageKey, valid);
}
export function clearOAuthInteraction() {
  interactionInMemory = null;
  store()?.removeItem(storageKey);
}
export function takeOAuthContinuationUrl() {
  const value =
    validateOAuthInteraction(interactionInMemory) ??
    validateOAuthInteraction(store()?.getItem(storageKey));
  if (!value) return null;
  clearOAuthInteraction();
  return buildApiNavigationUrl(
    `/oauth/authorize/continue?interaction=${encodeURIComponent(value)}`,
  );
}
export function preserveOAuthInteractionFromLocation() {
  const value = captureOAuthInteraction();
  if (value) {
    persistOAuthInteraction(value);
  } else if (
    typeof window !== "undefined" &&
    !new Set([
      "account-link-required",
      "password-reset-complete",
      "password-reset-cancelled",
    ]).has(new URLSearchParams(window.location.search).get("reason") ?? "")
  ) {
    clearOAuthInteraction();
  }
  return value;
}
export function buildApiNavigationUrl(
  path: string,
  base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
) {
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.");
  const url = new URL(base);
  const configured = url.pathname.replace(/\/+$/, "");
  const apiPath = configured.endsWith("/api")
    ? configured
    : `${configured}/api`;
  const [pathname, search = ""] = path.split("?");
  url.pathname = `${apiPath}/${pathname.replace(/^\/+/, "")}`.replace(
    /\/{2,}/g,
    "/",
  );
  url.search = search ? `?${search}` : "";
  url.hash = "";
  return url.toString();
}
