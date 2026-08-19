import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { StrictMode, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient, apiClientTesting } from "@/lib/api/client";
import GoogleAuthCallbackPage from "./GoogleAuthCallbackPage";
import { authUserQueryKey } from "./auth-state";
import GoogleSignInButton from "./components/GoogleSignInButton";
import { parseGoogleCallback } from "./google-callback";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

const apiMock = new MockAdapter(apiClient);
const refreshMock = new MockAdapter(apiClientTesting.refreshClient);
const user = {
  id: "google-user-1",
  email: "google@example.com",
  name: "Google User",
  username: null,
  avatar: null,
};

function renderWithClient(ui: ReactNode, strict = false) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const content = (
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
  render(strict ? <StrictMode>{content}</StrictMode> : content);
  return queryClient;
}

describe("Google authentication", () => {
  beforeEach(() => {
    apiClientTesting.reset();
    apiMock.reset();
    refreshMock.reset();
    navigation.push.mockReset();
    navigation.replace.mockReset();
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.replaceState(
      {},
      "",
      "/auth/callback?provider=google&status=success",
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts Google sign-in with one full-page navigation and disables immediately", () => {
    const navigate = vi.fn();
    render(<GoogleSignInButton navigate={navigate} />);

    const button = screen.getByRole("button", { name: "Continue with Google" });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(
      "http://localhost:3001/api/auth/google",
    );
    expect(
      screen.getByRole("button", { name: "Redirecting to Google" }),
    ).toBeDisabled();
  });

  it("parses every supported callback state and rejects malformed callbacks", () => {
    expect(
      parseGoogleCallback({ provider: "google", status: "success" }),
    ).toEqual({ kind: "success" });
    expect(
      parseGoogleCallback({
        provider: "google",
        status: "verification-required",
        challengeId: "opaque-challenge",
      }),
    ).toEqual({
      kind: "verification-required",
      challengeId: "opaque-challenge",
    });
    expect(
      parseGoogleCallback({
        provider: "google",
        status: "account-link-required",
      }),
    ).toEqual({ kind: "account-link-required" });
    expect(
      parseGoogleCallback({ provider: "google", status: "failed" }),
    ).toEqual({ kind: "failed" });
    expect(parseGoogleCallback({ status: "success" })).toEqual({
      kind: "failed",
    });
    expect(
      parseGoogleCallback({ provider: "github", status: "success" }),
    ).toEqual({ kind: "failed" });
    expect(
      parseGoogleCallback({
        provider: "google",
        status: "verification-required",
        challengeId: "",
      }),
    ).toEqual({ kind: "failed" });
    expect(
      parseGoogleCallback({
        provider: "google",
        status: ["success", "failed"],
      }),
    ).toEqual({ kind: "failed" });
  });

  it("hydrates the canonical current-user query once in Strict Mode", async () => {
    apiMock.onGet("/account/me").reply(200, user);
    const queryClient = renderWithClient(
      <GoogleAuthCallbackPage state={{ kind: "success" }} />,
      true,
    );

    expect(
      await screen.findByText("Finishing your sign-in."),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith("/dashboard"),
    );

    expect(apiMock.history.get).toHaveLength(1);
    expect(queryClient.getQueryData(authUserQueryKey)).toEqual(user);
    expect(window.location.search).toBe("");
  });

  it("shows a retryable error when the authenticated session cannot be confirmed", async () => {
    apiMock
      .onGet("/account/me")
      .replyOnce(500)
      .onGet("/account/me")
      .replyOnce(200, user);
    renderWithClient(<GoogleAuthCallbackPage state={{ kind: "success" }} />);

    expect(
      await screen.findByText(
        "Google sign-in could not be completed. Please try again.",
      ),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Retry session check" }),
    );

    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith("/dashboard"),
    );
    expect(apiMock.history.get).toHaveLength(2);
  });

  it("renders account-link-required without retrying Google", () => {
    renderWithClient(
      <GoogleAuthCallbackPage state={{ kind: "account-link-required" }} />,
    );

    expect(screen.getByText("Sign in to link Google.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Sign in with password" }),
    ).toHaveAttribute("href", "/sign-in?reason=account-link-required");
    expect(screen.getByRole("link", { name: "Back to login" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
    expect(screen.queryByText("Continue with Google")).not.toBeInTheDocument();
  });

  it("renders a generic failed callback without exposing provider details", () => {
    renderWithClient(<GoogleAuthCallbackPage state={{ kind: "failed" }} />);

    expect(screen.getByText("We couldn’t sign you in.")).toBeInTheDocument();
    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Return to login" }),
    ).toHaveAttribute("href", "/sign-in");
  });

  it("verifies a Google login challenge, hydrates the user, and stores no challenge", async () => {
    apiMock.onPost("/auth/login-verification/verify").reply(200, {
      message: "Login successful",
      user,
    });
    apiMock.onGet("/account/me").reply(200, user);
    const queryClient = renderWithClient(
      <GoogleAuthCallbackPage
        state={{
          kind: "verification-required",
          challengeId: "opaque-challenge",
        }}
      />,
    );

    fireEvent.change(
      screen.getByRole("textbox", { name: /Six-digit verification code/ }),
      { target: { value: "123456" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Verify and continue" }),
    );

    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith("/dashboard"),
    );
    expect(JSON.parse(apiMock.history.post[0].data)).toEqual({
      challengeId: "opaque-challenge",
      code: "123456",
    });
    expect(queryClient.getQueryData(authUserQueryKey)).toEqual(user);
    expect(window.sessionStorage.length).toBe(0);
  });

  it("keeps resend pending state independent and restarts its cooldown", async () => {
    let finishRequest:
      | ((value: [number, { message: string }]) => void)
      | undefined;
    apiMock.onPost("/auth/login-verification/resend").reply(
      () =>
        new Promise((resolve) => {
          finishRequest = resolve;
        }),
    );
    renderWithClient(
      <GoogleAuthCallbackPage
        state={{
          kind: "verification-required",
          challengeId: "opaque-challenge",
        }}
        initialResendSeconds={0}
      />,
    );

    const resendButton = screen.getByRole("button", {
      name: "Send a new code",
    });
    fireEvent.click(resendButton);
    expect(
      await screen.findByRole("button", { name: "Sending…" }),
    ).toBeDisabled();

    await act(async () => {
      finishRequest?.([
        200,
        {
          message: "If the login challenge is valid, a new code has been sent.",
        },
      ]);
    });
    expect(
      await screen.findByRole("button", { name: "Send again in 60s" }),
    ).toBeDisabled();
  });

  it("shares the refresh lock while hydrating the callback session", async () => {
    let notifyRefreshStarted: (() => void) | undefined;
    let finishRefresh: ((value: [number]) => void) | undefined;
    const refreshStarted = new Promise<void>((resolve) => {
      notifyRefreshStarted = resolve;
    });
    apiMock
      .onGet("/account/me")
      .reply((config) =>
        (config as typeof config & { _retry?: boolean })._retry
          ? [200, user]
          : [401],
      );
    apiMock
      .onGet("/protected")
      .reply((config) =>
        (config as typeof config & { _retry?: boolean })._retry
          ? [200, { ok: true }]
          : [401],
      );
    refreshMock.onPost("/auth/refresh").reply(
      () =>
        new Promise((resolve) => {
          finishRefresh = resolve;
          notifyRefreshStarted?.();
        }),
    );

    renderWithClient(<GoogleAuthCallbackPage state={{ kind: "success" }} />);
    await refreshStarted;
    const protectedRequest = apiClient.get("/protected");
    await waitFor(() =>
      expect(
        apiMock.history.get.some((request) => request.url === "/protected"),
      ).toBe(true),
    );
    finishRefresh?.([200]);

    await protectedRequest;
    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith("/dashboard"),
    );
    expect(refreshMock.history.post).toHaveLength(1);
  });
});
