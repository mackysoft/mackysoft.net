import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { repoRoot } from "./activity-sync/shared.mjs";

export const articleSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const contentTimeZone = "Asia/Tokyo";

function getDateFormatter() {
  return new Intl.DateTimeFormat("ja-JP", {
    calendar: "gregory",
    timeZone: contentTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatDateTimeMinute(date = new Date()) {
  const parts = getDateFormatter().formatToParts(date);
  let year = "";
  let month = "";
  let day = "";
  let hour = "";
  let minute = "";

  for (const part of parts) {
    if (part.type === "year") {
      year = part.value;
    } else if (part.type === "month") {
      month = part.value;
    } else if (part.type === "day") {
      day = part.value;
    } else if (part.type === "hour") {
      hour = part.value;
    } else if (part.type === "minute") {
      minute = part.value;
    }
  }

  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function quoteYamlString(value) {
  return JSON.stringify(value);
}

export function isValidArticleSlug(slug) {
  return articleSlugPattern.test(slug);
}

export function resolveArticlePaths(slug, { root = repoRoot } = {}) {
  const articleDir = path.join(root, "src/content/articles", slug);

  return {
    articleDir,
    indexPath: path.join(articleDir, "index.md"),
  };
}

export function createArticleTemplate({
  title = "Title",
  description = "Description",
  publishedAt = formatDateTimeMinute(),
  draft = true,
} = {}) {
  return `---
title: ${quoteYamlString(title)}
description: ${quoteYamlString(description)}
publishedAt: ${quoteYamlString(publishedAt)}
tags: []
draft: ${draft}
---
`;
}

export function parseCreateArticleArgs(args) {
  let slug = null;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      return { help: true };
    }

    if (arg.startsWith("--")) {
      throw new Error(`不明なオプションです: ${arg}`);
    }

    if (slug) {
      throw new Error("slug は 1 つだけ指定してください。");
    }

    slug = arg;
  }

  if (!slug) {
    throw new Error("slug を指定してください。");
  }

  return {
    help: false,
    slug,
  };
}

export async function scaffoldArticle(options, { root = repoRoot } = {}) {
  const {
    slug,
    title,
    description,
    publishedAt = formatDateTimeMinute(),
  } = options;

  if (!slug) {
    throw new Error("slug を指定してください。");
  }

  if (!isValidArticleSlug(slug)) {
    throw new Error("slug は英小文字・数字・ハイフンのみを使ってください。");
  }

  const paths = resolveArticlePaths(slug, { root });

  if (existsSync(paths.articleDir)) {
    throw new Error(`記事ディレクトリは既に存在します: ${path.relative(root, paths.articleDir)}`);
  }

  await mkdir(path.dirname(paths.articleDir), { recursive: true });
  await mkdir(paths.articleDir, { recursive: false });

  await writeFile(
    paths.indexPath,
    createArticleTemplate({
      title,
      description,
      publishedAt,
    }),
    "utf8",
  );

  return {
    ...paths,
    createdFiles: [paths.indexPath],
  };
}

export function getCreateArticleHelpText() {
  return [
    "Usage:",
    "  npm run new:article -- <slug>",
    "",
    "Options:",
    "  --help, -h          このヘルプを表示します",
  ].join("\n");
}

async function main() {
  const parsed = parseCreateArticleArgs(process.argv.slice(2));

  if (parsed.help) {
    console.log(getCreateArticleHelpText());
    return;
  }

  const result = await scaffoldArticle(parsed);
  const relativeArticleDir = path.relative(repoRoot, result.articleDir);
  const relativeFiles = result.createdFiles.map((filePath) => path.relative(repoRoot, filePath));

  console.log(`Created article scaffold: ${relativeArticleDir}`);

  for (const filePath of relativeFiles) {
    console.log(`- ${filePath}`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    await main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    console.error("");
    console.error(getCreateArticleHelpText());
    process.exitCode = 1;
  }
}
