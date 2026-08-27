import MockAdapter from "axios-mock-adapter";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  apiClient,
  apiClientTesting,
  setAuthFailureHandler,
} from "@/lib/api/client";
import { publicCalculatorsApi } from "./api";
import {
  calculatorDraftKey,
  clearCalculatorDraft,
  configurationFingerprint,
  readCalculatorDraft,
  writeCalculatorDraft,
} from "./draft";
import { publicCalculatorKeys } from "./query-keys";
import type { PublicCalculatorDetail } from "./types";
import {
  buildCalculationEntries,
  buildGradingScheme,
  eligibleCourses,
} from "./validation";

const apiMock = new MockAdapter(apiClient);
const refreshMock = new MockAdapter(apiClientTesting.refreshClient);

const detail: PublicCalculatorDetail = {
  id: "calc_cuid",
  title: "Computer Science GPA",
  description: null,
  institutionName: "Example University",
  departmentName: "Computer Science",
  sessions: [{ id: "session_1", name: "2025/2026", order: 1, metadata: null }],
  terms: [
    {
      id: "term_1",
      name: "First Semester",
      code: "SEM1",
      order: 1,
      metadata: null,
    },
  ],
  levels: [
    { id: "level_1", name: "100 Level", code: null, order: 1, metadata: null },
  ],
  courses: [
    {
      id: "course_1",
      name: "Algorithms",
      code: "CSC201",
      levelId: "level_1",
      termId: "term_1",
      creditUnits: "3.00",
      order: 1,
      metadata: null,
    },
    {
      id: "course_2",
      name: "General Studies",
      code: null,
      levelId: null,
      termId: null,
      creditUnits: "2.00",
      order: 2,
      metadata: null,
    },
    {
      id: "course_3",
      name: "Databases",
      code: "CSC202",
      levelId: "level_1",
      termId: "term_2",
      creditUnits: "4.00",
      order: 3,
      metadata: null,
    },
  ],
  gradingScheme: {
    id: "scheme_1",
    maxGradePoint: "5.00",
    bands: [
      { label: "A", minScore: 70, gradePoint: 5 },
      { label: "F", minScore: 0, gradePoint: 0 },
    ],
  },
  publicPath: "/public-calculator/calc_cuid",
};

