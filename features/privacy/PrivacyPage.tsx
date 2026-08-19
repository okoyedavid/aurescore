import LegalPage from "@/features/legal/components/LegalPage";
export default function PrivacyPage() { return <LegalPage title="Privacy notice" intro="This notice describes the intended data-handling principles for the AureScore prototype. It must be reviewed and completed before a production launch." sections={[
  { title: "Information collected", copy: "A production service may process account details, institutional structure, course assignments, academic results, approval activity, and technical logs necessary to operate and protect the platform." },
  { title: "Purpose and access", copy: "Academic information should be used only to provide authorised institutional workflows. Access should be limited by role, institution, department, course assignment, and student identity as appropriate." },
  { title: "Retention and deletion", copy: "Retention periods must be agreed with each institution and aligned with applicable academic-record and data-protection requirements. Production administrators should have documented export and deletion procedures." },
  { title: "Prototype status", copy: "The current project is a functional interface prototype and should not be used to store live student records until authentication, authorisation, encryption, backups, monitoring, and legal agreements are implemented and verified." },
  ]} />; }
