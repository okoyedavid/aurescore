import Footer from "@/components/layout/Footer";
import MotionProvider from "@/components/layout/MotionProvider";
import ActivityTracking from "./components/ActivityTracking";
import Benefits from "./components/Benefits";
import CurrentEvents from "./components/CurrentEvents";
import FeaturedProgram from "./components/FeaturedProgram";
import Hero from "./components/Hero";
import Testimonials from "./components/Testimonials";

export default function HomePage() {
  return (
    <main className="bg-cream">
      <MotionProvider />
      <Hero />
      <Benefits />
      <FeaturedProgram />
      <ActivityTracking />
      <CurrentEvents />
      <Testimonials />
      <Footer />
    </main>
  );
}
