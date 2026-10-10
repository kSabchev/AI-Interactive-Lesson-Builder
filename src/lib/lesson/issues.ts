import type { z } from "zod";
import type { Lesson } from "./schema";

/** Which part of the editor an issue belongs to. */
export type EditorTarget = "details" | "objectives" | "sources" | `section:${string}` | `quiz:${string}`;

export type LessonIssue = {
  target: EditorTarget;
  /** Human-readable location, e.g. "Quiz question 2 · Correct answer". */
  where: string;
  message: string;
};

const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  topic: "Topic",
  description: "Description",
  question: "Question",
  body: "Text",
  paragraphs: "Paragraphs",
  keyTerms: "Key words",
  term: "Word",
  definition: "Definition",
  example: "Real-life example",
  facilitatorNote: "Note for the adult",
  options: "Options",
  text: "Text",
  reveal: "Reveal explanation",
  answerOptionId: "Highlighted answer",
  instructions: "Instructions",
  labels: "Labels",
  targetId: "Diagram spot",
  explanation: "Explanation",
  categories: "Groups",
  label: "Group name",
  items: "Examples",
  categoryId: "Group",
  keyPoints: "Key points",
  prompt: "Question",
  correctOptionId: "Correct answer",
  objectiveId: "Learning objective",
  sectionId: "Lesson section",
  sourceIds: "Sources",
  url: "Link",
  excerpt: "Excerpt",
};

function describeField(rest: PropertyKey[]): string {
  const parts: string[] = [];
  for (let i = 0; i < rest.length; i++) {
    const key = rest[i];
    if (typeof key === "number") {
      // Attach the position to the preceding list name: "Options 3".
      if (parts.length) parts[parts.length - 1] += ` ${key + 1}`;
      continue;
    }
    parts.push(FIELD_LABELS[String(key)] ?? String(key));
  }
  return parts.join(" · ");
}

function friendlyMessage(issue: z.core.$ZodIssue): string {
  if (issue.code === "too_small") {
    if (issue.origin === "string") return "This can't be empty.";
    if (issue.origin === "array") return `Needs at least ${issue.minimum}.`;
  }
  if (issue.code === "too_big") {
    if (issue.origin === "string") return `Keep this under ${issue.maximum} characters.`;
    if (issue.origin === "array") return `Use at most ${issue.maximum}.`;
  }
  if (issue.code === "invalid_format" && issue.format === "url") return "This must be a full web address.";
  return issue.message;
}

export function describeIssues(lesson: Lesson, error: z.ZodError): LessonIssue[] {
  return error.issues.map((issue) => {
    const [root, index, ...rest] = issue.path;
    const message = friendlyMessage(issue);

    if (root === "sections" && typeof index === "number" && lesson.sections[index]) {
      const section = lesson.sections[index];
      return {
        target: `section:${section.id}`,
        where: [`Section ${index + 1} “${section.title}”`, describeField(rest)].filter(Boolean).join(" · "),
        message,
      };
    }
    if (root === "quiz" && typeof index === "number" && lesson.quiz[index]) {
      return {
        target: `quiz:${lesson.quiz[index].id}`,
        where: [`Quiz question ${index + 1}`, describeField(rest)].filter(Boolean).join(" · "),
        message,
      };
    }
    if (root === "objectives") {
      return {
        target: "objectives",
        where: typeof index === "number" ? `Objective ${index + 1}` : "Learning objectives",
        message,
      };
    }
    if (root === "sources") {
      return {
        target: "sources",
        where: [typeof index === "number" ? `Source ${index + 1}` : "Sources", describeField(rest)].filter(Boolean).join(" · "),
        message,
      };
    }
    return { target: "details", where: describeField(issue.path) || "Lesson", message };
  });
}
