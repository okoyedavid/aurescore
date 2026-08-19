import { apiClient } from "@/lib/api/client";
import { normalizeApiError } from "@/lib/api/errors";
import type {
  LoginInput,
  LoginResponse,
  LoginSuccessResponse,
  MessageResponse,
  RegisterInput,
  VerifyEmailInput,
  VerifyLoginInput,
  PasswordResetConfirmInput,
  PasswordResetRequestInput,
  PasswordResetRequestResponse,
  LogoutResponse,
} from "./types";

async function request<T>(operation: Promise<{ data: T }>) {
  try {
    return (await operation).data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export const authApi = {
  register: (input: RegisterInput, signal?: AbortSignal) =>
    request<MessageResponse>(
      apiClient.post("/auth/register", input, { signal }),
    ),
  verifyEmail: (input: VerifyEmailInput, signal?: AbortSignal) =>
    request<MessageResponse>(
      apiClient.post("/auth/email-verification/verify", input, { signal }),
    ),
  resendEmailVerification: (email: string, signal?: AbortSignal) =>
    request<MessageResponse>(
      apiClient.post("/auth/email-verification/resend", { email }, { signal }),
    ),
  login: (input: LoginInput, signal?: AbortSignal) =>
    request<LoginResponse>(apiClient.post("/auth/login", input, { signal })),
  verifyLogin: (input: VerifyLoginInput, signal?: AbortSignal) =>
    request<LoginSuccessResponse>(
      apiClient.post("/auth/login-verification/verify", input, { signal }),
    ),
  resendLoginVerification: (challengeId: string, signal?: AbortSignal) =>
    request<MessageResponse>(
      apiClient.post(
        "/auth/login-verification/resend",
        { challengeId },
        { signal },
      ),
    ),
  requestPasswordReset: (
    input: PasswordResetRequestInput,
    signal?: AbortSignal,
  ) =>
    request<PasswordResetRequestResponse>(
      apiClient.post("/auth/password-reset/request", input, { signal }),
    ),
  confirmPasswordReset: (
    input: PasswordResetConfirmInput,
    signal?: AbortSignal,
  ) =>
    request<MessageResponse>(
      apiClient.post("/auth/password-reset/confirm", input, { signal }),
    ),
  logout: () => request<LogoutResponse>(apiClient.post("/auth/logout")),
};
