import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Resvg } from "@resvg/resvg-js";

import { createArticleSocialImageSvg, createDefaultSocialImageSvg } from "./template.mjs";
import { ogImageFontFamily, ogImageWidth } from "./shared.mjs";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = resolveRepoRoot(moduleDir);
const avatarPath = path.join(repoRoot, "src/features/profile/assets/avatar.png");
const fontPath = path.join(repoRoot, "src/features/site/assets/fonts/NotoSansCJKjp-Bold.otf");

let ogAssetsPromise;

function resolveRepoRoot(startDir) {
  let currentDir = startDir;

  while (true) {
    if (existsSync(path.join(currentDir, "package.json"))) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);

    if (parentDir === currentDir) {
      throw new Error(`Unable to resolve repository root from ${startDir}`);
    }

    currentDir = parentDir;
  }
}

async function getOgAssets() {
  if (!ogAssetsPromise) {
    ogAssetsPromise = (async () => {
      const avatarBuffer = await readFile(avatarPath);

      return {
        avatarDataUri: `data:image/png;base64,${avatarBuffer.toString("base64")}`,
      };
    })();
  }

  return ogAssetsPromise;
}

function renderSvgToPng(svg) {
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: ogImageWidth,
    },
    font: {
      fontFiles: [fontPath],
      loadSystemFonts: false,
      defaultFontFamily: ogImageFontFamily,
    },
  });

  return resvg.render().asPng();
}

export async function renderDefaultSocialImagePng() {
  const { avatarDataUri } = await getOgAssets();
  return renderSvgToPng(createDefaultSocialImageSvg(avatarDataUri));
}

export async function renderArticleTitleSocialImagePng({ title, locale }) {
  const { avatarDataUri } = await getOgAssets();
  return renderSvgToPng(createArticleSocialImageSvg({ avatarDataUri, title, locale }));
}
