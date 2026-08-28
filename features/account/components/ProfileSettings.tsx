"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/FormField";
import { getApiErrorMessage, normalizeApiError } from "@/lib/api/errors";
import {
  hasProfileImageUploader,
  uploadProfileImage,
  validateProfileImage,
} from "@/lib/storage/profile-images";
import { useUpdateProfile } from "../hooks";
import type { AccountUser, UpdateProfileInput } from "../types";
import { AsyncMessage, SettingsHeading, SettingsPanel } from "./shared";

export default function ProfileSettings({ user }: { user: AccountUser }) {
  const update = useUpdateProfile();
  const saving = useRef(false);
  const previewObjectUrl = useRef<string | null>(null);
  const uploadedAvatarUrl = useRef<string | null>(null);
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio ?? "");
  const [username, setUsername] = useState(user.username ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user.avatar,
  );
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [localError, setLocalError] = useState("");
  const isUploading = uploadProgress !== null;

  useEffect(
    () => () => {
      if (previewObjectUrl.current) {
        URL.revokeObjectURL(previewObjectUrl.current);
      }
    },
    [],
  );

  const normalized = {
    name: name.trim(),
    bio: bio.trim() || null,
    username: username.trim().toLowerCase() || null,
  };
  const dirty =
    normalized.name !== user.name ||
    normalized.bio !== (user.bio ?? null) ||
    normalized.username !== (user.username ?? null) ||
    selectedAvatar !== null ||
    (removeAvatar && user.avatar !== null);
  const apiError = update.isError ? normalizeApiError(update.error) : null;
  const nameError = apiError?.fieldErrors?.name?.[0];
  const bioError = apiError?.fieldErrors?.bio?.[0];
  const usernameError =
    apiError?.status === 409
      ? "That username is unavailable."
      : apiError?.fieldErrors?.username?.[0];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current || update.isPending || !dirty) return;
    setLocalError("");
    if (!normalized.name || normalized.name.length > 40) {
      setLocalError("Name must contain between 1 and 40 characters.");
      return;
    }
    if (normalized.bio && normalized.bio.length > 500) {
      setLocalError("Biography cannot exceed 500 characters.");
      return;
    }
    if (normalized.username && !/^[a-z0-9_]{3,30}$/.test(normalized.username)) {
      setLocalError(
        "Username must use 3–30 lowercase letters, numbers, or underscores.",
      );
      return;
    }

    saving.current = true;
    let accountUpdateStarted = false;
    try {
      const changes: UpdateProfileInput = {};
      if (normalized.name !== user.name) changes.name = normalized.name;
      if (normalized.bio !== (user.bio ?? null)) changes.bio = normalized.bio;
      if (normalized.username !== (user.username ?? null)) {
        changes.username = normalized.username;
      }

      if (selectedAvatar) {
        if (!uploadedAvatarUrl.current) {
          setUploadProgress(0);
          uploadedAvatarUrl.current = await uploadProfileImage(
            selectedAvatar,
            setUploadProgress,
          );
          setUploadProgress(null);
        }
        changes.avatar = uploadedAvatarUrl.current;
      } else if (removeAvatar && user.avatar !== null) {
        changes.avatar = null;
      }

      if (!Object.keys(changes).length) return;
      accountUpdateStarted = true;
      const updatedUser = await update.mutateAsync(changes);
      if (previewObjectUrl.current) {
        URL.revokeObjectURL(previewObjectUrl.current);
        previewObjectUrl.current = null;
      }
      uploadedAvatarUrl.current = null;
      setAvatarPreview(updatedUser.avatar);
      setSelectedAvatar(null);
      setRemoveAvatar(false);
    } catch (error) {
      if (accountUpdateStarted && uploadedAvatarUrl.current) {
        setUploadError(
          `The image uploaded, but your account was not updated. ${getApiErrorMessage(error)}`,
        );
      } else if (!accountUpdateStarted) {
        setUploadError(
          error instanceof Error ? error.message : "The image upload failed.",
        );
      }
    } finally {
      setUploadProgress(null);
      saving.current = false;
    }
  }

  function selectAvatar(file: File | undefined) {
    if (!file || saving.current) return;
    update.reset();
    setUploadError("");
    const validationError = validateProfileImage(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }
    if (!hasProfileImageUploader()) {
      setUploadError(
        "Profile image uploads are currently unavailable.",
      );
      return;
    }

    if (previewObjectUrl.current) {
      URL.revokeObjectURL(previewObjectUrl.current);
    }
    previewObjectUrl.current = URL.createObjectURL(file);
    uploadedAvatarUrl.current = null;
    setSelectedAvatar(file);
    setRemoveAvatar(false);
    setAvatarPreview(previewObjectUrl.current);
  }

  return (
    <SettingsPanel>
      <SettingsHeading
        title="Profile"
        copy="Update the public details associated with your AureScore account."
      />
      <div
        className="mt-7 flex flex-col gap-5 border-b border-[var(--app-border)] pb-7 sm:flex-row sm:items-center"
        aria-busy={isUploading}
      >
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-lime font-display text-xl font-semibold text-black">
          {avatarPreview ? (
            <Image
              src={avatarPreview}
              alt={
                selectedAvatar
                  ? "Selected profile image preview"
                  : "Current profile avatar"
              }
              width={80}
              height={80}
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : (
            user.name
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
              .toUpperCase()
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Profile image</p>
          <p className="mt-1 text-xs text-[var(--app-muted)]">
            JPEG, PNG, or WebP. Maximum 5 MB.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <label
              className={`focus-ring inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--app-border)] px-4 text-xs font-semibold ${isUploading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              <Camera size={15} />
              {isUploading ? "Uploading…" : "Choose image"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={isUploading}
                onChange={(event) => {
                  selectAvatar(event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
            </label>
            {avatarPreview && (
              <button
                type="button"
                disabled={isUploading}
                onClick={() => {
                  if (previewObjectUrl.current) {
                    URL.revokeObjectURL(previewObjectUrl.current);
                    previewObjectUrl.current = null;
                  }
                  uploadedAvatarUrl.current = null;
                  setSelectedAvatar(null);
                  setRemoveAvatar(user.avatar !== null);
                  setAvatarPreview(null);
                  setUploadError("");
                  update.reset();
                }}
                className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-xs font-semibold text-red-500"
              >
                <Trash2 size={15} />
                Remove avatar
              </button>
            )}
          </div>
          {selectedAvatar && !isUploading && (
            <p role="status" className="mt-2 text-xs text-blue-500">
              Image selected. Save your profile to upload it.
            </p>
          )}
          {uploadProgress !== null && (
            <p role="status" className="mt-2 text-xs text-blue-500">
              Uploading image: {Math.round(uploadProgress)}%
            </p>
          )}
          {uploadError && (
            <p role="alert" className="mt-2 text-xs text-red-500">
              {uploadError}
            </p>
          )}
        </div>
      </div>
      <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
        <label htmlFor="profile-name" className="block text-sm font-semibold">
          Name{" "}
          <span className="float-right text-xs font-normal text-[var(--app-muted)]">
            {name.length}/40
          </span>
          <Input
            id="profile-name"
            value={name}
            onChange={(event) => setName(event.target.value.slice(0, 40))}
            maxLength={40}
            autoComplete="name"
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? "profile-name-error" : undefined}
            className="mt-2"
          />
          {nameError && (
            <span
              id="profile-name-error"
              className="mt-2 block text-xs text-red-500"
            >
              {nameError}
            </span>
          )}
        </label>
        <label
          htmlFor="profile-username"
          className="block text-sm font-semibold"
        >
          Username
          <Input
            id="profile-username"
            value={username}
            onChange={(event) =>
              setUsername(
                event.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9_]/g, "")
                  .slice(0, 30),
              )
            }
            maxLength={30}
            autoComplete="username"
            aria-invalid={Boolean(usernameError)}
            aria-describedby={
              usernameError ? "profile-username-error" : "profile-username-help"
            }
            className="mt-2"
            placeholder="your_username"
          />
          <span
            id="profile-username-help"
            className="mt-2 block text-xs font-normal text-[var(--app-muted)]"
          >
            3–30 lowercase letters, numbers, and underscores.
          </span>
          {usernameError && (
            <span
              id="profile-username-error"
              className="mt-2 block text-xs text-red-500"
            >
              {usernameError}
            </span>
          )}
        </label>
        <label htmlFor="profile-bio" className="block text-sm font-semibold">
          Biography{" "}
          <span className="float-right text-xs font-normal text-[var(--app-muted)]">
            {bio.length}/500
          </span>
          <Textarea
            id="profile-bio"
            value={bio}
            onChange={(event) => setBio(event.target.value.slice(0, 500))}
            maxLength={500}
            rows={5}
            aria-invalid={Boolean(bioError)}
            aria-describedby={bioError ? "profile-bio-error" : undefined}
            className="mt-2 resize-y"
            placeholder="Tell people a little about yourself."
          />
          {bioError && (
            <span
              id="profile-bio-error"
              className="mt-2 block text-xs text-red-500"
            >
              {bioError}
            </span>
          )}
        </label>
        <AsyncMessage
          error={localError || (apiError ? getApiErrorMessage(apiError) : "")}
          success={update.isSuccess ? "Profile saved." : ""}
        />
        <Button
          type="submit"
          disabled={!dirty || update.isPending || isUploading}
        >
          {isUploading
            ? "Uploading image…"
            : update.isPending
              ? "Saving…"
              : "Save profile"}
        </Button>
      </form>
    </SettingsPanel>
  );
}
