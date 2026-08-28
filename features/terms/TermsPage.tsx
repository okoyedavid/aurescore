import LegalPage from "@/features/legal/components/LegalPage";
export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      intro="These terms explain the conditions for using AureScore."
      sections={[
        {
          title: "Permitted use",
          copy: "Use AureScore only for lawful academic work that you are authorised to perform. Do not upload records you do not have permission to manage.",
        },
        {
          title: "Institutional responsibility",
          copy: "Institutions remain responsible for authorised users, grading policies, approval processes, record retention, and the accuracy of information entered into AureScore.",
        },
        {
          title: "Service availability",
          copy: "Service availability and support arrangements may vary. Any institution-specific commitments must be agreed in writing.",
        },
        {
          title: "Changes to these terms",
          copy: "These terms may be updated as AureScore grows. Material changes will be reflected on this page.",
        },
      ]}
    />
  );
}
