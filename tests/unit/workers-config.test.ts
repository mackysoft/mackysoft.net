import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, test } from "vitest";

const siteConfigPath = path.join(process.cwd(), "wrangler.jsonc");
const redirectConfigPath = path.join(process.cwd(), "wrangler.www-redirect.jsonc");

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

describe("workers configuration", () => {
  test("keeps the primary site worker asset-first", async () => {
    const config = await readJson(siteConfigPath);

    expect(config.main).toBeUndefined();
    expect(config.assets).toEqual({
      directory: "./dist",
      not_found_handling: "404-page",
    });
  });

  test("uses a dedicated worker for www redirects", async () => {
    const config = await readJson(redirectConfigPath);

    expect(config.name).toBe("site-www-redirect");
    expect(config.main).toBe("./worker/www-redirect.mjs");
    expect(config.workers_dev).toBe(true);
    expect(config.assets).toBeUndefined();
  });
});
