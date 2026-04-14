import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { Resvg } from "@resvg/resvg-js";

const rootDir = path.resolve(import.meta.dirname, "..");
const avatarPath = path.join(rootDir, "src/features/profile/assets/avatar.png");
const templatePath = path.join(rootDir, "src/features/site/assets/default-og.template.svg");
const outputPath = path.join(rootDir, "public/og/default.png");

async function main() {
  const [avatarBuffer, template] = await Promise.all([readFile(avatarPath), readFile(templatePath, "utf8")]);
  const avatarDataUri = `data:image/png;base64,${avatarBuffer.toString("base64")}`;
  const svg = template.replace("__AVATAR_DATA_URI__", avatarDataUri);

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: 1200,
    },
  });
  const pngBuffer = resvg.render().asPng();

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, pngBuffer);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
