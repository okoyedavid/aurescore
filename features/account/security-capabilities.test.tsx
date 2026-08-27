import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient, apiClientTesting } from "@/lib/api/client";
import LogoutButton from "@/features/auth/components/LogoutButton";
import ConnectedApplications from "./components/ConnectedApplications";
import EmailSettings from "./components/EmailSettings";
import PasswordSettings from "./components/PasswordSettings";
import SecuritySettings from "./components/SecuritySettings";
import { accountKeys } from "./query-keys";
import type { AccountUser } from "./types";

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  usePathname: () => "/settings/security",
}));
const apiMock = new MockAdapter(apiClient);
const refreshMock = new MockAdapter(apiClientTesting.refreshClient);
const providerUser: AccountUser = {
  id: "provider-user",
  email: "provider@example.com",
  name: "Provider User",
  username: null,
  avatar: null,
  hasPassword: false,
  authProviders: [],
  preferences: { desktopNotifications: true, twoFactorEnabled: false },
};
const passwordUser: AccountUser = {
  ...providerUser,
  id: "password-user",
  hasPassword: true,
  authProviders: [{ provider: "GOOGLE", linkedAt: "2026-08-19T10:00:00.000Z" }],
};
function renderWithClient(
  ui: ReactNode,
  setup?: (client: QueryClient) => void,
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  setup?.(client);
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  return client;
}
async function enterSecurityCode() {
  const dialog = await screen.findByRole("dialog");
  fireEvent.change(
    within(dialog).getByLabelText(/Six-digit verification code/),
    { target: { value: "123456" } },
  );
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Verify and continue" }),
  );
}

