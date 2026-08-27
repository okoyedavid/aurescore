import {
  BookOpenCheck,
  ClipboardCheck,
  FileBarChart,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react";

export const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Results", icon: BookOpenCheck },
  { label: "Approvals", icon: ClipboardCheck, badge: "12" },
  { label: "Students", icon: Users },
  { label: "Reports", icon: FileBarChart },
];

export const summaryCards = [
  {
    label: "Courses reporting",
    value: "28 / 34",
    detail: "6 still in progress",
    icon: BookOpenCheck,
    color: "text-blue-500",
  },
  {
    label: "Pending approvals",
    value: "12",
    detail: "4 require attention",
    icon: ClipboardCheck,
    color: "text-orange",
  },
  {
    label: "Student records",
    value: "1,248",
    detail: "97.6% complete",
    icon: GraduationCap,
    color: "text-emerald-500",
  },
  {
    label: "Approval compliance",
    value: "94%",
    detail: "Up 8% this cycle",
    icon: ShieldCheck,
    color: "text-violet-500",
  },
];

export const courses = [
  {
    code: "CSC 401",
    name: "Artificial Intelligence",
    owner: "Dr. N. Okafor",
    progress: 100,
    status: "Awaiting HOD",
    tone: "orange",
  },
  {
    code: "CSC 405",
    name: "Computer Networks",
    owner: "Engr. P. Musa",
    progress: 82,
    status: "In review",
    tone: "blue",
  },
  {
    code: "CSC 409",
    name: "Software Engineering",
    owner: "Dr. A. Bello",
    progress: 64,
    status: "Score entry",
    tone: "gray",
  },
  {
    code: "CSC 413",
    name: "Compiler Construction",
    owner: "Mrs. E. Umeh",
    progress: 100,
    status: "Approved",
    tone: "green",
  },
];

export const activities = [
  ["CSC 413 approved", "Dean, Faculty of Science", "8 min"],
  ["CSC 401 moved forward", "HOD, Computer Science", "32 min"],
  ["CSC 405 returned", "Exam officer · 3 issues", "1 hr"],
  ["CSC 417 submitted", "Dr. I. Nwosu", "2 hrs"],
];
