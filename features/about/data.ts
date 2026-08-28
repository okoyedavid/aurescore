import {
  BookOpenCheck,
  Braces,
  FileCheck2,
  GraduationCap,
  KeyRound,
  Layers3,
  ShieldCheck,
} from "lucide-react";

export const projectDetails = [
  ["Student", "Okoye Chukwuemeka David"],
  ["Department", "Computer Science"],
  ["Faculty", "Physical Sciences"],
  ["Supervisor", "Dr Okorie"],
];

export const academicScope = [
  {
    icon: BookOpenCheck,
    title: "Automated score compilation",
    copy: "Structure continuous assessment and examination scores, calculate totals, and apply grading rules consistently.",
  },
  {
    icon: GraduationCap,
    title: "GPA and CGPA processing",
    copy: "Derive semester and cumulative performance from approved course results while reducing repetitive manual calculation.",
  },
  {
    icon: FileCheck2,
    title: "Approval and transcripts",
    copy: "Represent the review path for submitted results and use approved records as the basis for transcript generation.",
  },
];

export const engineeringScope = [
  {
    icon: Layers3,
    title: "Institution workspaces",
    copy: "Separate workspaces help departments and institutions organise their academic records.",
  },
  {
    icon: Braces,
    title: "A growing product",
    copy: "The project continues to expand from score calculation into a broader academic platform.",
  },
  {
    icon: KeyRound,
    title: "Role-based authorisation",
    copy: "The system distinguishes students, lecturers, exam officers, HODs, deans, and administrators because each role performs different academic actions.",
  },
  {
    icon: ShieldCheck,
    title: "Protected academic records",
    copy: "Access controls and clear responsibilities help keep sensitive academic records protected.",
  },
];
