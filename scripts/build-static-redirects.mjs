import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import astroConfig from "../astro.config.mjs";
import { requireSiteUrl, toAbsoluteSiteUrl } from "../src/lib/site-url.mjs";
import { repoRoot } from "./activity-sync/shared.mjs";
import { getGeneratedRedirectRows, loadUrlMap, urlMapPath } from "./migration/url-map.mjs";

export const redirectDistPath = path.join(repoRoot, "dist");
export const redirectSite = requireSiteUrl(astroConfig.site, "Astro site must be configured to build static redirects.");
export const redirectsFileName = "_redirects";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

export function resolveRedirectOutputPath(distPath, legacyPath) {
  const segments = legacyPath.split("/").filter(Boolean);

  if (segments.length === 0) {
    return path.join(distPath, "index.html");
  }

  return path.join(distPath, ...segments, "index.html");
}

export function resolveRedirectsFilePath(distPath) {
  return path.join(distPath, redirectsFileName);
}

export function createStaticRedirectRules(redirects, statusCode = 301) {
  return `${redirects.map((redirect) => `${redirect.legacyPath} ${redirect.newPath} ${statusCode}`).join("\n")}\n`;
}

export function createStaticRedirectHtml({ legacyPath, newPath, site = redirectSite }) {
  const canonicalUrl = toAbsoluteSiteUrl(site, newPath);
  const escapedLegacyPath = escapeHtml(legacyPath);
  const escapedNewPath = escapeHtml(newPath);
  const escapedCanonicalUrl = escapeHtml(canonicalUrl);
  const serializedTargetPath = JSON.stringify(newPath);

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <title>Redirecting</title>
    <link rel="canonical" href="${escapedCanonicalUrl}" />
    <meta name="robots" content="noindex, nofollow" />
    <meta http-equiv="refresh" content="0;url=${escapedNewPath}" />
    <script>
      (() => {
        const target = new URL(${serializedTargetPath}, window.location.origin);
        target.search = window.location.search;
        target.hash = window.location.hash;
        window.location.replace(\`\${target.pathname}\${target.search}\${target.hash}\`);
      })();
    </script>
  </head>
  <body>
    <p>Redirecting from ${escapedLegacyPath} to <a href="${escapedNewPath}">${escapedNewPath}</a>.</p>
  </body>
</html>
`;
}

export async function buildStaticRedirects({ csvPath = urlMapPath, distPath = redirectDistPath, site = redirectSite } = {}) {
  const rows = await loadUrlMap({ filePath: csvPath });
  const redirects = getGeneratedRedirectRows(rows, { source: csvPath });

  await mkdir(distPath, { recursive: true });
  await writeFile(resolveRedirectsFilePath(distPath), createStaticRedirectRules(redirects), "utf8");

  for (const redirect of redirects) {
    const outputPath = resolveRedirectOutputPath(distPath, redirect.legacyPath);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, createStaticRedirectHtml({ ...redirect, site }), "utf8");
  }

  return redirects.map((redirect) => ({
    ...redirect,
    outputPath: resolveRedirectOutputPath(distPath, redirect.legacyPath),
  }));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await buildStaticRedirects();
}
