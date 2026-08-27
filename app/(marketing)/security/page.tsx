import type { Metadata } from "next";
import SecurityPage from "@/features/security/SecurityPage";

export const metadata: Metadata = {
  title: "Security | AureScore",
  description:
    "Role-based access, approval controls, audit trails, and responsible academic data handling.",
};
export default function Page() {
  return <SecurityPage />;
}
