export type AccountPreferences = {
  desktopNotifications: boolean;
  twoFactorEnabled: boolean;
};

export type AccountUser = {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  bio?: string | null;
  username: string | null;
  status?: string;
  emailVerifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  preferences?: Partial<AccountPreferences> | null;
  hasPassword?: boolean;
  authProviders?: Array<{ provider: string; linkedAt: string }>;
};

export type UpdateProfileInput = Partial<{
  name: string;
  bio: string | null;
  username: string | null;
  avatar: string | null;
}>;

export type UpdatePreferencesInput = Partial<AccountPreferences> & {
  currentPassword?: string;
  reauthToken?: string;
};

export type ChangePasswordInput = {
  currentPassword?: string;
  reauthToken?: string;
  newPassword: string;
};

export type SensitiveAction =
  | "set-password"
  | "change-email"
  | "change-two-factor";
export type SecurityVerificationChallenge = MessageResponse & {
  challengeId: string;
};
export type SecurityVerificationResult = {
  reauthToken: string;
  expiresIn: number;
};

export type OAuthGrant = {
  grantId: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt: string | null;
  client: {
    clientId?: string;
    name: string;
    homepageUrl?: string | null;
    logoUrl?: string | null;
  };
};

export type EmailChangeChallenge = {
  message: string;
  challengeId: string;
};

export type UserSession = {
  userSessionId: string;
  userAgent: string | null;
  deviceName: string | null;
  ipAddress: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  lastSeenAt: string;
  createdAt: string;
  revokedAt: string | null;
  isCurrent: boolean;
  expiresAt: string | null;
};

export type AuditEvent = {
  eventId: string;
  eventType: string;
  category: string;
  outcome: string;
  severity: string;
  userSessionId: string | null;
  authSessionId: string | null;
  requestId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  deviceName: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  reason: string | null;
  changes: unknown;
  metadata: unknown;
  createdAt: string;
};

export type AuditEventsPage = {
  items: AuditEvent[];
  nextCursor: string | null;
};

export type MessageResponse = { message: string };
export type RevokeSessionResponse = MessageResponse & {
  currentSessionRevoked: boolean;
};
export type RevokeOtherSessionsResponse = MessageResponse & { revoked: number };

export const defaultAccountPreferences: AccountPreferences = {
  desktopNotifications: false,
  twoFactorEnabled: false,
};

export function accountPreferences(user: AccountUser | null | undefined) {
  return { ...defaultAccountPreferences, ...(user?.preferences ?? {}) };
}
