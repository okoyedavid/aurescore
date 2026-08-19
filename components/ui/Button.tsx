import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "dark" | "outline" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-500",
  dark: "bg-ink text-white hover:bg-navy",
  outline: "border border-line bg-white text-ink hover:bg-cream",
  ghost: "text-blue-700 hover:bg-blue-50",
};

export function buttonStyles(variant: Variant = "primary", className = "") {
  return `focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`;
}

export function Button({ variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={buttonStyles(variant, className)} {...props} />;
}

export function ButtonLink({ href, children, variant = "primary", className = "" }: { href: string; children: ReactNode; variant?: Variant; className?: string }) {
  return <Link href={href} className={buttonStyles(variant, className)}>{children}</Link>;
}
