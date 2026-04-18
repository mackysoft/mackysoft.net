import path from "node:path";
import { fileURLToPath } from "node:url";

import activityData from "../src/generated/activity.json" with { type: "json" };
import { syncReleaseCoverSourceAssets } from "./activity-sync/covers.mjs";
import { activityCoverPublicDir, activityCoverSourceDir, repoRoot } from "./activity-sync/shared.mjs";

export async function generateActivityCoverAssets({
  releases = activityData.releases,
  sourceCoverDir = activityCoverPublicDir,
  outputDir = activityCoverSourceDir,
} = {}) {
  await syncReleaseCoverSourceAssets(releases, {
    sourceCoverDir,
    outputDir,
  });
}

async function main() {
  await generateActivityCoverAssets();
  console.log(
    `Synced localized release cover assets into ${path.relative(repoRoot, activityCoverSourceDir)}.`,
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await main();
}
