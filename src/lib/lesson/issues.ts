import type { z } from "zod";
import type { Dictionary } from "@/lib/i18n";
import type { Lesson } from "./schema";

/** Which part of the editor an issue belongs to. */
export type EditorTarget = "details" | "objectives" | "sources" | `section:${string}` | `quiz:${string}`;

export type LessonIssue = {
  target: EditorTarget;
  /** Human-readable location, e.g. "Quiz question 2 · Correct answer". */
  where: string;
  message: string;
};

function describeField(rest: PropertyKey[], t: Dictionary): string {
  const parts: string[] = [];
  for (let i = 0; i < rest.length; i++) {
    const key = rest[i];
    if (typeof key === "number") {
      // Attach the position to the preceding list name: "Options 3".
      if (parts.length) parts[parts.length - 1] += ` ${key + 1}`;
      continue;
    }
    parts.push(t.issues.fields[String(key)] ?? String(key));
  }
  return parts.join(" · ");
}

function friendlyMessage(issue: z.core.$ZodIssue, t: Dictionary): string {
  if (issue.code === "too_small") {
    if (issue.origin === "string") return t.issues.empty;
    if (issue.origin === "array") return t.issues.atLeast(Number(issue.minimum));
  }
  if (issue.code === "too_big") {
    if (issue.origin === "string") return t.issues.maxChars(Number(issue.maximum));
    if (issue.origin === "array") return t.issues.atMost(Number(issue.maximum));
  }
  if (issue.code === "invalid_format" && issue.format === "url") return t.issues.url;
  return issue.message;
}

export function describeIssues(lesson: Lesson, error: z.ZodError, t: Dictionary): LessonIssue[] {
  return error.issues.map((issue) => {
    const [root, index, ...rest] = issue.path;
    const message = friendlyMessage(issue, t);

    if (root === "sections" && typeof index === "number" && lesson.sections[index]) {
      const section = lesson.sections[index];
      return {
        target: `section:${section.id}`,
        where: [t.issues.section(index + 1, section.title), describeField(rest, t)].filter(Boolean).join(" · "),
        message,
      };
    }
    if (root === "quiz" && typeof index === "number" && lesson.quiz[index]) {
      return {
        target: `quiz:${lesson.quiz[index].id}`,
        where: [t.issues.quizQuestion(index + 1), describeField(rest, t)].filter(Boolean).join(" · "),
        message,
      };
    }
    if (root === "objectives") {
      return {
        target: "objectives",
        where: typeof index === "number" ? t.issues.objective(index + 1) : t.issues.objectives,
        message,
      };
    }
    if (root === "sources") {
      return {
        target: "sources",
        where: [typeof index === "number" ? t.issues.source(index + 1) : t.issues.sources, describeField(rest, t)]
          .filter(Boolean)
          .join(" · "),
        message,
      };
    }
    return { target: "details", where: describeField(issue.path, t) || t.issues.lesson, message };
  });
}
