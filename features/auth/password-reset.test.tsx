import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient, apiClientTesting } from "@/lib/api/client";
import { authUserQueryKey } from "./auth-state";
import PasswordResetPage from "./PasswordResetPage";

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));

const apiMock = new MockAdapter(apiClient);
const refreshMock = new MockAdapter(apiClientTesting.refreshClient);

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  return client;
}

function storedReset(
  email = "user@example.com",
  challengeId = "challenge-old",
) {
  sessionStorage.setItem("aurescore.pending-password-reset-email", email);
  sessionStorage.setItem(
    "aurescore.pending-password-reset-challenge",
    challengeId,
  );
  sessionStorage.setItem("aurescore.pending-password-reset-sent-at", "0");
}

describe("password reset", () => {
  beforeEach(() => {
    apiMock.reset();
    refreshMock.reset();
    apiClientTesting.reset();
    navigation.replace.mockReset();
    localStorage.clear();
    sessionStorage.clear();
    window.history.replaceState({}, "", "/forgot-password");
  });

  it("requests a reset with normalized email and shows only the generic server message", async () => {
    apiMock.onPost("/auth/password-reset/request").reply(202, {
      message: "If this account can be recovered, a code has been sent.",
      challengeId: "challenge-new",
    });
    renderWithClient(<PasswordResetPage />);
    fireEvent.change(await screen.findByLabelText("Email address"), {
      target: { value: " User@Example.COM " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send reset code" }));
    expect(
      await screen.findByText(
        "If this account can be recovered, a code has been sent.",
      ),
    ).toBeInTheDocument();
    expect(JSON.parse(apiMock.history.post[0].data)).toEqual({
      email: "user@example.com",
    });
    expect(screen.queryByText(/account exists/i)).not.toBeInTheDocument();
  });

  it("resend replaces the challenge, clears the code, and restarts cooldown", async () => {
    storedReset();
    apiMock.onPost("/auth/password-reset/request").reply(202, {
      message: "If eligible, a new code has been sent.",
      challengeId: "challenge-replacement",
    });
    renderWithClient(<PasswordResetPage />);
    const code = await screen.findByLabelText(/Six-digit verification code/);
    fireEvent.change(code, { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Resend code" }));
    await waitFor(() =>
      expect(
        sessionStorage.getItem("aurescore.pending-password-reset-challenge"),
      ).toBe("challenge-replacement"),
    );
    expect(code).toHaveValue("");
    expect(
      screen.getByRole("button", { name: /Resend available in 60 seconds/ }),
    ).toBeDisabled();
  });

  it("uses the server message for a 429 and prevents immediate resend", async () => {
    storedReset();
    apiMock
      .onPost("/auth/password-reset/request")
      .reply(429, { message: "Please wait before requesting another code." });
    renderWithClient(<PasswordResetPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Resend code" }));
    expect(
      await screen.findByText("Please wait before requesting another code."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Resend available in 60 seconds/ }),
    ).toBeDisabled();
    expect(refreshMock.history.post).toHaveLength(0);
  });

  it("rejects mismatched passwords without submitting", async () => {
    storedReset();
    renderWithClient(<PasswordResetPage />);
    fireEvent.change(
      await screen.findByLabelText(/Six-digit verification code/),
      { target: { value: "123456" } },
    );
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "new-password" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "different-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reset password" }));
    expect(
      await screen.findByText("Passwords do not match."),
    ).toBeInTheDocument();
    expect(apiMock.history.post).toHaveLength(0);
  });

  it("uses generic copy and clears an unusable code challenge", async () => {
    storedReset();
    apiMock.onPost("/auth/password-reset/confirm").reply(400, {
      code: "PASSWORD_RESET_CHALLENGE_INVALID",
      message: "Internal combined challenge failure",
    });
    renderWithClient(<PasswordResetPage />);
    fireEvent.change(
      await screen.findByLabelText(/Six-digit verification code/),
      { target: { value: "000000" } },
    );
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "new-password" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "new-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reset password" }));
    expect(
      await screen.findByText(
        "That code could not be accepted. Request a new code and try again.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Internal combined challenge failure"),
    ).not.toBeInTheDocument();
    expect(
      sessionStorage.getItem("aurescore.pending-password-reset-challenge"),
    ).toBeNull();
  });

  it("confirms without persisting credentials, clears auth cache, and preserves OAuth continuation", async () => {
    storedReset();
    sessionStorage.setItem("aurescore.oauth-interaction", "opaque-interaction");
    apiMock
      .onPost("/auth/password-reset/confirm")
      .reply(200, { message: "Password reset successfully" });
    const client = renderWithClient(<PasswordResetPage />);
    client.setQueryData(authUserQueryKey, {
      id: "user-1",
      email: "user@example.com",
      name: "User",
    });
    fireEvent.change(
      await screen.findByLabelText(/Six-digit verification code/),
      { target: { value: "123456" } },
    );
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "new-password" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "new-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reset password" }));
    expect(
      await screen.findByText("Password reset complete."),
    ).toBeInTheDocument();
    expect(JSON.parse(apiMock.history.post[0].data)).toEqual({
      challengeId: "challenge-old",
      code: "123456",
      newPassword: "new-password",
    });
    expect(client.getQueryData(authUserQueryKey)).toBeNull();
    expect(sessionStorage.getItem("aurescore.oauth-interaction")).toBe(
      "opaque-interaction",
    );
    expect(
      [...Array(sessionStorage.length)].map((_, index) =>
        sessionStorage.key(index),
      ),
    ).toEqual(["aurescore.oauth-interaction"]);
    fireEvent.click(screen.getByRole("button", { name: /Continue to login/ }));
    expect(navigation.replace).toHaveBeenCalledWith(
      "/login?reason=password-reset-complete",
    );
  });
});
