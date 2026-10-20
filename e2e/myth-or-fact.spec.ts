import { expect, test } from "@playwright/test";
import { waterCycleLesson } from "../src/content/samples/water-cycle";

test("myth or fact explains each answer straight away and scores the warm-up", async ({ page }) => {
  const lesson = { ...structuredClone(waterCycleLesson), id: "lesson-myth-1", contentOrigin: "ai-draft" as const, sources: [] };
  lesson.sections = lesson.sections.map((s) => ({ ...s, sourceIds: [] }));
  lesson.quiz = lesson.quiz.map((q) => ({ ...q, sourceIds: [] }));
  const index = lesson.sections.findIndex((s) => s.type === "prediction");
  const sectionId = lesson.sections[index].id;
  lesson.sections[index] = {
    id: sectionId,
    type: "myth-or-fact",
    title: "Myth or fact?",
    instructions: "Decide whether each one is a myth or a fact.",
    objectiveIds: [],
    sourceIds: [],
    statements: [
      { id: "s1", text: "Clouds are made of smoke.", isFact: false, explanation: "Clouds are tiny drops of water." },
      { id: "s2", text: "The Sun makes water evaporate.", isFact: true, explanation: "Warmth turns water into vapour." },
      { id: "s3", text: "Rain is new water every time.", isFact: false, explanation: "The same water goes round and round." },
    ],
  };
  const stream = [{ type: "start", mode: "live" }, { type: "done", lesson }];
  await page.route("**/api/lessons/generate", (route) =>
    route.fulfill({ contentType: "application/x-ndjson", body: stream.map((e) => JSON.stringify(e)).join("\n") + "\n" }),
  );
  await page.goto("/create");
  await page.getByRole("textbox", { name: "Topic" }).fill("The water cycle");
  await page.getByRole("button", { name: "Generate lesson" }).click();
  await expect(page).toHaveURL(/lesson-myth-1\/edit/);

  await page.goto(`/lessons/lesson-myth-1/present?section=${sectionId}`);
  const statements = page.getByRole("list", { name: "Statements" });
  await statements.getByRole("button", { name: 'Myth: "Clouds are made of smoke."' }).click();
  await expect(statements.getByText("Right — It's a myth!")).toBeVisible();
  await expect(statements.getByText("Clouds are tiny drops of water.")).toBeVisible();

  await statements.getByRole("button", { name: 'Myth: "The Sun makes water evaporate."' }).click();
  await expect(statements.getByText("Not quite — It's a fact!")).toBeVisible();
  await expect(page.getByText("You spotted")).toHaveCount(0);

  await statements.getByRole("button", { name: 'Myth: "Rain is new water every time."' }).click();
  await expect(page.getByText("You spotted 2 of 3.")).toBeVisible();
  await page.getByRole("button", { name: "Start again" }).click();
  await expect(statements.getByRole("button", { name: 'Fact: "Clouds are made of smoke."' })).toBeVisible();
});
