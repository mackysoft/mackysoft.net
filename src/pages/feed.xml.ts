import rss from "@astrojs/rss";
import type { APIRoute } from "astro";

import { getFeedLastBuildDate, getPublicLocalArticles, toRssFeedItems } from "../lib/publishing/feed";
import { getSiteMeta } from "../lib/site";
import { requireSiteUrl } from "../lib/site-url.mjs";

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = requireSiteUrl(site, "Astro site must be configured to build the RSS feed.");

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
    site: siteUrl,
    items: toRssFeedItems(articles),
    customData,
  });
};
