import type { APIRoute } from "astro";

import { getPublicUrlEntries, renderSitemapXml } from "../lib/publishing/sitemap";
import { requireSiteUrl } from "../lib/site-url.mjs";

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = requireSiteUrl(site, "Astro site must be configured to build the sitemap.");

  const entries = await getPublicUrlEntries(siteUrl);

  return new Response(renderSitemapXml(entries), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
