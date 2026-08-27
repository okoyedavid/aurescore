import type { Metadata } from "next";
import WorkflowPage from "@/features/workflow/WorkflowPage";

export const metadata: Metadata = {
  title: "Academic Workflow | AureScore",
  description:
    "A clear result workflow from course setup and score entry through approval and publication.",
};
export default function Page() {
  return <WorkflowPage />;
}
