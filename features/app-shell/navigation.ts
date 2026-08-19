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
  Code2,
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
  { label: "Developer", href: "/api", icon: Code2 },
];

export const navigationByArea = {
  dashboard: [
    {
      label: "Invitations",
      href: "/dashboard/invitations",
      icon: UsersRound,
      badge: "2",
    },
    { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  ],
  institution: [
    { label: "Results", href: "/institution/results", icon: BookOpenCheck },
    {
      label: "Approvals",
      href: "/institution/approvals",
      icon: ClipboardCheck,
      badge: "12",
    },
    { label: "Students", href: "/institution/students", icon: Users },
    { label: "Reports", href: "/institution/reports", icon: FileBarChart },
  ],
  workspace: [
    { label: "Score sheets", href: "/workspace/scores", icon: BookOpenCheck },
    {
      label: "Preferences",
      href: "/workspace/preferences",
      icon: SlidersHorizontal,
    },
  ],
  developer: [
    { label: "OAuth applications", href: "/api", icon: Code2 },
    { label: "Developer docs", href: "/developers", icon: BookOpenCheck },
  ],
} satisfies Record<string, NavigationItem[]>;

export const settingsByArea: Record<
  keyof typeof navigationByArea,
  NavigationItem
> = {
  dashboard: { label: "Settings", href: "/dashboard/settings", icon: Settings },
  institution: {
    label: "Institution settings",
    href: "/institution/settings",
    icon: Settings,
  },
  workspace: {
    label: "Workspace settings",
    href: "/workspace/settings",
    icon: Settings,
  },
  developer: {
    label: "Account settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
};

export type AppArea = keyof typeof navigationByArea;
