import {
  BadgeCheck,
  BookOpen,
  Calculator,
  ClipboardCheck,
  Send,
  UserCheck,
} from "lucide-react";
import MarketingShell from "@/features/marketing/components/MarketingShell";

export default function WorkflowPage() {
  return (
    <MarketingShell
      eyebrow="Academic workflow"
      title="A clear route from raw score to official record."
      intro="Each stage has an owner, a status, and a visible next action. Teams can move faster without weakening academic oversight."
      note={{
        label: "Lifecycle",
        value: "6",
        copy: "Connected stages make result progress visible long before the publication deadline.",
      }}
      sections={[
        {
          icon: BookOpen,
          title: "Configure",
          copy: "Set the academic context before result work begins.",
          points: [
            "Create session and semester",
            "Assign courses and lecturers",
            "Apply grading rules",
          ],
        },
        {
          icon: Calculator,
          title: "Enter",
          copy: "Capture student scores in a controlled course register.",
          points: [
            "CA and examination columns",
            "Automatic totals and grades",
            "Incomplete-entry warnings",
          ],
        },
        {
          icon: Send,
          title: "Submit",
          copy: "Freeze a complete draft and send it into formal review.",
          points: [
            "Submission confirmation",
            "Named reviewer assignment",
            "Deadline status",
          ],
        },
        {
          icon: ClipboardCheck,
          title: "Review",
          copy: "Resolve anomalies before departmental approval.",
          points: [
            "Validation issue queue",
            "Comments and corrections",
            "Resubmission history",
          ],
        },
        {
          icon: UserCheck,
          title: "Approve",
          copy: "Record sequential academic sign-off at the appropriate levels.",
          points: [
            "Exam officer recommendation",
            "HOD decision",
            "Dean or faculty approval",
          ],
        },
        {
          icon: BadgeCheck,
          title: "Publish",
          copy: "Release locked, approved results to official records.",
          points: [
            "Student visibility controls",
            "GPA update",
            "Report generation",
          ],
        },
      ]}
    />
  );
}
