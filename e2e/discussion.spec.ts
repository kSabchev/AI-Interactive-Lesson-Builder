import { expect, test } from "@playwright/test";
import { waterCycleLesson } from "../src/content/samples/water-cycle";

test("a 25-minute lesson's \"talk about it\" keeps the ideas hidden until the adult shows them", async ({ page }) => {
  const lesson = { ...structuredClone(waterCycleLesson), id: "lesson-talk-1", durationMinutes: 25 as const, contentOrigin: "ai-draft" as const, sources: [] };
  lesson.sections = lesson.sections.map((s) => ({ ...s, sourceIds: [] }));
  lesson.quiz = lesson.quiz.map((q) => ({ ...q, sourceIds: [] }));
  lesson.sections.splice(lesson.sections.length - 1, 0, {
    id: "sec-discussion",
    type: "discussion",
    title: "Let's talk",
    question: "Where does the water in your tap come from?",
    prompts: ["Where did it fall as rain?", "How did it get to your home?"],
    listenFor: ["It fell as rain or snow somewhere else.", "It was collected in rivers or reservoirs."],
    objectiveIds: [],
    sourceIds: [],
  });
  const stream = [{ type: "start", mode: "live" }, { type: "done", lesson }];
  await page.route("**/api/lessons/generate", (route) =>
    route.fulfill({ contentType: "application/x-ndjson", body: stream.map((e) => JSON.stringify(e)).join("\n") + "\n" }),
  );
  await page.goto("/create");
  await page.getByLabel("Lesson length").selectOption("25");
  await page.getByRole("textbox", { name: "Topic" }).fill("The water cycle");
  await page.getByRole("button", { name: "Generate lesson" }).click();
  await expect(page).toHaveURL(/lesson-talk-1\/edit/);

  await page.goto("/lessons/lesson-talk-1/present?section=sec-discussion");
  await expect(page.getByText("Where does the water in your tap come from?")).toBeVisible();
  await expect(page.getByText("How did it get to your home?")).toBeVisible();
  await expect(page.getByText("It was collected in rivers or reservoirs.")).toHaveCount(0);
  await page.getByRole("button", { name: "Show ideas to listen for" }).click();
  await expect(page.getByRole("status")).toContainText("It was collected in rivers or reservoirs.");
  await page.getByRole("button", { name: "Hide the ideas" }).click();
  await expect(page.getByText("It was collected in rivers or reservoirs.")).toHaveCount(0);
});
