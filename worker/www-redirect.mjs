import { canonicalRedirectHosts, canonicalSiteUrl } from "../src/config/site-url.mjs";
import { resolveCanonicalHostRedirectUrl } from "../src/lib/site-url.mjs";

export default {
  async fetch(request) {
    const redirectUrl = resolveCanonicalHostRedirectUrl(canonicalSiteUrl, canonicalRedirectHosts, request.url);

    if (!redirectUrl) {
      return new Response("Not Found", { status: 404 });
    }

    return Response.redirect(redirectUrl, 301);
  },
};
