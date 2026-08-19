import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import Footer from "@/components/layout/Footer";
import SiteHeader from "@/components/layout/SiteHeader";

const plans = [
  { name: "Department", audience: "For a focused pilot", price: "Custom", featured: false, features: ["One department", "Lecturer score entry", "GPA computation", "Department approval", "Standard reports"] },
  { name: "Institution", audience: "For connected academic operations", price: "Custom", featured: true, features: ["Multiple faculties and departments", "Full approval hierarchy", "Central administration", "Academic analytics", "Priority onboarding"] },
  { name: "Enterprise", audience: "For complex or multi-campus needs", price: "Custom", featured: false, features: ["Multiple campuses", "Tailored integrations", "Advanced access policy", "Migration planning", "Dedicated support"] },
];

export default function PricingPage() {
  return <main className="min-h-screen bg-cream"><SiteHeader />
    <section className="border-b border-line bg-white"><div className="mx-auto max-w-6xl px-6 py-20 text-center md:px-10 md:py-28"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Pricing</p><h1 className="mx-auto mt-5 max-w-4xl font-display text-5xl font-semibold leading-none md:text-7xl">Start at the level your institution can support.</h1><p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted md:text-lg">Pricing depends on student volume, academic structure, approval depth, onboarding, and integration requirements.</p></div></section>
    <section className="py-20 lg:py-28"><div className="mx-auto grid max-w-6xl gap-4 px-6 md:grid-cols-3 md:px-10">
      {plans.map((plan) => <article key={plan.name} className={`flex flex-col rounded-lg border p-7 ${plan.featured ? "border-navy-deep bg-navy-deep text-white" : "border-line bg-white text-ink"}`}>
        <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${plan.featured ? "text-lime" : "text-blue-700"}`}>{plan.audience}</p><h2 className="mt-4 font-display text-3xl font-semibold">{plan.name}</h2><p className={`mt-2 text-sm ${plan.featured ? "text-white/55" : "text-muted"}`}>Scoped to your academic structure</p><p className="mt-8 font-display text-4xl font-semibold">{plan.price}</p>
        <ul className={`mt-8 flex-1 space-y-3 border-t pt-6 ${plan.featured ? "border-white/15" : "border-line"}`}>{plan.features.map((feature) => <li key={feature} className="flex gap-2 text-sm"><Check size={16} className={plan.featured ? "text-lime" : "text-blue-600"} aria-hidden="true" />{feature}</li>)}</ul>
        <Link href="/contact" className={`focus-ring mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full text-sm font-semibold ${plan.featured ? "bg-white text-ink" : "bg-ink text-white"}`}>Discuss rollout <ArrowRight size={16} aria-hidden="true" /></Link>
      </article>)}
    </div><p className="mx-auto mt-8 max-w-2xl px-6 text-center text-xs leading-relaxed text-muted">A final commercial price should be published only after hosting, support, storage, and onboarding costs have been validated.</p></section><Footer /></main>;
}