describe("account security capabilities", () => {
  beforeEach(() => {
    apiMock.reset();
    refreshMock.reset();
    apiClientTesting.reset();
    navigation.replace.mockReset();
    sessionStorage.clear();
    localStorage.clear();
    window.history.replaceState({}, "", "/settings/security");
  });
  it("renders linked providers without offering email-based ownership inference", () => {
    renderWithClient(<SecuritySettings user={passwordUser} />);
    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Link Google" }),
    ).not.toBeInTheDocument();
  });
  it("starts Google linking and hydrates the current user after callback success", async () => {
    const navigate = vi.fn();
    apiMock
      .onPost("/auth/google/link")
      .reply(200, { url: "https://accounts.google.com/o/oauth2/auth" });
    renderWithClient(
      <SecuritySettings user={providerUser} navigate={navigate} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Link Google" }));
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith(
        "https://accounts.google.com/o/oauth2/auth",
      ),
    );
    cleanup();
    window.history.replaceState(
      {},
      "",
      "/settings/security?googleLink=success",
    );
    apiMock.onGet("/account/me").reply(200, {
      ...providerUser,
      authProviders: [
        { provider: "GOOGLE", linkedAt: "2026-08-19T10:00:00.000Z" },
      ],
    });
    renderWithClient(<SecuritySettings user={providerUser} />);
    expect(
      await screen.findByText("Google was linked successfully."),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        apiMock.history.get.some((request) => request.url === "/account/me"),
      ).toBe(true),
    );
  });
  it("shows a generic retry for a failed Google callback", () => {
    window.history.replaceState(
      {},
      "",
      "/settings/security?googleLink=failed&providerDetail=hidden",
    );
    renderWithClient(<SecuritySettings user={providerUser} />);
    expect(
      screen.getByText("Google could not be linked. Please try again."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Retry Google linking" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("hidden")).not.toBeInTheDocument();
  });
  it("sets a provider-only password with an action-bound in-memory token", async () => {
    apiMock.onPost("/account/security-verification/request").reply(200, {
      message: "Security code sent.",
      challengeId: "set-password-challenge",
    });
    apiMock
      .onPost("/account/security-verification/verify")
      .reply(200, { reauthToken: "one-use-token", expiresIn: 300 });
    apiMock
      .onPatch("/account/password")
      .reply(200, { message: "Password changed successfully" });
    const queryClient = renderWithClient(
      <PasswordSettings user={providerUser} />,
      (client) => client.setQueryData(accountKeys.me, providerUser),
    );
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "new-password" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "new-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Set password" }));
    await enterSecurityCode();
    await screen.findByText(/Password saved successfully/);
    expect(
      JSON.parse(
        apiMock.history.post.find((request) =>
          request.url?.endsWith("/request"),
        )!.data,
      ),
    ).toEqual({ action: "set-password" });
    expect(JSON.parse(apiMock.history.patch[0].data)).toEqual({
      newPassword: "new-password",
      reauthToken: "one-use-token",
    });
    expect(
      JSON.stringify(
        [...Array(sessionStorage.length)].map((_, i) =>
          sessionStorage.getItem(sessionStorage.key(i)!),
        ),
      ),
    ).not.toContain("one-use-token");
    expect(
      JSON.stringify(
        queryClient
          .getMutationCache()
          .getAll()
          .map((mutation) => ({
            variables: mutation.state.variables,
            data: mutation.state.data,
          })),
      ),
    ).not.toMatch(/one-use-token|123456|new-password/);
  });
  it("uses security verification for provider-only email and 2FA changes", async () => {
    apiMock.onPost("/account/security-verification/request").reply((config) => [
      200,
      {
        message: "Security code sent.",
        challengeId: `challenge-${JSON.parse(config.data).action}`,
      },
    ]);
    apiMock
      .onPost("/account/security-verification/verify")
      .reply(200, { reauthToken: "email-token", expiresIn: 300 });
    apiMock
      .onPost("/account/email-change/request")
      .reply(200, { message: "Code sent", challengeId: "email-change" });
    renderWithClient(<EmailSettings user={providerUser} />);
    fireEvent.change(screen.getByLabelText(/New email address/), {
      target: { value: "new@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Send confirmation code" }),
    );
    await enterSecurityCode();
    await screen.findByText(/Enter the six-digit code sent to new@example.com/);
    expect(
      JSON.parse(
        apiMock.history.post.find(
          (request) => request.url === "/account/email-change/request",
        )!.data,
      ),
    ).toEqual({ newEmail: "new@example.com", reauthToken: "email-token" });
    cleanup();
    sessionStorage.clear();
    apiMock.resetHistory();
    apiMock.onPost("/account/security-verification/request").reply(200, {
      message: "Security code sent.",
      challengeId: "two-factor-challenge",
    });
    apiMock
      .onPost("/account/security-verification/verify")
      .reply(200, { reauthToken: "two-factor-token", expiresIn: 300 });
    apiMock
      .onPatch("/account/preferences")
      .reply(200, { desktopNotifications: true, twoFactorEnabled: true });
    renderWithClient(<SecuritySettings user={providerUser} />);
    fireEvent.click(
      screen.getByRole("switch", { name: "Email login verification" }),
    );
    await enterSecurityCode();
    await waitFor(() => expect(apiMock.history.patch).toHaveLength(1));
    expect(JSON.parse(apiMock.history.patch[0].data)).toEqual({
      twoFactorEnabled: true,
      reauthToken: "two-factor-token",
    });
  });
  it("surfaces action binding and cooldown errors without persisting tokens", async () => {
    apiMock.onPost("/account/security-verification/request").replyOnce(429, {
      message: "Wait before requesting another security code.",
    });
    renderWithClient(<PasswordSettings user={providerUser} />, (client) =>
      client.setQueryData(accountKeys.me, providerUser),
    );
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "new-password" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "new-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Set password" }));
    expect(
      await screen.findByText("Wait before requesting another security code."),
    ).toBeInTheDocument();
    expect(apiMock.history.post).toHaveLength(1);
    expect(sessionStorage.length).toBe(0);
  });
  it("rejects a reauthentication token bound to another action without retrying", async () => {
    apiMock.onPost("/account/security-verification/request").reply(200, {
      message: "Security code sent.",
      challengeId: "set-password-challenge",
    });
    apiMock
      .onPost("/account/security-verification/verify")
      .reply(200, { reauthToken: "wrong-action-token", expiresIn: 300 });
    apiMock.onPatch("/account/password").reply(400, {
      code: "REAUTH_ACTION_MISMATCH",
      message: "This security approval cannot be used for that action.",
    });
    const client = renderWithClient(
      <PasswordSettings user={providerUser} />,
      (query) => query.setQueryData(accountKeys.me, providerUser),
    );
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "new-password" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "new-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Set password" }));
    await enterSecurityCode();
    expect(
      await screen.findByText(
        "This security approval cannot be used for that action.",
      ),
    ).toBeInTheDocument();
    expect(apiMock.history.patch).toHaveLength(1);
    expect(
      JSON.stringify(
        client
          .getMutationCache()
          .getAll()
          .map((mutation) => ({
            variables: mutation.state.variables,
            data: mutation.state.data,
          })),
      ),
    ).not.toContain("wrong-action-token");
    expect(sessionStorage.length).toBe(0);
  });
});

describe("logout and connected applications", () => {
  beforeEach(() => {
    apiMock.reset();
    refreshMock.reset();
    apiClientTesting.reset();
    navigation.replace.mockReset();
    sessionStorage.clear();
  });
  it("clears authentication after idempotent logout errors without refresh recursion", async () => {
    apiMock
      .onPost("/auth/logout")
      .reply(401, { message: "Already signed out" });
    const client = renderWithClient(
      <LogoutButton className="test" />,
      (query) => query.setQueryData(accountKeys.me, passwordUser),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));
    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith("/login"),
    );
    expect(client.getQueryData(accountKeys.me)).toBeNull();
    expect(refreshMock.history.post).toHaveLength(0);
  });
  it("lists grants, confirms revocation, and invalidates the grants query", async () => {
    apiMock.onGet("/account/oauth-grants").reply(200, [
      {
        grantId: "grant/1",
        scopes: ["openid", "profile"],
        createdAt: "2026-08-19T10:00:00.000Z",
        lastUsedAt: null,
        client: {
          name: "Example App",
          homepageUrl: "https://example.com",
          logoUrl: null,
        },
      },
    ]);
    apiMock
      .onDelete("/account/oauth-grants/grant%2F1")
      .reply(200, { message: "Access revoked" });
    renderWithClient(<ConnectedApplications />);
    expect(await screen.findByText("Example App")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Revoke access" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Revoke access",
      }),
    );
    expect(await screen.findByText("Access revoked")).toBeInTheDocument();
    await waitFor(() => expect(apiMock.history.get).toHaveLength(2));
  });
});
