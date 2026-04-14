import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { renderDefaultSocialImagePng } from "../src/features/site/og-image.mjs";

const rootDir = path.resolve(import.meta.dirname, "..");
const outputPath = path.join(rootDir, "public/og/default.png");

async function main() {
  const pngBuffer = await renderDefaultSocialImagePng();

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, pngBuffer);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
