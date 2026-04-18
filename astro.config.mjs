import { defineConfig } from "astro/config";
import { canonicalSiteUrl } from "./src/config/site-url.mjs";

export default defineConfig({
  output: "static",
  site: canonicalSiteUrl,
  image: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: new URL(canonicalSiteUrl).hostname,
        pathname: "/generated/activity-covers/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/zenn/image/upload/**",
      },
      {
        protocol: "https",
        hostname: "opengraph.githubassets.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "repository-images.githubusercontent.com",
        pathname: "/**",
      },
    ],
  },
});
