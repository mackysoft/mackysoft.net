import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

import { parseUrlMapCsv } from "../../scripts/migration/url-map.mjs";
import { assetsPagePath, getReleasedAssetKeys, resolveTaxonomyEntryPath } from "../../scripts/migration/taxonomy-targets.mjs";
import { getContentYear, getContentYearMonth, parseContentDateInput } from "../../src/lib/content-date";

type ArticleRecord = {
  slug: string;
  draft: boolean;
  publishedAt: Date;
  tags: string[];
};

type TaxonomySection = "categories" | "tags";
type TaxonomyKind = "category" | "tag";
type TaxonomyMapEntry = {
  kind: TaxonomyKind;
  legacyPath: string;
  legacySlug: string;
  legacyName: string;
  newTag: string;
  newPath: string;
  status: "mapped" | "excluded";
  notes: string;
};
type TaxonomyMapDraftEntry = {
  legacyPath?: string;
  legacySlug?: string;
  legacyName?: string;
  newTag?: string;
  newPath?: string;
  status?: string;
  notes?: string;
};

const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const articlesRoot = path.join(repoRoot, "src/content/articles");
const gamesRoot = path.join(repoRoot, "src/content/games");
const urlMapPath = path.join(repoRoot, "docs/migration/url-map.csv");
const taxonomyMapPath = path.join(repoRoot, "docs/migration/taxonomy-map.yaml");
const activityDataPath = path.join(repoRoot, "src/generated/activity.json");

function readFrontmatter(markdown: string) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (!match) {
    throw new Error("Markdown file is missing frontmatter.");
  }

  return match[1].replace(/\r\n/g, "\n");
}

function parseArticleRecord(slug: string): ArticleRecord {
  const markdown = readFileSync(path.join(articlesRoot, slug, "index.md"), "utf8");
  const frontmatter = readFrontmatter(markdown);
  const publishedAtMatch = frontmatter.match(/^publishedAt:\s*"([^"]+)"$/m);

  if (!publishedAtMatch) {
    throw new Error(`Article "${slug}" is missing publishedAt.`);
  }

  const tagsBlock = frontmatter.match(/^tags:\n((?:  - .+\n?)*)/m)?.[1] ?? "";
  const tags = tagsBlock
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const tagMatch = line.match(/^\s*-\s+"?(.*?)"?$/);

      if (!tagMatch) {
        throw new Error(`Article "${slug}" contains an unsupported tag line: ${line}`);
      }

      return tagMatch[1];
    });

  return {
    slug,
    draft: /^draft:\s*true$/m.test(frontmatter),
    publishedAt: parseContentDateInput(publishedAtMatch[1]) ?? new Date(publishedAtMatch[1]),
    tags,
  };
}

function readArticleRecords() {
  return readdirSync(articlesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => parseArticleRecord(entry.name))
    .sort((left, right) => left.slug.localeCompare(right.slug));
}

function readGameRoutes() {
  return new Set(
    readdirSync(gamesRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => `/games/${entry.name}/`),
  );
}

function parseTaxonomyMap(yamlText: string) {
  const entries: TaxonomyMapEntry[] = [];
  const lines = yamlText.split(/\r?\n/);
  let section: TaxonomySection | null = null;
  let current: TaxonomyMapDraftEntry | null = null;

  function commitCurrent() {
    if (!current || !section) {
      return;
    }

    if (current.status && current.status !== "mapped" && current.status !== "excluded") {
      throw new Error(`Unsupported taxonomy status: ${current.status}`);
    }

    const status = current.status === "mapped" ? "mapped" : "excluded";

    entries.push({
      kind: section === "categories" ? "category" : "tag",
      legacyPath: current.legacyPath ?? "",
      legacySlug: current.legacySlug ?? "",
      legacyName: current.legacyName ?? "",
      newTag: current.newTag ?? "",
      newPath: current.newPath ?? "",
      status,
      notes: current.notes ?? "",
    });
  }

  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }

    const sectionMatch = line.match(/^(categories|tags):$/);

    if (sectionMatch) {
      commitCurrent();
      section = sectionMatch[1] as TaxonomySection;
      current = null;
      continue;
    }

    const itemMatch = line.match(/^  - ([a-z_]+): "(.*)"$/);

    if (itemMatch) {
      commitCurrent();
      current = {};
      const [, key, value] = itemMatch;

      current[camelizeTaxonomyKey(key)] = value;
      continue;
    }

    const fieldMatch = line.match(/^    ([a-z_]+): "(.*)"$/);

    if (fieldMatch && current) {
      const [, key, value] = fieldMatch;
      current[camelizeTaxonomyKey(key)] = value;
      continue;
    }

    throw new Error(`Unsupported taxonomy-map.yaml line: ${line}`);
  }

  commitCurrent();
  return entries;
}

