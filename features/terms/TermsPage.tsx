import LegalPage from "@/features/legal/components/LegalPage";
export default function TermsPage() { return <LegalPage title="Terms of use" intro="These provisional terms explain the boundaries of the AureScore prototype. Production terms require legal review before institutions or students rely on the service." sections={[
  { title: "Permitted use", copy: "Use the prototype only for evaluation, demonstration, and project assessment. Do not upload real confidential academic records or credentials reused on another service." },
  { title: "Institutional responsibility", copy: "An institution adopting a production version would remain responsible for lawful processing, authorised users, grading policy, approval design, record retention, and the accuracy of source information." },
  { title: "Service availability", copy: "The prototype is provided without a production availability commitment. Hosting, support, incident response, backups, and service levels must be agreed before deployment." },
  { title: "Future agreement", copy: "Commercial use will require complete terms covering privacy, security responsibilities, acceptable use, support, pricing, intellectual property, and termination." },
  ]} />; }
