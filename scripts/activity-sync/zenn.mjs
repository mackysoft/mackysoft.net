import * as cheerio from "cheerio";

import {
  decodeHtmlEntities,
  normalizeWhitespace,
  summarizeDescription,
  zennFeedUrl,
} from "./shared.mjs";

/**
 * @typedef {{
 *   title: string;
 *   description: string;
 *   url: string;
 *   coverUrl?: string;
 *   coverAlt?: string;
 * }} LocalizedArticleActivity
 */

/**
 * @typedef {{
 *   id: string;
 *   source: string;
 *   publishedAt: string;
 *   locales: {
 *     ja: LocalizedArticleActivity;
 *     en?: LocalizedArticleActivity;
 *   };
 * }} ArticleActivity
 */

export function createArticleId(url) {
  const { pathname } = new URL(url);
  const segments = pathname.split("/").filter(Boolean);
  const slug = segments.at(-1);
  return slug ? `zenn:${slug}` : `zenn:${pathname}`;
}

export function createZennCoverAlt(title, locale = "ja") {
  return locale === "en" ? `${title} cover image` : `${title} のカバー画像`;
}

export function extractZennArticleBodyText(bodyHtml = "") {
  return normalizeWhitespace(cheerio.load(bodyHtml).root().text());
}

/**
 * @param {LocalizedArticleActivity} activity
 * @returns {LocalizedArticleActivity}
 */
export function createLocalizedArticleActivity(activity) {
  return {
    title: activity.title,
    description: activity.description,
    url: activity.url,
    ...(activity.coverUrl
      ? {
          coverUrl: activity.coverUrl,
          ...(activity.coverAlt ? { coverAlt: activity.coverAlt } : {}),
        }
      : {}),
  };
}

export function extractNextData(html) {
  const $ = cheerio.load(html);
  const nextData = $("script#__NEXT_DATA__").html();

  if (nextData) {
    return JSON.parse(nextData);
  }

  const matched = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);

  if (matched?.[1]) {
    return JSON.parse(matched[1]);
  }

  throw new Error("Zenn article page is missing __NEXT_DATA__.");
}

/**
 * @typedef {{
 *   locale: string;
 *   isTranslated: boolean;
 * } & LocalizedArticleActivity} ParsedZennArticlePage
 */

/**
 * @param {string} html
 * @returns {ParsedZennArticlePage}
 */
export function parseZennArticlePage(html) {
  const $ = cheerio.load(html);
  const nextData = extractNextData(html);
  const article = nextData?.props?.pageProps?.article;
  const locale = normalizeWhitespace(nextData?.props?.pageProps?.locale ?? article?.locale ?? "");
  const title = normalizeWhitespace(article?.title ?? $("title").text());
  const content = extractZennArticleBodyText(article?.bodyHtml ?? "");
  const description = summarizeDescription(content);
  const url = normalizeWhitespace(
    $("link[rel='canonical']").attr("href")
    ?? $("meta[property='og:url']").attr("content")
    ?? "",
  );
  const coverUrl = normalizeWhitespace(article?.ogImageUrl ?? $("meta[property='og:image']").attr("content") ?? "");

  if (!title || !description || !url || !locale) {
    throw new Error("Zenn article page is missing required localized article fields.");
  }

  return {
    title,
    description,
    content,
    url,
    locale,
    isTranslated: Boolean(article?.isTranslated),
    ...(coverUrl
      ? {
          coverUrl,
          coverAlt: createZennCoverAlt(title, locale === "en" ? "en" : "ja"),
        }
      : {}),
  };
}

/**
 * @param {string} xml
 * @returns {ArticleActivity[]}
 */
export function parseZennFeed(xml) {
  const $ = cheerio.load(xml, {
    xmlMode: true,
  });

  return $("item")
    .toArray()
    .map((element) => {
      const item = $(element);
      const title = normalizeWhitespace(decodeHtmlEntities(item.find("title").first().text()));
      const description = summarizeDescription(item.find("description").first().text());
      const url = normalizeWhitespace(item.find("link").first().text());
      const publishedAtText = normalizeWhitespace(item.find("pubDate").first().text());
      const publishedAt = new Date(publishedAtText);
      const coverUrl = normalizeWhitespace(item.find("enclosure").attr("url") ?? "");

      if (!title || !description || !url || Number.isNaN(publishedAt.valueOf())) {
        throw new Error("Zenn RSS item is missing required article fields.");
      }

      return {
        id: createArticleId(url),
        source: "Zenn",
        publishedAt: publishedAt.toISOString(),
        locales: {
          ja: createLocalizedArticleActivity({
            title,
            description,
            url,
            ...(coverUrl
              ? {
                  coverUrl,
                  coverAlt: createZennCoverAlt(title, "ja"),
                }
              : {}),
          }),
        },
      };
    })
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

export async function fetchZennFeed(fetchImpl = fetch) {
  const response = await fetchImpl(zennFeedUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch Zenn feed: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

export async function fetchZennArticleHtml(url, locale = "en", fetchImpl = fetch) {
  const localizedUrl = new URL(url);
  localizedUrl.searchParams.set("locale", locale);

  const response = await fetchImpl(localizedUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch Zenn article ${localizedUrl}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

/**
 * @param {ArticleActivity} article
 * @param {(input: string | URL | Request, init?: RequestInit) => Promise<Response>} [fetchImpl]
 * @returns {Promise<ArticleActivity>}
 */
export async function enrichZennArticleWithEnglishLocale(article, fetchImpl = fetch) {
  try {
    const html = await fetchZennArticleHtml(article.locales.ja.url, "en", fetchImpl);
    const localizedArticle = parseZennArticlePage(html);

    if (!localizedArticle.isTranslated || localizedArticle.locale !== "en") {
      return article;
    }

    return {
      ...article,
      locales: {
        ...article.locales,
        en: createLocalizedArticleActivity({
          title: localizedArticle.title,
          description: localizedArticle.description,
          url: localizedArticle.url,
          ...(localizedArticle.coverUrl
            ? {
                coverUrl: localizedArticle.coverUrl,
                coverAlt: localizedArticle.coverAlt,
              }
            : {}),
        }),
      },
    };
  } catch (error) {
    console.warn(`Skipping English locale for ${article.id}: ${error instanceof Error ? error.message : String(error)}`);
    return article;
  }
}

export async function enrichZennArticlesWithEnglishLocale(articles, fetchImpl = fetch) {
  return Promise.all(articles.map((article) => enrichZennArticleWithEnglishLocale(article, fetchImpl)));
}
