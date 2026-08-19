import { DatabaseBackup, Eye, FileClock, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import MarketingShell from "@/features/marketing/components/MarketingShell";

export default function SecurityPage() {
  return <MarketingShell eyebrow="Security and governance" title="Academic records deserve deliberate controls." intro="AureScore is designed around least-privilege access, traceable decisions, and institutional ownership of sensitive result data." note={{ label: "Core rule", value: "100%", copy: "Published results come from an approved workflow, never an informal copy passed between teams." }} sections={[
    { icon: KeyRound, title: "Role-based access", copy: "People access only the institution, faculty, department, and courses relevant to them.", points: ["Scoped permissions", "Role-specific workspaces", "Administrative revocation"] },
    { icon: ShieldCheck, title: "Approval controls", copy: "Formal decisions are separated from score entry and recorded clearly.", points: ["Sequential sign-off", "Return instead of overwrite", "Publication gates"] },
    { icon: FileClock, title: "Audit trails", copy: "Significant actions remain attributable throughout the record lifecycle.", points: ["Actor and timestamp", "Status history", "Correction context"] },
    { icon: LockKeyhole, title: "Protected records", copy: "Approved academic records are locked against casual modification.", points: ["Controlled reopening", "Explicit change reasons", "Version awareness"] },
    { icon: Eye, title: "Student privacy", copy: "Student views expose personal approved records, not administrative work queues.", points: ["Scoped student access", "Publication controls", "Minimal data exposure"] },
    { icon: DatabaseBackup, title: "Operational resilience", copy: "The product architecture can support reliable retention and recovery policies.", points: ["Institution-owned exports", "Backup-ready data design", "Documented retention rules"] },
  ]} />;
}
