import type { Metadata } from "next";
import AboutPage from "@/features/about/AboutPage";

export const metadata: Metadata = {
  title: "About the Project | AureScore",
  description:
    "The academic context, engineering scope, and development goals of AureScore by Okoye Chukwuemeka David.",
};
export default function Page() {
  return <AboutPage />;
}
