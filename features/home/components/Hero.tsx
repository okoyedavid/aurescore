import { ArrowDownRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import Navbar from "./Navbar";

const capabilities = ["Score entry", "GPA computation", "Multi-level approval"];

export default function Hero() {
  return (
    <section
      id="top"
      className="relative h-[100svh] min-h-[620px] max-h-[900px] overflow-hidden bg-navy-deep"
    >
      <picture className="absolute inset-0">
        <source
          media="(max-width: 767px)"
          srcSet="/video/processed/hero-portrait-poster.jpg"
        />
        <img
          src="/video/processed/hero-landscape-poster.jpg"
          alt=""
          className="h-full w-full object-cover"
        />
      </picture>

      <video
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
        tabIndex={-1}
        className="hero-video absolute inset-0 h-full w-full object-cover"
      >
        <source
          media="(max-width: 767px)"
          src="/video/processed/hero-portrait.mp4"
          type="video/mp4"
        />
        <source src="/video/processed/hero-landscape.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-navy-deep/65" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-navy-deep/40" />

      <Navbar />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1200px] flex-col justify-end px-6 pb-10 pt-28 md:px-10 md:pb-12">
        <div className="max-w-4xl">
          <p className="hero-kicker text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
            Academic result infrastructure
          </p>

          <h1 className="hero-title mt-4 font-display text-6xl font-semibold leading-[0.9] text-white sm:text-7xl md:text-8xl lg:text-9xl">
            AureScore
          </h1>

          <div className="mt-6 grid gap-6 border-t border-white/20 pt-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="hero-pill max-w-xl font-display text-2xl font-medium leading-tight text-white sm:text-3xl">
                Every result has a clear path from entry to approval.
              </p>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65">
                Replace disconnected spreadsheets with secure GPA computation,
                review, and sign-off for departments, faculties, and
                universities.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                Register account
                <ArrowRight aria-hidden="true" size={17} />
              </Link>
              <Link
                href="/workflow"
                className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-full border border-white/25 bg-black/10 px-5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                See workflow
                <ArrowDownRight aria-hidden="true" size={17} />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
          {capabilities.map((capability) => (
            <span key={capability} className="inline-flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-blue-400" />
              {capability}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
