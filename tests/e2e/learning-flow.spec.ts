import { expect, test } from "@playwright/test";

test("anonymous learner predicts and continues", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "From source file to running process" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /09 Experiment/i }).click();
  await page.getByRole("button", { name: "dependency init" }).click();
  await page.getByRole("button", { name: "Reveal execution trace" }).click();
  await expect(page.getByText("Correct.")).toBeVisible();
});

test("bookmark persists locally", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Bookmark lesson" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Bookmark lesson" })).toHaveClass(/active/);
});
