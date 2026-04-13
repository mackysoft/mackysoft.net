import rss from "@astrojs/rss";
import type { APIRoute } from "astro";

import { getFeedLastBuildDate, getPublicLocalArticles, toRssFeedItems } from "../lib/publishing/feed";
import { getSiteMeta } from "../lib/site";

export const GET: APIRoute = async ({ site }) => {
  if (!site) {
    throw new Error("Astro site must be configured to build the RSS feed.");
  }

  const articles = await getPublicLocalArticles();
  const lastBuildDate = getFeedLastBuildDate(articles);
  const siteMeta = getSiteMeta("ja");
  const customData = [
    "<language>ja</language>",
    ...(lastBuildDate ? [`<lastBuildDate>${lastBuildDate.toUTCString()}</lastBuildDate>`] : []),
  ].join("");

  return rss({
    title: siteMeta.name,
    description: siteMeta.description,
    site,
    items: toRssFeedItems(articles),
    customData,
  });
};
