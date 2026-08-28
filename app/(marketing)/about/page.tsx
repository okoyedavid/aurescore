import type { Metadata } from "next";
import AboutPage from "@/features/about/AboutPage";

export const metadata: Metadata = {
  title: "About the Project | AureScore",
  description:
    "The story behind AureScore and its journey from a final-year project to a growing SaaS product.",
};
export default function Page() {
  return <AboutPage />;
}
