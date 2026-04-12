import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { formatContentDate } from "../../src/lib/content-date";

const activityData = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, "../../src/generated/activity.json"), "utf8"),
) as {
  releases: Array<{
    repo: string;
    version: string;
    description: string;
    license: string;
    url: string;
    publishedAt: string;
    coverAlt: string;
  }>;
};

const latestRelease = activityData.releases[0]!;
const latestReleaseRepoName = latestRelease.repo.split("/").at(-1)!;
const secondLatestRelease = activityData.releases
  .toSorted((left, right) => right.publishedAt.localeCompare(left.publishedAt))[1];

test.describe("assets page", () => {
  test("shows GitHub releases in descending order with asset cards", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/assets/");

    await expect(page.getByText("Home / Assets", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Assets" })).toBeVisible();

    const firstCard = page.locator(".asset-card").first();

    await expect(firstCard).toBeVisible();
    await expect(firstCard.getByRole("link", { name: latestReleaseRepoName, exact: true })).toHaveAttribute("href", latestRelease.url);
    await expect(firstCard.locator(".activity-card__link-layer")).toHaveAttribute("href", latestRelease.url);
    await expect(firstCard.locator(".activity-card__link-layer")).toHaveAttribute("target", "_blank");
    await expect(firstCard.getByRole("img", { name: latestRelease.coverAlt })).toBeVisible();
    await expect(firstCard).toContainText("最新リリース日");
    await expect(firstCard).toContainText(formatContentDate(new Date(latestRelease.publishedAt)));
    await expect(firstCard).toContainText(latestRelease.version);

    if (latestRelease.description) {
      await expect(firstCard).toContainText(latestRelease.description);
    }

    if (latestRelease.license) {
      await expect(firstCard).toContainText(latestRelease.license);
    }

    await expect(firstCard.locator(".asset-card__stars")).toBeVisible();
    await expect(page.locator(".asset-card").filter({ hasText: "Unity-GitHubActions-ExportPackage-Example" })).toHaveCount(0);
    await expect(page.locator(".asset-card").filter({ hasText: "UniData" })).toHaveCount(0);

    if (secondLatestRelease) {
      const secondRepoName = secondLatestRelease.repo.split("/").at(-1)!;
      await expect(page.locator(".asset-card").nth(1).getByRole("link", { name: secondRepoName, exact: true })).toBeVisible();
    }
  });
});
