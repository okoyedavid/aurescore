"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { clearAuthenticatedUser } from "../auth-state";
import { useLogout } from "../hooks";

export default function LogoutButton({
  className = "",
  onComplete,
}: {
  className?: string;
  onComplete?: () => void;
}) {
  const logout = useLogout();
  const queryClient = useQueryClient();
  const router = useRouter();
  const active = useRef(false);
  async function run() {
    if (active.current || logout.isPending) return;
    active.current = true;
    try {
      await logout.mutateAsync();
    } catch {
    } finally {
      clearAuthenticatedUser(queryClient);
      onComplete?.();
      router.replace("/login");
      active.current = false;
    }
  }
  return (
    <button
      type="button"
      role="menuitem"
      disabled={logout.isPending}
      onClick={() => void run()}
      className={className}
    >
      <LogOut size={17} />
      {logout.isPending ? "Signing out…" : "Sign out"}
    </button>
  );
}
