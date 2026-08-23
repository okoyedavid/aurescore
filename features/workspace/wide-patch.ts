import type { CourseType, WorkspaceDetails, WorkspacePatch } from "./types";
import {
  normalizeCourse,
  normalizeLevel,
  normalizeSession,
} from "./validation";

export type WideSessionRow = {
  key: string;
  id?: string;
  name: string;
  startsAt: string;
  endsAt: string;
};
export type WideLevelRow = {
  key: string;
  id?: string;
  name: string;
  code: string;
  order: string;
};
export type WideCourseRow = {
  key: string;
  id?: string;
  name: string;
  code: string;
  type: CourseType;
};
export type WideValues = {
  name: string;
  description: string;
  sessions: WideSessionRow[];
  levels: WideLevelRow[];
  courses: WideCourseRow[];
};

export function buildWorkspacePatch(
  original: WorkspaceDetails,
  values: WideValues,
): WorkspacePatch {
  const patch: WorkspacePatch = {};
  const name = values.name.trim();
  const description = values.description.trim() || null;
  if (name !== original.name) patch.name = name;
  if (description !== original.description) patch.description = description;
  const sessionCreate = values.sessions
    .filter((row) => !row.id)
    .map(normalizeSession);
  const sessionUpdate = values.sessions
    .filter((row) => row.id)
    .flatMap((row) => {
      const before = original.sessions.find((item) => item.id === row.id);
      if (!before) return [];
      const after = normalizeSession(row);
      const update: NonNullable<
        NonNullable<WorkspacePatch["sessions"]>["update"]
      >[number] = { sessionId: row.id! };
      if (after.name !== before.name) update.name = after.name;
      if (after.startsAt !== before.startsAt) update.startsAt = after.startsAt;
      if (after.endsAt !== before.endsAt) update.endsAt = after.endsAt;
      return Object.keys(update).length > 1 ? [update] : [];
    });
  if (sessionCreate.length || sessionUpdate.length)
    patch.sessions = {
      ...(sessionCreate.length ? { create: sessionCreate } : {}),
      ...(sessionUpdate.length ? { update: sessionUpdate } : {}),
    };
  const levelCreate = values.levels
    .filter((row) => !row.id)
    .map(normalizeLevel);
  const levelUpdate = values.levels
    .filter((row) => row.id)
    .flatMap((row) => {
      const before = original.levels.find((item) => item.id === row.id);
      if (!before) return [];
      const after = normalizeLevel(row);
      const update: NonNullable<
        NonNullable<WorkspacePatch["levels"]>["update"]
      >[number] = { levelId: row.id! };
      if (after.name !== before.name) update.name = after.name;
      if (after.code !== before.code) update.code = after.code;
      if (after.order !== before.order) update.order = after.order;
      return Object.keys(update).length > 1 ? [update] : [];
    });
  if (levelCreate.length || levelUpdate.length)
    patch.levels = {
      ...(levelCreate.length ? { create: levelCreate } : {}),
      ...(levelUpdate.length ? { update: levelUpdate } : {}),
    };
  const courseCreate = values.courses
    .filter((row) => !row.id)
    .map(normalizeCourse);
  const courseUpdate = values.courses
    .filter((row) => row.id)
    .flatMap((row) => {
      const before = original.courses.find((item) => item.id === row.id);
      if (!before) return [];
      const after = normalizeCourse(row);
      const update: NonNullable<
        NonNullable<WorkspacePatch["courses"]>["update"]
      >[number] = { courseId: row.id! };
      if (after.name !== before.name) update.name = after.name;
      if (after.code !== before.code) update.code = after.code;
      if (after.type !== before.type) update.type = after.type;
      return Object.keys(update).length > 1 ? [update] : [];
    });
  if (courseCreate.length || courseUpdate.length)
    patch.courses = {
      ...(courseCreate.length ? { create: courseCreate } : {}),
      ...(courseUpdate.length ? { update: courseUpdate } : {}),
    };
  return patch;
}
