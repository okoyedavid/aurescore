import {
  Bell,
  BookOpenCheck,
  Building2,
  ClipboardCheck,
  FileBarChart,
  LayoutDashboard,
  Settings,
  SlidersHorizontal,
  UserRoundCog,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export const destinations: NavigationItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Institution", href: "/institution", icon: Building2 },
  { label: "Private workspace", href: "/workspace", icon: UserRoundCog },
];

export const navigationByArea: Record<"dashboard" | "institution" | "workspace", NavigationItem[]> = {
  dashboard: [
    { label: "Invitations", href: "/dashboard/invitations", icon: UsersRound, badge: "2" },
    { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  ],
  institution: [
    { label: "Results", href: "/institution/results", icon: BookOpenCheck },
    { label: "Approvals", href: "/institution/approvals", icon: ClipboardCheck, badge: "12" },
    { label: "Students", href: "/institution/students", icon: Users },
    { label: "Reports", href: "/institution/reports", icon: FileBarChart },
  ],
  workspace: [
    { label: "Score sheets", href: "/workspace/scores", icon: BookOpenCheck },
    { label: "Preferences", href: "/workspace/preferences", icon: SlidersHorizontal },
  ],
};

export const settingsByArea: Record<"dashboard" | "institution" | "workspace", NavigationItem> = {
  dashboard: { label: "Settings", href: "/dashboard/settings", icon: Settings },
  institution: { label: "Institution settings", href: "/institution/settings", icon: Settings },
  workspace: { label: "Workspace settings", href: "/workspace/settings", icon: Settings },
};

export type AppArea = keyof typeof navigationByArea;
