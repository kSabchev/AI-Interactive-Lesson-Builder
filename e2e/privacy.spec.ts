import { expect, test } from "@playwright/test";

test("the privacy notice is linked from the footer and says who receives what", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Site" }).getByRole("link", { name: "Privacy" }).click();
  await expect(page).toHaveURL("/privacy");
  await expect(page.getByRole("heading", { level: 1, name: "Privacy" })).toBeVisible();
  await expect(page.getByText("Anthropic (Claude) writes the lessons.", { exact: false })).toBeVisible();
  await expect(page.getByText("There are no analytics or advertising cookies.", { exact: false })).toBeVisible();
  await expect(page.getByText("Error reports are deleted after 30 days.", { exact: false })).toBeVisible();
});
