import { expect, test } from "@playwright/test";
import { waterCycleLesson } from "../src/content/samples/water-cycle";

const PAIRS = [
  ["Evaporation", "Water turns into vapour"],
  ["Condensation", "Vapour cools into clouds"],
  ["Precipitation", "Rain or snow falls"],
] as const;

test("learners match pairs, see what went wrong, and fix only the wrong ones", async ({ page }) => {
  // A generated lesson whose "apply it" activity is match pairs instead of sorting.
  const lesson = { ...structuredClone(waterCycleLesson), id: "lesson-match-1", contentOrigin: "ai-draft" as const, sources: [] };
  lesson.sections = lesson.sections.map((s) => ({ ...s, sourceIds: [] }));
  lesson.quiz = lesson.quiz.map((q) => ({ ...q, sourceIds: [] }));
  const index = lesson.sections.findIndex((s) => s.type === "sorting");
  const sectionId = lesson.sections[index].id;
  lesson.sections[index] = {
    id: sectionId,
    type: "matching",
    title: "Match the stages",
    instructions: "Match each stage with what happens in it.",
    objectiveIds: [],
    sourceIds: [],
    pairs: PAIRS.map(([left, right], i) => ({ id: `pair-${i + 1}`, left, right, explanation: `${left} explained.` })),
  };
  const stream = [{ type: "start", mode: "live" }, { type: "done", lesson }];
  await page.route("**/api/lessons/generate", (route) =>
    route.fulfill({ contentType: "application/x-ndjson", body: stream.map((e) => JSON.stringify(e)).join("\n") + "\n" }),
  );
  await page.goto("/create");
  await page.getByRole("textbox", { name: "Topic" }).fill("The water cycle");
  await page.getByRole("button", { name: "Generate lesson" }).click();
  await expect(page).toHaveURL(/lesson-match-1\/edit/);

  await page.goto(`/lessons/lesson-match-1/present?section=${sectionId}`);
  await expect(page.getByRole("heading", { name: "Match the stages" })).toBeVisible();
  const check = page.getByRole("button", { name: "Check the pairs" });
  await expect(check).toBeDisabled();

  const pick = async (left: string, right: string) => {
    await page.getByRole("button", { name: `Match "${left}"` }).click();
    await page.getByRole("button", { name: `Match with "${right}"` }).click();
  };
  // Swap the last two on purpose.
  await pick("Evaporation", "Water turns into vapour");
  await pick("Condensation", "Rain or snow falls");
  await pick("Precipitation", "Vapour cools into clouds");
  await check.click();
  const status = page.getByRole("status");
  await expect(status.getByText("1 of 3 pairs are right.")).toBeVisible();
  await expect(status.getByText("Condensation explained.", { exact: false })).toBeVisible();

  // "Try again" clears only the wrong pairs.
  await status.getByRole("button", { name: "Try the tricky ones again" }).click();
  await expect(check).toBeDisabled();
  await pick("Condensation", "Vapour cools into clouds");
  await pick("Precipitation", "Rain or snow falls");
  await check.click();
  await expect(page.getByRole("status").getByText("Perfect — every pair is right!")).toBeVisible();
});
