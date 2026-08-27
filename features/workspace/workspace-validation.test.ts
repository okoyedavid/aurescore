import { describe, expect, it } from "vitest";
import type { WorkspaceDetails } from "./types";
import { buildWorkspacePatch } from "./wide-patch";
import {
  buildCreateWorkspaceInput,
  dateInputToIso,
  normalizeTerm,
  normalizeSession,
  validateTerm,
  validateSession,
} from "./validation";

const workspace: WorkspaceDetails = {
  id: "cm-workspace",
  name: "Engineering",
  description: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  terms: [],
  sessions: [
    {
      id: "cm-session",
      workspaceId: "cm-workspace",
      name: "2026/2027",
      startsAt: "2026-09-01T00:00:00.000Z",
      endsAt: null,
      createdAt: "",
      updatedAt: "",
    },
  ],
  levels: [
    {
      id: "cm-level",
      workspaceId: "cm-workspace",
      name: "Level 100",
      code: "100L",
      order: 100,
      metadata: null,
      createdAt: "",
      updatedAt: "",
    },
  ],
  courses: [
    {
      id: "cm-course",
      workspaceId: "cm-workspace",
      name: "Physics",
      code: "PHY101",
      type: "COURSE",
      defaultLevelId: null,
      defaultTermId: null,
      defaultLevel: null,
      defaultTerm: null,
      metadata: null,
      createdAt: "",
      updatedAt: "",
    },
  ],
};

describe("workspace payload validation", () => {
  it("omits empty initial collections and never includes courses", () => {
    const input = buildCreateWorkspaceInput({
      name: " Records ",
      description: "",
      sessions: [],
      levels: [],
    });
    expect(input).toEqual({ name: "Records", description: null });
    expect(input).not.toHaveProperty("courses");
  });
  it("includes optional initial sessions and levels", () => {
    const session = normalizeSession({
      name: " 2026/2027 ",
      startsAt: "2026-09-01",
      endsAt: "2027-07-31",
    });
    const input = buildCreateWorkspaceInput({
      name: "Records",
      description: "Private",
      sessions: [session],
      levels: [{ name: "Level 100", code: "100L", order: 100 }],
    });
    expect(input.sessions).toEqual([
      {
        name: "2026/2027",
        startsAt: "2026-09-01T00:00:00.000Z",
        endsAt: "2027-07-31T00:00:00.000Z",
      },
    ]);
    expect(input.levels).toHaveLength(1);
    expect(input).not.toHaveProperty("courses");
  });
  it("preserves date-only intent at UTC midnight and rejects reversed ranges", () => {
    expect(dateInputToIso("2026-09-01")).toBe("2026-09-01T00:00:00.000Z");
    expect(
      validateSession({
        name: "2026/2027",
        startsAt: "2027-01-01T00:00:00.000Z",
        endsAt: "2026-01-01T00:00:00.000Z",
      }),
    ).toEqual({
      "session.endsAt": "End date must not precede the start date.",
    });
  });
  it("builds create and changed-field update batches without deletion or empty updates", () => {
    const patch = buildWorkspacePatch(workspace, {
      name: "Engineering records",
      description: "",
      sessions: [
        {
          key: "cm-session",
          id: "cm-session",
          name: "2026/2027 Revised",
          startsAt: "2026-09-01",
          endsAt: "",
        },
        { key: "new-s", name: "2027/2028", startsAt: "", endsAt: "" },
      ],
      levels: [
        {
          key: "cm-level",
          id: "cm-level",
          name: "Level 100",
          code: "100L",
          order: "100",
        },
        { key: "new-l", name: "Level 200", code: "200L", order: "200" },
      ],
      courses: [
        {
          key: "cm-course",
          id: "cm-course",
          name: "General Physics",
          code: "PHY101",
          type: "COURSE",
        },
        { key: "new-c", name: "Chemistry", code: "CHM101", type: "SUBJECT" },
      ],
    });
    expect(patch).toEqual({
      name: "Engineering records",
      sessions: {
        create: [{ name: "2027/2028", startsAt: null, endsAt: null }],
        update: [{ sessionId: "cm-session", name: "2026/2027 Revised" }],
      },
      levels: { create: [{ name: "Level 200", code: "200L", order: 200 }] },
      courses: {
        create: [{ name: "Chemistry", code: "CHM101", type: "SUBJECT" }],
        update: [{ courseId: "cm-course", name: "General Physics" }],
      },
    });
    expect(JSON.stringify(patch)).not.toContain("delete");
  });
  it("returns an empty patch when nothing changed", () => {
    expect(
      buildWorkspacePatch(workspace, {
        name: workspace.name,
        description: "",
        sessions: [
          {
            key: "cm-session",
            id: "cm-session",
            name: "2026/2027",
            startsAt: "2026-09-01",
            endsAt: "",
          },
        ],
        levels: [
          {
            key: "cm-level",
            id: "cm-level",
            name: "Level 100",
            code: "100L",
            order: "100",
          },
        ],
        courses: [
          {
            key: "cm-course",
            id: "cm-course",
            name: "Physics",
            code: "PHY101",
            type: "COURSE",
          },
        ],
      }),
    ).toEqual({});
  });
});

describe("term validation", () => {
  it("normalizes reusable term fields", () => {
    expect(
      normalizeTerm({
        name: " First Semester ",
        code: " SEM1 ",
        order: "1",
      }),
    ).toEqual({
      name: "First Semester",
      code: "SEM1",
      order: 1,
      metadata: null,
    });
  });

  it("rejects invalid names, codes, and non-integer order", () => {
    const errors = validateTerm({
      name: "",
      code: "x".repeat(31),
      order: 1.5,
    });
    expect(errors["term.name"]).toMatch(/1 and 120/i);
    expect(errors["term.order"]).toMatch(/whole number/i);
    expect(errors["term.code"]).toMatch(/at most 30/i);
  });
});
