import Footer from "@/components/layout/Footer";
import SiteHeader from "@/components/layout/SiteHeader";
import ContactForm from "./components/ContactForm";

export default function ContactPage() {
  return <main className="min-h-screen bg-cream"><SiteHeader /><section className="py-20 lg:py-28"><div className="mx-auto grid max-w-6xl gap-12 px-6 md:px-10 lg:grid-cols-[0.75fr_1fr]"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Contact</p><h1 className="mt-5 font-display text-5xl font-semibold leading-none md:text-6xl">Plan a result workflow your teams can actually operate.</h1><p className="mt-6 max-w-lg text-base leading-relaxed text-muted">Share your institution structure and current process. The next step is a scoped workflow discussion, not a generic sales presentation.</p><dl className="mt-10 space-y-5 border-t border-line pt-7"><div><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Best starting point</dt><dd className="mt-1 text-sm font-semibold">One department, one semester, one approval cycle</dd></div><div><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Web</dt><dd className="mt-1 text-sm font-semibold">aurescore.okoyedavid.com</dd></div></dl></div><ContactForm /></div></section><Footer /></main>;
}
