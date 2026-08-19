import type { Metadata } from "next";
import OnboardingPage from "@/features/auth/OnboardingPage";

export const metadata: Metadata = { title: "Set up your account | AureScore", description: "Choose how you will use AureScore and connect your academic workspace." };
export default function Page() { return <OnboardingPage />; }
