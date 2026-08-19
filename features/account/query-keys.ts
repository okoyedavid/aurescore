export const accountKeys = {
  all: ["account"] as const,
  me: ["account", "me"] as const,
  sessions: ["account", "sessions"] as const,
  auditRoot: ["account", "audit-events"] as const,
  auditEvents: (filters: { limit: number }) =>
    ["account", "audit-events", filters] as const,
};
