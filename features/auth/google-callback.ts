export type GoogleCallbackState =
  | { kind: "success" }
  | { kind: "verification-required"; challengeId: string }
  | { kind: "account-link-required" }
  | { kind: "failed" };

type CallbackSearchParams = Record<string, string | string[] | undefined>;

function singleValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

export function parseGoogleCallback(
  params: CallbackSearchParams,
): GoogleCallbackState {
  const allowedKeys = new Set(["provider", "status", "challengeId"]);
  if (Object.keys(params).some((key) => !allowedKeys.has(key))) {
    return { kind: "failed" };
  }

  const provider = singleValue(params.provider);
  const status = singleValue(params.status);
  const challengeId = singleValue(params.challengeId);

  if (provider !== "google") return { kind: "failed" };

  if (status === "success" && challengeId === null) {
    return { kind: "success" };
  }

  if (
    status === "verification-required" &&
    challengeId !== null &&
    challengeId.trim().length > 0
  ) {
    return { kind: "verification-required", challengeId };
  }

  if (status === "account-link-required" && challengeId === null) {
    return { kind: "account-link-required" };
  }

  return { kind: "failed" };
}
