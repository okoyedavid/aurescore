import type { Metadata } from "next";
import PrivacyPage from "@/features/privacy/PrivacyPage";

export const metadata: Metadata = { title: "Privacy | AureScore" };
export default function Page() { return <PrivacyPage />; }
