import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  image: {
    remotePatterns: [
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
