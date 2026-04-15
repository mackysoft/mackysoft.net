import { canonicalRedirectHosts, canonicalSiteUrl } from "../src/config/site-url.mjs";
import { resolveCanonicalHostRedirectUrl } from "../src/lib/site-url.mjs";

export default {
  async fetch(request, env) {
    const redirectUrl = resolveCanonicalHostRedirectUrl(canonicalSiteUrl, canonicalRedirectHosts, request.url);

    if (redirectUrl) {
      return Response.redirect(redirectUrl, 301);
    }

    return env.ASSETS.fetch(request);
  },
};
