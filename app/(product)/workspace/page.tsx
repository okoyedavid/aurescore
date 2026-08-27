import type { Metadata } from "next";
import WorkspacePage from "@/features/workspace/WorkspacePage";

export const metadata: Metadata = { title: "Private Workspace | AureScore" };
export default function Page() {
  return <WorkspacePage />;
}
