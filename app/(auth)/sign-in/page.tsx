import type { Metadata } from "next";
import SignInPage from "@/features/auth/SignInPage";

export const metadata: Metadata = { title: "Sign in | AureScore", description: "Sign in to your AureScore academic workspace." };
export default function Page() { return <SignInPage />; }
