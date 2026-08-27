"use client";

import { FormEvent, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/FormField";
import AppShell from "@/features/app-shell/components/AppShell";
import { normalizeApiError } from "@/lib/api/errors";
import { FieldError, RequestError } from "./components/FieldError";
import { useCreateWorkspace } from "./hooks";
import {
  buildCreateWorkspaceInput,
  normalizeLevel,
  normalizeSession,
  normalizeTerm,
  validateWorkspace,
  type FieldErrors,
} from "./validation";

type SessionRow = {
  key: number;
  name: string;
  startsAt: string;
  endsAt: string;
};
type LevelRow = { key: number; name: string; code: string; order: string };
type TermRow = { key: number; name: string; code: string; order: string };
const termPresets = {
  "Two semesters": ["First Semester", "Second Semester"],
  "Three terms": ["First Term", "Second Term", "Third Term"],
  "Three trimesters": [
    "First Trimester",
    "Second Trimester",
    "Third Trimester",
  ],
  "Four quarters": [
    "First Quarter",
    "Second Quarter",
    "Third Quarter",
    "Fourth Quarter",
  ],
} as const;
let nextKey = 0;

export default function CreateWorkspacePage() {
  const router = useRouter();
  const create = useCreateWorkspace();
  const locked = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [levels, setLevels] = useState<LevelRow[]>([]);
  const [terms, setTerms] = useState<TermRow[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});

  function focusFirstError(next: FieldErrors) {
    const key = Object.keys(next)[0];
    if (key)
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>(`[data-field="${key}"]`)
          ?.focus(),
      );
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || create.isPending) return;
    const data = new FormData(event.currentTarget);
    const input = buildCreateWorkspaceInput({
      name: String(data.get("name") ?? ""),
      description: String(data.get("description") ?? ""),
      sessions: sessions.map(normalizeSession),
      levels: levels.map(normalizeLevel),
      terms: terms.map(normalizeTerm),
    });
    const next = validateWorkspace(input);
    setErrors(next);
    create.reset();
    if (Object.keys(next).length) return focusFirstError(next);
    locked.current = true;
    try {
      const workspace = await create.mutateAsync(input);
      router.replace(`/workspace/${encodeURIComponent(workspace.id)}`);
    } catch (error) {
      const backend = normalizeApiError(error);
      const backendFields = Object.fromEntries(
        Object.entries(backend.fieldErrors ?? {}).map(([key, messages]) => [
          key,
          messages[0],
        ]),
      );
      if (Object.keys(backendFields).length) {
        setErrors(backendFields);
        focusFirstError(backendFields);
      }
    } finally {
      locked.current = false;
    }
  }
  return (
    <AppShell area="workspace">
      <div className="mx-auto w-full max-w-[1500px] px-[clamp(20px,4.5vw,72px)] pb-[72px] pt-[clamp(28px,4vw,58px)] max-[900px]:px-5 max-[900px]:pb-14 max-[900px]:pt-7">
        <header className="border-b border-[var(--app-border)] pb-6">
          <p className="mb-2 text-[10px] font-bold uppercase leading-normal tracking-[0.13em] text-blue-600">
            Private workspace
          </p>
          <h1 className="m-0 font-display text-[clamp(38px,4vw,50px)] font-medium leading-none tracking-[-0.045em] max-[650px]:text-[39px]">
            Create a workspace
          </h1>
          <p className="mt-2.5 text-xs leading-normal text-[var(--app-muted)]">
            Courses can be added after this workspace exists.
          </p>
        </header>
        <form
          ref={formRef}
          onSubmit={submit}
          noValidate
          className="app-panel mt-8 max-w-4xl space-y-8 border border-[var(--app-border)] p-5 sm:p-8"
        >
          {Object.keys(errors).length > 0 && (
            <div
              role="alert"
              tabIndex={-1}
              className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              <p className="font-semibold">
                Please correct the highlighted fields.
              </p>
              <p>{Object.values(errors)[0]}</p>
            </div>
          )}
          <section className="space-y-5">
            <h2 className="font-display text-xl font-semibold">Core details</h2>
            <label className="block text-sm font-semibold">
              Workspace name
              <Input
                data-field="name"
                name="name"
                autoFocus
                maxLength={80}
                className="mt-2"
                aria-invalid={Boolean(errors.name)}
              />
              <FieldError>{errors.name}</FieldError>
            </label>
            <label className="block text-sm font-semibold">
              Description{" "}
              <span className="font-normal text-[var(--app-muted)]">
                (optional)
              </span>
              <Textarea
                data-field="description"
                name="description"
                rows={4}
                maxLength={500}
                className="mt-2"
                aria-invalid={Boolean(errors.description)}
              />
              <FieldError>{errors.description}</FieldError>
            </label>
          </section>
          <fieldset>
            <legend className="font-display text-xl font-semibold">
              Initial sessions{" "}
              <span className="text-sm font-normal text-[var(--app-muted)]">
                (optional)
              </span>
            </legend>
            <p className="mt-1 text-xs text-[var(--app-muted)]">
              Up to 20. Dates preserve the calendar day you enter.
            </p>
            <div className="mt-4 space-y-4">
              {sessions.map((row, index) => (
                <div
                  key={row.key}
                  className="rounded-sm border border-[var(--app-border)] p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      New session {index + 1}
                    </p>
                    <button
                      type="button"
                      aria-label={`Remove session ${index + 1}`}
                      onClick={() =>
                        setSessions((items) =>
                          items.filter((item) => item.key !== row.key),
                        )
                      }
                      className="app-icon-button"
                    >
                      <Minus size={16} />
                    </button>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <label className="text-sm">
                      Name
                      <Input
                        data-field={`sessions.${index}.name`}
                        value={row.name}
                        onChange={(e) =>
                          setSessions((items) =>
                            items.map((item) =>
                              item.key === row.key
                                ? { ...item, name: e.target.value }
                                : item,
                            ),
                          )
                        }
                        className="mt-1"
                        aria-invalid={Boolean(errors[`sessions.${index}.name`])}
                      />
                      <FieldError>
                        {errors[`sessions.${index}.name`]}
                      </FieldError>
                    </label>
                    <label className="text-sm">
                      Start date
                      <Input
                        type="date"
                        value={row.startsAt}
                        onChange={(e) =>
                          setSessions((items) =>
                            items.map((item) =>
                              item.key === row.key
                                ? { ...item, startsAt: e.target.value }
                                : item,
                            ),
                          )
                        }
                        className="mt-1"
                      />
                    </label>
                    <label className="text-sm">
                      End date
                      <Input
                        data-field={`sessions.${index}.endsAt`}
                        type="date"
                        value={row.endsAt}
                        onChange={(e) =>
                          setSessions((items) =>
                            items.map((item) =>
                              item.key === row.key
                                ? { ...item, endsAt: e.target.value }
                                : item,
                            ),
                          )
                        }
                        className="mt-1"
                        aria-invalid={Boolean(
                          errors[`sessions.${index}.endsAt`],
                        )}
                      />
                      <FieldError>
                        {errors[`sessions.${index}.endsAt`]}
                      </FieldError>
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={sessions.length >= 20}
              onClick={() =>
                setSessions((items) => [
                  ...items,
                  { key: ++nextKey, name: "", startsAt: "", endsAt: "" },
                ])
              }
              className="focus-ring mt-4 inline-flex items-center gap-2 rounded text-sm font-semibold text-blue-600 disabled:opacity-40"
            >
              <Plus size={15} />
              Add session
            </button>
            <FieldError>{errors.sessions}</FieldError>
          </fieldset>
          <fieldset>
            <legend className="font-display text-xl font-semibold">
              Initial levels{" "}
              <span className="text-sm font-normal text-[var(--app-muted)]">
                (optional)
              </span>
            </legend>
            <p className="mt-1 text-xs text-[var(--app-muted)]">
              Up to 50. Lower order values appear first.
            </p>
            <div className="mt-4 space-y-4">
              {levels.map((row, index) => (
                <div
                  key={row.key}
                  className="rounded-sm border border-[var(--app-border)] p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      New level {index + 1}
                    </p>
                    <button
                      type="button"
                      aria-label={`Remove level ${index + 1}`}
                      onClick={() =>
                        setLevels((items) =>
                          items.filter((item) => item.key !== row.key),
                        )
                      }
                      className="app-icon-button"
                    >
                      <Minus size={16} />
                    </button>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    {(
                      [
                        ["name", "Name"],
                        ["code", "Code"],
                        ["order", "Order"],
                      ] as const
                    ).map(([field, label]) => (
                      <label key={field} className="text-sm">
                        {label}
                        <Input
                          data-field={`levels.${index}.${field}`}
                          type={field === "order" ? "number" : "text"}
                          min={field === "order" ? 0 : undefined}
                          value={row[field]}
                          onChange={(e) =>
                            setLevels((items) =>
                              items.map((item) =>
                                item.key === row.key
                                  ? { ...item, [field]: e.target.value }
                                  : item,
                              ),
                            )
                          }
                          className="mt-1"
                          aria-invalid={Boolean(
                            errors[`levels.${index}.${field}`],
                          )}
                        />
                        <FieldError>
                          {errors[`levels.${index}.${field}`]}
                        </FieldError>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={levels.length >= 50}
              onClick={() =>
                setLevels((items) => [
                  ...items,
                  { key: ++nextKey, name: "", code: "", order: "" },
                ])
              }
              className="focus-ring mt-4 inline-flex items-center gap-2 rounded text-sm font-semibold text-blue-600 disabled:opacity-40"
            >
              <Plus size={15} />
              Add level
            </button>
            <FieldError>{errors.levels}</FieldError>
          </fieldset>
          <fieldset>
            <legend className="font-display text-xl font-semibold">
              Initial terms{" "}
              <span className="text-sm font-normal text-[var(--app-muted)]">
                (optional)
              </span>
            </legend>
            <p className="mt-1 text-xs text-[var(--app-muted)]">
              Create reusable workspace terms. Presets only generate editable
              rows.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(termPresets).map(([label, names]) => (
                <Button
                  key={label}
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setTerms(
                      names.map((name, index) => ({
                        key: ++nextKey,
                        name,
                        code: "",
                        order: String(index + 1),
                      })),
                    )
                  }
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="mt-4 space-y-4">
              {terms.map((row, index) => (
                <div
                  key={row.key}
                  className="rounded-sm border border-[var(--app-border)] p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      New term {index + 1}
                    </p>
                    <button
                      type="button"
                      aria-label={`Remove term ${index + 1}`}
                      onClick={() =>
                        setTerms((items) =>
                          items.filter((item) => item.key !== row.key),
                        )
                      }
                      className="app-icon-button"
                    >
                      <Minus size={16} />
                    </button>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    {(
                      [
                        ["name", "Name"],
                        ["code", "Code"],
                        ["order", "Order"],
                      ] as const
                    ).map(([field, label]) => (
                      <label key={field} className="text-sm">
                        {label}
                        <Input
                          data-field={`terms.${index}.${field}`}
                          type={field === "order" ? "number" : "text"}
                          min={field === "order" ? 0 : undefined}
                          value={row[field]}
                          onChange={(event) =>
                            setTerms((items) =>
                              items.map((item) =>
                                item.key === row.key
                                  ? { ...item, [field]: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          className="mt-1"
                          aria-invalid={Boolean(
                            errors[`terms.${index}.${field}`],
                          )}
                        />
                        <FieldError>
                          {errors[`terms.${index}.${field}`]}
                        </FieldError>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={terms.length >= 50}
              onClick={() =>
                setTerms((items) => [
                  ...items,
                  { key: ++nextKey, name: "", code: "", order: "" },
                ])
              }
              className="focus-ring mt-4 inline-flex items-center gap-2 rounded text-sm font-semibold text-blue-600 disabled:opacity-40"
            >
              <Plus size={15} /> Add custom term
            </button>
            <FieldError>{errors.terms}</FieldError>
          </fieldset>
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
              {create.isPending ? "Creating workspace…" : "Create workspace"}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
