import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, test } from "vitest";

import {
  buildStaticRedirects,
  resolveRedirectOutputPath,
} from "../../scripts/build-static-redirects.mjs";
import {
  getGeneratedRedirectRows,
  parseUrlMapCsv,
} from "../../scripts/migration/url-map.mjs";

const csvHeader = "legacy_path,new_path,content_type,redirect_kind,status";

async function withTempDir(run: (tempDir: string) => Promise<void>) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "static-redirects-"));

  try {
    await run(tempDir);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

describe("static redirects", () => {
  test("builds redirect pages from mapped rows and skips excluded or self-mapped rows", async () => {
    await withTempDir(async (tempDir) => {
      const csvPath = path.join(tempDir, "url-map.csv");
      const distPath = path.join(tempDir, "dist");

      await writeFile(csvPath, [
        csvHeader,
        "/legacy-article/,/articles/new-article/,article,exact,mapped",
        "/treasure-rogue/,/games/treasure-rogue/,game,exact,mapped",
        "/about/,/about/,page,exact,mapped",
        "/private/,,page,exact,excluded",
      ].join("\n"), "utf8");

      const redirects = await buildStaticRedirects({ csvPath, distPath });

      expect(redirects.map((redirect: { legacyPath: string }) => redirect.legacyPath)).toEqual([
        "/legacy-article/",
        "/treasure-rogue/",
      ]);

      const outputPath = resolveRedirectOutputPath(distPath, "/legacy-article/");
      const html = await readFile(outputPath, "utf8");

      expect(html).toContain('<link rel="canonical" href="https://mackysoft.net/articles/new-article/" />');
      expect(html).toContain('<meta name="robots" content="noindex, nofollow" />');
      expect(html).toContain('<meta http-equiv="refresh" content="0;url=/articles/new-article/" />');
      expect(html).toContain("window.location.search");
      expect(html).toContain("window.location.hash");
      expect(html).toContain('<a href="/articles/new-article/">/articles/new-article/</a>');
      expect(html).not.toContain("data-pagefind-body");

      expect(existsSync(resolveRedirectOutputPath(distPath, "/about/"))).toBe(false);
      expect(existsSync(resolveRedirectOutputPath(distPath, "/private/"))).toBe(false);
    });
  });

  test("rejects CSV files without required headers", () => {
    expect(() => parseUrlMapCsv([
      "legacy_path,new_path,content_type,redirect_kind",
      "/legacy-article/,/articles/new-article/,article,exact",
    ].join("\n"), { source: "test-url-map.csv" })).toThrow('Missing required header "status"');
  });

  test("rejects mapped rows without new_path", () => {
    expect(() => parseUrlMapCsv([
      csvHeader,
      "/legacy-article/,,article,exact,mapped",
    ].join("\n"), { source: "test-url-map.csv" })).toThrow('mapped rows must define "new_path"');
  });

  test("rejects rows whose paths are not site absolute paths", () => {
    expect(() => parseUrlMapCsv([
      csvHeader,
      "legacy-article/,/articles/new-article/,article,exact,mapped",
    ].join("\n"), { source: "test-url-map.csv" })).toThrow('"legacy_path" must be a site absolute path');

    expect(() => parseUrlMapCsv([
      csvHeader,
      "/legacy-article/,/articles/new-article,article,exact,mapped",
    ].join("\n"), { source: "test-url-map.csv" })).toThrow('"new_path" must be a site absolute path');
  });

  test("rejects duplicate legacy paths among redirect generation targets", () => {
    const rows = parseUrlMapCsv([
      csvHeader,
      "/legacy-article/,/articles/new-article/,article,exact,mapped",
      "/legacy-article/,/articles/another-article/,article,exact,mapped",
      "/about/,/about/,page,exact,mapped",
    ].join("\n"), { source: "test-url-map.csv" });

    expect(() => getGeneratedRedirectRows(rows, { source: "test-url-map.csv" })).toThrow(
      'Duplicate legacy_path "/legacy-article/" found in redirect generation targets.',
    );
  });
});
