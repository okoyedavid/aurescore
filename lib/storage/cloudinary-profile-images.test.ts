import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/uploads/profile-image/signature/route";
import { uploadProfileImageToCloudinary } from "./cloudinary-profile-images";
import { createCloudinarySignature } from "./cloudinary-signature";

const originalEnvironment = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_KEY,
  secret: process.env.CLOUDINARY_SECRET,
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
};

describe("Cloudinary profile images", () => {
  beforeEach(() => {
    process.env.CLOUDINARY_CLOUD_NAME = "aurescore-cloud";
    process.env.CLOUDINARY_KEY = "public-key";
    process.env.CLOUDINARY_SECRET = "server-secret";
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:3001/api";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env.CLOUDINARY_CLOUD_NAME = originalEnvironment.cloudName;
    process.env.CLOUDINARY_KEY = originalEnvironment.apiKey;
    process.env.CLOUDINARY_SECRET = originalEnvironment.secret;
    process.env.NEXT_PUBLIC_API_BASE_URL = originalEnvironment.apiBaseUrl;
  });

  it("issues a signed upload only after confirming the authenticated account", async () => {
    const accountRequest = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "user-1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", accountRequest);

    const response = await POST(
      new Request("http://localhost:3000/api/uploads/profile-image/signature", {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
          Cookie: "access=opaque-cookie",
          "X-Aurescore-Upload": "profile-image",
        },
      }),
    );
    const body = (await response.json()) as Record<string, string | number>;

    expect(response.status).toBe(200);
    expect(accountRequest).toHaveBeenCalledWith(
      "http://localhost:3001/api/account/me",
      expect.objectContaining({
        headers: expect.objectContaining({ Cookie: "access=opaque-cookie" }),
        cache: "no-store",
      }),
    );
    expect(body.cloudName).toBe("aurescore-cloud");
    expect(body.apiKey).toBe("public-key");
    expect(body).not.toHaveProperty("apiSecret");
    expect(body).not.toHaveProperty("secret");
    expect(body.signature).toBe(
      createCloudinarySignature(
        {
          allowed_formats: body.allowedFormats,
          folder: body.folder,
          overwrite: "false",
          public_id: body.publicId,
          timestamp: body.timestamp,
        },
        "server-secret",
      ),
    );
  });

  it("does not issue upload credentials without an authentication cookie", async () => {
    const accountRequest = vi.fn();
    vi.stubGlobal("fetch", accountRequest);

    const response = await POST(
      new Request("http://localhost:3000/api/uploads/profile-image/signature", {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
          "X-Aurescore-Upload": "profile-image",
        },
      }),
    );

    expect(response.status).toBe(401);
    expect(accountRequest).not.toHaveBeenCalled();
  });

  it("uploads directly to Cloudinary and reports progress", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            cloudName: "aurescore-cloud",
            apiKey: "public-key",
            timestamp: 1234,
            signature: "signed-value",
            folder: "aurescore/profile-images",
            publicId: "user-1/image-1",
            allowedFormats: "jpg,jpeg,png,webp",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    let uploadUrl = "";
    const uploaded = { body: null as FormData | null };
    class FakeXmlHttpRequest {
      status = 200;
      responseText = JSON.stringify({
        secure_url: "https://res.cloudinary.com/aurescore-cloud/avatar.jpg",
      });
      uploadListeners: Record<string, (event: ProgressEvent) => void> = {};
      listeners: Record<string, () => void> = {};
      upload = {
        addEventListener: (
          name: string,
          listener: (event: ProgressEvent) => void,
        ) => {
          this.uploadListeners[name] = listener;
        },
      };
      open(_method: string, url: string) {
        uploadUrl = url;
      }
      addEventListener(name: string, listener: () => void) {
        this.listeners[name] = listener;
      }
      send(body: FormData) {
        uploaded.body = body;
        this.uploadListeners.progress?.({
          lengthComputable: true,
          loaded: 5,
          total: 10,
        } as ProgressEvent);
        this.listeners.load?.();
      }
    }
    vi.stubGlobal("XMLHttpRequest", FakeXmlHttpRequest);
    const progress: number[] = [];

    const url = await uploadProfileImageToCloudinary(
      new File(["image"], "avatar.jpg", { type: "image/jpeg" }),
      (value) => progress.push(value),
    );

    expect(uploadUrl).toBe(
      "https://api.cloudinary.com/v1_1/aurescore-cloud/image/upload",
    );
    expect(uploaded.body).toBeInstanceOf(FormData);
    if (!uploaded.body) throw new Error("Expected an upload body.");
    expect(uploaded.body.get("api_key")).toBe("public-key");
    expect(uploaded.body.has("api_secret")).toBe(false);
    expect(progress).toEqual([50, 100]);
    expect(url).toBe("https://res.cloudinary.com/aurescore-cloud/avatar.jpg");
  });
});
