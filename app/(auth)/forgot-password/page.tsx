import type { Metadata } from "next";
import PasswordResetPage from "@/features/auth/PasswordResetPage";

export const metadata: Metadata = {
  title: "Reset password | AureScore",
  description: "Recover access to your AureScore account.",
};

export default function Page() {
  return <PasswordResetPage />;
}
