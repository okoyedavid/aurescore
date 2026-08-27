import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.");
}

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean };
type RefreshErrorBody = { code?: string; message?: unknown };
type AuthFailureHandler = () => void;

let refreshPromise: Promise<void> | null = null;
let authFailureHandler: AuthFailureHandler | null = null;
let authFailureHandled = false;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

const excludedAuthPaths = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/google",
  "/auth/logout",
  "/auth/email-verification/",
  "/auth/login-verification/",
  "/auth/password-reset/",
  "/public/public-calculators",
  "/public/public-calculators/",
];

function requestPath(config: InternalAxiosRequestConfig) {
  try {
    return new URL(config.url ?? "", config.baseURL ?? API_BASE_URL).pathname;
  } catch {
    return config.url ?? "";
  }
}

function isRefreshExcluded(config: InternalAxiosRequestConfig) {
  const path = requestPath(config);
  return excludedAuthPaths.some((excluded) =>
    excluded.endsWith("/") ? path.startsWith(excluded) : path === excluded,
  );
}

function isCurrentPasswordFailure(error: AxiosError<RefreshErrorBody>) {
  const code = error.response?.data?.code;
  const message = error.response?.data?.message;
  const messages = Array.isArray(message) ? message : [message];
  return (
    code === "CURRENT_PASSWORD_INCORRECT" ||
    code === "INVALID_CURRENT_PASSWORD" ||
    messages.some(
      (item) =>
        typeof item === "string" &&
        /(current password (?:is )?incorrect|incorrect current password)/i.test(
          item,
        ),
    )
  );
}

async function performRefresh() {
  try {
    await refreshClient.post("/auth/refresh");
  } catch (error) {
    const refreshError = error as AxiosError<RefreshErrorBody>;
    if (
      refreshError.response?.status === 409 &&
      refreshError.response.data?.code === "REFRESH_ALREADY_ROTATED"
    ) {
      return;
    }
    throw error;
  }
}

function refreshOnce() {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function handleAuthFailure() {
  if (authFailureHandled) return;
  authFailureHandled = true;
  authFailureHandler?.();
}

apiClient.interceptors.request.use((config) => {
  config.withCredentials = true;
  config.headers = AxiosHeaders.from(config.headers);
  if (config.data !== undefined && !config.headers.has("Content-Type")) {
    config.headers.set("Content-Type", "application/json");
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableRequest | undefined;
    if (
      error.response?.status === 401 &&
      isCurrentPasswordFailure(error as AxiosError<RefreshErrorBody>)
    ) {
      return Promise.reject(error);
    }
    if (
      error.response?.status !== 401 ||
      !original ||
      isRefreshExcluded(original)
    ) {
      return Promise.reject(error);
    }

    if (original._retry) {
      handleAuthFailure();
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      await refreshOnce();
      return await apiClient(original);
    } catch (refreshError) {
      handleAuthFailure();
      return Promise.reject(refreshError);
    }
  },
);

export function setAuthFailureHandler(handler: AuthFailureHandler | null) {
  authFailureHandler = handler;
  return () => {
    if (authFailureHandler === handler) authFailureHandler = null;
  };
}

export function resetAuthFailureRedirect() {
  authFailureHandled = false;
}

export const apiClientTesting = {
  refreshClient,
  reset() {
    refreshPromise = null;
    authFailureHandler = null;
    authFailureHandled = false;
  },
};
