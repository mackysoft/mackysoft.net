import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const articlesRoot = path.join(repoRoot, "src/content/articles");
const urlMapPath = path.join(repoRoot, "docs/migration/url-map.csv");

describe("wordpress import output", () => {
  test("imports all wordpress posts as local markdown articles", () => {
    const articleDirectories = readdirSync(articlesRoot, { withFileTypes: true }).filter((entry) =>
      entry.isDirectory(),
    );

    expect(articleDirectories).toHaveLength(32);

    for (const directory of articleDirectories) {
      const articlePath = path.join(articlesRoot, directory.name, "index.md");
      expect(existsSync(articlePath)).toBe(true);

      const markdown = readFileSync(articlePath, "utf8");
      expect(markdown).not.toContain("mackysoft.net/wp-content/uploads/");
      expect(markdown).not.toContain("wp-block-embed");
      expect(markdown).not.toContain("<iframe");

      const coverMatch = markdown.match(/^cover: "(.+)"$/m);
      if (coverMatch) {
        expect(markdown).toMatch(/^coverAlt: ".+"$/m);
        const localAssetPath = path.join(articlesRoot, directory.name, coverMatch[1].replace(/^\.\//, ""));
        expect(existsSync(localAssetPath)).toBe(true);
      }
    }
  });

  test("records redirect mappings for imported articles and legacy entry points", () => {
    const csv = readFileSync(urlMapPath, "utf8").trim().split("\n").slice(1);
    const rows = csv.map((line) => line.split(","));
    const articleRows = rows.filter((row) => row[2] === "article");
    const redirects = new Map(rows.map(([legacyPath, newPath]) => [legacyPath, newPath]));

    expect(articleRows).toHaveLength(32);
    expect(redirects.get("/blog/")).toBe("/articles/");
    expect(redirects.get("/treasure-rogue/")).toBe("/games/treasure-rogue/");
    expect(redirects.get("/treasure-rogue/privacy-policy/")).toBe("/privacy-policy/");
  });
});
