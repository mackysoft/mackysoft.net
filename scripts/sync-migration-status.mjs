import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { repoRoot } from "./activity-sync/shared.mjs";
import { loadTaxonomyMap, stringifyTaxonomyMapYaml, taxonomyMapPath } from "./migration/taxonomy-map.mjs";
import { getReleasedAssetKeys, resolveTaxonomyEntryPath } from "./migration/taxonomy-targets.mjs";
import { loadUrlMap, urlMapPath } from "./migration/url-map.mjs";

const articlesRoot = path.join(repoRoot, "src/content/articles");
const activityDataPath = path.join(repoRoot, "src/generated/activity.json");
const urlMapHeaders = ["legacy_path", "new_path", "content_type", "redirect_kind", "status"];

function csvCell(value) {
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, "\"\"")}"`;
  }
  return stringValue;
}

function toCsv(headers, rows) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvCell(row[header] ?? "")).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function readFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    throw new Error("Markdown file is missing frontmatter.");
  }
  return match[1].replace(/\r\n/g, "\n");
}

function parseArticleRecord(slug, markdown) {
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
    publishedAt: publishedAtMatch[1],
    tags,
  };
}

async function readArticleRecords() {
  const directoryEntries = await readdir(articlesRoot, { withFileTypes: true });
  const articles = [];

  for (const entry of directoryEntries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const markdown = await readFile(path.join(articlesRoot, entry.name, "index.md"), "utf8");
    articles.push(parseArticleRecord(entry.name, markdown));
  }

  return articles.sort((left, right) => left.slug.localeCompare(right.slug));
}

function getPublicArchivePaths(articles) {
  const years = new Set();
  const months = new Set();

  for (const article of articles) {
    const [year, month] = article.publishedAt.split("T")[0].split("-");
    years.add(`/${year}/`);
    months.add(`/${year}/${month}/`);
  }

  return {
    years,
    months,
  };
}

function syncUrlMapRows(rows, { articles, taxonomyEntries }) {
  const articlesBySlug = new Map(articles.map((article) => [article.slug, article]));
  const publicArticles = articles.filter((article) => !article.draft);
  const publicArchivePaths = getPublicArchivePaths(publicArticles);
  const taxonomyByLegacyKey = new Map(
    taxonomyEntries.map((entry) => [`${entry.kind}:${entry.legacyPath}`, entry]),
  );

  return rows.map((row) => {
    if (row.contentType === "article") {
      const slug = row.legacyPath.replace(/^\/|\/$/g, "");
      const article = articlesBySlug.get(slug);
      if (!article) {
        return {
          legacy_path: row.legacyPath,
          new_path: row.newPath,
          content_type: row.contentType,
          redirect_kind: row.redirectKind,
          status: row.status,
        };
      }

      const mapped = !article.draft;
      return {
        legacy_path: row.legacyPath,
        new_path: mapped ? `/articles/${article.slug}/` : "",
        content_type: row.contentType,
        redirect_kind: row.redirectKind,
        status: mapped ? "mapped" : "excluded",
      };
    }

    if (row.contentType === "archive") {
      const mapped = publicArchivePaths.years.has(row.legacyPath) || publicArchivePaths.months.has(row.legacyPath);
      return {
        legacy_path: row.legacyPath,
        new_path: mapped ? `/archive${row.legacyPath}` : "",
        content_type: row.contentType,
        redirect_kind: row.redirectKind,
        status: mapped ? "mapped" : "excluded",
      };
    }

    if (row.contentType === "category" || row.contentType === "tag") {
      const kind = row.contentType === "category" ? "category" : "tag";
      const taxonomyEntry = taxonomyByLegacyKey.get(`${kind}:${row.legacyPath}`);
      if (!taxonomyEntry) {
        return {
          legacy_path: row.legacyPath,
          new_path: row.newPath,
          content_type: row.contentType,
          redirect_kind: row.redirectKind,
          status: row.status,
        };
      }

      return {
        legacy_path: row.legacyPath,
        new_path: taxonomyEntry.newPath,
        content_type: row.contentType,
        redirect_kind: row.redirectKind,
        status: taxonomyEntry.status,
      };
    }

    return {
      legacy_path: row.legacyPath,
      new_path: row.newPath,
      content_type: row.contentType,
      redirect_kind: row.redirectKind,
      status: row.status,
    };
  });
}

function syncTaxonomyEntries(entries, articles, releasedAssetKeys) {
  const publicTags = new Set(
    articles
      .filter((article) => !article.draft)
      .flatMap((article) => article.tags),
  );

  return entries.map((entry) => {
    const newPath = resolveTaxonomyEntryPath(entry, { publicTags, releasedAssetKeys });
    return {
      ...entry,
      newPath,
      status: newPath ? "mapped" : "excluded",
    };
  });
}

export async function syncMigrationStatus() {
  const [articles, urlMapRows, taxonomyEntries, activityDataText] = await Promise.all([
    readArticleRecords(),
    loadUrlMap(),
    loadTaxonomyMap(),
    readFile(activityDataPath, "utf8"),
  ]);
  const releasedAssetKeys = getReleasedAssetKeys(JSON.parse(activityDataText));

  const nextTaxonomyEntries = syncTaxonomyEntries(taxonomyEntries, articles, releasedAssetKeys);
  const nextUrlMapRows = syncUrlMapRows(urlMapRows, {
    articles,
    taxonomyEntries: nextTaxonomyEntries,
  });

  await Promise.all([
    writeFile(urlMapPath, toCsv(urlMapHeaders, nextUrlMapRows), "utf8"),
    writeFile(taxonomyMapPath, stringifyTaxonomyMapYaml(nextTaxonomyEntries), "utf8"),
  ]);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await syncMigrationStatus();
}
