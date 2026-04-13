import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { repoRoot } from "./activity-sync/shared.mjs";

export const articleSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const defaultJapaneseTitle = "TODO: 記事タイトルを入力";
const defaultJapaneseDescription = "TODO: 記事一覧と OGP 用の概要を入力";

function formatTimezoneOffset(date) {
  const totalMinutes = -date.getTimezoneOffset();
  const sign = totalMinutes >= 0 ? "+" : "-";
  const absoluteMinutes = Math.abs(totalMinutes);
  const hours = String(Math.floor(absoluteMinutes / 60)).padStart(2, "0");
  const minutes = String(absoluteMinutes % 60).padStart(2, "0");
  return `${sign}${hours}:${minutes}`;
}

export function formatIsoDateTime(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${formatTimezoneOffset(date)}`;
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
  title = defaultJapaneseTitle,
  description = defaultJapaneseDescription,
  publishedAt = formatIsoDateTime(),
  draft = true,
} = {}) {
  return `---
title: ${quoteYamlString(title)}
description: ${quoteYamlString(description)}
publishedAt: ${quoteYamlString(publishedAt)}
tags: []
draft: ${draft}
---

本文をここから書きます。
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
    publishedAt = formatIsoDateTime(),
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
