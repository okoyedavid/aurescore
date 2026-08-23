import type { Metadata } from "next";
import CreateWorkspacePage from "@/features/workspace/CreateWorkspacePage";
export const metadata: Metadata = { title: "Create workspace | AureScore" };
export default function Page() {
  return <CreateWorkspacePage />;
}
