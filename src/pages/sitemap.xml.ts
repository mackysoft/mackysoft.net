import type { APIRoute } from "astro";

import { getPublicUrlEntries, renderSitemapXml } from "../lib/publishing/sitemap";

export const GET: APIRoute = async ({ site }) => {
  if (!site) {
    throw new Error("Astro site must be configured to build the sitemap.");
  }

  const entries = await getPublicUrlEntries(site);

  return new Response(renderSitemapXml(entries), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