describe("public calculator contracts", () => {
  beforeEach(() => {
    apiMock.reset();
    refreshMock.reset();
    apiClientTesting.reset();
    localStorage.clear();
  });

  it("keeps creator and anonymous query keys isolated, including cursors by limit", () => {
    expect(publicCalculatorKeys.creatorDetail("calc_cuid")).not.toEqual(
      publicCalculatorKeys.publicDetail("calc_cuid"),
    );
    expect(publicCalculatorKeys.catalogue(20)).not.toEqual(
      publicCalculatorKeys.catalogue(50),
    );
  });

  it("does not start authenticated refresh or redirect handling for public 401 responses", async () => {
    const authFailure = vi.fn();
    setAuthFailureHandler(authFailure);
    apiMock.onGet("/public/public-calculators/missing").reply(401);
    refreshMock.onPost("/auth/refresh").reply(200);
    await expect(
      publicCalculatorsApi.publicDetail("missing"),
    ).rejects.toMatchObject({ status: 401 });
    expect(refreshMock.history.post).toHaveLength(0);
    expect(authFailure).not.toHaveBeenCalled();
  });

  it("retains the authenticated cookie-and-refresh flow for creator requests", async () => {
    apiMock
      .onGet("/public-calculators")
      .replyOnce(401)
      .onGet("/public-calculators")
      .reply(200, []);
    refreshMock.onPost("/auth/refresh").reply(200);
    await expect(publicCalculatorsApi.creatorList()).resolves.toEqual([]);
    expect(refreshMock.history.post).toHaveLength(1);
    expect(apiMock.history.get).toHaveLength(2);
    expect(apiMock.history.get[0].withCredentials).toBe(true);
  });

  it("uses dedicated creator resource routes and replaces grading through calculator PATCH", async () => {
    apiMock.onPost("/public-calculators/calc_cuid/sessions").reply(201, {});
    apiMock.onPost("/public-calculators/calc_cuid/terms").reply(201, {});
    apiMock.onPost("/public-calculators/calc_cuid/levels").reply(201, {});
    apiMock.onPost("/public-calculators/calc_cuid/courses").reply(201, {});
    apiMock.onPatch("/public-calculators/calc_cuid").reply(200, {});
    await publicCalculatorsApi.createSession("calc_cuid", {
      name: "2025/2026",
    });
    await publicCalculatorsApi.createTerm("calc_cuid", {
      name: "First Semester",
    });
    await publicCalculatorsApi.createLevel("calc_cuid", { name: "100 Level" });
    await publicCalculatorsApi.createCourse("calc_cuid", {
      name: "Algorithms",
      creditUnits: 3,
    });
    await publicCalculatorsApi.update("calc_cuid", {
      gradingScheme: {
        maxGradePoint: 5,
        bands: [{ label: "Pass", minScore: 0, gradePoint: 5 }],
      },
    });
    expect(apiMock.history.post.map((request) => request.url)).toEqual([
      "/public-calculators/calc_cuid/sessions",
      "/public-calculators/calc_cuid/terms",
      "/public-calculators/calc_cuid/levels",
      "/public-calculators/calc_cuid/courses",
    ]);
    expect(JSON.parse(apiMock.history.patch[0].data)).toHaveProperty(
      "gradingScheme.bands",
    );
  });

  it("uses nextCursor and accepts 204 creator and resource deletes without parsing a body", async () => {
    apiMock
      .onGet("/public/public-calculators")
      .reply(200, { items: [], nextCursor: "next_cuid" });
    apiMock.onDelete("/public-calculators/calc_cuid").reply(204);
    apiMock.onDelete("/public-calculators/calc_cuid/terms/term_1").reply(204);
    const page = await publicCalculatorsApi.publicCatalogue({
      limit: 20,
      cursor: "cursor_cuid",
    });
    await expect(
      publicCalculatorsApi.remove("calc_cuid"),
    ).resolves.toBeUndefined();
    await expect(
      publicCalculatorsApi.removeTerm("calc_cuid", "term_1"),
    ).resolves.toBeUndefined();
    expect(page.nextCursor).toBe("next_cuid");
    expect(apiMock.history.get[0].params).toEqual({
      limit: 20,
      cursor: "cursor_cuid",
    });
  });

  it("constructs exact score and grade entries, retaining score and grade point zero", () => {
    expect(
      buildCalculationEntries({
        mode: "score",
        selectedCourseIds: ["course_1"],
        inputs: { course_1: "0" },
      }),
    ).toEqual({ entries: [{ courseId: "course_1", score: 0 }], errors: {} });
    expect(
      buildCalculationEntries({
        mode: "grade",
        selectedCourseIds: ["course_1"],
        inputs: { course_1: "F" },
        allowedGrades: ["A", "F"],
      }),
    ).toEqual({ entries: [{ courseId: "course_1", grade: "F" }], errors: {} });
  });

  it("rejects empty, duplicate, invalid score, and unknown-grade submissions", () => {
    expect(
      buildCalculationEntries({
        mode: "score",
        selectedCourseIds: [],
        inputs: {},
      }).errors.entries,
    ).toBeTruthy();
    expect(
      buildCalculationEntries({
        mode: "score",
        selectedCourseIds: ["course_1", "course_1"],
        inputs: { course_1: "80" },
      }).errors.entries,
    ).toMatch(/only be submitted once/i);
    expect(
      buildCalculationEntries({
        mode: "score",
        selectedCourseIds: ["course_1"],
        inputs: { course_1: "101" },
      }).errors["entries.course_1"],
    ).toMatch(/0 to 100/i);
    expect(
      buildCalculationEntries({
        mode: "grade",
        selectedCourseIds: ["course_1"],
        inputs: { course_1: "Z" },
        allowedGrades: ["A", "F"],
      }).errors["entries.course_1"],
    ).toMatch(/scheme/i);
  });

  it("filters by Term and Level while including unassigned Courses", () => {
    expect(
      eligibleCourses(detail.courses, "term_1", "level_1").map(
        (course) => course.id,
      ),
    ).toEqual(["course_1", "course_2"]);
    expect(eligibleCourses(detail.courses, "", "")).toHaveLength(3);
  });

  it("validates an editable grading scheme without hard-coded labels", () => {
    const valid = buildGradingScheme({
      maxGradePoint: "4",
      bands: [
        { rowId: 1, label: "Excellent", minScore: "80", gradePoint: "4" },
        { rowId: 2, label: "Developing", minScore: "0", gradePoint: "0" },
      ],
    });
    expect(valid.input?.bands.map((band) => band.label)).toEqual([
      "Excellent",
      "Developing",
    ]);
    const invalid = buildGradingScheme({
      maxGradePoint: "4",
      bands: [
        { rowId: 1, label: "Pass", minScore: "50", gradePoint: "2" },
        { rowId: 2, label: "pass", minScore: "50", gradePoint: "3" },
      ],
    });
    expect(invalid.input).toBeUndefined();
    expect(Object.values(invalid.errors).join(" ")).toMatch(
      /unique|start at 0/i,
    );
  });

  it("namespaces drafts, preserves raw inputs, and discards incompatible configuration", () => {
    const fingerprint = configurationFingerprint(detail);
    writeCalculatorDraft(detail.id, {
      version: 1,
      updatedAt: "now",
      configurationFingerprint: fingerprint,
      mode: "score",
      sessionId: "session_1",
      termId: "term_1",
      levelId: "level_1",
      selectedCourseIds: ["course_1"],
      inputs: { course_1: "0" },
    });
    expect(readCalculatorDraft(detail.id, fingerprint)?.inputs.course_1).toBe(
      "0",
    );
    expect(readCalculatorDraft(detail.id, "changed")).toBeNull();
    expect(localStorage.getItem(calculatorDraftKey(detail.id))).toBeNull();
    clearCalculatorDraft(detail.id);
  });
});
