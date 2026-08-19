import type { AccountUser } from "@/features/account/types";

export type AuthUser = AccountUser;

export type MessageResponse = { message: string };

export type LoginSuccessResponse = MessageResponse & {
  user: AuthUser;
  requiresTwoFactor?: false;
};

export type LoginChallengeResponse = MessageResponse & {
  requiresTwoFactor: true;
  challengeId: string;
};

export type LoginResponse = LoginSuccessResponse | LoginChallengeResponse;

export type RegisterInput = { email: string; name: string; password: string };
export type LoginInput = { email: string; password: string };
export type VerifyEmailInput = { email: string; code: string };
export type VerifyLoginInput = { challengeId: string; code: string };
