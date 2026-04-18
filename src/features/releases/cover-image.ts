import type { ImageMetadata } from "astro";

type SiteUrl = URL | string;

const localizedReleaseCoverImports = import.meta.glob("../../generated/activity-covers/**/*.{avif,gif,jpeg,jpg,png,svg,webp}", {
  eager: true,
  import: "default",
});

export const releaseCoverWidths = [320, 480];

export type ReleaseCoverSource =
  | {
    kind: "optimized";
    src: ImageMetadata;
  }
  | {
    kind: "public";
    src: string;
  }
  | {
    kind: "remote";
    src: string;
  };

function isImageMetadata(value: unknown): value is ImageMetadata {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as {
    src?: unknown;
    width?: unknown;
    height?: unknown;
    format?: unknown;
  };

  return (
    typeof candidate.src === "string"
    && typeof candidate.width === "number"
    && typeof candidate.height === "number"
    && typeof candidate.format === "string"
  );
}

function toLocalizedReleaseCoverPublicPath(filePath: string) {
  const normalized = filePath.replaceAll("\\", "/");
  const marker = "/generated/activity-covers/";
  const markerIndex = normalized.indexOf(marker);

  return markerIndex >= 0 ? normalized.slice(markerIndex) : normalized;
}

function createLocalizedReleaseCoverMap() {
  const localizedReleaseCoverMap = new Map<string, ImageMetadata>();

  for (const [filePath, importedValue] of Object.entries(localizedReleaseCoverImports)) {
    if (!isImageMetadata(importedValue)) {
      continue;
    }

    localizedReleaseCoverMap.set(toLocalizedReleaseCoverPublicPath(filePath), importedValue);
  }

  return localizedReleaseCoverMap;
}

export function normalizeReleaseCoverPublicPath(coverUrl: string) {
  return new URL(coverUrl, "https://mackysoft.net").pathname;
}

const localizedReleaseCoverMap = createLocalizedReleaseCoverMap();

export function resolveReleaseCoverImage(coverUrl: string, siteUrl: SiteUrl): ReleaseCoverSource {
  if (coverUrl.startsWith("/")) {
    const publicPath = normalizeReleaseCoverPublicPath(coverUrl);
    const localizedCover = localizedReleaseCoverMap.get(publicPath);

    if (localizedCover) {
      return {
        kind: "optimized",
        src: localizedCover,
      };
    }

    return {
      kind: "public",
      src: publicPath,
    };
  }

  return {
    kind: "remote",
    src: new URL(coverUrl, siteUrl).toString(),
  };
}
