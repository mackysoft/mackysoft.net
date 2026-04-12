import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as pagefind from "pagefind";

import { repoRoot } from "./activity-sync/shared.mjs";
import {
  createExternalArticleSearchRecords,
  createReleaseSearchRecords,
} from "./search-index/records.mjs";

const distPath = path.join(repoRoot, "dist");
const activityPath = path.join(repoRoot, "src/generated/activity.json");
const pagefindOutputPath = path.join(distPath, "pagefind");

async function readActivityData() {
  const activityJson = await readFile(activityPath, "utf8");
  return JSON.parse(activityJson);
}

function formatErrors(errors = []) {
  return errors.map((error) => `- ${error}`).join("\n");
}

export async function buildSearchIndex({ fetchImpl = fetch } = {}) {
  await rm(pagefindOutputPath, { recursive: true, force: true });

  const { index } = await pagefind.createIndex();
  const addDirectoryResult = await index.addDirectory({ path: distPath });

  if (addDirectoryResult.errors?.length) {
    throw new Error(`Failed to index static HTML.\n${formatErrors(addDirectoryResult.errors)}`);
  }

  const activity = await readActivityData();
  const externalArticleRecords = await createExternalArticleSearchRecords(activity.articles, fetchImpl);
  const releaseRecords = await createReleaseSearchRecords(activity.releases, fetchImpl);

  for (const record of [...externalArticleRecords, ...releaseRecords]) {
    const result = await index.addCustomRecord(record);

    if (result.errors?.length) {
      console.warn(`Failed to add search record for ${record.url}.\n${formatErrors(result.errors)}`);
    }
  }

  const writeFilesResult = await index.writeFiles({ outputPath: pagefindOutputPath });

  if (writeFilesResult.errors?.length) {
    throw new Error(`Failed to write Pagefind files.\n${formatErrors(writeFilesResult.errors)}`);
  }

  await index.deleteIndex();
  await pagefind.close();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await buildSearchIndex();
}
