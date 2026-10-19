import { expect, type Page, test } from "@playwright/test";
import { waterCycleLesson } from "../src/content/samples/water-cycle";

const STEPS = ["The Sun warms the sea", "Water vapour rises", "Vapour cools into clouds", "Rain falls back down"];

/** A generated lesson whose activity is "put in order", served by a mocked generation request. */
async function generateSequenceLesson(page: Page) {
  const lesson = { ...structuredClone(waterCycleLesson), id: "lesson-seq-1", contentOrigin: "ai-draft" as const, sources: [] };
  lesson.sections = lesson.sections.map((s) => ({ ...s, sourceIds: [] }));
  lesson.quiz = lesson.quiz.map((q) => ({ ...q, sourceIds: [] }));
  const index = lesson.sections.findIndex((s) => s.type === "diagram-labeling");
  lesson.sections[index] = {
    id: lesson.sections[index].id,
    type: "sequence",
    title: "Order the water cycle",
    instructions: "Put the steps of the water cycle in order.",
    objectiveIds: [],
    sourceIds: [],
    steps: STEPS.map((text, i) => ({ id: `step-${i + 1}`, text, explanation: `Step ${i + 1} explained.` })),
  };
  const stream = [{ type: "start", mode: "live" }, { type: "done", lesson }];
  await page.route("**/api/lessons/generate", (route) =>
    route.fulfill({ contentType: "application/x-ndjson", body: stream.map((e) => JSON.stringify(e)).join("\n") + "\n" }),
  );
  await page.goto("/create");
  await page.getByRole("textbox", { name: "Topic" }).fill("The water cycle");
  await page.getByRole("button", { name: "Generate lesson" }).click();
  await expect(page).toHaveURL(/lesson-seq-1\/edit/);
  return lesson.sections[index].id;
}

test("learners put shuffled steps in order with the move buttons, with feedback on misplaced ones", async ({ page }) => {
  const sectionId = await generateSequenceLesson(page);
  await page.goto(`/lessons/lesson-seq-1/present?section=${sectionId}`);
  await expect(page.getByRole("heading", { name: "Order the water cycle" })).toBeVisible();

  const list = page.getByRole("list", { name: "Steps" });
  const items = list.getByRole("listitem");
  const currentOrder = async () =>
    (await items.allTextContents()).map((text) => STEPS.find((step) => text.includes(step))!);

  // Starts shuffled; checking now explains what's out of place.
  expect(await currentOrder()).not.toEqual(STEPS);
  await page.getByRole("button", { name: "Check the order" }).click();
  await expect(page.getByRole("status").getByText(/of 4 steps are in the right place/)).toBeVisible();
  await expect(page.getByRole("status").getByText(/belongs at step \d\. Step \d explained\./).first()).toBeVisible();

  // Fix it one step at a time using only "Move up".
  for (let target = 0; target < STEPS.length; target++) {
    let position = (await currentOrder()).indexOf(STEPS[target]);
    while (position > target) {
      await page.getByRole("button", { name: `Move "${STEPS[target]}" up` }).click();
      position--;
    }
  }
  expect(await currentOrder()).toEqual(STEPS);
  await expect(page.getByRole("button", { name: `Move "${STEPS[0]}" up` })).toBeDisabled();

  await page.getByRole("button", { name: "Check the order" }).click();
  await expect(page.getByRole("status").getByText("Spot on — every step is in the right place!")).toBeVisible();

  await page.getByRole("button", { name: "Shuffle again" }).click();
  expect(await currentOrder()).not.toEqual(STEPS);
});

test("the editor lists the steps in their correct order and can reorder them", async ({ page }) => {
  await generateSequenceLesson(page);
  await page.getByRole("button", { name: /Order the water cycle/ }).click();
  const stepFields = page.getByRole("textbox", { name: "Step", exact: true });
  await expect(stepFields).toHaveCount(4);
  await expect(stepFields.first()).toHaveValue(STEPS[0]);

  await page.getByRole("button", { name: "Move step 2 up" }).click();
  await expect(stepFields.first()).toHaveValue(STEPS[1]);
});
