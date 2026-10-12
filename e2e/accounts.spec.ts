import { expect, type Page, test } from "@playwright/test";
import { latestLink, signIn, uniqueEmail } from "./mailbox";

async function copySample(page: Page, title: string, newTitle: string) {
  await page.goto("/");
  const card = page.getByRole("listitem").filter({ has: page.getByRole("link", { name: new RegExp(title) }) });
  await card.getByRole("link", { name: "Edit a copy" }).click();
  await page.getByLabel("Lesson title").fill(newTitle);
  await page.getByRole("button", { name: "Save as my copy" }).click();
  await expect(page).toHaveURL(/copied=1/);
}

test("a magic link signs the user in and a used link can't be reused", async ({ page }) => {
  const email = uniqueEmail("signin");
  await signIn(page, email);
  await expect(page).toHaveURL("/");

  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Account" }).click();
  await expect(page.getByText(email)).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Sign in" })).toBeVisible();

  // The link from the first sign-in is single-use.
  await page.goto(await latestLink(email));
  await expect(page.getByText("That sign-in link has expired or was already used.").filter({ visible: true })).toBeVisible();
});

test("lessons saved while signed in are available on another device", async ({ page, browser }) => {
  const email = uniqueEmail("devices");
  await signIn(page, email);
  await copySample(page, "The Solar System", "Planets for Class 3");

  const otherDevice = await browser.newPage();
  await signIn(otherDevice, email);
  const saved = otherDevice.getByRole("region", { name: "Your lessons" });
  await expect(saved.getByRole("link", { name: "Planets for Class 3" })).toBeVisible();
  await expect(saved.getByText("Saved to your account", { exact: false })).toHaveCount(0);
  await otherDevice.close();
});

test("a guest's browser lessons can be moved into their new account", async ({ page }) => {
  await copySample(page, "The Water Cycle", "Rainy Day Lesson");
  await page.getByRole("link", { name: "Library" }).click();
  await expect(page.getByRole("region", { name: "Your lessons" }).getByRole("link", { name: "Rainy Day Lesson" })).toBeVisible();

  await signIn(page, uniqueEmail("import"));
  const banner = page.getByRole("region", { name: "Lessons in this browser" });
  await expect(banner).toContainText("1 lesson is saved in this browser");
  await banner.getByRole("button", { name: "Move to my account" }).click();

  await expect(banner).toBeHidden();
  await expect(page.getByRole("region", { name: "Your lessons" }).getByRole("link", { name: "Rainy Day Lesson" })).toBeVisible();

  // Signing out shows the (now empty) browser library: the lesson lives in the account.
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Account" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByText("Nothing saved yet")).toBeVisible();
});

test("deleting the account removes its lessons", async ({ page }) => {
  const email = uniqueEmail("delete");
  await signIn(page, email);
  await copySample(page, "Photosynthesis", "Leaves at Work");

  await page.goto("/account");
  const remove = page.getByRole("button", { name: "Delete my account" });
  await expect(remove).toBeDisabled();
  await page.getByLabel("Type DELETE to confirm").fill("DELETE");
  await remove.click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Sign in" })).toBeVisible();

  // Signing up again with the same email starts empty.
  await signIn(page, email);
  await expect(page.getByText("Nothing saved yet")).toBeVisible();
});

test("the development mailbox doesn't exist in production", async ({ page }) => {
  const response = await page.goto("/dev/mailbox");
  expect(response?.status()).toBe(404);
});
