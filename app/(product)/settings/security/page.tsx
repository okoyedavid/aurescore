import type { Metadata } from "next";
import AccountSettingsPage from "@/features/dashboard/components/AccountSettingsPage";

export const metadata: Metadata = { title: "Security settings | AureScore" };
export default function Page() {
  return <AccountSettingsPage initialSection="security" />;
}
