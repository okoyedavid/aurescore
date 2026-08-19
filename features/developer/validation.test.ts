import { describe, expect, it } from "vitest";
import {
  isValidRedirectUri,
  normalizeOAuthClientInput,
  validateOAuthClient,
} from "./validation";

describe("OAuth client validation", () => {
  it.each([
    "https://app.example.com/callback",
    "http://localhost:3000/callback",
    "http://127.0.0.1/callback",
    "http://[::1]:3000/callback",
  ])("accepts secure and loopback redirect %s", (value) =>
    expect(isValidRedirectUri(value)).toBe(true),
  );
  it.each([
    "http://example.com/callback",
    "https://app.example.com/callback?next=x",
    "https://app.example.com/callback#part",
    "https://user:pass@app.example.com/callback",
    "not-a-url",
  ])("rejects unsafe redirect %s", (value) =>
    expect(isValidRedirectUri(value)).toBe(false),
  );
  it("requires unique redirects and openid", () => {
    expect(
      validateOAuthClient({
        name: "Example",
        redirectUris: [
          "https://app.example/callback",
          "https://app.example/callback",
        ],
        allowedScopes: ["profile"],
      }),
    ).toMatchObject({
      redirectUris: expect.any(String),
      allowedScopes: expect.any(String),
    });
  });
  it("normalizes fields without removing openid", () => {
    expect(
      normalizeOAuthClientInput({
        name: "  App name  ",
        description: "  ",
        redirectUris: [" https://app.example/callback "],
        allowedScopes: ["email"],
      }),
    ).toEqual({
      name: "App name",
      description: undefined,
      homepageUrl: undefined,
      logoUrl: undefined,
      redirectUris: ["https://app.example/callback"],
      allowedScopes: ["openid", "email"],
    });
  });
});
