import type { Metadata } from "next";
import RegisterPage from "@/features/auth/RegisterPage";

export const metadata: Metadata = {
  title: "Register | AureScore",
  description: "Create your AureScore account.",
};
export default function Page() { return <RegisterPage />; }
