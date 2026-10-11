import { expect, type Page, test } from "@playwright/test";

async function copySample(page: Page, sampleTitle: RegExp) {
  await page.goto("/");
  const card = page.getByRole("listitem").filter({ has: page.getByRole("link", { name: sampleTitle }) });
  await card.getByRole("link", { name: "Edit a copy" }).click();
  await expect(page.getByText("This is a curated sample")).toBeVisible();
}

test("editing a sample saves a copy that survives a refresh and shows in the library", async ({ page }) => {
  await copySample(page, /The Water Cycle/);

  await page.getByLabel("Lesson title").fill("Puddles and Clouds (Class 4B)");
  await expect(page.getByRole("status").filter({ hasText: "Unsaved changes" })).toBeVisible();
  await page.getByRole("button", { name: "Save as my copy" }).click();

  await expect(page).toHaveURL(/\/lessons\/lesson-[\w-]+\/edit\?copied=1/);
  await expect(page.getByText("Saved a copy to your library")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Lesson title")).toHaveValue("Puddles and Clouds (Class 4B)");

  await page.getByRole("link", { name: "Library" }).click();
  const saved = page.getByRole("region", { name: "Your lessons" });
  await expect(saved.getByRole("link", { name: "Puddles and Clouds (Class 4B)" })).toBeVisible();
  await expect(saved.getByText("Sample copy")).toBeVisible();
  // The sample itself is untouched.
  await expect(page.getByRole("region", { name: "Try a sample lesson" }).getByRole("link", { name: /Where Does the Puddle Go/ })).toBeVisible();
});

test("section edits appear in the presentation and the preview", async ({ page }) => {
  await copySample(page, /The Solar System/);

  await page.getByRole("button", { name: /1\. The travelling Sun/ }).click();
  await page.getByLabel("Big question").fill("Does the Sun really move across the sky?");
  await expect(page.getByRole("complementary", { name: "Section preview" })).toContainText(
    "Does the Sun really move across the sky?",
  );

  await page.getByRole("button", { name: /Start lesson/ }).click();
  await expect(page).toHaveURL(/\/lessons\/lesson-[\w-]+\/present/);
  await expect(page.getByRole("main").getByText("Does the Sun really move across the sky?")).toBeVisible();

  // The edits were saved as a copy, which is in the library after going back.
  await page.goBack();
  await expect(page.getByRole("region", { name: "Your lessons" }).getByRole("link", { name: /The Solar System/ })).toBeVisible();
});

test("invalid edits are explained, linked to the field, and block saving until fixed", async ({ page }) => {
  await copySample(page, /Photosynthesis/);

  await page.getByRole("button", { name: /^Q1\./ }).click();
  await page.getByLabel("Option A").fill("");
  await page.getByRole("button", { name: "Lesson details" }).click();
  await page.getByRole("button", { name: "Save as my copy" }).click();

  const issues = page.getByRole("region", { name: /Fix 1 problem/ });
  await expect(issues).toContainText("Quiz question 1 · Options 1 · Text: This can't be empty.");
  await expect(page).toHaveURL(/sample-photosynthesis\/edit/);

  await issues.getByRole("button").click();
  await page.getByLabel("Option A").fill("Oxygen");
  await expect(issues).toBeHidden();
  await page.getByRole("button", { name: "Save as my copy" }).click();
  await expect(page).toHaveURL(/copied=1/);
});

test("the latest quiz attempt is saved and can be reopened from the library", async ({ page }) => {
  await page.goto("/lessons/sample-water-cycle/quiz");
  for (let i = 0; i < 5; i++) {
    await page.locator("fieldset:not([disabled])").getByRole("radio").nth(1).check({ force: true });
    await page.getByRole("button", { name: "Submit answer" }).click();
    await page.getByRole("button", { name: i === 4 ? /See my results/ : /Next question/ }).click();
  }
  const score = (await page.locator("p.text-7xl").innerText()).replace(/\s+/g, "");

  await page.getByRole("link", { name: "Return to library" }).click();
  await expect(page.getByRole("heading", { name: "Your lessons" })).toBeVisible();
  await page.reload();
  const lastQuiz = page.getByRole("link", { name: /Last quiz:/ });
  await expect(lastQuiz).toHaveText(`Last quiz: ${score}`);

  await lastQuiz.click();
  await expect(page.getByText("Your score")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Answer review" })).toBeVisible();
});

test("a saved lesson can be deleted after confirming", async ({ page }) => {
  await copySample(page, /The Water Cycle/);
  await page.getByRole("button", { name: "Save as my copy" }).click();
  await expect(page).toHaveURL(/copied=1/);
  await page.getByRole("link", { name: "Library" }).click();

  const saved = page.getByRole("region", { name: "Your lessons" });
  await saved.getByRole("button", { name: "Delete" }).click();
  await saved.getByRole("button", { name: "Delete for good" }).click();
  await expect(saved.getByText("Nothing saved yet")).toBeVisible();
});
