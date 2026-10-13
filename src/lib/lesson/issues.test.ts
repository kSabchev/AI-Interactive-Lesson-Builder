import { describe, expect, it } from "vitest";
import { getSampleLesson } from "@/content/samples";
import { en } from "@/lib/i18n/dictionaries/en";
import { bg } from "@/lib/i18n/dictionaries/bg";
import { describeIssues } from "./issues";
import { type Lesson, lessonSchema } from "./schema";

const sample = getSampleLesson("sample-water-cycle")!;

function issuesFor(mutate: (lesson: Lesson) => void) {
  const lesson = structuredClone(sample);
  mutate(lesson);
  const result = lessonSchema.safeParse(lesson);
  if (result.success) throw new Error("expected the lesson to be invalid");
  return describeIssues(lesson, result.error, en);
}

describe("describeIssues", () => {
  it("points section field errors at the section with a readable location", () => {
    const [issue] = issuesFor((l) => {
      const explanation = l.sections.find((s) => s.type === "explanation")!;
      if (explanation.type === "explanation") explanation.keyTerms[1].definition = "";
    });
    expect(issue).toEqual({
      target: "section:sec-evaporation",
      where: "Section 3 “Up and away: evaporation and condensation” · Key words 2 · Definition",
      message: "This can't be empty.",
    });
  });

  it("points quiz errors at the question", () => {
    const [issue] = issuesFor((l) => {
      l.quiz[1].options[2].text = "";
    });
    expect(issue.target).toBe("quiz:q2");
    expect(issue.where).toBe("Quiz question 2 · Options 3 · Text");
  });

  it("explains overlong text", () => {
    const [issue] = issuesFor((l) => {
      l.title = "x".repeat(200);
    });
    expect(issue).toMatchObject({ target: "details", where: "Title", message: "Keep this under 160 characters." });
  });

  it("routes objective errors to the objectives panel", () => {
    const [issue] = issuesFor((l) => {
      l.objectives[2].description = " ";
    });
    expect(issue).toMatchObject({ target: "objectives", where: "Objective 3" });
  });
});

describe("describeIssues in Bulgarian", () => {
  it("describes the location and problem in the interface language", () => {
    const lesson = structuredClone(sample);
    lesson.quiz[1].options[2].text = "";
    const result = lessonSchema.safeParse(lesson);
    if (result.success) throw new Error("expected the lesson to be invalid");
    expect(describeIssues(lesson, result.error, bg)[0]).toMatchObject({
      where: "Въпрос 2 от теста · Отговори 3 · Текст",
      message: "Това поле не може да е празно.",
    });
  });
});
