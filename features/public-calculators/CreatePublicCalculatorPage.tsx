"use client";

import { FormEvent, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import AppShell from "@/features/app-shell/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/FormField";
import { normalizeApiError } from "@/lib/api/errors";
import {
  FieldError,
  RequestError,
} from "@/features/workspace/components/FieldError";
import { useCreateCalculator } from "./hooks";
import { GradingBandEditor } from "./components/GradingBandEditor";
import {
  buildGradingScheme,
  normalizeDimension,
  normalizeIdentity,
  validateDimension,
  validateIdentity,
  type CalculatorFieldErrors,
  type GradingBandDraft,
} from "./validation";
import type {
  CalculatorSessionInput,
  CalculatorTermOrLevelInput,
  CreateCalculatorInput,
} from "./types";

type DimensionDraft = {
  rowId: number;
  name: string;
  code: string;
  order: string;
};
let nextRowId = 0;
const blankDimension = (): DimensionDraft => ({
  rowId: ++nextRowId,
  name: "",
  code: "",
  order: "",
});

function DimensionRows({
  title,
  rows,
  setRows,
  withCode,
  errors,
  prefix,
}: {
  title: string;
  rows: DimensionDraft[];
  setRows: (rows: DimensionDraft[]) => void;
  withCode: boolean;
  errors: CalculatorFieldErrors;
  prefix: string;
}) {
  return (
    <fieldset>
      <legend className="font-display text-xl font-semibold">
        {title}{" "}
        <span className="text-sm font-normal text-[var(--app-muted)]">
          (optional)
        </span>
      </legend>
      {title === "Terms" && (
        <p className="mt-1 text-xs text-[var(--app-muted)]">
          Terms are reusable and are not attached to Sessions.
        </p>
      )}
      <div className="mt-4 space-y-3">
        {rows.map((row, index) => (
          <div
            key={row.rowId}
            className="border border-[var(--app-border)] p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">
                {title.slice(0, -1)} {index + 1}
              </p>
              <button
                type="button"
                className="app-icon-button"
                aria-label={`Remove ${title.slice(0, -1).toLocaleLowerCase()} ${index + 1}`}
                onClick={() =>
                  setRows(rows.filter((item) => item.rowId !== row.rowId))
                }
              >
                <Minus size={15} />
              </button>
            </div>
            <div
              className={`mt-3 grid gap-3 ${withCode ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
            >
              <label className="text-xs font-semibold">
                Name
                <Input
                  value={row.name}
                  onChange={(event) =>
                    setRows(
                      rows.map((item) =>
                        item.rowId === row.rowId
                          ? { ...item, name: event.target.value }
                          : item,
                      ),
                    )
                  }
                  className="mt-1"
                  aria-invalid={Boolean(errors[`${prefix}.${index}.name`])}
                />
                <FieldError>{errors[`${prefix}.${index}.name`]}</FieldError>
              </label>
              {withCode && (
                <label className="text-xs font-semibold">
                  Code{" "}
                  <span className="font-normal text-[var(--app-muted)]">
                    (optional)
                  </span>
                  <Input
                    value={row.code}
                    onChange={(event) =>
                      setRows(
                        rows.map((item) =>
                          item.rowId === row.rowId
                            ? { ...item, code: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className="mt-1"
                    aria-invalid={Boolean(errors[`${prefix}.${index}.code`])}
                  />
                  <FieldError>{errors[`${prefix}.${index}.code`]}</FieldError>
                </label>
              )}
              <label className="text-xs font-semibold">
                Order{" "}
                <span className="font-normal text-[var(--app-muted)]">
                  (optional)
                </span>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={row.order}
                  onChange={(event) =>
                    setRows(
                      rows.map((item) =>
                        item.rowId === row.rowId
                          ? { ...item, order: event.target.value }
                          : item,
                      ),
                    )
                  }
                  className="mt-1"
                  aria-invalid={Boolean(errors[`${prefix}.${index}.order`])}
                />
                <FieldError>{errors[`${prefix}.${index}.order`]}</FieldError>
              </label>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="focus-ring mt-3 inline-flex items-center gap-2 rounded text-xs font-semibold text-blue-600"
        onClick={() => setRows([...rows, blankDimension()])}
      >
        <Plus size={14} /> Add {title.slice(0, -1).toLocaleLowerCase()}
      </button>
    </fieldset>
  );
}

export default function CreatePublicCalculatorPage() {
  const router = useRouter();
  const create = useCreateCalculator();
  const formRef = useRef<HTMLFormElement>(null);
  const locked = useRef(false);
  const [sessions, setSessions] = useState<DimensionDraft[]>([]);
  const [terms, setTerms] = useState<DimensionDraft[]>([]);
  const [levels, setLevels] = useState<DimensionDraft[]>([]);
  const [includeGrading, setIncludeGrading] = useState(false);
  const [maxGradePoint, setMaxGradePoint] = useState("5");
  const [bands, setBands] = useState<GradingBandDraft[]>([]);
  const [errors, setErrors] = useState<CalculatorFieldErrors>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || create.isPending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const identity = normalizeIdentity({
      title: String(data.get("title") ?? ""),
      description: String(data.get("description") ?? ""),
      institutionName: String(data.get("institutionName") ?? ""),
      departmentName: String(data.get("departmentName") ?? ""),
    });
    const sessionInputs = sessions.map((row) =>
      normalizeDimension(row, false),
    ) as CalculatorSessionInput[];
    const termInputs = terms.map((row) =>
      normalizeDimension(row, true),
    ) as CalculatorTermOrLevelInput[];
    const levelInputs = levels.map((row) =>
      normalizeDimension(row, true),
    ) as CalculatorTermOrLevelInput[];
    const next: CalculatorFieldErrors = validateIdentity(identity);
    sessionInputs.forEach((input, index) =>
      Object.assign(next, validateDimension(input, `sessions.${index}`)),
    );
    termInputs.forEach((input, index) =>
      Object.assign(next, validateDimension(input, `terms.${index}`)),
    );
    levelInputs.forEach((input, index) =>
      Object.assign(next, validateDimension(input, `levels.${index}`)),
    );
    const grading = includeGrading
      ? buildGradingScheme({ maxGradePoint, bands })
      : { errors: {} as CalculatorFieldErrors };
    Object.assign(next, grading.errors);
    setErrors(next);
    create.reset();
    if (Object.keys(next).length) {
      requestAnimationFrame(() =>
        form.querySelector<HTMLElement>("[aria-invalid='true']")?.focus(),
      );
      return;
    }
    const input: CreateCalculatorInput = {
      ...identity,
      ...(sessionInputs.length ? { sessions: sessionInputs } : {}),
      ...(termInputs.length ? { terms: termInputs } : {}),
      ...(levelInputs.length ? { levels: levelInputs } : {}),
      ...(grading.input ? { gradingScheme: grading.input } : {}),
    };
    locked.current = true;
    try {
      const calculator = await create.mutateAsync(input);
      router.replace(
        `/dashboard/public-calculators/${encodeURIComponent(calculator.id)}?tab=courses`,
      );
    } catch (error) {
      const backend = normalizeApiError(error);
      if (backend.fieldErrors)
        setErrors(
          Object.fromEntries(
            Object.entries(backend.fieldErrors).map(([key, value]) => [
              key,
              value[0],
            ]),
          ),
        );
    } finally {
      locked.current = false;
    }
  }

  return (
    <AppShell area="dashboard">
      <div className="mx-auto w-full max-w-[1500px] px-[clamp(20px,4.5vw,72px)] pb-[72px] pt-[clamp(28px,4vw,58px)] max-[900px]:px-5">
        <header className="border-b border-[var(--app-border)] pb-6">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.13em] text-blue-600">
            Public calculator setup
          </p>
          <h1 className="font-display text-[clamp(38px,4vw,50px)] font-medium leading-none tracking-[-0.045em]">
            Create a calculator
          </h1>
          <p className="mt-2.5 max-w-2xl text-xs text-[var(--app-muted)]">
            Add the calculator details first. Courses and credit units can be
            added after creation.
          </p>
        </header>
        <form
          ref={formRef}
          onSubmit={submit}
          noValidate
          className="app-panel mt-8 max-w-4xl space-y-9 border border-[var(--app-border)] p-5 sm:p-8"
        >
          {Object.keys(errors).length > 0 && (
            <p
              role="alert"
              tabIndex={-1}
              className="border border-red-200 bg-red-50 p-3 text-xs text-red-700"
            >
              Please correct the highlighted fields. {Object.values(errors)[0]}
            </p>
          )}
          <section className="space-y-4">
            <h2 className="font-display text-xl font-semibold">1. Identity</h2>
            <label className="block text-sm font-semibold">
              Title
              <Input
                name="title"
                autoFocus
                className="mt-1"
                aria-invalid={Boolean(errors.title)}
              />
              <FieldError>{errors.title}</FieldError>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                Institution{" "}
                <span className="font-normal text-[var(--app-muted)]">
                  (optional)
                </span>
                <Input
                  name="institutionName"
                  className="mt-1"
                  aria-invalid={Boolean(errors.institutionName)}
                />
                <FieldError>{errors.institutionName}</FieldError>
              </label>
              <label className="text-sm font-semibold">
                Department{" "}
                <span className="font-normal text-[var(--app-muted)]">
                  (optional)
                </span>
                <Input
                  name="departmentName"
                  className="mt-1"
                  aria-invalid={Boolean(errors.departmentName)}
                />
                <FieldError>{errors.departmentName}</FieldError>
              </label>
            </div>
            <label className="block text-sm font-semibold">
              Description{" "}
              <span className="font-normal text-[var(--app-muted)]">
                (optional)
              </span>
              <Textarea
                name="description"
                rows={3}
                className="mt-1"
                aria-invalid={Boolean(errors.description)}
              />
              <FieldError>{errors.description}</FieldError>
            </label>
          </section>
          <DimensionRows
            title="Sessions"
            prefix="sessions"
            rows={sessions}
            setRows={setSessions}
            withCode={false}
            errors={errors}
          />
          <DimensionRows
            title="Terms"
            prefix="terms"
            rows={terms}
            setRows={setTerms}
            withCode
            errors={errors}
          />
          <DimensionRows
            title="Levels"
            prefix="levels"
            rows={levels}
            setRows={setLevels}
            withCode
            errors={errors}
          />
          <section>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold">
                  5. Grading scheme
                </h2>
                <p className="mt-1 text-xs text-[var(--app-muted)]">
                  Optional now, required before publication.
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={includeGrading}
                  onChange={(event) => setIncludeGrading(event.target.checked)}
                />{" "}
                Configure now
              </label>
            </div>
            {includeGrading && (
              <div className="mt-5">
                <GradingBandEditor
                  maxGradePoint={maxGradePoint}
                  setMaxGradePoint={setMaxGradePoint}
                  bands={bands}
                  setBands={setBands}
                  errors={errors}
                />
              </div>
            )}
          </section>
          <RequestError>
            {create.isError
              ? normalizeApiError(create.error).message
              : undefined}
          </RequestError>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={create.isPending}
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending
                ? "Creating calculator…"
                : "Create and add Courses"}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
