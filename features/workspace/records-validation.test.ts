import { describe, expect, it } from "vitest";
import {
  buildScores,
  estimatedTotal,
  exactResultInput,
  validateScheme,
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
      "DRAFT",
    );
    expect(valid.errors).toEqual({});
    expect(valid.input).toEqual({
      courseOfferingId: "offering",
      studentId: "student",
      scores: { ca: 24, exam: 61 },
      status: "DRAFT",
    });
    expect(valid.input).not.toHaveProperty("totalScore");
    const invalid = buildScores(caExam, { ca: "31", exam: "NaN" });
    expect(invalid.errors.ca).toContain("Continuous Assessment");
    expect(invalid.errors.exam).toContain("Examination");
  });

  it("calculates only a labeled estimate for differently scaled components", () => {
    expect(
      estimatedTotal(project, { proposal: 10, delivery: 40, defence: 25 }),
    ).toBe(50);
  });
});
