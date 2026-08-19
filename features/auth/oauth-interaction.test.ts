import { beforeEach, describe, expect, it } from "vitest";
import {
  clearOAuthInteraction,
  persistOAuthInteraction,
  preserveOAuthInteractionFromLocation,
  takeOAuthContinuationUrl,
  validateOAuthInteraction,
} from "./oauth-interaction";

describe("OAuth interaction continuation", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    clearOAuthInteraction();
  });
  it("accepts only nonempty bounded opaque values", () => {
    expect(validateOAuthInteraction("opaque value")).toBe("opaque value");
    expect(validateOAuthInteraction("  ")).toBeNull();
    expect(validateOAuthInteraction("x".repeat(2049))).toBeNull();
  });
  it("encodes and consumes temporary interaction state", () => {
    persistOAuthInteraction("opaque/value?x=1");
    expect(takeOAuthContinuationUrl()).toBe(
      "http://localhost:3001/api/oauth/authorize/continue?interaction=opaque%2Fvalue%3Fx%3D1",
    );
    expect(takeOAuthContinuationUrl()).toBeNull();
    expect(window.sessionStorage.length).toBe(0);
  });
  it("never persists secrets or token-shaped authentication data", () => {
    persistOAuthInteraction("interaction-only");
    expect(Object.keys(window.sessionStorage)).toEqual([
      "aurescore.oauth-interaction",
    ]);
  });
  it("clears a stale interaction when a fresh ordinary login begins", () => {
    persistOAuthInteraction("stale");
    window.history.replaceState({}, "", "/sign-in");
    preserveOAuthInteractionFromLocation();
    expect(takeOAuthContinuationUrl()).toBeNull();
  });
});
