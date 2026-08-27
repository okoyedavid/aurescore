import type {
  CourseInput,
  CreateWorkspaceInput,
  LevelInput,
  SessionInput,
  TermInput,
  WorkspacePatch,
} from "./types";

export type FieldErrors = Record<string, string>;
const optional = (value: string) => value.trim() || null;

export function dateInputToIso(value: string): string | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
  return date.getUTCFullYear() === Number(match[1]) &&
    date.getUTCMonth() === Number(match[2]) - 1 &&
    date.getUTCDate() === Number(match[3])
    ? date.toISOString()
    : null;
}

export function isoToDateInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

export function normalizeSession(input: {
  name: string;
  startsAt?: string;
  endsAt?: string;
}): SessionInput {
  return {
    name: input.name.trim(),
    startsAt: dateInputToIso(input.startsAt ?? ""),
    endsAt: dateInputToIso(input.endsAt ?? ""),
  };
}

export function validateSession(
  input: SessionInput,
  prefix = "session",
): FieldErrors {
  const errors: FieldErrors = {};
  if (input.name.length < 2 || input.name.length > 80)
    errors[`${prefix}.name`] = "Name must be between 2 and 80 characters.";
  if (
    input.startsAt &&
    input.endsAt &&
    new Date(input.endsAt).getTime() < new Date(input.startsAt).getTime()
  )
    errors[`${prefix}.endsAt`] = "End date must not precede the start date.";
  return errors;
}

export function normalizeTerm(input: {
  name: string;
  code?: string;
  order?: string;
  metadata?: Record<string, unknown> | null;
}): TermInput {
  const order = input.order?.trim();
  return {
    name: input.name.trim(),
    code: optional(input.code ?? ""),
    order: order ? Number(order) : null,
    metadata: input.metadata ?? null,
  };
}

export function validateTerm(input: TermInput, prefix = "term"): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.name || input.name.length > 120)
    errors[`${prefix}.name`] = "Name must be between 1 and 120 characters.";
  if ((input.code?.length ?? 0) > 30)
    errors[`${prefix}.code`] = "Code must be at most 30 characters.";
  if (
    input.order !== null &&
    input.order !== undefined &&
    !Number.isInteger(input.order)
  )
    errors[`${prefix}.order`] = "Order must be a whole number.";
  return errors;
}

export function normalizeLevel(input: {
  name: string;
  code?: string;
  order?: string;
}): LevelInput {
  const order = input.order?.trim();
  return {
    name: input.name.trim(),
    code: optional(input.code ?? ""),
    order: order ? Number(order) : null,
  };
}

export function validateLevel(
  input: LevelInput,
  prefix = "level",
): FieldErrors {
  const errors: FieldErrors = {};
  if (input.name.length < 1 || input.name.length > 80)
    errors[`${prefix}.name`] = "Name must be between 1 and 80 characters.";
  if ((input.code?.length ?? 0) > 30)
    errors[`${prefix}.code`] = "Code must be at most 30 characters.";
  if (
    input.order !== null &&
    input.order !== undefined &&
    (!Number.isInteger(input.order) || input.order < 0)
  )
    errors[`${prefix}.order`] = "Order must be a non-negative whole number.";
  return errors;
}

export function normalizeCourse(input: {
  name: string;
  code?: string;
  type?: CourseInput["type"];
  defaultLevelId?: string | null;
  defaultTermId?: string | null;
}): CourseInput {
  return {
    name: input.name.trim(),
    code: optional(input.code ?? ""),
    type: input.type ?? "COURSE",
    ...(input.defaultLevelId !== undefined
      ? { defaultLevelId: input.defaultLevelId || null }
      : {}),
    ...(input.defaultTermId !== undefined
      ? { defaultTermId: input.defaultTermId || null }
      : {}),
  };
}

export function validateCourse(
  input: CourseInput,
  prefix = "course",
): FieldErrors {
  const errors: FieldErrors = {};
  if (input.name.length < 1 || input.name.length > 120)
    errors[`${prefix}.name`] = "Name must be between 1 and 120 characters.";
  if ((input.code?.length ?? 0) > 30)
    errors[`${prefix}.code`] = "Code must be at most 30 characters.";
  return errors;
}

export function validateWorkspace(input: CreateWorkspaceInput): FieldErrors {
  const errors: FieldErrors = {};
  if (input.name.length < 2 || input.name.length > 80)
    errors.name = "Workspace name must be between 2 and 80 characters.";
  if ((input.description?.length ?? 0) > 500)
    errors.description = "Description must be at most 500 characters.";
  if ((input.sessions?.length ?? 0) > 20)
    errors.sessions = "A workspace can start with at most 20 sessions.";
  if ((input.levels?.length ?? 0) > 50)
    errors.levels = "A workspace can start with at most 50 levels.";
  if ((input.terms?.length ?? 0) > 50)
    errors.terms = "A workspace can start with at most 50 terms.";
  input.sessions?.forEach((item, index) =>
    Object.assign(errors, validateSession(item, `sessions.${index}`)),
  );
  input.levels?.forEach((item, index) =>
    Object.assign(errors, validateLevel(item, `levels.${index}`)),
  );
  input.terms?.forEach((item, index) =>
    Object.assign(errors, validateTerm(item, `terms.${index}`)),
  );
  return errors;
}

export function buildCreateWorkspaceInput(values: {
  name: string;
  description: string;
  sessions: SessionInput[];
  levels: LevelInput[];
  terms?: TermInput[];
}): CreateWorkspaceInput {
  const input: CreateWorkspaceInput = {
    name: values.name.trim(),
    description: optional(values.description),
  };
  if (values.sessions.length) input.sessions = values.sessions;
  if (values.levels.length) input.levels = values.levels;
  if (values.terms?.length) input.terms = values.terms;
  return input;
}

export function hasWorkspacePatch(input: WorkspacePatch) {
  return Object.keys(input).length > 0;
}
