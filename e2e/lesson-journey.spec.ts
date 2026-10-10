import { expect, test } from "@playwright/test";

test("a visitor can open a sample lesson, do the activities, take the quiz and revisit a missed section", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Where Does the Puddle Go/ }).click();

  // 1. Hook
  await expect(page.getByRole("heading", { name: "The disappearing puddle" })).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();

  // 2. Prediction: unscored, reveals an explanation.
  await page.getByLabel("It turned into an invisible gas and rose into the air").check();
  await page.getByRole("button", { name: "Lock in my prediction" }).click();
  await expect(page.getByText("What really happens")).toBeVisible();

  // 3. Explanation — navigate with the keyboard.
  await page.getByRole("button", { name: "Next" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("heading", { name: /evaporation and condensation/ })).toBeVisible();
  await page.keyboard.press("ArrowRight");

  // 4. Diagram labeling: select a label, then its destination.
  await expect(page.getByRole("heading", { name: "Label the water cycle" })).toBeVisible();
  const placements: [string, RegExp][] = [
    ["Evaporation", /Water rising from the ocean/],
    ["Condensation", /Cloud forming in the sky/],
    ["Precipitation", /Rain falling on the mountains/],
    ["Collection", /River flowing back to the ocean/],
  ];
  for (const [label, target] of placements) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await page.getByRole("button", { name: target }).click();
  }
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByText("every label is in the right place")).toBeVisible();

  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();

  // 6. Sorting: one deliberate mistake gets explained.
  await expect(page.getByRole("heading", { name: "Sort it out" })).toBeVisible();
  const sorts: [string, string][] = [
    ["Wet laundry drying on a sunny washing line", "Evaporation"],
    ["A bathroom mirror fogging up after a hot shower", "Condensation"],
    ["Snowflakes falling on a winter day", "Precipitation"],
    ["Dew drops on the grass on a cool morning", "Precipitation"],
    ["A puddle shrinking in the afternoon sun", "Evaporation"],
    ["Rain pouring down during a thunderstorm", "Precipitation"],
  ];
  for (const [item, category] of sorts) {
    await page.getByRole("button", { name: item }).click();
    await page.getByRole("button", { name: `Put in ${category}` }).click();
  }
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(page.getByText("5 of 6 sorted correctly.")).toBeVisible();
  await expect(page.getByRole("status")).toContainText("belongs in Condensation");

  // 7. Recap, then the quiz.
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { name: "Three big ideas" })).toBeVisible();
  await page.getByRole("link", { name: /Finish lesson and start quiz/ }).click();

  // Quiz: answer 4 correctly and miss question 3.
  const answers = [
    "Heat from the Sun",
    "Billions of tiny water droplets",
    "The cloud gets too hot",
    "Evaporation → condensation → precipitation → collection",
    "Condensation",
  ];
  for (const [i, answer] of answers.entries()) {
    await expect(page.getByText(`Question ${i + 1} of 5`)).toBeVisible();
    await page.getByText(answer, { exact: true }).click();
    await page.getByRole("button", { name: "Submit answer" }).click();
    await expect(page.getByText(i === 2 ? "Not quite." : "Correct!")).toBeVisible();
    // Submitted answers are locked.
    await expect(page.getByRole("radio").first()).toBeDisabled();
    await page.getByRole("button", { name: i === 4 ? /See my results/ : /Next question/ }).click();
  }

  // Results
  await expect(page.getByText("4 / 5")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Concepts to revisit" })).toBeVisible();
  await page.getByRole("link", { name: /Revisit: Back down again/ }).click();
  await expect(page).toHaveURL(/section=sec-rain/);
  await expect(page.getByRole("heading", { name: /precipitation and collection/ })).toBeVisible();
});

test("retrying the quiz starts a fresh attempt", async ({ page }) => {
  await page.goto("/lessons/sample-water-cycle/quiz");
  for (let i = 0; i < 5; i++) {
    await page.locator("fieldset:not([disabled])").getByRole("radio").first().check({ force: true });
    await page.getByRole("button", { name: "Submit answer" }).click();
    await page.getByRole("button", { name: i === 4 ? /See my results/ : /Next question/ }).click();
  }
  await expect(page.getByText("Your score")).toBeVisible();
  await page.getByRole("button", { name: "Retry quiz" }).click();
  await expect(page.getByText("Question 1 of 5")).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit answer" })).toBeDisabled();
});

test("unknown lessons show a path back to the library", async ({ page }) => {
  await page.goto("/lessons/does-not-exist/present");
  await expect(page.getByRole("heading", { name: /couldn't find that lesson/ })).toBeVisible();
  await page.getByRole("link", { name: "Back to the library" }).click();
  await expect(page.getByRole("heading", { name: "Try a sample lesson" })).toBeVisible();
});
