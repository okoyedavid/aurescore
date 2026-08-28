import type {
  CalculatorCourse,
  CalculatorTermOrLevel,
  PublicCourse,
  PublicTermOrLevel,
} from "./types";

type Dimension = Pick<CalculatorTermOrLevel, "id" | "name" | "order">;
type Course = Pick<
  CalculatorCourse | PublicCourse,
  "id" | "name" | "code" | "levelId" | "termId" | "creditUnits" | "order"
>;

export const byDimensionOrder = <T extends Dimension>(a: T, b: T) =>
  (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) ||
  a.name.localeCompare(b.name);

export const byCourseOrder = <T extends Course>(a: T, b: T) =>
  (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) ||
  (a.code ?? "").localeCompare(b.code ?? "", undefined, {
    numeric: true,
    sensitivity: "base",
  }) ||
  a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

export function missingCourseFields(course: Course) {
  return [
    !course.levelId ? "Level" : null,
    !course.termId ? "Term" : null,
    !(Number(course.creditUnits) > 0) ? "Credit units" : null,
  ].filter((field): field is string => Boolean(field));
}

export function groupCourses<T extends Course>(
  courses: T[],
  levels: Array<Dimension | PublicTermOrLevel>,
  terms: Array<Dimension | PublicTermOrLevel>,
) {
  const complete = courses.filter(
    (course) => !missingCourseFields(course).length,
  );
  return levels
    .slice()
    .sort(byDimensionOrder)
    .map((level) => ({
      level,
      terms: terms
        .slice()
        .sort(byDimensionOrder)
        .map((term) => ({
          term,
          courses: complete
            .filter(
              (course) =>
                course.levelId === level.id && course.termId === term.id,
            )
            .sort(byCourseOrder),
        }))
        .filter((group) => group.courses.length),
    }))
    .filter((group) => group.terms.length);
}
