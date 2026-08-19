import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api/client";
import { AppShellProvider } from "@/features/app-shell/AppShellContext";
import { configureProfileImageUploader } from "@/lib/storage/profile-images";
import AuditHistory from "./components/AuditHistory";
import EmailSettings from "./components/EmailSettings";
import PasswordSettings from "./components/PasswordSettings";
import PreferencesSettings from "./components/PreferencesSettings";
import ProfileSettings from "./components/ProfileSettings";
import SecuritySettings from "./components/SecuritySettings";
import SessionsSettings from "./components/SessionsSettings";
import { setPendingEmailChange } from "./email-change-session";
import { useCurrentUser } from "./hooks";
import { accountKeys } from "./query-keys";
import type { AccountUser, UserSession } from "./types";

const navigation = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  usePathname: () => "/dashboard/settings",
}));

const apiMock = new MockAdapter(apiClient);
const user: AccountUser = {
  id: "user-1",
  email: "user@example.com",
  name: "User Name",
  username: "user_name",
  avatar: null,
  bio: "Current biography",
  status: "active",
  emailVerifiedAt: "2026-08-18T10:00:00.000Z",
  createdAt: "2026-08-17T10:00:00.000Z",
  updatedAt: "2026-08-18T10:00:00.000Z",
  preferences: { desktopNotifications: true, twoFactorEnabled: false },
};

function renderWithClient(
  ui: ReactNode,
  setup?: (client: QueryClient) => void,
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  setup?.(queryClient);
  render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
  return queryClient;
}

function renderWithShell(ui: ReactNode, setup?: (client: QueryClient) => void) {
  return renderWithClient(<AppShellProvider>{ui}</AppShellProvider>, setup);
}

function CurrentUserProbe() {
  const current = useCurrentUser();
  if (current.isPending) return <p>Loading account</p>;
  return <p>{current.data?.name ?? "Signed out"}</p>;
}

const sessions: UserSession[] = [
  {
    userSessionId: "current-session",
    userAgent: "Mozilla/5.0 (Windows NT 10.0) Chrome/126.0",
    deviceName: null,
    ipAddress: "203.0.113.1",
    city: "Lagos",
    region: "Lagos",
    country: "Nigeria",
    lastSeenAt: "2026-08-18T12:00:00.000Z",
    createdAt: "2026-08-17T12:00:00.000Z",
    revokedAt: null,
    isCurrent: true,
    expiresAt: "2099-08-19T12:00:00.000Z",
  },
  {
    userSessionId: "other/session",
    userAgent: "Mozilla/5.0 Firefox/120.0",
    deviceName: null,
    ipAddress: null,
    city: null,
    region: null,
    country: null,
    lastSeenAt: "2026-08-18T11:00:00.000Z",
    createdAt: "2026-08-16T12:00:00.000Z",
    revokedAt: null,
    isCurrent: false,
    expiresAt: null,
  },
];

