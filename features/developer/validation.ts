import type { CreateOAuthClientInput, OAuthScope } from "./types";

export type OAuthClientFieldErrors = Partial<
  Record<
    "name" | "redirectUris" | "allowedScopes" | "homepageUrl" | "logoUrl",
    string
  >
>;

export function isValidRedirectUri(value: string) {
  try {
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash) return false;
    if (url.protocol === "https:") return true;
    return (
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    );
  } catch {
    return false;
  }
}

export function validateOAuthClient(
  input: CreateOAuthClientInput,
): OAuthClientFieldErrors {
  const errors: OAuthClientFieldErrors = {};
  if (input.name.length < 3 || input.name.length > 80)
    errors.name = "Name must be between 3 and 80 characters.";
  if (input.redirectUris.length < 1 || input.redirectUris.length > 10)
    errors.redirectUris = "Add between 1 and 10 redirect URIs.";
  else if (new Set(input.redirectUris).size !== input.redirectUris.length)
    errors.redirectUris = "Redirect URIs must be unique.";
  else if (input.redirectUris.some((uri) => !isValidRedirectUri(uri)))
    errors.redirectUris =
      "Use absolute HTTPS URLs without query strings or fragments. HTTP is allowed only for localhost.";
  if (
    !input.allowedScopes.includes("openid") ||
    new Set(input.allowedScopes).size !== input.allowedScopes.length
  )
    errors.allowedScopes =
      "The openid scope is required and scopes must be unique.";
  for (const field of ["homepageUrl", "logoUrl"] as const) {
    const value = input[field];
    if (value) {
      try {
        const url = new URL(value);
        if (!["http:", "https:"].includes(url.protocol))
          errors[field] = "Enter a valid HTTP or HTTPS URL.";
      } catch {
        errors[field] = "Enter a valid absolute URL.";
      }
    }
  }
  return errors;
}

export function normalizeOAuthClientInput(
  input: CreateOAuthClientInput,
): CreateOAuthClientInput {
  const clean = (value?: string) => value?.trim() || undefined;
  return {
    name: input.name.trim(),
    description: clean(input.description),
    homepageUrl: clean(input.homepageUrl),
    logoUrl: clean(input.logoUrl),
    redirectUris: input.redirectUris.map((value) => value.trim()),
    allowedScopes: Array.from(
      new Set<OAuthScope>(["openid", ...input.allowedScopes]),
    ),
  };
}
