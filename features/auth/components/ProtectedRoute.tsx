"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthUser } from "../hooks";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isPending, isError, refetch } = useAuthUser();

  useEffect(() => {
    if (user === null) {
      router.replace(`/sign-in?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router, user]);

  if (isPending || user === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-navy-deep text-white">
        <div className="text-center" role="status" aria-live="polite">
          <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-white/25 border-t-lime" />
          <p className="mt-4 text-sm text-white/70">Checking your session…</p>
        </div>
      </main>
    );
  }

  if (isError || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-navy-deep px-6 text-white">
        <div className="max-w-sm text-center" role="alert">
          <p className="font-display text-2xl font-semibold">
            We could not check your session.
          </p>
          <p className="mt-3 text-sm text-white/65">
            Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="focus-ring mt-6 min-h-11 rounded-md bg-lime px-6 text-sm font-semibold text-black"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return children;
}
