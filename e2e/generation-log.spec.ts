import { expect, test } from "@playwright/test";
import { signIn, uniqueEmail } from "./mailbox";

test("operators can see each generation request and its model calls", async ({ page }, testInfo) => {
  const email = `operator-${testInfo.project.name}@example.com`;
  await signIn(page, email);

  await page.goto("/create");
  await page.getByRole("textbox", { name: "Topic" }).fill("Why does it rain?");
  await page.getByRole("button", { name: "Generate lesson" }).click();
  await expect(page).toHaveURL(/\/edit\?generated=1/);

  await page.goto("/account");
  await page.getByRole("link", { name: "Generation log" }).click();
  await expect(page.getByRole("heading", { name: "Generation log" })).toBeVisible();
  await expect(page.getByText("Requests", { exact: true })).toBeVisible();

  const row = page.getByRole("row").filter({ hasText: email }).first();
  await expect(row).toContainText("Sample mode");
  await expect(page.getByRole("columnheader", { name: "Model" })).toBeVisible();
  await row.getByRole("link").click();

  await expect(page.getByText("This request made no model calls.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open the lesson" })).toBeVisible();
});

test("the generation log is only for operators", async ({ page }) => {
  await page.goto("/admin/generations");
  await expect(page.getByText("Sign in to see the generation log.")).toBeVisible();

  await signIn(page, uniqueEmail("not-operator"));
  await page.goto("/admin/generations");
  await expect(page.getByText("Only site operators can see the generation log.")).toBeVisible();
  await page.goto("/account");
  await expect(page.getByRole("link", { name: "Generation log" })).toHaveCount(0);
});
