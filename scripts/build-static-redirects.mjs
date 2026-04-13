import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { repoRoot } from "./activity-sync/shared.mjs";
import { getGeneratedRedirectRows, loadUrlMap, urlMapPath } from "./migration/url-map.mjs";

export const redirectSiteOrigin = "https://mackysoft.net";
export const redirectDistPath = path.join(repoRoot, "dist");

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

export function createStaticRedirectHtml({ legacyPath, newPath }) {
  const canonicalUrl = new URL(newPath, redirectSiteOrigin).toString();
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

export async function buildStaticRedirects({ csvPath = urlMapPath, distPath = redirectDistPath } = {}) {
  const rows = await loadUrlMap({ filePath: csvPath });
  const redirects = getGeneratedRedirectRows(rows, { source: csvPath });

  await mkdir(distPath, { recursive: true });

  for (const redirect of redirects) {
    const outputPath = resolveRedirectOutputPath(distPath, redirect.legacyPath);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, createStaticRedirectHtml(redirect), "utf8");
  }

  return redirects.map((redirect) => ({
    ...redirect,
    outputPath: resolveRedirectOutputPath(distPath, redirect.legacyPath),
  }));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await buildStaticRedirects();
}
