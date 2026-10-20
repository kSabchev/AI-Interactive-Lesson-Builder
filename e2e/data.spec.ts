import { expect, test } from "@playwright/test";
import { waterCycleLesson } from "../src/content/samples/water-cycle";

test("read the data shows an example chart with its numbers, and explains each answer", async ({ page }) => {
  const lesson = { ...structuredClone(waterCycleLesson), id: "lesson-data-1", ageGroup: "13-14" as const, contentOrigin: "ai-draft" as const, sources: [] };
  lesson.sections = lesson.sections.map((s) => ({ ...s, sourceIds: [] }));
  lesson.quiz = lesson.quiz.map((q) => ({ ...q, sourceIds: [] }));
  const index = lesson.sections.findIndex((s) => s.type === "sorting");
  const sectionId = lesson.sections[index].id;
  lesson.sections[index] = {
    id: sectionId,
    type: "data",
    title: "How fast does a puddle dry?",
    instructions: "A class measured a puddle's depth each hour.",
    chart: "line",
    caption: "Depth of a puddle on a sunny day",
    xLabel: "Time",
    yLabel: "Depth (mm)",
    rows: [
      { label: "9am", value: 20 },
      { label: "10am", value: 14 },
      { label: "11am", value: 9 },
      { label: "12pm", value: 3 },
    ],
    questions: [
      {
        id: "dq-1",
        prompt: "When was the puddle deepest?",
        options: [{ id: "a", text: "9am" }, { id: "b", text: "11am" }, { id: "c", text: "12pm" }],
        correctOptionId: "a",
        explanation: "At 9am it was 20 mm deep.",
      },
      {
        id: "dq-2",
        prompt: "How much did it shrink from 9am to 10am?",
        options: [{ id: "a", text: "6 mm" }, { id: "b", text: "14 mm" }, { id: "c", text: "20 mm" }],
        correctOptionId: "a",
        explanation: "20 mm minus 14 mm is 6 mm.",
      },
    ],
    objectiveIds: [],
    sourceIds: [],
  };
  const stream = [{ type: "start", mode: "live" }, { type: "done", lesson }];
  await page.route("**/api/lessons/generate", (route) =>
    route.fulfill({ contentType: "application/x-ndjson", body: stream.map((e) => JSON.stringify(e)).join("\n") + "\n" }),
  );
  await page.goto("/create");
  // Wait until the form is interactive (the store is ready), so the choice isn't reset by hydration.
  await expect(page.getByRole("button", { name: "Generate lesson" })).toBeEnabled();
  await page.getByLabel("Learner age").selectOption("13-14");
  await expect(page.getByLabel("Learner age")).toHaveValue("13-14");
  await expect(page.getByRole("option", { name: "Ages 13–14 (Years 9–10)" })).toHaveCount(1);
  await page.getByRole("textbox", { name: "Topic" }).fill("Evaporation");
  await page.getByRole("button", { name: "Generate lesson" }).click();
  await expect(page).toHaveURL(/lesson-data-1\/edit/);

  await page.goto(`/lessons/lesson-data-1/present?section=${sectionId}`);
  await expect(page.getByRole("img", { name: "Chart: Depth of a puddle on a sunny day" })).toBeVisible();
  await expect(page.getByText("Example data, made up to practise reading charts.")).toBeVisible();
  await page.getByText("See the numbers").click();
  await expect(page.getByRole("row", { name: "12pm 3" })).toBeVisible();

  await page.getByRole("button", { name: 'Answer "9am" to: When was the puddle deepest?' }).click();
  await expect(page.getByRole("status").first()).toContainText("Right! At 9am it was 20 mm deep.");
  await page.getByRole("button", { name: 'Answer "14 mm" to: How much did it shrink from 9am to 10am?' }).click();
  await expect(page.getByRole("status").nth(1)).toContainText("Not quite. The answer is 6 mm.");
});
