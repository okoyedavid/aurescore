import LegalPage from "@/features/legal/components/LegalPage";
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy notice"
      intro="This notice explains how AureScore handles account and academic information."
      sections={[
        {
          title: "Information collected",
          copy: "AureScore may process account details, academic structure, course assignments, results, approval activity, and security logs needed to provide the service.",
        },
        {
          title: "Purpose and access",
          copy: "Academic information is used to provide authorised result-management features. Access is limited according to each user's role and workspace.",
        },
        {
          title: "Retention and deletion",
          copy: "Academic records should be retained according to institutional policy and applicable data-protection requirements. Contact AureScore to request access, correction, or deletion where available.",
        },
        {
          title: "Responsible use",
          copy: "Only upload academic information that you are authorised to manage. Institutions remain responsible for approving use of AureScore with live student records.",
        },
      ]}
    />
  );
}
