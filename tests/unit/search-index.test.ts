import { describe, expect, test } from "vitest";

import {
  createExternalArticleSearchRecord,
  createReleaseSearchRecords,
} from "../../scripts/search-index/records.mjs";

function createHtmlResponse(payload: string, init: ResponseInit = {}) {
  return new Response(payload, {
    status: init.status ?? 200,
    statusText: init.statusText,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

function createZennArticlePageHtml({
  locale,
  title,
  canonicalUrl,
  bodyHtml,
  ogImageUrl,
  isTranslated,
}: {
  locale: string;
  title: string;
  canonicalUrl: string;
  bodyHtml: string;
  ogImageUrl?: string;
  isTranslated: boolean;
}) {
  return `<!DOCTYPE html>
<html lang="${locale}">
  <head>
    <title>${title}</title>
    <link rel="canonical" href="${canonicalUrl}" />
    <meta property="og:url" content="${canonicalUrl}" />
    ${ogImageUrl ? `<meta property="og:image" content="${ogImageUrl}" />` : ""}
  </head>
  <body>
    <script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
      props: {
        pageProps: {
          locale,
          article: {
            title,
            bodyHtml,
            ogImageUrl,
            isTranslated,
            locale,
          },
        },
      },
    })}</script>
  </body>
</html>`;
}

describe("search-index records", () => {
  test("builds an external article record from Zenn detail body text", async () => {
    const record = await createExternalArticleSearchRecord({
      id: "zenn:sample",
      source: "Zenn",
      publishedAt: "2026-01-06T03:05:01.000Z",
      locales: {
        ja: {
          title: "Sample article",
          description: "Short summary",
          url: "https://zenn.dev/makihiro_dev/articles/sample-article",
          coverUrl: "https://example.com/cover.png",
          coverAlt: "Sample article cover",
        },
      },
    }, "ja", async () => {
      return createHtmlResponse(createZennArticlePageHtml({
        locale: "ja",
        title: "Sample article",
        canonicalUrl: "https://zenn.dev/makihiro_dev/articles/sample-article",
        bodyHtml: "<p>Detailed explanation with a distinctive keyword.</p><p>Second paragraph.</p>",
        ogImageUrl: "https://example.com/detail-cover.png",
        isTranslated: true,
      }));
    });

    expect(record).toMatchObject({
      url: "https://zenn.dev/makihiro_dev/articles/sample-article",
      language: "ja",
      meta: {
        title: "Sample article",
        type: "article",
        source: "Zenn",
        image: "https://example.com/detail-cover.png",
        imageAlt: "Sample article のカバー画像",
      },
      filters: {
        type: ["article"],
      },
    });
    expect(record?.content).toContain("distinctive keyword");
    expect(record?.content).toContain("Second paragraph.");
  });

  test("falls back to the stored description when external article fetch fails", async () => {
    const record = await createExternalArticleSearchRecord({
      id: "zenn:fallback",
      source: "Zenn",
      publishedAt: "2026-01-06T03:05:01.000Z",
      locales: {
        ja: {
          title: "Fallback article",
          description: "Stored summary only",
          url: "https://zenn.dev/makihiro_dev/articles/fallback-article",
        },
      },
    }, "ja", async () => {
      return createHtmlResponse("Not Found", {
        status: 404,
        statusText: "Not Found",
      });
    });

    expect(record?.content).toContain("Stored summary only");
  });

  test("falls back to English metadata when building a zh-hant external article record", async () => {
    const record = await createExternalArticleSearchRecord({
      id: "zenn:localized",
      source: "Zenn",
      publishedAt: "2026-01-06T03:05:01.000Z",
      locales: {
        ja: {
          title: "日文文章",
          description: "日文摘要",
          url: "https://zenn.dev/makihiro_dev/articles/localized",
        },
        en: {
          title: "English article",
          description: "English summary",
          url: "https://zenn.dev/makihiro_dev/articles/localized?locale=en",
        },
      },
    }, "zh-hant", async (input) => {
      expect(String(input)).toContain("?locale=en");

      return createHtmlResponse(createZennArticlePageHtml({
        locale: "en",
        title: "English article",
        canonicalUrl: "https://zenn.dev/makihiro_dev/articles/localized?locale=en",
        bodyHtml: "<p>Expanded English body.</p>",
        isTranslated: true,
      }));
    });

    expect(record).toMatchObject({
      url: "https://zenn.dev/makihiro_dev/articles/localized?locale=en",
      language: "zh-hant",
      meta: {
        title: "English article",
      },
    });
    expect(record?.content).toContain("Expanded English body.");
  });

  test("creates release search records for all supported indexes", async () => {
    const records = await createReleaseSearchRecords([
      {
        groupId: "GitHub:mackysoft/example",
        source: "GitHub",
        repo: "mackysoft/example",
        description: "Release description",
        license: "MIT",
        stargazerCount: 10,
        name: "Example release",
        version: "1.2.3",
        url: "https://github.com/mackysoft/example/releases/tag/1.2.3",
        publishedAt: "2026-01-01T00:00:00.000Z",
        coverUrl: "https://example.com/release-cover.png",
        coverAlt: "release cover",
      },
    ], async () => createHtmlResponse("# Example README\n\nFeature overview with README only keyword."));

    expect(records).toHaveLength(3);
    expect(records.map((record: { language: string }) => record.language)).toEqual(["ja", "en", "zh-hant"]);
    expect(records[0]).toMatchObject({
      url: "/__search-index/release/ja/GitHub%3Amackysoft%2Fexample/",
      meta: {
        title: "example",
        targetUrl: "https://github.com/mackysoft/example/releases/tag/1.2.3",
        type: "asset",
        source: "GitHub",
      },
      filters: {
        type: ["asset"],
      },
    });
    expect(records[0]?.content).toContain("1.2.3");
    expect(records[0]?.content).toContain("Release description");
    expect(records[0]?.content).toContain("README only keyword");
  });

  test("keeps release records when the repository README is missing", async () => {
    const records = await createReleaseSearchRecords([
      {
        groupId: "GitHub:mackysoft/missing-readme",
        source: "GitHub",
        repo: "mackysoft/missing-readme",
        description: "Release description",
        license: "MIT",
        stargazerCount: 10,
        name: "Example release",
        version: "1.2.3",
        url: "https://github.com/mackysoft/missing-readme/releases/tag/1.2.3",
        publishedAt: "2026-01-01T00:00:00.000Z",
        coverUrl: "https://example.com/release-cover.png",
        coverAlt: "release cover",
      },
    ], async () => new Response("Not Found", {
      status: 404,
      statusText: "Not Found",
    }));

    expect(records).toHaveLength(3);
    expect(records[0]?.content).toContain("Release description");
  });
});