function camelizeTaxonomyKey(key: string) {
  return key.replace(/_([a-z])/g, (_, character: string) => character.toUpperCase()) as keyof TaxonomyMapDraftEntry;
}

function toYearLegacyPath(date: Date) {
  return `/${getContentYear(date)}/`;
}

function toMonthLegacyPath(date: Date) {
  const { year, month } = getContentYearMonth(date);
  return `/${year}/${month}/`;
}

function toSortedValues(values: Iterable<string>) {
  return Array.from(values).sort((left, right) => left.localeCompare(right, "ja"));
}

function getPublicTagRoutes(articles: ArticleRecord[]) {
  return new Set(
    articles
      .filter((article) => !article.draft)
      .flatMap((article) => article.tags)
      .map((tag) => `/tags/${tag}/`),
  );
}

const articles = readArticleRecords();
const publicArticles = articles.filter((article) => !article.draft);
const urlMapRows = parseUrlMapCsv(readFileSync(urlMapPath, "utf8"), { source: urlMapPath });
const taxonomyMapEntries = parseTaxonomyMap(readFileSync(taxonomyMapPath, "utf8"));
const releasedAssetKeys = getReleasedAssetKeys(JSON.parse(readFileSync(activityDataPath, "utf8")));

describe("migration contract", () => {
  test("keeps article redirects aligned with current local articles", () => {
    const articleRows = urlMapRows.filter((row) => row.contentType === "article");
    const rowsByLegacyPath = new Map(articleRows.map((row) => [row.legacyPath, row]));

    expect(toSortedValues(rowsByLegacyPath.keys())).toEqual(
      articles.map((article) => `/${article.slug}/`),
    );

    for (const article of articles) {
      const legacyPath = `/${article.slug}/`;
      const row = rowsByLegacyPath.get(legacyPath);

      expect(row, `Missing url-map row for article ${legacyPath}`).toBeDefined();
      expect(row?.redirectKind).toBe("exact");

      if (article.draft) {
        expect(row?.status).toBe("excluded");
        expect(row?.newPath).toBe("");
        continue;
      }

      expect(row?.status).toBe("mapped");
      expect(row?.newPath).toBe(`/articles/${article.slug}/`);
    }
  });

  test("keeps archive redirects aligned with public article dates", () => {
    const archiveRows = urlMapRows.filter((row) => row.contentType === "archive");
    const rowsByLegacyPath = new Map(archiveRows.map((row) => [row.legacyPath, row]));
    const allArchivePaths = new Set([
      ...articles.map((article) => toYearLegacyPath(article.publishedAt)),
      ...articles.map((article) => toMonthLegacyPath(article.publishedAt)),
    ]);
    const mappedArchivePaths = new Set([
      ...publicArticles.map((article) => toYearLegacyPath(article.publishedAt)),
      ...publicArticles.map((article) => toMonthLegacyPath(article.publishedAt)),
    ]);

    expect(toSortedValues(rowsByLegacyPath.keys())).toEqual(toSortedValues(allArchivePaths));

    for (const legacyPath of toSortedValues(allArchivePaths)) {
      const row = rowsByLegacyPath.get(legacyPath);
      const shouldBeMapped = mappedArchivePaths.has(legacyPath);

      expect(row, `Missing url-map row for archive ${legacyPath}`).toBeDefined();
      expect(row?.redirectKind).toBe("archive");
      expect(row?.status).toBe(shouldBeMapped ? "mapped" : "excluded");
      expect(row?.newPath).toBe(shouldBeMapped ? `/archive${legacyPath}` : "");
    }
  });

  test("maps games, pages, and taxonomy redirects to current routes", () => {
    const gameRoutes = readGameRoutes();
    const pageRoutes = new Set([
      "/about/",
      "/assets/",
      "/articles/",
      "/games/",
      "/privacy-policy/",
    ]);
    const publicTagRoutes = getPublicTagRoutes(articles);
    const gameRows = urlMapRows.filter((row) => row.contentType === "game");
    const pageRows = urlMapRows.filter((row) => row.contentType === "page");
    const taxonomyRows = urlMapRows.filter((row) => row.contentType === "category" || row.contentType === "tag");
    const taxonomyEntriesByKey = new Map(
      taxonomyMapEntries.map((entry) => [`${entry.kind}:${entry.legacyPath}`, entry]),
    );

    for (const row of gameRows) {
      expect(row.status).toBe("mapped");
      expect(row.redirectKind).toBe("exact");
      expect(gameRoutes.has(row.newPath)).toBe(true);
    }

    for (const row of pageRows) {
      expect(row.status).toBe("mapped");
      expect(row.redirectKind).toBe("exact");
      expect(pageRoutes.has(row.newPath)).toBe(true);
    }

    for (const row of taxonomyRows) {
      expect(row.redirectKind).toBe("taxonomy");

      if (row.status === "excluded") {
        expect(row.newPath).toBe("");
        continue;
      }

      const kind = row.contentType === "category" ? "category" : "tag";
      const taxonomyEntry = taxonomyEntriesByKey.get(`${kind}:${row.legacyPath}`);

      expect(taxonomyEntry, `Missing taxonomy entry for ${row.legacyPath}`).toBeDefined();

      const expectedPath = resolveTaxonomyEntryPath(taxonomyEntry, {
        publicTags: new Set(publicArticles.flatMap((article) => article.tags)),
        releasedAssetKeys,
      });

      expect(row.newPath).toBe(expectedPath);

      if (row.newPath === assetsPagePath) {
        expect(pageRoutes.has(row.newPath)).toBe(true);
        continue;
      }

      expect(publicTagRoutes.has(row.newPath)).toBe(true);
    }
  });

  test("keeps taxonomy-map.yaml aligned with url-map.csv and current tags", () => {
    const publicTags = new Set(
      publicArticles.flatMap((article) => article.tags),
    );
    const urlMapTaxonomyRows = urlMapRows
      .filter((row) => row.contentType === "category" || row.contentType === "tag");
    const rowsByKey = new Map(
      urlMapTaxonomyRows.map((row) => [`${row.contentType}:${row.legacyPath}`, row]),
    );
    const entryKeys = taxonomyMapEntries.map((entry) => `${entry.kind}:${entry.legacyPath}`);

    expect(toSortedValues(rowsByKey.keys())).toEqual(toSortedValues(entryKeys));

    for (const entry of taxonomyMapEntries) {
      const row = rowsByKey.get(`${entry.kind}:${entry.legacyPath}`);

      expect(row, `Missing url-map row for ${entry.kind} ${entry.legacyPath}`).toBeDefined();
      expect(row?.status).toBe(entry.status);
      expect(row?.newPath).toBe(entry.newPath);

      if (entry.status === "excluded") {
        expect(entry.newPath).toBe("");
        continue;
      }

      const expectedPath = resolveTaxonomyEntryPath(entry, {
        publicTags,
        releasedAssetKeys,
      });

      expect(entry.newPath).toBe(expectedPath);

      if (entry.newPath === assetsPagePath) {
        continue;
      }

      expect(publicTags.has(entry.newTag)).toBe(true);
    }
  });
});
