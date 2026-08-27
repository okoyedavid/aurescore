"use client";

import { ArrowDown, ArrowUp, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormField";
import type { CalculatorFieldErrors, GradingBandDraft } from "../validation";

export const commonFivePointBands = (): GradingBandDraft[] => [
  { rowId: 1, label: "A", minScore: "70", gradePoint: "5" },
  { rowId: 2, label: "B", minScore: "60", gradePoint: "4" },
  { rowId: 3, label: "C", minScore: "50", gradePoint: "3" },
  { rowId: 4, label: "D", minScore: "45", gradePoint: "2" },
  { rowId: 5, label: "E", minScore: "40", gradePoint: "1" },
  { rowId: 6, label: "F", minScore: "0", gradePoint: "0" },
];

export function GradingBandEditor({
  maxGradePoint,
  setMaxGradePoint,
  bands,
  setBands,
  errors = {},
}: {
  maxGradePoint: string;
  setMaxGradePoint: (value: string) => void;
  bands: GradingBandDraft[];
  setBands: (value: GradingBandDraft[]) => void;
  errors?: CalculatorFieldErrors;
}) {
  const nextId = Math.max(0, ...bands.map((band) => band.rowId)) + 1;
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= bands.length) return;
    const next = bands.slice();
    [next[index], next[target]] = [next[target], next[index]];
    setBands(next);
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="block max-w-xs text-sm font-semibold">
          Maximum grade point
          <Input
            type="number"
            min="0"
            step="0.01"
            value={maxGradePoint}
            onChange={(event) => setMaxGradePoint(event.target.value)}
            className="mt-1"
            aria-invalid={Boolean(errors.maxGradePoint)}
          />
          {errors.maxGradePoint && (
            <span role="alert" className="mt-1 block text-xs text-red-600">
              {errors.maxGradePoint}
            </span>
          )}
        </label>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setMaxGradePoint("5");
            setBands(commonFivePointBands());
          }}
        >
          Common 5-point preset
        </Button>
      </div>
      <fieldset>
        <legend className="text-sm font-semibold">Grade bands</legend>
        <p className="mt-1 text-xs text-[var(--app-muted)]">
          Keep the highest score threshold first. Every value remains editable.
        </p>
        {errors.bands && (
          <p role="alert" className="mt-2 text-xs text-red-600">
            {errors.bands}
          </p>
        )}
        <div className="mt-3 space-y-3">
          {bands.map((band, index) => (
            <div
              key={band.rowId}
              className="grid gap-3 border border-[var(--app-border)] p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
            >
              {(
                [
                  ["label", "Label", "text", undefined, undefined],
                  ["minScore", "Minimum score", "number", "0", "100"],
                  ["gradePoint", "Grade point", "number", "0", maxGradePoint],
                ] as const
              ).map(([field, label, type, min, max]) => (
                <label key={field} className="text-xs font-semibold">
                  {label}
                  <Input
                    aria-label={`${label} ${index + 1}`}
                    type={type}
                    min={min}
                    max={max}
                    step={type === "number" ? "0.01" : undefined}
                    value={band[field]}
                    onChange={(event) =>
                      setBands(
                        bands.map((item) =>
                          item.rowId === band.rowId
                            ? { ...item, [field]: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className="mt-1"
                    aria-invalid={Boolean(errors[`bands.${index}.${field}`])}
                  />
                  {errors[`bands.${index}.${field}`] && (
                    <span role="alert" className="mt-1 block text-red-600">
                      {errors[`bands.${index}.${field}`]}
                    </span>
                  )}
                </label>
              ))}
              <div className="flex items-start gap-1 pt-6">
                <button
                  type="button"
                  className="app-icon-button"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={`Move band ${index + 1} up`}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  className="app-icon-button"
                  disabled={index === bands.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={`Move band ${index + 1} down`}
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  className="app-icon-button text-red-600"
                  onClick={() =>
                    setBands(bands.filter((item) => item.rowId !== band.rowId))
                  }
                  aria-label={`Remove band ${index + 1}`}
                >
                  <Minus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setBands([
              ...bands,
              { rowId: nextId, label: "", minScore: "", gradePoint: "" },
            ])
          }
          className="focus-ring mt-3 inline-flex items-center gap-2 rounded text-xs font-semibold text-blue-600"
        >
          <Plus size={14} /> Add grade band
        </button>
      </fieldset>
    </div>
  );
}
