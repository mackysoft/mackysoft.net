import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "@playwright/test";

const accentColor = "#1f92d5";
const iconTextColor = "#f8fdff";
const faviconText = "m";
const faviconSize = 1024;
const faviconRadius = 232;
const faviconWidthRatio = 0.58;
const fontStack = "\"IBM Plex Sans\", \"Roboto\", \"Helvetica Neue\", Arial, sans-serif";
const googleFontsQuery = "family=IBM+Plex+Sans:wght@700&family=Roboto:wght@700&display=swap";
const outputPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(import.meta.dirname, "..", "public", "favicon.png");

async function waitForFonts(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;

    const fontFaces = Array.from(document.fonts);
    await Promise.all(fontFaces.map((fontFace) => fontFace.load().catch(() => undefined)));
  });
}

async function measureText(page, { fontFamily, fontWeight, text, targetWidth, targetHeight }) {
  return page.evaluate(
    ({ pageFontFamily, pageFontWeight, pageText, pageTargetWidth, pageTargetHeight }) => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Canvas 2D context is unavailable.");
      }

      const baseFontSize = 1000;
      context.font = `${pageFontWeight} ${baseFontSize}px ${pageFontFamily}`;

      const metrics = context.measureText(pageText);
      const measuredWidth = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
      const measuredHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
      const scale = Math.min(pageTargetWidth / measuredWidth, pageTargetHeight / measuredHeight);
      const fontSize = baseFontSize * scale;

      context.font = `${pageFontWeight} ${fontSize}px ${pageFontFamily}`;
      const finalMetrics = context.measureText(pageText);

      return {
        fontSize,
        ascent: finalMetrics.actualBoundingBoxAscent,
        descent: finalMetrics.actualBoundingBoxDescent,
      };
    },
    {
      pageFontFamily: fontFamily,
      pageFontWeight: fontWeight,
      pageText: text,
      pageTargetWidth: targetWidth,
      pageTargetHeight: targetHeight,
    },
  );
}

function createFontPage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?${googleFontsQuery}" rel="stylesheet">
    <style>
      body {
        margin: 0;
      }
    </style>
  </head>
  <body></body>
</html>`;
}

function createIconPage({ fontSize, baselineY }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?${googleFontsQuery}" rel="stylesheet">
    <style>
      body {
        margin: 0;
        background: transparent;
      }
    </style>
  </head>
  <body>
    <svg
      id="favicon"
      width="${faviconSize}"
      height="${faviconSize}"
      viewBox="0 0 ${faviconSize} ${faviconSize}"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="${faviconSize}" height="${faviconSize}" rx="${faviconRadius}" fill="${accentColor}" />
      <text
        x="${faviconSize / 2}"
        y="${baselineY}"
        fill="${iconTextColor}"
        font-family="${fontStack}"
        font-size="${fontSize}"
        font-weight="700"
        text-anchor="middle"
      >${faviconText}</text>
    </svg>
  </body>
</html>`;
}

async function renderFaviconPng() {
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage({
      viewport: {
        width: faviconSize,
        height: faviconSize,
      },
      deviceScaleFactor: 1,
    });

    await page.setContent(createFontPage(), { waitUntil: "networkidle" });
    await waitForFonts(page);

    const targetTextBox = faviconSize * faviconWidthRatio;
    const iconMetrics = await measureText(page, {
      fontFamily: fontStack,
      fontWeight: 700,
      text: faviconText,
      targetWidth: targetTextBox,
      targetHeight: targetTextBox,
    });
    const baselineY = faviconSize / 2 + (iconMetrics.ascent - iconMetrics.descent) / 2;

    await page.setContent(createIconPage({ fontSize: iconMetrics.fontSize, baselineY }), { waitUntil: "networkidle" });
    await waitForFonts(page);

    return await page.locator("#favicon").screenshot({
      type: "png",
      omitBackground: true,
    });
  } finally {
    await browser.close();
  }
}

async function main() {
  const pngBuffer = await renderFaviconPng();

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, pngBuffer);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
