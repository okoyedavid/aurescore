import Footer from "@/components/layout/Footer";
import SiteHeader from "@/components/layout/SiteHeader";

export default function LegalPage({ title, intro, sections }: { title: string; intro: string; sections: { title: string; copy: string }[] }) {
  return <main className="min-h-screen bg-cream"><SiteHeader /><article className="mx-auto max-w-3xl px-6 py-20 md:px-10 md:py-28"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">AureScore policy</p><h1 className="mt-5 font-display text-5xl font-semibold">{title}</h1><p className="mt-6 text-lg leading-relaxed text-muted">{intro}</p><p className="mt-4 text-xs text-muted">Last updated: August 11, 2026</p><div className="mt-12 space-y-10 border-t border-line pt-10">{sections.map((section)=><section key={section.title}><h2 className="font-display text-2xl font-semibold">{section.title}</h2><p className="mt-3 text-sm leading-7 text-muted">{section.copy}</p></section>)}</div></article><Footer /></main>;
}
