import { buildApiNavigationUrl } from "./oauth-interaction";

export function buildGoogleAuthUrl(baseUrl?: string) {
  return buildApiNavigationUrl("/auth/google", baseUrl);
}

export const googleAuthUrl = buildGoogleAuthUrl();
