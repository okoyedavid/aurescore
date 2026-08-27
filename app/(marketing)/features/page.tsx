import type { Metadata } from "next";
import FeaturesPage from "@/features/features/FeaturesPage";

export const metadata: Metadata = {
  title: "Features | AureScore",
  description:
    "Result entry, GPA computation, approvals, records, reporting, and analytics in one academic platform.",
};
export default function Page() {
  return <FeaturesPage />;
}
