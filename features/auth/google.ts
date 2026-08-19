const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

if (!configuredApiBaseUrl) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.");
}

export function buildGoogleAuthUrl(baseUrl = configuredApiBaseUrl) {
  const url = new URL(baseUrl);
  const configuredPath = url.pathname.replace(/\/+$/, "");
  const apiPath = configuredPath.endsWith("/api")
    ? configuredPath
    : `${configuredPath}/api`;

  url.pathname = `${apiPath}/auth/google`.replace(/\/{2,}/g, "/");
  url.search = "";
  url.hash = "";
  return url.toString();
}

export const googleAuthUrl = buildGoogleAuthUrl();
