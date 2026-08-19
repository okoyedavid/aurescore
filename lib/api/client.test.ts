import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient, apiClientTesting, setAuthFailureHandler } from "./client";

const apiMock = new MockAdapter(apiClient);
const refreshMock = new MockAdapter(apiClientTesting.refreshClient);

describe("refresh interceptor", () => {
  beforeEach(() => {
    apiClientTesting.reset();
    apiMock.reset();
    refreshMock.reset();
  });

  afterEach(() => {
    apiMock.reset();
    refreshMock.reset();
  });

  it("uses one refresh for simultaneous 401 responses and retries queued requests", async () => {
    let refreshes = 0;
    apiMock
      .onGet("/protected")
      .reply((config) =>
        (config as typeof config & { _retry?: boolean })._retry
          ? [200, { ok: true }]
          : [401],
      );
    refreshMock.onPost("/auth/refresh").reply(async () => {
      refreshes += 1;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return [200];
    });

    const responses = await Promise.all([
      apiClient.get("/protected"),
      apiClient.get("/protected"),
      apiClient.get("/protected"),
    ]);

    expect(refreshes).toBe(1);
    expect(responses.every((response) => response.data.ok)).toBe(true);
    expect(apiMock.history.get).toHaveLength(6);
  });

  it("treats REFRESH_ALREADY_ROTATED as recoverable and retries once", async () => {
    apiMock
      .onGet("/protected")
      .replyOnce(401)
      .onGet("/protected")
      .replyOnce(200, { ok: true });
    refreshMock
      .onPost("/auth/refresh")
      .reply(409, { code: "REFRESH_ALREADY_ROTATED" });

    const response = await apiClient.get("/protected");

    expect(response.data.ok).toBe(true);
    expect(refreshMock.history.post).toHaveLength(1);
    expect(apiMock.history.get).toHaveLength(2);
  });

  it("clears auth once when refresh is rejected", async () => {
    const authFailure = vi.fn();
    setAuthFailureHandler(authFailure);
    apiMock.onGet("/one").reply(401);
    apiMock.onGet("/two").reply(401);
    refreshMock
      .onPost("/auth/refresh")
      .reply(401, { code: "REFRESH_REJECTED" });

    await Promise.allSettled([apiClient.get("/one"), apiClient.get("/two")]);

    expect(refreshMock.history.post).toHaveLength(1);
    expect(authFailure).toHaveBeenCalledTimes(1);
  });

  it("does not loop when a request is still unauthorized after refresh", async () => {
    const authFailure = vi.fn();
    setAuthFailureHandler(authFailure);
    apiMock.onGet("/protected").reply(401);
    refreshMock.onPost("/auth/refresh").reply(200);

    await expect(apiClient.get("/protected")).rejects.toBeTruthy();

    expect(refreshMock.history.post).toHaveLength(1);
    expect(apiMock.history.get).toHaveLength(2);
    expect(authFailure).toHaveBeenCalledTimes(1);
  });

  it("never refreshes excluded authentication requests", async () => {
    apiMock.onPost("/auth/login").reply(401);

    await expect(apiClient.post("/auth/login", {})).rejects.toBeTruthy();

    expect(refreshMock.history.post).toHaveLength(0);
  });

  it("does not refresh or log out for an incorrect current password", async () => {
    const authFailure = vi.fn();
    setAuthFailureHandler(authFailure);
    apiMock.onPatch("/account/password").reply(401, {
      code: "CURRENT_PASSWORD_INCORRECT",
      message: "Current password is incorrect",
    });

    await expect(
      apiClient.patch("/account/password", {
        currentPassword: "wrong",
        newPassword: "new-password",
      }),
    ).rejects.toBeTruthy();

    expect(refreshMock.history.post).toHaveLength(0);
    expect(authFailure).not.toHaveBeenCalled();
  });
});
