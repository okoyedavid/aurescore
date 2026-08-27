"use client";

import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const links = [
  { label: "Features", href: "/features" },
  { label: "Solutions", href: "/solutions" },
  { label: "Workflow", href: "/workflow" },
  { label: "Security", href: "/security" },
  { label: "Pricing", href: "/pricing" },
  { label: "Developers", href: "/developers" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const overflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-[1200px] items-center justify-between px-6 md:px-10">
        <Link
          href="/"
          className="focus-ring rounded font-display text-xl font-semibold text-ink"
        >
          AureScore
        </Link>

        <nav
          className="hidden items-center gap-7 lg:flex"
          aria-label="Primary navigation"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link focus-ring rounded text-sm text-ink/65 hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className="focus-ring hidden min-h-10 items-center px-3 text-sm font-semibold text-ink sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="focus-ring hidden min-h-11 items-center rounded-md bg-ink px-5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-navy sm:inline-flex"
          >
            Register account
          </Link>
          <button
            type="button"
            aria-label="Open navigation"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-md border border-line text-ink lg:hidden"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
        </div>
      </div>

      {open &&
        createPortal(
          <div className="nav-overlay is-open fixed inset-0 z-[100] lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
              className="nav-backdrop absolute inset-0 bg-ink/60 backdrop-blur-sm"
            />
            <aside className="nav-panel absolute inset-y-0 right-0 flex w-[min(88vw,420px)] flex-col bg-navy-deep px-6 py-6 text-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/15 pb-5">
                <div>
                  <p className="font-display text-xl font-semibold">
                    AureScore
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    Academic result management
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close navigation"
                  onClick={() => setOpen(false)}
                  className="focus-ring flex h-10 w-10 items-center justify-center rounded-md border border-white/20 transition-colors duration-150 hover:bg-white/10"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
              <nav className="nav-scroll flex-1 overflow-y-auto py-4">
                {links.map((link, index) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="nav-panel-link group flex items-center justify-between border-b border-white/10 py-4"
                    style={{ transitionDelay: `${80 + index * 45}ms` }}
                  >
                    <span className="font-display text-xl font-medium">
                      {link.label}
                    </span>
                    <ArrowRight
                      size={17}
                      className="text-white/40 transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                ))}
              </nav>
              <div className="grid grid-cols-2 gap-2 border-t border-white/15 pt-5">
                <Link
                  href="/sign-in"
                  onClick={() => setOpen(false)}
                  className="focus-ring flex min-h-12 items-center justify-center rounded-md border border-white/20 text-sm font-semibold"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="focus-ring flex min-h-12 items-center justify-center rounded-md bg-blue-600 text-sm font-semibold"
                >
                  Register
                </Link>
              </div>
            </aside>
          </div>,
          document.body,
        )}
    </header>
  );
}
