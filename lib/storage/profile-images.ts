import { uploadProfileImageToCloudinary } from "./cloudinary-profile-images";

export const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const PROFILE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type ProfileImageUploader = (
  file: File,
  onProgress: (percentage: number) => void,
) => Promise<string>;

let configuredUploader: ProfileImageUploader | null =
  uploadProfileImageToCloudinary;

export function validateProfileImage(file: File) {
  if (!PROFILE_IMAGE_TYPES.includes(file.type)) {
    return "Choose a JPEG, PNG, or WebP image.";
  }
  if (file.size > PROFILE_IMAGE_MAX_BYTES) {
    return "Choose an image smaller than 5 MB.";
  }
  return null;
}

export function hasProfileImageUploader() {
  return configuredUploader !== null;
}

export function configureProfileImageUploader(
  uploader: ProfileImageUploader | null,
) {
  configuredUploader = uploader;
}

export async function uploadProfileImage(
  file: File,
  onProgress: (percentage: number) => void,
) {
  if (!configuredUploader) {
    throw new Error(
      "Profile image uploads are unavailable until a storage provider is configured.",
    );
  }
  const url = await configuredUploader(file, onProgress);
  if (!/^https:\/\//i.test(url) || url.length > 2048) {
    throw new Error(
      "The storage provider did not return a valid HTTPS image URL.",
    );
  }
  return url;
}
