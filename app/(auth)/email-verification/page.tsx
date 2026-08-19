import type { Metadata } from "next";
import EmailVerificationPage from "@/features/auth/EmailVerificationPage";

export const metadata: Metadata = {
  title: "Verify email | AureScore",
  description: "Verify the email address for your AureScore account.",
};

export default function Page() {
  return <EmailVerificationPage />;
}
