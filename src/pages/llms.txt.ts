import type { APIRoute } from "astro";

import { renderLlmsTxt } from "../lib/publishing/public-text";
import { requireSiteUrl } from "../lib/site-url.mjs";

export const GET: APIRoute = ({ site }) => {
  const siteUrl = requireSiteUrl(site, "Astro site must be configured to build llms.txt.");

  return new Response(renderLlmsTxt(siteUrl), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
