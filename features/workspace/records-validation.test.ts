import { describe, expect, it } from "vitest";
import {
  buildGradingSchemeInput,
  buildScores,
  exactResultInput,
  validateScheme,
  validateGradingSchemeDraft,
  validateStudent,
} from "./records-validation";
import type { AssessmentComponent } from "./types";

const caExam: AssessmentComponent[] = [
  { key: "ca", label: "Continuous Assessment", maxScore: 30, weight: 30 },
  { key: "exam", label: "Examination", maxScore: 70, weight: 70 },
];
const project: AssessmentComponent[] = [
  { key: "proposal", label: "Proposal", maxScore: 20, weight: 10 },
  { key: "delivery", label: "Delivery", maxScore: 80, weight: 60 },
  { key: "defence", label: "Defence", maxScore: 50, weight: 30 },
];
const finalOnly: AssessmentComponent[] = [
  { key: "total", label: "Final Score", maxScore: 100, weight: 100 },
];

describe("assessment scheme validation", () => {
  it.each([
    ["CA/Exam", caExam],
    ["Project", project],
    ["Final Score Only", finalOnly],
  ])("accepts the %s structure", (name, components) => {
    expect(validateScheme({ name, components })).toEqual({});
  });

  it("rejects duplicate keys, invalid maximum scores, and a non-100 weight total", () => {
    const errors = validateScheme({
      name: "Invalid",
      components: [
        { key: "test", label: "One", maxScore: 0, weight: 40 },
        { key: "test", label: "Two", maxScore: 100000.001, weight: 40 },
      ],
    });
    expect(errors["components.1.key"]).toMatch(/unique/i);
    expect(errors["components.0.maxScore"]).toMatch(/above 0/i);
    expect(errors["components.1.maxScore"]).toMatch(/at most 100000/i);
    expect(errors.weightTotal).toMatch(/exactly 100/i);
  });
});

describe("student and result payload validation", () => {
  it("accepts students with and without matric numbers and normalizes empty matric in the UI layer", () => {
    expect(validateStudent({ name: "Ada", matricNumber: "ENG/1" })).toEqual({});
    expect(validateStudent({ name: "Ada", matricNumber: null })).toEqual({});
  });

  it("constructs exactly the scheme score keys and identifies ranges by label", () => {
    const valid = exactResultInput(
      "offering",
      "student",
      caExam,
      { ca: "24", exam: "61", injected: "100" },
    );
    expect(valid.errors).toEqual({});
    expect(valid.input).toEqual({
      courseOfferingId: "offering",
      studentId: "student",
      scores: { ca: 24, exam: 61 },
    });
    expect(valid.input).not.toHaveProperty("totalScore");
    expect(valid.input).not.toHaveProperty("status");
    const invalid = buildScores(caExam, { ca: "31", exam: "NaN" });
    expect(invalid.errors.ca).toContain("Continuous Assessment");
    expect(invalid.errors.exam).toContain("Examination");
  });

});

describe("grading scheme validation", () => {
  const common = {
    name: "Common 5-point scale",
    maxGradePoint: "5",
    bands: [
      { label: "A", minScore: "70", gradePoint: "5" },
      { label: "B", minScore: "60", gradePoint: "4" },
      { label: "C", minScore: "50", gradePoint: "3" },
      { label: "D", minScore: "45", gradePoint: "2" },
      { label: "E", minScore: "40", gradePoint: "1" },
      { label: "F", minScore: "0", gradePoint: "0" },
    ],
  };

  it("accepts and sorts the editable common five-point scale", () => {
    const built = buildGradingSchemeInput({
      ...common,
      bands: [...common.bands].reverse(),
    });
    expect(built.errors).toEqual({});
    expect(built.input.bands.map((band) => band.minScore)).toEqual([
      70, 60, 50, 45, 40, 0,
    ]);
  });

  it("rejects malformed, duplicate, and missing-zero boundaries", () => {
    const errors = validateGradingSchemeDraft({
      name: "Broken",
      maxGradePoint: "5.000",
      bands: [
        { label: "", minScore: "70.0001", gradePoint: "x" },
        { label: "B", minScore: "60", gradePoint: "4" },
        { label: "C", minScore: "60.0", gradePoint: "3" },
      ],
    });
    expect(errors.maxGradePoint).toMatch(/2 decimals/i);
    expect(errors["bands.0.label"]).toMatch(/1 and 40/i);
    expect(errors["bands.0.minScore"]).toMatch(/3 decimals/i);
    expect(errors["bands.0.gradePoint"]).toMatch(/between 0/i);
    expect(errors["bands.2.minScore"]).toMatch(/unique/i);
    expect(errors.zeroBoundary).toMatch(/minimum score of 0/i);
  });

  it("rejects a grade point above the configured maximum", () => {
    const errors = validateGradingSchemeDraft({
      name: "Scale",
      maxGradePoint: "4.5",
      bands: [{ label: "A", minScore: "0", gradePoint: "5" }],
    });
    expect(errors["bands.0.gradePoint"]).toMatch(/cannot exceed/i);
  });
});
