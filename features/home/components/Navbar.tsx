"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";

const desktopLinks = [
  { label: "Features", href: "/features" },
  { label: "Workflow", href: "/workflow" },
  { label: "Security", href: "/security" },
];

const mobileLinks = [
  {
    label: "Features",
    detail: "Connected result operations",
    href: "/features",
  },
  {
    label: "Solutions",
    detail: "For every institutional level",
    href: "/solutions",
  },
  {
    label: "Workflow",
    detail: "From score entry to approval",
    href: "/workflow",
  },
  {
    label: "Security",
    detail: "Structured review and access",
    href: "/security",
  },
  {
    label: "Testimonials",
    detail: "Built around academic teams",
    href: "/#testimonials",
  },
  { label: "Contact", detail: "Plan your AureScore rollout", href: "/contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex w-full min-w-0 max-w-[1200px] items-center justify-between px-6 py-6 md:px-10">
        <Link
          href="/"
          className="focus-ring rounded font-display text-xl font-semibold tracking-tight text-white"
        >
          AureScore
        </Link>

        <nav
          className="hidden items-center gap-8 lg:flex"
          aria-label="Primary navigation"
        >
          {desktopLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="nav-link focus-ring rounded text-sm text-white/75 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className="focus-ring inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Sign In
          </Link>
          <button
            type="button"
            aria-label="Open navigation"
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsOpen(true)}
            className="menu-trigger focus-ring flex h-10 w-10 items-center justify-center rounded-md bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25 lg:hidden"
          >
            <Menu aria-hidden="true" size={20} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <div
        className={`nav-overlay fixed inset-0 z-40 lg:hidden ${isOpen ? "is-open" : ""}`}
        aria-hidden={!isOpen}
      >
        <button
          type="button"
          tabIndex={isOpen ? 0 : -1}
          aria-label="Close navigation"
          onClick={closeMenu}
          className="nav-backdrop absolute inset-0 bg-ink/65 backdrop-blur-sm"
        />

        <aside
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="nav-panel absolute inset-y-0 right-0 flex w-[min(88vw,420px)] flex-col bg-navy-deep px-6 pb-7 pt-6 text-white shadow-2xl sm:px-8"
        >
          <div className="flex items-center justify-between border-b border-white/15 pb-5">
            <div>
              <p className="font-display text-lg font-semibold">AureScore</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/45">
                Academic result management
              </p>
            </div>
            <button
              type="button"
              tabIndex={isOpen ? 0 : -1}
              aria-label="Close navigation"
              onClick={closeMenu}
              className="focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10"
            >
              <X aria-hidden="true" size={20} strokeWidth={1.8} />
            </button>
          </div>

          <nav className="nav-scroll flex-1 overflow-y-auto py-4">
            {mobileLinks.map((link, index) => (
              <Link
                key={link.label}
                href={link.href}
                tabIndex={isOpen ? 0 : -1}
                onClick={closeMenu}
                className="nav-panel-link focus-ring group grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border-b border-white/10 py-4"
                style={{
                  transitionDelay: isOpen ? `${80 + index * 45}ms` : "0ms",
                }}
              >
                <span>
                  <span className="block font-display text-xl font-medium">
                    {link.label}
                  </span>
                  <span className="mt-1 block text-xs text-white/45">
                    {link.detail}
                  </span>
                </span>
                <ArrowRight
                  aria-hidden="true"
                  size={17}
                  className="text-white/40 transition-transform group-hover:translate-x-1 group-hover:text-white"
                />
              </Link>
            ))}
          </nav>

          <div className="border-t border-white/15 pt-5">
            <Link
              href="/register"
              tabIndex={isOpen ? 0 : -1}
              onClick={closeMenu}
              className="focus-ring flex min-h-12 items-center justify-center rounded-full bg-blue-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
            >
              Register account
            </Link>
          </div>
        </aside>
      </div>
    </header>
  );
}
