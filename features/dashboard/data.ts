export const workspaces = [
  { name: "Department of Computer Science", institution: "Faculty of Physical Sciences", role: "Institution administrator", href: "/institution", status: "Active", accent: "bg-blue-600" },
  { name: "Personal score records", institution: "Private workspace", role: "Owner", href: "/workspace", status: "Active", accent: "bg-orange" },
];

export const pendingTasks = [
  { title: "Review CSC 405 corrections", source: "Department of Computer Science", due: "Due today", href: "/institution" },
  { title: "Approve first-semester result batch", source: "Department of Computer Science", due: "Due Aug 14", href: "/institution" },
  { title: "Complete workspace grading scale", source: "Personal score records", due: "No deadline", href: "/workspace" },
];

export const invitations = [
  { institution: "Faculty of Computing", role: "Exam officer", invitedBy: "Dr. Ada Nwosu" },
  { institution: "Aurelia College", role: "Lecturer", invitedBy: "Institution administrator" },
];
