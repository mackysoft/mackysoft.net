import type { APIRoute } from "astro";

import { renderRobotsTxt } from "../lib/publishing/public-text";
import { requireSiteUrl } from "../lib/site-url.mjs";

export const GET: APIRoute = ({ site }) => {
  const siteUrl = requireSiteUrl(site, "Astro site must be configured to build robots.txt.");

  return new Response(renderRobotsTxt(siteUrl), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
