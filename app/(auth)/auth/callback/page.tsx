import type { Metadata } from "next";
import GoogleAuthCallbackPage from "@/features/auth/GoogleAuthCallbackPage";
import { parseGoogleCallback } from "@/features/auth/google-callback";

export const metadata: Metadata = {
  title: "Google sign-in | AureScore",
  description: "Complete Google sign-in for your AureScore account.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = parseGoogleCallback(await searchParams);
  return <GoogleAuthCallbackPage state={state} />;
}
