import { expect, type Page, test } from "@playwright/test";
import { photosynthesisLesson } from "../src/content/samples/photosynthesis";

async function openCreate(page: Page) {
  await page.goto("/");
  await page.getByRole("link", { name: "Create a lesson" }).click();
  await expect(page.getByRole("heading", { name: "Create a lesson" })).toBeVisible();
}

test("sample mode creates an honestly labelled copy and opens it for review", async ({ page }) => {
  await openCreate(page);
  await expect(page.getByText("Sample mode.")).toBeVisible();

  await page.getByRole("button", { name: "Load example" }).click();
  await expect(page.getByLabel("Topic")).toHaveValue("How magnets work");
  await page.getByLabel("Topic").fill("Why do plants need light?");
  await page.getByRole("button", { name: "Generate lesson" }).click();

  await expect(page).toHaveURL(/\/lessons\/lesson-[\w-]+\/edit\?generated=1/);
  await expect(page.getByText("Sample mode: AI generation is switched off")).toBeVisible();
  await expect(page.getByLabel("Lesson title")).toHaveValue(/Photosynthesis/);

  await page.getByRole("link", { name: "Library" }).click();
  await expect(page.getByRole("region", { name: "Your lessons" }).getByText("Sample copy")).toBeVisible();
});

test("the form explains invalid input without sending a request", async ({ page }) => {
  let requests = 0;
  await page.route("**/api/lessons/generate", (route) => {
    requests++;
    return route.continue();
  });
  await openCreate(page);
  await page.getByLabel("Topic").fill("x");
  await page.getByRole("button", { name: "Generate lesson" }).click();
  const topic = page.getByLabel("Topic");
  await expect(topic).toHaveAttribute("aria-invalid", "true");
  await expect(topic).toHaveAccessibleDescription(/Enter a topic of at least 3 characters\./);
  await expect(topic).toBeFocused();
  expect(requests).toBe(0);
});

test("a failed generation keeps the inputs and offers a retry and a way back to samples", async ({ page }) => {
  await page.route("**/api/lessons/generate", (route) =>
    route.fulfill({
      status: 429,
      contentType: "application/json",
      body: JSON.stringify({ error: { code: "rate_limited", message: "You've reached the limit of 5 AI lessons per hour." } }),
    }),
  );
  await openCreate(page);
  await page.getByLabel("Topic").fill("Volcanoes");
  await page.getByLabel("Reference text (optional)").fill("Volcanoes form where magma reaches the surface.");
  await page.getByRole("button", { name: "Generate lesson" }).click();

  await expect(page.getByText("You've reached the limit of 5 AI lessons per hour.")).toBeVisible();
  await expect(page.getByLabel("Topic")).toHaveValue("Volcanoes");
  await expect(page.getByLabel("Reference text (optional)")).toHaveValue("Volcanoes form where magma reaches the surface.");
  await expect(page.getByRole("button", { name: "Try again" })).toBeEnabled();
  await expect(page.getByRole("link", { name: "Or open a sample lesson" })).toBeVisible();
});

test("live progress shows only the stages the server reports, then opens the AI draft", async ({ page }) => {
  const lesson = { ...structuredClone(photosynthesisLesson), id: "lesson-live-1", contentOrigin: "ai-draft", sources: [] };
  lesson.quiz = lesson.quiz.map((q) => ({ ...q, sourceIds: [] }));
  const stream = [
    { type: "start", mode: "live" },
    { type: "stage", stage: "validate", status: "start" },
    { type: "stage", stage: "validate", status: "done" },
    { type: "stage", stage: "outline", status: "start" },
    { type: "stage", stage: "outline", status: "done" },
    { type: "stage", stage: "content", status: "start" },
    { type: "retry", stage: "content", reason: "The response was not valid JSON." },
    { type: "stage", stage: "content", status: "done" },
    { type: "stage", stage: "quiz", status: "start" },
    { type: "stage", stage: "quiz", status: "done" },
    { type: "stage", stage: "check", status: "start" },
    { type: "stage", stage: "check", status: "done" },
    { type: "done", lesson },
  ];
  await page.route("**/api/lessons/generate", (route) =>
    route.fulfill({ contentType: "application/x-ndjson", body: stream.map((e) => JSON.stringify(e)).join("\n") + "\n" }),
  );

  await openCreate(page);
  await page.getByLabel("Topic").fill("Photosynthesis");
  await page.getByRole("button", { name: "Generate lesson" }).click();

  await expect(page).toHaveURL(/\/lessons\/lesson-live-1\/edit\?generated=1/);
  await expect(page.getByText("AI-generated draft, saved to your library")).toBeVisible();
  await page.getByRole("button", { name: "Lesson details" }).click();
  await expect(page.getByText("AI draft", { exact: true })).toBeVisible();
});
