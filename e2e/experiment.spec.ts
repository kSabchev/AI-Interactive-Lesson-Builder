import { expect, test } from "@playwright/test";
import { waterCycleLesson } from "../src/content/samples/water-cycle";

test("an experiment shows safety first, then predict, then reveals what happened and why; the editor lists one item per line", async ({ page }) => {
  const lesson = { ...structuredClone(waterCycleLesson), id: "lesson-exp-1", contentOrigin: "ai-draft" as const, sources: [] };
  lesson.sections = lesson.sections.map((s) => ({ ...s, sourceIds: [] }));
  lesson.quiz = lesson.quiz.map((q) => ({ ...q, sourceIds: [] }));
  const index = lesson.sections.findIndex((s) => s.type === "diagram-labeling");
  const sectionId = lesson.sections[index].id;
  lesson.sections[index] = {
    id: sectionId,
    type: "experiment",
    title: "Make a mini cloud",
    question: "What will appear on the cold lid?",
    materials: ["A clear jar", "Warm tap water", "A metal lid", "Ice cubes"],
    steps: ["Pour warm water into the jar.", "Put the lid on upside down.", "Put ice cubes on the lid."],
    observe: "Tiny droplets form under the lid.",
    explanation: "Warm vapour cools on the cold lid and turns back into water, like a cloud.",
    safety: "Use warm tap water, never hot water, and wipe up spills.",
    objectiveIds: [],
    sourceIds: [],
  };
  const stream = [{ type: "start", mode: "live" }, { type: "done", lesson }];
  await page.route("**/api/lessons/generate", (route) =>
    route.fulfill({ contentType: "application/x-ndjson", body: stream.map((e) => JSON.stringify(e)).join("\n") + "\n" }),
  );
  await page.goto("/create");
  await page.getByRole("textbox", { name: "Topic" }).fill("The water cycle");
  await page.getByRole("button", { name: "Generate lesson" }).click();
  await expect(page).toHaveURL(/lesson-exp-1\/edit/);

  await page.getByRole("button", { name: /Make a mini cloud/ }).click();
  await expect(page.getByRole("textbox", { name: "Materials (one per line)" })).toHaveValue(
    "A clear jar\nWarm tap water\nA metal lid\nIce cubes",
  );

  await page.goto(`/lessons/lesson-exp-1/present?section=${sectionId}`);
  await expect(page.getByRole("complementary", { name: "Safety first" })).toContainText("never hot water");
  await expect(page.getByRole("heading", { name: "You need" })).toBeVisible();
  await expect(page.getByText("Put ice cubes on the lid.")).toBeVisible();
  await expect(page.getByText("What will appear on the cold lid?")).toBeVisible();
  await expect(page.getByText("Warm vapour cools on the cold lid")).toHaveCount(0);

  await page.getByRole("button", { name: "Show what happened" }).click();
  await expect(page.getByRole("status")).toContainText("Tiny droplets form under the lid.");
  await expect(page.getByRole("status")).toContainText("Warm vapour cools on the cold lid");
});
