import { expect, test } from "@playwright/test";
import { solarSystemLesson } from "../src/content/samples/solar-system";

test("sections show where their content comes from", async ({ page }) => {
  await page.goto("/lessons/sample-water-cycle/present?section=sec-evaporation");
  const sources = page.getByText(/Where this comes from \(2\)/);
  await sources.click();
  const link = page.getByRole("link", { name: /USGS Water Science School/ });
  await expect(link).toHaveAttribute("href", /usgs\.gov/);
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");
});

test("quiz feedback names the source behind the answer", async ({ page }) => {
  await page.goto("/lessons/sample-water-cycle/quiz");
  await page.getByText("Heat from the Sun", { exact: true }).click();
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(page.getByRole("status").getByRole("link", { name: /USGS Water Science School/ })).toBeVisible();
});

test("a web-researched draft is labelled as such and links the pages it used", async ({ page }) => {
  const lesson = {
    ...structuredClone(solarSystemLesson),
    id: "lesson-web-1",
    contentOrigin: "web-research" as const,
    sources: [
      {
        id: "web-1",
        title: "All About the Planets",
        url: "https://spaceplace.nasa.gov/planets/en/",
        excerpt: "Our solar system is home to eight amazing planets.",
      },
    ],
  };
  lesson.sections = lesson.sections.map((s) => ({ ...s, sourceIds: s.id === "sec-sun-planets" ? ["web-1"] : [] }));
  lesson.quiz = lesson.quiz.map((q) => ({ ...q, sourceIds: ["web-1"] }));

  const stream = [
    { type: "start", mode: "live" },
    { type: "stage", stage: "research", status: "start" },
    { type: "stage", stage: "research", status: "done" },
    { type: "done", lesson },
  ];
  await page.route("**/api/lessons/generate", (route) =>
    route.fulfill({ contentType: "application/x-ndjson", body: stream.map((e) => JSON.stringify(e)).join("\n") + "\n" }),
  );

  await page.goto("/create");
  await page.getByRole("textbox", { name: "Topic" }).fill("The planets");
  await page.getByRole("button", { name: "Generate lesson" }).click();

  await expect(page).toHaveURL(/lesson-web-1\/edit\?generated=1/);
  await expect(page.getByText("Draft researched on the web")).toBeVisible();

  await page.getByRole("button", { name: /3\. A star and its eight planets/ }).click();
  await expect(page.getByRole("main").getByRole("link", { name: /All About the Planets/ })).toBeVisible();

  await page.getByRole("button", { name: "Sources (1)" }).click();
  await expect(page.getByText("Web-researched.")).toBeVisible();
});
