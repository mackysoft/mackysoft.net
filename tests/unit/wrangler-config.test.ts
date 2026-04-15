import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, test } from "vitest";

const wranglerConfigPath = path.join(process.cwd(), "wrangler.jsonc");

describe("wrangler assets routing", () => {
  test("limits run_worker_first to canonical site paths", async () => {
    const config = JSON.parse(await readFile(wranglerConfigPath, "utf8"));
    const runWorkerFirst = config.assets?.run_worker_first;

    expect(Array.isArray(runWorkerFirst)).toBe(true);
    expect(runWorkerFirst).toEqual(expect.arrayContaining([
      "/",
      "/articles/*",
      "/games/*",
      "/assets/*",
      "/archive/*",
      "/tags/*",
      "/en/*",
    ]));
    expect(runWorkerFirst).not.toContain("/treasure-rogue/");
    expect(runWorkerFirst).not.toBe(true);
  });
});
