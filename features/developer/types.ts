export const oauthScopes = ["openid", "profile", "email"] as const;
export type OAuthScope = (typeof oauthScopes)[number];

export type OAuthClient = {
  clientId: string;
  name: string;
  description?: string | null;
  homepageUrl?: string | null;
  logoUrl?: string | null;
  redirectUris: string[];
  allowedScopes: OAuthScope[];
  state: string;
  clientSecretHint?: string | null;
  clientSecretCreatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  disabledAt?: string | null;
};

export type CreateOAuthClientInput = {
  name: string;
  description?: string;
  homepageUrl?: string;
  logoUrl?: string;
  redirectUris: string[];
  allowedScopes: OAuthScope[];
};

export type OAuthClientWithSecret = OAuthClient & { clientSecret: string };
export type RotatedOAuthSecret = {
  clientSecret: string;
  clientSecretHint?: string;
  clientSecretCreatedAt?: string;
};
