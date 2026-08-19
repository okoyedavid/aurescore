"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { clearAuthenticatedUser } from "@/features/auth/auth-state";
import {
  clearPendingChallenge,
  sanitizeReturnTo,
} from "@/features/auth/session";
import { setAuthFailureHandler } from "@/lib/api/client";

function sessionExpiredDestination() {
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const returnTo = sanitizeReturnTo(current);
  return `/sign-in?reason=session-expired&returnTo=${encodeURIComponent(returnTo)}`;
}

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            refetchOnWindowFocus: false,
          },
          mutations: { retry: false },
        },
      }),
  );

  useEffect(() => {
    return setAuthFailureHandler(() => {
      clearAuthenticatedUser(queryClient);
      clearPendingChallenge();
      if (window.location.pathname === "/auth/callback") return;
      window.location.replace(sessionExpiredDestination());
    });
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
