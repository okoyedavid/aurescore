"use client";

type CloudinarySignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId: string;
  allowedFormats: string;
};

type CloudinaryUploadResponse = {
  secure_url?: unknown;
};

async function requestUploadSignature() {
  const response = await fetch("/api/uploads/profile-image/signature", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-Aurescore-Upload": "profile-image",
    },
    body: "{}",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: unknown;
    } | null;
    throw new Error(
      typeof body?.message === "string"
        ? body.message
        : "The image upload could not be authorized.",
    );
  }

  return (await response.json()) as CloudinarySignature;
}

export async function uploadProfileImageToCloudinary(
  file: File,
  onProgress: (percentage: number) => void,
) {
  const signed = await requestUploadSignature();
  const body = new FormData();
  body.set("file", file);
  body.set("api_key", signed.apiKey);
  body.set("timestamp", String(signed.timestamp));
  body.set("signature", signed.signature);
  body.set("folder", signed.folder);
  body.set("public_id", signed.publicId);
  body.set("overwrite", "false");
  body.set("allowed_formats", signed.allowedFormats);

  return new Promise<string>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloudName)}/image/upload`,
    );
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.min(100, (event.loaded / event.total) * 100));
      }
    });
    request.addEventListener("error", () => {
      reject(new Error("The image could not be uploaded to Cloudinary."));
    });
    request.addEventListener("abort", () => {
      reject(new Error("The image upload was cancelled."));
    });
    request.addEventListener("load", () => {
      if (request.status < 200 || request.status >= 300) {
        reject(new Error("Cloudinary rejected the image upload."));
        return;
      }

      try {
        const result = JSON.parse(
          request.responseText,
        ) as CloudinaryUploadResponse;
        if (
          typeof result.secure_url !== "string" ||
          !result.secure_url.startsWith("https://")
        ) {
          throw new Error();
        }
        onProgress(100);
        resolve(result.secure_url);
      } catch {
        reject(new Error("Cloudinary returned an invalid image URL."));
      }
    });
    request.send(body);
  });
}
