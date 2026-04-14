import { describe, expect, test } from "vitest";

import {
  articleTitleCompactMaxLines,
  articleTitleCondensedFontSize,
  articleTitleFontSize,
  articleTitleMaxLines,
  articleTitleMaxWidth,
  calculateArticleTitleLayout,
} from "../../src/features/site/og-image.mjs";
import {
  articleTitleCardImageHeight,
  articleTitleCardImageWidth,
  resolveLocalArticleCardImage,
  resolveLocalArticleSocialImage,
} from "../../src/features/site/social-image";

describe("social image helpers", () => {
  test("keeps a short Japanese article title readable without breaking embedded English words", () => {
    const title = "【Unity】HasComponent関数【拡張メソッド】";
    const layout = calculateArticleTitleLayout(title, "ja");

    expect(layout.lines.join("")).toBe(title);
    expect(layout.lines.length).toBeLessThanOrEqual(articleTitleCompactMaxLines);
    expect(layout.lines.some((line: string) => line.includes("HasComponent"))).toBe(true);
    expect(layout.fontSize).toBe(articleTitleFontSize);
  });

  test("keeps the base font size for long Japanese titles that already fit naturally", () => {
    const title = "【つくるUOZU】和尚さんのメンタリング整理【BOOT CAMP 2020 その1】";
    const layout = calculateArticleTitleLayout(title, "ja");

    expect(layout.lines.join("")).toBe(title);
    expect(layout.lines.length).toBeLessThanOrEqual(articleTitleCompactMaxLines);
    expect(layout.fontSize).toBe(articleTitleFontSize);
  });

  test("wraps Japanese titles automatically within the available width", () => {
    const title = "ゲームデザインにコントラストを取り入れるための実践メモ";
    const layout = calculateArticleTitleLayout(title, "ja", {
      maxWidth: articleTitleMaxWidth,
    });

    expect(layout.lines.join("")).toBe(title);
    expect(layout.lines.length).toBeGreaterThan(1);
    expect(layout.lines.length).toBeLessThanOrEqual(articleTitleCompactMaxLines);
    expect(layout.fontSize).toBe(articleTitleFontSize);
  });

  test("shrinks Japanese titles that would otherwise exceed the compact three-line layout", () => {
    const title = "ゲームデザインにコントラストを取り入れるための実践メモをさらに詳しくまとめた補足記事の追補版と実例集その二改訂版";
    const layout = calculateArticleTitleLayout(title, "ja", {
      maxWidth: articleTitleMaxWidth,
    });

    expect(layout.lines.join("")).toBe(title);
    expect(layout.lines.length).toBeLessThanOrEqual(articleTitleMaxLines);
    expect(layout.fontSize).toBeLessThan(articleTitleFontSize);
    expect(layout.fontSize).toBeGreaterThanOrEqual(articleTitleCondensedFontSize);
  });

  test("shrinks long English titles until they fit within four lines", () => {
    const title =
      "Supplementary Notes on 'A Released Bad Game Is More Valuable Than an Unreleased Masterpiece' for Developers Who Want to Actually Finish and Ship";
    const layout = calculateArticleTitleLayout(title, "en", {
      maxWidth: articleTitleMaxWidth,
    });

    expect(layout.lines.join(" ")).toBe(title);
    expect(layout.lines.length).toBeLessThanOrEqual(articleTitleMaxLines);
    expect(layout.lines.length).toBeGreaterThan(articleTitleCompactMaxLines);
    expect(layout.fontSize).toBeLessThan(articleTitleFontSize);
    expect(layout.fontSize).toBeGreaterThanOrEqual(articleTitleCondensedFontSize);
  });

  test("wraps English titles on word boundaries before falling back to character wrapping", () => {
    const title = "How to Implement a Turn-Based Game Loop in C Sharp";
    const layout = calculateArticleTitleLayout(title, "en", {
      maxWidth: 560,
    });

    expect(layout.lines.length).toBeGreaterThan(1);
    expect(layout.lines.join(" ")).toBe(title);
    expect(layout.lines.every((line: string) => line === line.trim())).toBe(true);
  });

  test("resolves article images from the content locale and keeps authored covers", () => {
    expect(resolveLocalArticleSocialImage({
      slug: "hascomponent",
      title: "【Unity】HasComponent関数【拡張メソッド】",
      contentLocale: "ja",
    })).toEqual({
      src: "/og/articles/hascomponent.png",
      alt: "【Unity】HasComponent関数【拡張メソッド】 の記事タイトル画像",
      width: 1200,
      height: 630,
    });

    expect(resolveLocalArticleSocialImage({
      slug: "turnbased-gameloop",
      title: "How to Implement a Turn-Based Game Loop [C#]",
      contentLocale: "en",
    })).toEqual({
      src: "/en/og/articles/turnbased-gameloop.png",
      alt: "Title card for How to Implement a Turn-Based Game Loop [C#]",
      width: 1200,
      height: 630,
    });

    expect(resolveLocalArticleCardImage({
      slug: "turnbased-gameloop",
      title: "How to Implement a Turn-Based Game Loop [C#]",
      contentLocale: "en",
    })).toEqual({
      src: "/en/og/articles/cards/turnbased-gameloop.png",
      alt: "Title card for How to Implement a Turn-Based Game Loop [C#]",
      width: articleTitleCardImageWidth,
      height: articleTitleCardImageHeight,
    });

    const authoredCover = {
      src: "/_astro/authored-cover.webp",
      width: 1200,
      height: 630,
      format: "webp",
    };

    expect(resolveLocalArticleSocialImage({
      slug: "vision-introduction",
      title: "[Unity] Implementing CullingGroup More Easily [Vision]",
      contentLocale: "en",
      cover: authoredCover as never,
      coverAlt: "著者指定カバー",
    })).toEqual({
      src: authoredCover,
      alt: "著者指定カバー",
      width: 1200,
      height: 630,
    });

    expect(resolveLocalArticleCardImage({
      slug: "vision-introduction",
      title: "[Unity] Implementing CullingGroup More Easily [Vision]",
      contentLocale: "en",
      cover: authoredCover as never,
      coverAlt: "著者指定カバー",
    })).toEqual({
      src: authoredCover,
      alt: "著者指定カバー",
      width: 1200,
      height: 630,
    });
  });
});
