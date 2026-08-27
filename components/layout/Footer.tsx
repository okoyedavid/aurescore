import Link from "next/link";

const footerGroups = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Academic workflow", href: "/workflow" },
      { label: "Security", href: "/security" },
      { label: "Pricing", href: "/pricing" },
      { label: "Public calculators", href: "/public-calculators" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "Departments", href: "/solutions" },
      { label: "Faculties", href: "/solutions" },
      { label: "Universities", href: "/solutions" },
      { label: "Students", href: "/solutions" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Documentation", href: "/docs" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export default function Footer() {
  return (
    <footer id="contact" className="bg-ink text-white">
      <div
        data-reveal="children"
        className="mx-auto max-w-6xl px-6 pb-8 pt-20 md:px-10 lg:pt-24"
      >
        <div className="grid gap-10 border-b border-white/15 pb-16 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
              Move beyond result spreadsheets
            </p>
            <h2 className="mt-5 max-w-3xl font-display text-4xl font-medium leading-tight md:text-5xl">
              Give every academic result a clear path to approval.
            </h2>
          </div>

          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link
              href="/register"
              className="focus-ring inline-flex min-h-12 items-center justify-center rounded-md bg-blue-600 px-6 text-sm font-semibold text-white transition-colors duration-150 hover:bg-blue-500"
            >
              Register account
            </Link>
            <Link
              href="/workflow"
              className="focus-ring inline-flex min-h-12 items-center justify-center rounded-md border border-white/20 px-6 text-sm font-semibold text-white transition-colors duration-150 hover:bg-white/10"
            >
              View workflow
            </Link>
          </div>
        </div>

        <div className="grid gap-12 py-14 md:grid-cols-[1.15fr_1fr]">
          <div>
            <Link
              href="/"
              className="focus-ring rounded font-display text-2xl font-semibold"
              aria-label="AureScore home"
            >
              AureScore
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">
              Secure result management, GPA computation, and multi-level
              approvals for higher education institutions.
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="grid grid-cols-2 gap-8 sm:grid-cols-3"
          >
            {footerGroups.map((group) => (
              <div key={group.title}>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
                  {group.title}
                </p>
                <ul className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="focus-ring rounded text-sm text-white/70 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <p
          aria-hidden="true"
          className="overflow-hidden whitespace-nowrap text-center font-display text-[18vw] font-semibold leading-[0.85] text-transparent md:text-[8.5rem]"
          style={{ WebkitTextStroke: "1px rgba(255,255,255,0.28)" }}
        >
          AureScore
        </p>

        <div className="mt-8 flex flex-col gap-4 border-t border-white/15 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <span>&copy; 2026 AureScore. All rights reserved.</span>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link
              href="/privacy"
              className="focus-ring rounded hover:text-white"
            >
              Privacy
            </Link>
            <Link href="/terms" className="focus-ring rounded hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
