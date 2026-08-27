import {
  Building2,
  GraduationCap,
  Landmark,
  School,
  Users,
  UserRoundCheck,
} from "lucide-react";
import MarketingShell from "@/features/marketing/components/MarketingShell";

export default function SolutionsPage() {
  return (
    <MarketingShell
      eyebrow="Institution-wide coordination"
      title="One system for every academic responsibility."
      intro="AureScore separates responsibilities clearly while keeping departments, faculties, administrators, and students connected to the same trusted record."
      note={{
        label: "Shared source",
        value: "1",
        copy: "Different roles see the tools they need without creating competing versions of the same result.",
      }}
      sections={[
        {
          icon: School,
          title: "Departments",
          copy: "Coordinate courses, lecturers, submissions, and departmental decisions.",
          points: [
            "Course allocation",
            "Exam officer queue",
            "HOD approval overview",
          ],
        },
        {
          icon: Building2,
          title: "Faculties",
          copy: "Bring several departments into a consistent faculty review process.",
          points: [
            "Cross-department progress",
            "Dean approval queue",
            "Faculty result summaries",
          ],
        },
        {
          icon: Landmark,
          title: "Institutions",
          copy: "Configure academic structures and governance centrally.",
          points: [
            "Sessions and semesters",
            "Grading policies",
            "Role and access management",
          ],
        },
        {
          icon: Users,
          title: "Lecturers",
          copy: "Give teaching staff a focused workspace for assigned result tasks.",
          points: [
            "Personal course queue",
            "Guided score entry",
            "Submission status",
          ],
        },
        {
          icon: UserRoundCheck,
          title: "Academic officers",
          copy: "Review exceptions and keep approval cycles moving.",
          points: [
            "Validation flags",
            "Commented returns",
            "Pending-work visibility",
          ],
        },
        {
          icon: GraduationCap,
          title: "Students",
          copy: "Publish only approved academic information through secure access.",
          points: ["Semester results", "GPA history", "Downloadable records"],
        },
      ]}
    />
  );
}
