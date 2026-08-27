import type { Metadata } from "next";
import DashboardPage from "@/features/dashboard/DashboardPage";

export const metadata: Metadata = {
  title: "Academic Workspace | AureScore",
  description: "AureScore academic result operations dashboard.",
};
export default function Page() {
  return <DashboardPage />;
}
