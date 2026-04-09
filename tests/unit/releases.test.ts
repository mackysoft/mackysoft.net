import { describe, expect, test } from "vitest";

import activityData from "../../src/generated/activity.json";
import { getLatestReleases } from "../../src/lib/articles";

describe("getLatestReleases", () => {
  test("returns the newest checked-in releases in descending order", () => {
    expect(activityData.releases.length).toBeGreaterThanOrEqual(3);

    const latestReleases = getLatestReleases();
    const expected = [...activityData.releases]
      .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
      .slice(0, 3);

    expect(latestReleases).toEqual(expected);
  });
});
