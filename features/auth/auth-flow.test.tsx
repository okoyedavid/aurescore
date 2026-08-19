import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api/client";
import AuthForm from "./components/AuthForm";
import EmailVerificationPage from "./EmailVerificationPage";
import LoginVerificationPage from "./LoginVerificationPage";
import { authUserQueryKey } from "./auth-state";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

const apiMock = new MockAdapter(apiClient);
const user = {
  id: "user-1",
  email: "user@example.com",
  name: "User Name",
  username: null,
  avatar: null,
};

function renderWithClient(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
  return queryClient;
}

function submitLogin() {
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: " User@Example.com " },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "password123" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Continue to workspace" }),
  );
}

describe("authentication flows", () => {
  beforeEach(() => {
    apiMock.reset();
    navigation.push.mockReset();
    navigation.replace.mockReset();
    window.sessionStorage.clear();
    window.localStorage.clear();
    window.history.replaceState(
      {},
      "",
      "/sign-in?returnTo=%2Fworkspace%2Fscores",
    );
  });

  it("completes a normal login and caches the returned user", async () => {
    apiMock
      .onPost("/auth/login")
      .reply(200, { message: "Login successful", user });
    const queryClient = renderWithClient(<AuthForm mode="sign-in" />);

    submitLogin();

    await waitFor(() =>
      expect(queryClient.getQueryData(authUserQueryKey)).toEqual(user),
    );
    expect(navigation.replace).toHaveBeenCalledWith("/workspace/scores");
  });

  it("keeps the user unauthenticated when login verification is required", async () => {
    apiMock.onPost("/auth/login").reply(200, {
      message: "A login verification code has been sent.",
      requiresTwoFactor: true,
      challengeId: "challenge-123",
    });
    const queryClient = renderWithClient(<AuthForm mode="sign-in" />);

    submitLogin();

    await waitFor(() =>
      expect(navigation.push).toHaveBeenCalledWith("/login-verification"),
    );
    expect(queryClient.getQueryData(authUserQueryKey)).toBeUndefined();
    expect(
      window.sessionStorage.getItem("aurescore.pending-login-challenge"),
    ).toBe("challenge-123");
    expect(
      [...Array(window.localStorage.length)].map((_, index) =>
        window.localStorage.key(index),
      ),
    ).not.toContain("accessToken");
    expect(
      [...Array(window.sessionStorage.length)].map((_, index) =>
        window.sessionStorage.key(index),
      ),
    ).not.toContain("refreshToken");
  });

  it("redirects an unverified login and automatically resends an email code", async () => {
    apiMock.onPost("/auth/login").reply(403, {
      code: "EMAIL_NOT_VERIFIED",
      message: "Email is not verified.",
    });
    apiMock.onPost("/auth/email-verification/resend").reply(200, {
      message: "If this email exists, a verification code has been sent.",
    });
    renderWithClient(<AuthForm mode="sign-in" />);

    submitLogin();

    await waitFor(() =>
      expect(navigation.push).toHaveBeenCalledWith("/email-verification"),
    );
    expect(
      window.sessionStorage.getItem("aurescore.pending-verification-email"),
    ).toBe("user@example.com");
    expect(
      window.sessionStorage.getItem(
        "aurescore.pending-verification-auto-resend",
      ),
    ).toBe("true");

    cleanup();
    renderWithClient(<EmailVerificationPage />);

    expect(
      await screen.findByText(
        "If this email exists, a verification code has been sent.",
      ),
    ).toBeInTheDocument();
    expect(
      apiMock.history.post.filter(
        (request) => request.url === "/auth/email-verification/resend",
      ),
    ).toHaveLength(1);
    expect(
      window.sessionStorage.getItem(
        "aurescore.pending-verification-auto-resend",
      ),
    ).toBeNull();
  });

  it("authenticates only after successful login verification", async () => {
    window.sessionStorage.setItem(
      "aurescore.pending-login-challenge",
      "challenge-123",
    );
    window.sessionStorage.setItem(
      "aurescore.pending-return-to",
      "/dashboard/invitations",
    );
    window.sessionStorage.setItem(
      "aurescore.pending-login-sent-at",
      String(Date.now()),
    );
    apiMock.onPost("/auth/login-verification/verify").reply(200, {
      message: "Login successful",
      user,
    });
    const queryClient = renderWithClient(<LoginVerificationPage />);

    fireEvent.change(
      await screen.findByRole("textbox", {
        name: /Six-digit verification code/,
      }),
      {
        target: { value: "123456" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Verify and sign in" }));

    await waitFor(() =>
      expect(queryClient.getQueryData(authUserQueryKey)).toEqual(user),
    );
    expect(queryClient.getQueryState(authUserQueryKey)?.isInvalidated).toBe(
      false,
    );
    expect(
      window.sessionStorage.getItem("aurescore.pending-login-challenge"),
    ).toBeNull();
    expect(navigation.replace).toHaveBeenCalledWith("/dashboard/invitations");
    expect(navigation.replace).not.toHaveBeenCalledWith(
      "/sign-in?reason=missing-challenge",
    );
  });

  it("shows invalid or expired verification errors without authenticating", async () => {
    window.sessionStorage.setItem(
      "aurescore.pending-login-challenge",
      "challenge-123",
    );
    window.sessionStorage.setItem(
      "aurescore.pending-login-sent-at",
      String(Date.now()),
    );
    apiMock.onPost("/auth/login-verification/verify").reply(400, {
      code: "LOGIN_VERIFICATION_EXPIRED",
      message: "This login verification code has expired.",
    });
    const queryClient = renderWithClient(<LoginVerificationPage />);

    fireEvent.change(
      await screen.findByRole("textbox", {
        name: /Six-digit verification code/,
      }),
      {
        target: { value: "654321" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Verify and sign in" }));

    expect(
      await screen.findByText("This login verification code has expired."),
    ).toBeInTheDocument();
    expect(queryClient.getQueryData(authUserQueryKey)).toBeUndefined();
  });

  it("shows resend loading and starts the cooldown after success", async () => {
    window.sessionStorage.setItem(
      "aurescore.pending-login-challenge",
      "challenge-123",
    );
    window.sessionStorage.setItem("aurescore.pending-login-sent-at", "0");
    let finishRequest:
      | ((value: [number, { message: string }]) => void)
      | undefined;
    apiMock.onPost("/auth/login-verification/resend").reply(
      () =>
        new Promise((resolve) => {
          finishRequest = resolve;
        }),
    );
    renderWithClient(<LoginVerificationPage />);

    const resendButton = await screen.findByRole("button", {
      name: "Send a new code",
    });
    fireEvent.click(resendButton);
    expect(
      await screen.findByRole("button", { name: "Sending…" }),
    ).toBeDisabled();

    finishRequest?.([
      200,
      { message: "If the login challenge is valid, a new code has been sent." },
    ]);
    expect(
      await screen.findByText(
        "If the login challenge is valid, a new code has been sent.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Send again in 60s/ }),
    ).toBeDisabled();
  });
});
