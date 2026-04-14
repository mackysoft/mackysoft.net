import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Resvg } from "@resvg/resvg-js";

export const ogImageWidth = 1200;
export const ogImageHeight = 630;
export const articleTitleFontSize = 56;
export const articleTitleCondensedFontSize = 48;
export const articleTitleMinFontSize = 40;
export const articleTitleLineHeight = 1.48;
export const articleTitleCompactMaxLines = 3;
export const articleTitleMaxLines = 4;
export const articleTitleSidePadding = 84;
export const articleTitleMaxWidth = ogImageWidth - articleTitleSidePadding * 2;

const FONT_FAMILY = "Noto Sans CJK JP";
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(moduleDir, "../../..");
const avatarPath = path.join(repoRoot, "src/features/profile/assets/avatar.png");
const fontPath = path.join(repoRoot, "src/features/site/assets/fonts/NotoSansCJKjp-Bold.otf");

let ogAssetsPromise;

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function isWideCharacter(character) {
  return /[\u1100-\u11ff\u2e80-\u9fff\uac00-\ud7af\u3040-\u30ff\u3400-\u4dbf\uf900-\ufaff\uff01-\uff60\uffe0-\uffee]/u.test(
    character,
  );
}

function estimateCharacterWidth(character) {
  if (character === " ") {
    return 0.34;
  }

  if (character === "\t") {
    return 0.68;
  }

  if (isWideCharacter(character)) {
    return 1;
  }

  if (/[A-Z]/.test(character)) {
    return 0.69;
  }

  if (/[a-z]/.test(character)) {
    return 0.56;
  }

  if (/[0-9]/.test(character)) {
    return 0.58;
  }

  if (/[()[\]{}]/.test(character)) {
    return 0.4;
  }

  if (/[.,:;'"`]/.test(character)) {
    return 0.28;
  }

  if (/[!?]/.test(character)) {
    return 0.36;
  }

  if (/[+\-_=/*\\|]/.test(character)) {
    return 0.42;
  }

  return 0.62;
}

export function estimateTextWidth(text, fontSize) {
  return Array.from(text).reduce((total, character) => total + estimateCharacterWidth(character) * fontSize, 0);
}

function splitTitleTokens(title, locale) {
  if (locale === "en") {
    return title.split(/(\s+)/).filter((token) => token.length > 0);
  }

  return title.match(/[A-Za-z0-9][A-Za-z0-9+#./_-]*(?:\s+[A-Za-z0-9][A-Za-z0-9+#./_-]*)*|\s+|./gu) ?? [];
}

function wrapLongToken(token, fontSize, maxWidth) {
  const segments = [];
  let current = "";

  for (const character of Array.from(token)) {
    const next = `${current}${character}`;

    if (current && estimateTextWidth(next, fontSize) > maxWidth) {
      segments.push(current);
      current = character;
      continue;
    }

    current = next;
  }

  if (current) {
    segments.push(current);
  }

  return segments;
}

function wrapTitleLines(title, locale, fontSize, maxWidth) {
  const rawTokens = splitTitleTokens(title, locale);
  const tokens = rawTokens.flatMap((token) => {
    if (!token.trim()) {
      return [token];
    }

    if (estimateTextWidth(token, fontSize) <= maxWidth) {
      return [token];
    }

    return wrapLongToken(token, fontSize, maxWidth);
  });
  const lines = [];
  let currentLine = "";

  for (const token of tokens) {
    if (!token.trim()) {
      if (currentLine && estimateTextWidth(`${currentLine}${token}`, fontSize) <= maxWidth) {
        currentLine += token;
      }

      continue;
    }

    const candidate = `${currentLine}${token}`;

    if (!currentLine || estimateTextWidth(candidate, fontSize) <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    lines.push(currentLine.trimEnd());
    currentLine = token.trimStart();
  }

  if (currentLine) {
    lines.push(currentLine.trimEnd());
  }

  return lines;
}

export function calculateArticleTitleLayout(
  title,
  locale,
  {
    compactMaxLines = articleTitleCompactMaxLines,
    maxWidth = articleTitleMaxWidth,
    maxLines = articleTitleMaxLines,
    lineHeight = articleTitleLineHeight,
  } = {},
) {
  const createLayout = (fontSize, lines) => {
    const lineWidths = lines.map((line) => estimateTextWidth(line, fontSize));

    return {
      lines,
      lineWidths,
      maxLineWidth: Math.max(...lineWidths, 0),
      fontSize,
      lineHeight: Number((fontSize * lineHeight).toFixed(2)),
      maxWidth,
      maxLines,
    };
  };

  const defaultLines = wrapTitleLines(title, locale, articleTitleFontSize, maxWidth);

  if (defaultLines.length <= compactMaxLines) {
    return createLayout(articleTitleFontSize, defaultLines);
  }

  for (let fontSize = articleTitleCondensedFontSize; fontSize >= articleTitleMinFontSize; fontSize -= 2) {
    const lines = wrapTitleLines(title, locale, fontSize, maxWidth);

    if (lines.length <= maxLines) {
      return createLayout(fontSize, lines);
    }
  }

  throw new Error(
    `Unable to fit article title within ${maxLines} lines between ${articleTitleCondensedFontSize}px and ${articleTitleMinFontSize}px: ${title}`,
  );
}

function createSvgDocument(defsMarkup, contentMarkup) {
  return `<svg width="${ogImageWidth}" height="${ogImageHeight}" viewBox="0 0 ${ogImageWidth} ${ogImageHeight}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <mask id="frame-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="${ogImageWidth}" height="${ogImageHeight}">
      <rect width="${ogImageWidth}" height="${ogImageHeight}" fill="white" />
      <rect x="32" y="32" width="1136" height="566" rx="64" fill="black" />
    </mask>
    <radialGradient id="frame-gradient-primary" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(236 142) scale(812 652)">
      <stop offset="0" stop-color="#8BD8F4" />
      <stop offset="0.28" stop-color="#79D1F0" />
      <stop offset="0.58" stop-color="#67C9EB" />
      <stop offset="1" stop-color="#67C9EB" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="frame-gradient-secondary" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(960 456) scale(824 664)">
      <stop offset="0" stop-color="#7DD4F1" />
      <stop offset="0.28" stop-color="#69C9EA" />
      <stop offset="0.6" stop-color="#58BFE5" />
      <stop offset="1" stop-color="#58BFE5" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="frame-gradient-soft" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(704 196) scale(1036 836)">
      <stop offset="0" stop-color="#AEE4F8" stop-opacity="0.1" />
      <stop offset="0.34" stop-color="#90DAF3" stop-opacity="0.05" />
      <stop offset="1" stop-color="#90DAF3" stop-opacity="0" />
    </radialGradient>
    ${defsMarkup}
  </defs>

  <rect width="${ogImageWidth}" height="${ogImageHeight}" fill="#EEF8FF" />
  <g mask="url(#frame-mask)">
    <rect width="${ogImageWidth}" height="${ogImageHeight}" fill="#63C6EA" />
    <rect width="${ogImageWidth}" height="${ogImageHeight}" fill="url(#frame-gradient-primary)" />
    <rect width="${ogImageWidth}" height="${ogImageHeight}" fill="url(#frame-gradient-soft)" />
    <rect width="${ogImageWidth}" height="${ogImageHeight}" fill="url(#frame-gradient-secondary)" />
  </g>
  <rect x="48" y="48" width="1104" height="534" rx="48" fill="none" stroke="#79D4F8" stroke-opacity="0.9" stroke-width="4" />
  ${contentMarkup}
</svg>`;
}

function createDefaultSocialImageSvg(avatarDataUri) {
  return createSvgDocument(
    `<clipPath id="default-avatar-clip">
      <circle cx="940" cy="315" r="102" />
    </clipPath>`,
    `<text
      x="760"
      y="340"
      text-anchor="end"
      fill="#12314D"
      font-family="${FONT_FAMILY}"
      font-size="94"
      font-weight="700"
    >
      mackysoft.net
    </text>

    <circle cx="940" cy="315" r="110" fill="#DCF3FF" stroke="#3FAFEE" stroke-opacity="0.28" stroke-width="2" />
    <image
      href="${avatarDataUri}"
      x="838"
      y="213"
      width="204"
      height="204"
      preserveAspectRatio="xMidYMid slice"
      clip-path="url(#default-avatar-clip)"
    />`,
  );
}

function createArticleTitleMarkup(title, locale) {
  const layout = calculateArticleTitleLayout(title, locale);
  const titleAreaTop = 92;
  const titleX = articleTitleSidePadding;
  const titleY = titleAreaTop + layout.fontSize;
  const lineMarkup = layout.lines
    .map((line, index) => {
      const dy = index === 0 ? 0 : layout.lineHeight;
      return `<tspan x="${titleX}" dy="${dy}">${escapeXml(line)}</tspan>`;
    })
    .join("");

  return `<text
    x="${titleX}"
    y="${titleY.toFixed(2)}"
    fill="#12314D"
    font-family="${FONT_FAMILY}"
    font-size="${layout.fontSize}"
    font-weight="700"
  >${lineMarkup}</text>`;
}

function createArticleBrandLockupMarkup(avatarDataUri) {
  return `<text
      x="980"
      y="524"
      text-anchor="end"
      fill="#12314D"
      font-family="${FONT_FAMILY}"
      font-size="42"
      font-weight="700"
    >
      mackysoft.net
    </text>
    <circle cx="1040" cy="508" r="40" fill="#DCF3FF" stroke="#3FAFEE" stroke-opacity="0.28" stroke-width="2" />
    <image
      href="${avatarDataUri}"
      x="1004"
      y="472"
      width="72"
      height="72"
      preserveAspectRatio="xMidYMid slice"
      clip-path="url(#brand-avatar-clip)"
    />`;
}

function createArticleSocialImageSvg({ avatarDataUri, title, locale }) {
  return createSvgDocument(
    `<clipPath id="brand-avatar-clip">
      <circle cx="1040" cy="508" r="36" />
    </clipPath>`,
    `${createArticleTitleMarkup(title, locale)}
    ${createArticleBrandLockupMarkup(avatarDataUri)}`,
  );
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
      defaultFontFamily: FONT_FAMILY,
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
