import { createHash } from "node:crypto";

export function createCloudinarySignature(
  parameters: Record<string, string | number>,
  secret: string,
) {
  const serialized = Object.entries(parameters)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return createHash("sha1").update(`${serialized}${secret}`).digest("hex");
}
