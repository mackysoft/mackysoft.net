import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, test } from "vitest";

import {
  createArticleTemplate,
  formatIsoDateTime,
  isValidArticleSlug,
  parseCreateArticleArgs,
  scaffoldArticle,
} from "../../scripts/create-article.mjs";

async function withTempRepo(run: (tempDir: string) => Promise<void>) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "create-article-"));

  try {
    await run(tempDir);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

describe("create article script", () => {
  test("validates slug format", () => {
    expect(isValidArticleSlug("new-article")).toBe(true);
    expect(isValidArticleSlug("new_article")).toBe(false);
    expect(isValidArticleSlug("New-Article")).toBe(false);
    expect(isValidArticleSlug("trailing-")).toBe(false);
  });

  test("formats ISO datetime with timezone offset", () => {
    const date = new Date("2026-04-14T01:23:45.000Z");
    expect(formatIsoDateTime(date)).toMatch(/^2026-04-14T\d{2}:23:45[+-]\d{2}:\d{2}$/);
  });

  test("creates markdown templates with required frontmatter", () => {
    const template = createArticleTemplate({
      title: "記事タイトル",
      description: "記事概要",
      publishedAt: "2026-04-14T09:00:00+09:00",
    });

    expect(template).toContain('title: "記事タイトル"');
    expect(template).toContain('publishedAt: "2026-04-14T09:00:00+09:00"');
    expect(template).toContain("tags: []");
    expect(template).toContain("draft: true");
    expect(template).not.toContain("updatedAt:");
    expect(template).not.toContain("cover:");
  });

  test("parses only slug and help option", () => {
    expect(parseCreateArticleArgs(["my-article"])).toEqual({
      help: false,
      slug: "my-article",
    });
    expect(parseCreateArticleArgs(["--help"])).toEqual({ help: true });
    expect(() => parseCreateArticleArgs(["my-article", "--en"])).toThrow("不明なオプションです: --en");
  });

  test("scaffolds only index.md", async () => {
    await withTempRepo(async (tempDir) => {
      const contentRoot = path.join(tempDir, "src/content/articles");
      await rm(contentRoot, { recursive: true, force: true });
      await scaffoldArticle({
        slug: "new-article",
        title: "新しい記事",
        description: "概要",
        publishedAt: "2026-04-14T09:00:00+09:00",
      }, { root: tempDir });

      const japanesePath = path.join(contentRoot, "new-article/index.md");

      expect(existsSync(japanesePath)).toBe(true);
      expect(existsSync(path.join(contentRoot, "new-article/index.en.md"))).toBe(false);
      expect(readFileSync(japanesePath, "utf8")).toContain('title: "新しい記事"');
      expect(readFileSync(japanesePath, "utf8")).toContain("tags: []");
      expect(readFileSync(japanesePath, "utf8")).not.toContain("updatedAt:");
    });
  });

  test("rejects invalid slug and existing directories", async () => {
    await withTempRepo(async (tempDir) => {
      const existingDir = path.join(tempDir, "src/content/articles/existing-article");
      await rm(path.join(tempDir, "src"), { recursive: true, force: true });
      await scaffoldArticle({ slug: "existing-article" }, { root: tempDir });

      await expect(scaffoldArticle({ slug: "existing-article" }, { root: tempDir })).rejects.toThrow(
        "記事ディレクトリは既に存在します",
      );
      await expect(scaffoldArticle({ slug: "bad_slug" }, { root: tempDir })).rejects.toThrow(
        "slug は英小文字・数字・ハイフンのみを使ってください。",
      );

      expect(existsSync(existingDir)).toBe(true);
    });
  });
});
