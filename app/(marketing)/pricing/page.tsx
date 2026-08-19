import type { Metadata } from "next";
import PricingPage from "@/features/pricing/PricingPage";

export const metadata: Metadata = { title: "Pricing | AureScore", description: "Straightforward AureScore plans for departments, faculties, and institutions." };
export default function Page() { return <PricingPage />; }
