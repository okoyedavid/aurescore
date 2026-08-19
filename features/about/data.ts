import { BookOpenCheck, Braces, FileCheck2, GraduationCap, KeyRound, Layers3, ShieldCheck } from "lucide-react";

export const projectDetails = [
  ["Student", "Okoye Chukwuemeka David"],
  ["Department", "Computer Science"],
  ["Faculty", "Physical Sciences"],
  ["Supervisor", "Dr Okorie"],
];

export const academicScope = [
  { icon: BookOpenCheck, title: "Automated score compilation", copy: "Structure continuous assessment and examination scores, calculate totals, and apply grading rules consistently." },
  { icon: GraduationCap, title: "GPA and CGPA processing", copy: "Derive semester and cumulative performance from approved course results while reducing repetitive manual calculation." },
  { icon: FileCheck2, title: "Approval and transcripts", copy: "Represent the review path for submitted results and use approved records as the basis for transcript generation." },
];

export const engineeringScope = [
  { icon: Layers3, title: "Multi-tenant design", copy: "I extended the data model beyond a single department so that separate institutions and private workspaces can remain logically isolated." },
  { icon: Braces, title: "NestJS learning pivot", copy: "I chose NestJS for the planned backend to strengthen my understanding of modular architecture, dependency injection, validation, guards, and domain boundaries." },
  { icon: KeyRound, title: "Role-based authorisation", copy: "The system distinguishes students, lecturers, exam officers, HODs, deans, and administrators because each role performs different academic actions." },
  { icon: ShieldCheck, title: "Access-control boundaries", copy: "The expanded design treats tenant isolation, least privilege, protected operations, and traceable approval decisions as core requirements." },
];
