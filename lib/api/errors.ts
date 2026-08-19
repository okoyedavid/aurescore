import axios from "axios";

type BackendErrorBody = {
  code?: unknown;
  message?: unknown;
  errors?: unknown;
};

export type ApiError = Error & {
  status?: number;
  code?: string;
  fieldErrors?: Record<string, string[]>;
  validationMessages?: string[];
};

function toMessages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return typeof value === "string" ? [value] : [];
}

function extractFieldErrors(
  value: unknown,
): Record<string, string[]> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;

  const entries = Object.entries(value)
    .map(([field, messages]) => [field, toMessages(messages)] as const)
    .filter(([, messages]) => messages.length > 0);

  return entries.length ? Object.fromEntries(entries) : undefined;
}

function inferFieldErrors(messages: string[]) {
  const fields = [
    "name",
    "bio",
    "username",
    "avatar",
    "desktopNotifications",
    "twoFactorEnabled",
    "currentPassword",
    "newPassword",
    "newEmail",
    "code",
    "challengeId",
  ];
  const inferred: Record<string, string[]> = {};
  for (const message of messages) {
    const compact = message.replace(/[^a-z0-9]/gi, "").toLowerCase();
    const field = fields.find((candidate) =>
      compact.startsWith(candidate.toLowerCase()),
    );
    if (field) (inferred[field] ??= []).push(message);
  }
  return Object.keys(inferred).length ? inferred : undefined;
}

export function normalizeApiError(error: unknown): ApiError {
  if ((error as ApiError)?.name === "ApiError") return error as ApiError;

  if (!axios.isAxiosError<BackendErrorBody>(error)) {
    const normalized = new Error(
      "Something went wrong. Please try again.",
    ) as ApiError;
    normalized.name = "ApiError";
    return normalized;
  }

  const body = error.response?.data;
  const messageList = toMessages(body?.message);
  const explicitFieldErrors = extractFieldErrors(body?.errors);
  const fieldErrors = explicitFieldErrors ?? inferFieldErrors(messageList);
  const message =
    messageList[0] ??
    Object.values(fieldErrors ?? {})[0]?.[0] ??
    (error.code === "ERR_CANCELED"
      ? "The request was cancelled."
      : "We could not complete your request. Please try again.");
  const normalized = new Error(message) as ApiError;
  normalized.name = "ApiError";
  normalized.status = error.response?.status;
  normalized.code = typeof body?.code === "string" ? body.code : undefined;
  normalized.fieldErrors = fieldErrors;
  normalized.validationMessages = messageList.length ? messageList : undefined;
  return normalized;
}

export function getApiErrorMessage(error: unknown) {
  return normalizeApiError(error).message;
}

const emailVerificationRequiredCodes = new Set([
  "EMAIL_NOT_VERIFIED",
  "EMAIL_VERIFICATION_REQUIRED",
  "UNVERIFIED_EMAIL",
]);

export function isEmailVerificationRequired(error: unknown) {
  const normalized = normalizeApiError(error);
  if (normalized.code && emailVerificationRequiredCodes.has(normalized.code)) {
    return true;
  }

  return (
    normalized.status === 403 &&
    /email/i.test(normalized.message) &&
    /(not\s+verified|unverified|verification\s+required)/i.test(
      normalized.message,
    )
  );
}
