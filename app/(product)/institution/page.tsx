import type { Metadata } from "next";
import InstitutionPage from "@/features/institution/InstitutionPage";

export const metadata: Metadata = {
  title: "Institution Workspace | AureScore",
};
export default function Page() {
  return <InstitutionPage />;
}
