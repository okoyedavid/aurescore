import type { Metadata } from "next";
import LoginVerificationPage from "@/features/auth/LoginVerificationPage";

export const metadata: Metadata = {
  title: "Verify login | AureScore",
  description: "Complete login verification for your AureScore account.",
};

export default function Page() {
  return <LoginVerificationPage />;
}
