import type { Metadata } from "next";
import DocsPage from "@/features/docs/DocsPage";

export const metadata: Metadata = {
  title: "Documentation | AureScore",
  description: "AureScore product documentation and implementation overview.",
};
export default function Page() {
  return <DocsPage />;
}
