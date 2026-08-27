import {
  BarChart3,
  BookOpenCheck,
  FileDown,
  GraduationCap,
  History,
  Workflow,
} from "lucide-react";
import MarketingShell from "@/features/marketing/components/MarketingShell";

export default function FeaturesPage() {
  return (
    <MarketingShell
      eyebrow="Platform capabilities"
      title="Result operations without spreadsheet sprawl."
      intro="AureScore gives every academic team one dependable place to enter, verify, approve, publish, and understand results."
      note={{
        label: "One record",
        value: "01",
        copy: "Every correction, review, and approval stays attached to the result it changed.",
      }}
      sections={[
        {
          icon: BookOpenCheck,
          title: "Structured score entry",
          copy: "Lecturers work only with assigned courses and configured grading rules.",
          points: [
            "Continuous assessment and exam fields",
            "Draft saving and completeness checks",
            "Bulk import with validation",
          ],
        },
        {
          icon: GraduationCap,
          title: "Automatic GPA",
          copy: "Compute grade points and cumulative performance from approved institutional rules.",
          points: [
            "Configurable grading scales",
            "Semester and cumulative GPA",
            "Carryover and repeat handling",
          ],
        },
        {
          icon: Workflow,
          title: "Approval workflows",
          copy: "Move submissions through the right reviewers before any result is published.",
          points: [
            "Exam officer review",
            "HOD and dean sign-off",
            "Return with comments",
          ],
        },
        {
          icon: History,
          title: "Audit history",
          copy: "Keep a chronological record of changes across the result lifecycle.",
          points: [
            "Named actions and timestamps",
            "Version-aware corrections",
            "Approval evidence",
          ],
        },
        {
          icon: FileDown,
          title: "Reports and exports",
          copy: "Prepare official result sheets and summaries without rebuilding spreadsheets.",
          points: [
            "Course and class reports",
            "PDF-ready result sheets",
            "Controlled data exports",
          ],
        },
        {
          icon: BarChart3,
          title: "Academic analytics",
          copy: "See completion, grade distribution, and performance patterns at a glance.",
          points: [
            "Submission progress",
            "Pass and fail distribution",
            "Department comparisons",
          ],
        },
      ]}
    />
  );
}
