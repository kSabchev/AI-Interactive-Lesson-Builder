import { expect, test } from "@playwright/test";

test("an access code starts a demo account, which can't subscribe or see operator pages", async ({ page }) => {
  await page.goto("/sign-in");
  const demo = page.getByRole("region", { name: "Try the demo" });

  await demo.getByRole("textbox", { name: "Access code" }).fill("not-the-code");
  await demo.getByRole("button", { name: "Start the demo" }).click();
  await expect(demo.getByText("That access code isn't valid.")).toBeVisible();

  await demo.getByRole("textbox", { name: "Access code" }).fill("  E2E-DEMO-CODE ");
  await demo.getByRole("button", { name: "Start the demo" }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Demo account" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in to keep my lessons" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Generation log" })).toHaveCount(0);

  await page.goto("/admin/generations");
  await expect(page.getByText("Only site operators can see the generation log.")).toBeVisible();

  const checkout = await page.request.post("/api/billing/checkout", {
    data: { interval: "month" },
    headers: { origin: new URL(page.url()).origin },
  });
  expect(checkout.status()).toBe(403);
  expect((await checkout.json()).error.code).toBe("demo_account");

  // Signing in properly from here keeps the demo's lessons, and the form says so.
  await page.goto("/sign-in");
  await expect(page.getByText("You're using a demo account.")).toBeVisible();
  await expect(page.getByRole("region", { name: "Try the demo" })).toHaveCount(0);
});
