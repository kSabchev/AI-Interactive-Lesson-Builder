import { expect, test } from "@playwright/test";
import { signIn, uniqueEmail } from "./mailbox";
import { currentUserId, deliverSubscriptionWebhook } from "./stripe";

test("guests see the plans and are asked to sign in to upgrade", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByRole("heading", { name: "Pro" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in to upgrade" })).toBeVisible();

  await page.getByRole("radio", { name: /Yearly/ }).click();
  await expect(page.getByText("$90")).toBeVisible();
});

test("a free account shows its usage, and a Stripe subscription webhook upgrades it to Pro", async ({ page }) => {
  await signIn(page, uniqueEmail("billing"));

  await page.goto("/account");
  const plan = page.getByRole("region", { name: /plan/ });
  await expect(plan.getByRole("heading", { name: "Free plan" })).toBeVisible();
  await expect(plan.getByText("0 of 3 used")).toBeVisible();
  await expect(plan.getByText("0 of 10")).toBeVisible();

  await page.goto("/pricing");
  await expect(page.getByRole("button", { name: "Upgrade to Pro" })).toBeEnabled();

  await deliverSubscriptionWebhook(page.request, await currentUserId(page));

  await page.goto("/account");
  await expect(plan.getByRole("heading", { name: "Pro plan" })).toBeVisible();
  await expect(plan.getByText("0 of 30 used")).toBeVisible();
  await expect(plan.getByText(/Renews on/)).toBeVisible();
  await expect(plan.getByRole("button", { name: "Manage billing" })).toBeVisible();

  await page.goto("/pricing");
  await expect(page.getByRole("button", { name: "Manage billing" })).toBeVisible();
});

test("cancelling the subscription returns the account to Free", async ({ page }) => {
  await signIn(page, uniqueEmail("cancel"));
  const userId = await currentUserId(page);
  await deliverSubscriptionWebhook(page.request, userId);
  await deliverSubscriptionWebhook(page.request, userId, "canceled");

  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Free plan" })).toBeVisible();
});

test("the header links to pricing", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Pricing" }).click();
  await expect(page.getByRole("heading", { name: "Plans" })).toBeVisible();
});
