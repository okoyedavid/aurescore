import { apiClient } from "@/lib/api/client";
import { normalizeApiError } from "@/lib/api/errors";
import type {
  AccountPreferences,
  AccountUser,
  AuditEventsPage,
  ChangePasswordInput,
  EmailChangeChallenge,
  MessageResponse,
  RevokeOtherSessionsResponse,
  RevokeSessionResponse,
  UpdatePreferencesInput,
  UpdateProfileInput,
  UserSession,
  OAuthGrant,
  SecurityVerificationChallenge,
  SecurityVerificationResult,
  SensitiveAction,
} from "./types";

async function request<T>(operation: Promise<{ data: T }>) {
  try {
    return (await operation).data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export const accountApi = {
  currentUser: async (signal?: AbortSignal): Promise<AccountUser | null> => {
    try {
      return await request<AccountUser>(
        apiClient.get("/account/me", { signal }),
      );
    } catch (error) {
      const normalized = normalizeApiError(error);
      if (normalized.status === 401) return null;
      throw normalized;
    }
  },
  updateProfile: (input: UpdateProfileInput) =>
    request<AccountUser>(apiClient.patch("/account/profile", input)),
  updatePreferences: (input: UpdatePreferencesInput) =>
    request<AccountPreferences>(apiClient.patch("/account/preferences", input)),
  changePassword: (input: ChangePasswordInput) =>
    request<MessageResponse>(apiClient.patch("/account/password", input)),
  requestEmailChange: (input: {
    newEmail: string;
    currentPassword?: string;
    reauthToken?: string;
  }) =>
    request<EmailChangeChallenge>(
      apiClient.post("/account/email-change/request", input),
    ),
  confirmEmailChange: (input: { challengeId: string; code: string }) =>
    request<MessageResponse>(
      apiClient.post("/account/email-change/confirm", input),
    ),
  sessions: (signal?: AbortSignal) =>
    request<UserSession[]>(apiClient.get("/sessions", { signal })),
  revokeSession: (sessionId: string) =>
    request<RevokeSessionResponse>(
      apiClient.delete(`/sessions/${encodeURIComponent(sessionId)}`),
    ),
  revokeOtherSessions: () =>
    request<RevokeOtherSessionsResponse>(apiClient.delete("/sessions/others")),
  auditEvents: (input: {
    limit: number;
    cursor?: string;
    signal?: AbortSignal;
  }) =>
    request<AuditEventsPage>(
      apiClient.get("/audit-events", {
        signal: input.signal,
        params: { limit: input.limit, cursor: input.cursor },
      }),
    ),
  requestSecurityVerification: (action: SensitiveAction) =>
    request<SecurityVerificationChallenge>(
      apiClient.post("/account/security-verification/request", { action }),
    ),
  verifySecurityVerification: (input: { challengeId: string; code: string }) =>
    request<SecurityVerificationResult>(
      apiClient.post("/account/security-verification/verify", input),
    ),
  googleLink: () =>
    request<{ url: string }>(apiClient.post("/auth/google/link")),
  oauthGrants: (signal?: AbortSignal) =>
    request<OAuthGrant[]>(apiClient.get("/account/oauth-grants", { signal })),
  revokeOAuthGrant: (grantId: string) =>
    request<MessageResponse>(
      apiClient.delete(`/account/oauth-grants/${encodeURIComponent(grantId)}`),
    ),
};
