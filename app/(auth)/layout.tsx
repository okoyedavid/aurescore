import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen bg-white lg:h-screen lg:grid-cols-[0.9fr_1.1fr] lg:overflow-hidden">
      <section className="relative hidden overflow-hidden bg-navy-deep p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <Link
          href="/"
          className="focus-ring w-fit rounded font-display text-2xl font-semibold"
        >
          AureScore
        </Link>
        <div className="relative z-10 max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lime">
            Academic operations
          </p>
          <h2 className="mt-5 font-display text-5xl font-semibold leading-[1.02]">
            A dependable path from score entry to approval.
          </h2>
          <ul className="mt-8 space-y-4 text-sm text-white/65">
            {[
              "Role-specific academic workspaces",
              "Automatic GPA computation",
              "Traceable multi-level decisions",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <CheckCircle2
                  size={17}
                  className="text-lime"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-white/35">
          AureScore academic result management
        </p>
      </section>
      <section className="flex min-h-screen items-start justify-center overflow-y-auto px-6 py-12 sm:px-10 lg:h-screen lg:min-h-0 xl:py-16">
        <div className="w-full max-w-md has-[.onboarding-flow]:max-w-2xl">
          <Link
            href="/"
            className="focus-ring inline-block rounded font-display text-xl font-semibold lg:hidden"
          >
            AureScore
          </Link>
          {children}
        </div>
      </section>
    </main>
  );
}
