import Footer from "@/components/layout/Footer";
import MotionProvider from "@/components/layout/MotionProvider";
import SiteHeader from "@/components/layout/SiteHeader";
import AcademicContext from "./components/AcademicContext";
import EngineeringExtension from "./components/EngineeringExtension";
import ProjectOrigin from "./components/ProjectOrigin";
import ProjectStatus from "./components/ProjectStatus";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-cream">
      <MotionProvider />
      <SiteHeader />
      <ProjectOrigin />
      <AcademicContext />
      <EngineeringExtension />
      <ProjectStatus />
      <Footer />
    </main>
  );
}