describe("account queries and settings", () => {
  beforeEach(() => {
    apiMock.reset();
    navigation.replace.mockReset();
    navigation.push.mockReset();
    window.sessionStorage.clear();
    window.localStorage.clear();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:profile-preview"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    configureProfileImageUploader(null);
  });

  it("bootstraps authentication from /account/me and populates the cache", async () => {
    apiMock.onGet("/account/me").reply(200, user);
    const queryClient = renderWithClient(<CurrentUserProbe />);

    expect(screen.getByText("Loading account")).toBeInTheDocument();
    expect(await screen.findByText("User Name")).toBeInTheDocument();
    expect(queryClient.getQueryData(accountKeys.me)).toEqual(user);
    expect(
      apiMock.history.get.filter((request) => request.url === "/account/me"),
    ).toHaveLength(1);
  });

  it("sends only dirty profile fields", async () => {
    apiMock
      .onPatch("/account/profile")
      .reply(200, { ...user, name: "Updated Name" });
    renderWithClient(<ProfileSettings user={user} />);

    fireEvent.change(screen.getByLabelText(/Name/), {
      target: { value: " Updated Name " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));

    await screen.findByText("Profile saved.");
    expect(JSON.parse(apiMock.history.patch[0].data)).toEqual({
      name: "Updated Name",
    });
  });

  it("previews an avatar locally and uploads it only when the profile is saved", async () => {
    const uploader = vi.fn(
      async (_file: File, progress: (value: number) => void) => {
        progress(100);
        return "https://storage.example.com/avatar.jpg";
      },
    );
    configureProfileImageUploader(uploader);
    apiMock.onPatch("/account/profile").reply(200, {
      ...user,
      avatar: "https://storage.example.com/avatar.jpg",
    });
    const queryClient = renderWithClient(<ProfileSettings user={user} />);
    const file = new File(["image"], "avatar.jpg", { type: "image/jpeg" });

    fireEvent.change(screen.getByLabelText(/Choose image/), {
      target: { files: [file] },
    });

    expect(uploader).not.toHaveBeenCalled();
    expect(apiMock.history.patch).toHaveLength(0);
    expect(
      screen.getByText("Image selected. Save your profile to upload it."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));

    await waitFor(() => expect(uploader).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(apiMock.history.patch).toHaveLength(1));
    expect(JSON.parse(apiMock.history.patch[0].data)).toEqual({
      avatar: "https://storage.example.com/avatar.jpg",
    });
    expect(
      (queryClient.getQueryData(accountKeys.me) as AccountUser).avatar,
    ).toBe("https://storage.example.com/avatar.jpg");
  });

  it("renders a username conflict beside the username field", async () => {
    apiMock.onPatch("/account/profile").reply(409, {
      code: "USERNAME_UNAVAILABLE",
      message: "Username is unavailable",
    });
    renderWithClient(<ProfileSettings user={user} />);
    fireEvent.change(screen.getByLabelText(/Username/), {
      target: { value: "taken_name" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect(
      await screen.findByText("That username is unavailable."),
    ).toBeInTheDocument();
  });

  it("updates desktop notifications without sending a password", async () => {
    apiMock.onPatch("/account/preferences").reply(200, {
      desktopNotifications: false,
      twoFactorEnabled: false,
    });
    renderWithShell(<PreferencesSettings user={user} />);
    fireEvent.click(
      screen.getByRole("switch", { name: "Desktop notifications" }),
    );
    await screen.findByText("Preferences saved.");
    expect(JSON.parse(apiMock.history.patch[0].data)).toEqual({
      desktopNotifications: false,
    });
  });

  it("requires password confirmation before changing email login verification", async () => {
    apiMock.onPatch("/account/preferences").reply(200, {
      desktopNotifications: true,
      twoFactorEnabled: true,
    });
    renderWithClient(<SecuritySettings user={user} />);
    fireEvent.click(
      screen.getByRole("switch", { name: "Email login verification" }),
    );
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("button", { name: "Confirm change" }),
    ).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText("Current password"), {
      target: { value: "password123" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Confirm change" }),
    );
    await waitFor(() => expect(apiMock.history.patch).toHaveLength(1));
    expect(JSON.parse(apiMock.history.patch[0].data)).toEqual({
      twoFactorEnabled: true,
      currentPassword: "password123",
    });
  });

  it("changes the password, preserves the current user, and invalidates sessions", async () => {
    apiMock
      .onPatch("/account/password")
      .reply(200, { message: "Password changed successfully" });
    const queryClient = renderWithClient(<PasswordSettings />, (client) => {
      client.setQueryData(accountKeys.me, user);
      client.setQueryData(accountKeys.sessions, sessions);
    });
    fireEvent.change(screen.getByLabelText("Current password"), {
      target: { value: "old-password" },
    });
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "new-password" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "new-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Change password" }));

    expect(
      await screen.findByText(/Every other device was signed out/),
    ).toBeInTheDocument();
    expect(queryClient.getQueryData(accountKeys.me)).toEqual(user);
    expect(queryClient.getQueryState(accountKeys.sessions)?.isInvalidated).toBe(
      true,
    );
    expect(JSON.parse(apiMock.history.patch[0].data)).toEqual({
      currentPassword: "old-password",
      newPassword: "new-password",
    });
  });

  it("does not change cached email before confirmation", async () => {
    apiMock.onPost("/account/email-change/request").reply(200, {
      message: "A verification code has been sent to the new email address.",
      challengeId: "email-challenge",
    });
    const queryClient = renderWithClient(
      <EmailSettings user={user} />,
      (client) => client.setQueryData(accountKeys.me, user),
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: /New email address/ }),
      { target: { value: "new@example.com" } },
    );
    fireEvent.change(screen.getByLabelText("Current password"), {
      target: { value: "password123" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Send confirmation code" }),
    );

    expect(
      await screen.findByText(
        /Enter the six-digit code sent to new@example.com/,
      ),
    ).toBeInTheDocument();
    expect(
      (queryClient.getQueryData(accountKeys.me) as AccountUser).email,
    ).toBe("user@example.com");
  });

  it("confirms an email change, refetches current user, and invalidates sessions", async () => {
    setPendingEmailChange("email-challenge", "new@example.com");
    apiMock
      .onPost("/account/email-change/confirm")
      .reply(200, { message: "Email changed successfully" });
    apiMock
      .onGet("/account/me")
      .reply(200, { ...user, email: "new@example.com" });
    const queryClient = renderWithClient(
      <EmailSettings user={user} />,
      (client) => {
        client.setQueryData(accountKeys.me, user);
        client.setQueryData(accountKeys.sessions, sessions);
      },
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: /Six-digit verification code/ }),
      { target: { value: "123456" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Confirm email change" }),
    );

    await waitFor(() =>
      expect(
        (queryClient.getQueryData(accountKeys.me) as AccountUser).email,
      ).toBe("new@example.com"),
    );
    expect(queryClient.getQueryState(accountKeys.sessions)?.isInvalidated).toBe(
      true,
    );
    expect(
      await screen.findByText(/Every other session was revoked/),
    ).toBeInTheDocument();
  });
});

describe("session and audit settings", () => {
  beforeEach(() => {
    apiMock.reset();
    navigation.replace.mockReset();
    window.sessionStorage.clear();
  });

  it("labels the current session and revokes another session without logout", async () => {
    apiMock.onGet("/sessions").reply(200, sessions);
    apiMock.onDelete("/sessions/other%2Fsession").reply(200, {
      message: "Session revoked successfully",
      currentSessionRevoked: false,
    });
    renderWithClient(<SessionsSettings />);
    expect(await screen.findByText("Current session")).toBeInTheDocument();
    expect(screen.getByText("Chrome browser on Windows")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Revoke session" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Revoke session" }),
    );
    expect(
      await screen.findByText("Session revoked successfully"),
    ).toBeInTheDocument();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it("revokes the current session and clears authentication", async () => {
    apiMock.onGet("/sessions").reply(200, sessions);
    apiMock.onDelete("/sessions/current-session").reply(200, {
      message: "Session revoked successfully",
      currentSessionRevoked: true,
    });
    const queryClient = renderWithClient(<SessionsSettings />, (client) =>
      client.setQueryData(accountKeys.me, user),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Sign out this device" }),
    );
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Revoke session",
      }),
    );
    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith(
        "/sign-in?reason=session-revoked",
      ),
    );
    expect(queryClient.getQueryData(accountKeys.me)).toBeNull();
  });

  it("revokes all other sessions while keeping the caller signed in", async () => {
    apiMock.onGet("/sessions").reply(200, sessions);
    apiMock.onDelete("/sessions/others").reply(200, {
      message: "Other sessions revoked successfully",
      revoked: 1,
    });
    const queryClient = renderWithClient(<SessionsSettings />, (client) =>
      client.setQueryData(accountKeys.me, user),
    );
    const revokeOthersButton = await screen.findByRole("button", {
      name: "Sign out all other devices",
    });
    await waitFor(() => expect(revokeOthersButton).not.toBeDisabled());
    fireEvent.click(revokeOthersButton);
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Sign out other devices",
      }),
    );
    expect(await screen.findByText(/1 session revoked/)).toBeInTheDocument();
    expect(queryClient.getQueryData(accountKeys.me)).toEqual(user);
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it("uses backend audit cursors and safely renders unknown event text", async () => {
    apiMock.onGet("/audit-events").reply((config) => {
      if (config.params?.cursor === "next-event") {
        return [200, { items: [], nextCursor: null }];
      }
      return [
        200,
        {
          items: [
            {
              eventId: "event-1",
              eventType: "future.<img src=x onerror=alert(1)>",
              category: "future",
              outcome: "success",
              severity: "info",
              userSessionId: null,
              authSessionId: null,
              requestId: null,
              ipAddress: null,
              userAgent: null,
              deviceName: null,
              city: null,
              region: null,
              country: null,
              reason: null,
              changes: null,
              metadata: { html: "<img src=x onerror=alert(1)>" },
              createdAt: "2026-08-18T12:00:00.000Z",
            },
          ],
          nextCursor: "next-event",
        },
      ];
    });
    renderWithClient(<AuditHistory />);
    expect(
      await screen.findByText(/Future <img src=x onerror=alert\(1\)>/),
    ).toBeInTheDocument();
    expect(document.querySelector("img")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Load more activity" }));
    await waitFor(() => expect(apiMock.history.get).toHaveLength(2));
    expect(apiMock.history.get[1].params.cursor).toBe("next-event");
  });

  it("resets audit pagination after an invalid cursor", async () => {
    apiMock
      .onGet("/audit-events")
      .reply((config) =>
        config.params?.cursor === "invalid-cursor"
          ? [400, { message: "Invalid cursor" }]
          : [200, { items: [], nextCursor: "invalid-cursor" }],
      );
    renderWithClient(<AuditHistory />);
    const loadMore = await screen.findByRole("button", {
      name: "Load more activity",
    });
    fireEvent.click(loadMore);

    await waitFor(() =>
      expect(apiMock.history.get.length).toBeGreaterThanOrEqual(3),
    );
    expect(apiMock.history.get[0].params.cursor).toBeUndefined();
    expect(apiMock.history.get[1].params.cursor).toBe("invalid-cursor");
    expect(apiMock.history.get[2].params.cursor).toBeUndefined();
  });
});
