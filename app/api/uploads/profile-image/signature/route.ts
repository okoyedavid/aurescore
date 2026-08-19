import { randomUUID } from "node:crypto";
import { createCloudinarySignature } from "@/lib/storage/cloudinary-signature";

const allowedFormats = "jpg,jpeg,png,webp";
const folder = "aurescore/profile-images";

function jsonError(message: string, status: number) {
  return Response.json({ message }, { status });
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && origin !== requestUrl.origin) {
    return jsonError("The image upload request was rejected.", 403);
  }
  if (request.headers.get("x-aurescore-upload") !== "profile-image") {
    return jsonError("The image upload request was rejected.", 400);
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_KEY;
  const apiSecret = process.env.CLOUDINARY_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return jsonError(
      "Profile image uploads are not fully configured yet.",
      503,
    );
  }

  const cookie = request.headers.get("cookie");
  if (!cookie) {
    return jsonError("Sign in again before uploading a profile image.", 401);
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl) {
    return jsonError("The account service is unavailable.", 503);
  }

  let accountResponse: Response;
  try {
    accountResponse = await fetch(
      `${apiBaseUrl.replace(/\/+$/, "")}/account/me`,
      {
        headers: { Accept: "application/json", Cookie: cookie },
        cache: "no-store",
      },
    );
  } catch {
    return jsonError("The account session could not be confirmed.", 503);
  }

  if (!accountResponse.ok) {
    return jsonError("Sign in again before uploading a profile image.", 401);
  }

  const account = (await accountResponse.json().catch(() => null)) as {
    id?: unknown;
  } | null;
  if (typeof account?.id !== "string" || account.id.length === 0) {
    return jsonError("The account session could not be confirmed.", 401);
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `${account.id}/${randomUUID()}`;
  const parameters = {
    allowed_formats: allowedFormats,
    folder,
    overwrite: "false",
    public_id: publicId,
    timestamp,
  };

  return Response.json({
    cloudName,
    apiKey,
    timestamp,
    signature: createCloudinarySignature(parameters, apiSecret),
    folder,
    publicId,
    allowedFormats,
  });
}
