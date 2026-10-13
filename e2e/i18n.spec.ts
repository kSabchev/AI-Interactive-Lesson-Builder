import { expect, test } from "@playwright/test";
import { waterCycleLesson } from "../src/content/samples/water-cycle";

test("the language toggle switches the interface and remembers the choice", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Turn a science topic into an interactive lesson.");

  await page.getByRole("button", { name: "Switch to Bulgarian" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Превърнете научна тема в интерактивен урок.");
  await expect(page.getByRole("link", { name: "Създай", exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "bg");

  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Превърнете научна тема в интерактивен урок.");
  await expect(page).toHaveTitle(/интерактивни уроци/);

  await page.getByRole("button", { name: "Превключи на английски" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Turn a science topic into an interactive lesson.");
});

test.describe("with a Bulgarian browser", () => {
  test.use({ locale: "bg-BG" });

  test("defaults to Bulgarian, and a Bulgarian topic is announced as a Bulgarian lesson", async ({ page }) => {
    await page.goto("/create");
    await expect(page.getByRole("heading", { name: "Създайте урок" })).toBeVisible();

    await page.getByRole("textbox", { name: "Тема" }).fill("Кръговратът на водата");
    await expect(page.getByText("Урокът ще бъде написан на български.")).toBeVisible();
    await page.getByRole("textbox", { name: "Тема" }).fill("The water cycle");
    await expect(page.getByText("Урокът ще бъде написан на английски.")).toBeVisible();

    // Sample mode explains, in Bulgarian, that the closest sample is an English lesson.
    await page.getByRole("textbox", { name: "Тема" }).fill("Кръговратът на водата");
    await page.getByRole("button", { name: "Създай урок" }).click();
    await expect(page).toHaveURL(/\/lessons\/lesson-[\w-]+\/edit\?generated=1/);
    await expect(page.getByText(/Режим с примерни уроци: генерирането с ИИ е изключено на този сайт/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Започни урока" })).toBeVisible();
  });

  test("explains form errors in Bulgarian", async ({ page }) => {
    await page.goto("/create");
    await page.getByRole("textbox", { name: "Тема" }).fill("x");
    await page.getByRole("button", { name: "Създай урок" }).click();
    await expect(page.getByRole("textbox", { name: "Тема" })).toHaveAccessibleDescription(
      /Въведете тема от поне 3 знака\./,
    );
  });
});

test("a Bulgarian lesson shows Bulgarian learner controls inside an English interface", async ({ page }) => {
  // A generated Bulgarian lesson (the content here is the English sample; only its language is set).
  const lesson = { ...structuredClone(waterCycleLesson), id: "lesson-bg-1", language: "bg" as const, contentOrigin: "ai-draft" as const, sources: [] };
  lesson.sections = lesson.sections.map((s) => ({ ...s, sourceIds: [] }));
  lesson.quiz = lesson.quiz.map((q) => ({ ...q, sourceIds: [] }));
  const stream = [{ type: "start", mode: "live" }, { type: "done", lesson }];
  await page.route("**/api/lessons/generate", (route) =>
    route.fulfill({ contentType: "application/x-ndjson", body: stream.map((e) => JSON.stringify(e)).join("\n") + "\n" }),
  );
  await page.goto("/create");
  await page.getByRole("textbox", { name: "Topic" }).fill("Кръговратът на водата");
  await page.getByRole("button", { name: "Generate lesson" }).click();
  await expect(page).toHaveURL(/lesson-bg-1\/edit/);

  await page.getByRole("button", { name: "Start lesson" }).click();
  // The adult's header stays in English; the lesson's own controls are Bulgarian.
  await expect(page.getByRole("link", { name: "Exit" })).toBeVisible();
  await expect(page.getByText("Да се зачудим")).toBeVisible();
  await expect(page.getByRole("button", { name: "Напред" })).toBeVisible();
  await expect(page.locator('[lang="bg"]').first()).toBeVisible();
});
