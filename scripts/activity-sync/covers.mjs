import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

import { activityCoverPublicBasePath, activityCoverPublicDir } from "./shared.mjs";

const releaseCoverDirectoryName = "github";
const releaseCoverRetryStatuses = new Set([408, 425, 429, 500, 502, 503, 504]);
const releaseCoverRetryDelayMs = 250;
const releaseCoverRetryMaxAttempts = 3;
const imageExtensionByContentType = new Map([
  ["image/avif", ".avif"],
  ["image/gif", ".gif"],
  ["image/jpeg", ".jpg"],
  ["image/jpg", ".jpg"],
  ["image/png", ".png"],
  ["image/svg+xml", ".svg"],
  ["image/webp", ".webp"],
]);
const imageExtensions = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"]);

export function createReleaseCoverSlug(repo) {
  return repo.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function createReleaseCoverRelativePath(repo, extension) {
  return path.posix.join(releaseCoverDirectoryName, `${createReleaseCoverSlug(repo)}${extension}`);
}

export function createVersionedLocalCoverUrl(relativePath, content) {
  const version = createHash("sha256").update(content).digest("hex").slice(0, 12);
  return `${activityCoverPublicBasePath}/${relativePath}?v=${version}`;
}

export function getReleaseCoverRelativePathFromUrl(coverUrl) {
  const normalized = coverUrl.startsWith("/")
    ? new URL(coverUrl, "https://mackysoft.net")
    : new URL(coverUrl);
  const basePath = `${activityCoverPublicBasePath}/`;

  if (!normalized.pathname.startsWith(basePath)) {
    return null;
  }

  return normalized.pathname.slice(basePath.length);
}

export function resolveLocalCoverPath(coverOutputDir, relativePath) {
  return path.join(coverOutputDir, ...relativePath.split("/"));
}

export async function readPreviousReleaseCoverUrls(activityPath) {
  try {
    const previousActivity = JSON.parse(await readFile(activityPath, "utf8"));
    const releases = Array.isArray(previousActivity.releases) ? previousActivity.releases : [];

    return new Map(
      releases
        .filter((release) => typeof release?.repo === "string" && typeof release?.coverUrl === "string")
        .map((release) => [release.repo, release.coverUrl]),
    );
  }
  catch {
    return new Map();
  }
}

function getImageExtension(contentType, sourceUrl) {
  const normalizedContentType = contentType?.split(";")[0].trim().toLowerCase();
  const extensionFromContentType = normalizedContentType ? imageExtensionByContentType.get(normalizedContentType) : undefined;

  if (extensionFromContentType) {
    return extensionFromContentType;
  }

  const pathname = sourceUrl.startsWith("/")
    ? new URL(sourceUrl, "https://mackysoft.net").pathname
    : new URL(sourceUrl).pathname;
  const extensionFromPathname = path.posix.extname(pathname).toLowerCase();

  if (imageExtensions.has(extensionFromPathname)) {
    return extensionFromPathname === ".jpeg" ? ".jpg" : extensionFromPathname;
  }

  return ".png";
}

async function tryFetchCoverResponse(coverUrl, fetchImpl) {
  return fetchImpl(coverUrl, {
    headers: {
      Accept: "image/*",
    },
    redirect: "follow",
  });
}

export async function fetchReleaseCoverAsset(coverUrl, fetchImpl) {
  let lastError = null;

  for (let attempt = 1; attempt <= releaseCoverRetryMaxAttempts; attempt += 1) {
    try {
      const response = await tryFetchCoverResponse(coverUrl, fetchImpl);

      if (!response.ok) {
        if (releaseCoverRetryStatuses.has(response.status) && attempt < releaseCoverRetryMaxAttempts) {
          await sleep(releaseCoverRetryDelayMs * attempt);
          continue;
        }

        throw new Error(`Failed to fetch ${coverUrl}: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type");

      if (!contentType?.toLowerCase().startsWith("image/")) {
        throw new Error(`Failed to fetch ${coverUrl}: unsupported content-type ${contentType ?? "unknown"}`);
      }

      const content = Buffer.from(await response.arrayBuffer());

      if (content.byteLength === 0) {
        throw new Error(`Failed to fetch ${coverUrl}: empty image response`);
      }

      return {
        content,
        extension: getImageExtension(contentType, coverUrl),
      };
    }
    catch (error) {
      lastError = error;

      if (attempt >= releaseCoverRetryMaxAttempts) {
        break;
      }

      await sleep(releaseCoverRetryDelayMs * attempt);
    }
  }

  throw lastError;
}

async function writeReleaseCoverAsset(repo, content, extension, coverOutputDir) {
  const relativePath = createReleaseCoverRelativePath(repo, extension);
  const filePath = resolveLocalCoverPath(coverOutputDir, relativePath);

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content);

  return {
    relativePath,
    coverUrl: createVersionedLocalCoverUrl(relativePath, content),
  };
}

async function reusePreviousReleaseCover(previousCoverUrl, coverOutputDir) {
  if (!previousCoverUrl) {
    return null;
  }

  const relativePath = getReleaseCoverRelativePathFromUrl(previousCoverUrl);

  if (!relativePath) {
    return null;
  }

  try {
    const content = await readFile(resolveLocalCoverPath(coverOutputDir, relativePath));
    return {
      relativePath,
      coverUrl: createVersionedLocalCoverUrl(relativePath, content),
    };
  }
  catch {
    return null;
  }
}

export async function syncReleaseCoverAssets(
  releases,
  {
    fetchImpl = fetch,
    activityPath,
    coverOutputDir = activityCoverPublicDir,
  } = {},
) {
  const previousCoverUrls = await readPreviousReleaseCoverUrls(activityPath);
  const usedRelativePaths = new Set();
  const localizedReleases = [];

  for (const release of releases) {
    try {
      const asset = await fetchReleaseCoverAsset(release.coverUrl, fetchImpl);
      const localizedCover = await writeReleaseCoverAsset(release.repo, asset.content, asset.extension, coverOutputDir);
      usedRelativePaths.add(localizedCover.relativePath);
      localizedReleases.push({
        ...release,
        coverUrl: localizedCover.coverUrl,
      });
      continue;
    }
    catch {
      const previousCover = await reusePreviousReleaseCover(previousCoverUrls.get(release.repo), coverOutputDir);

      if (previousCover) {
        usedRelativePaths.add(previousCover.relativePath);
        localizedReleases.push({
          ...release,
          coverUrl: previousCover.coverUrl,
        });
        continue;
      }
    }

    localizedReleases.push(release);
  }

  await pruneUnusedReleaseCoverAssets(usedRelativePaths, coverOutputDir);
  return localizedReleases;
}

export async function pruneUnusedReleaseCoverAssets(usedRelativePaths, coverOutputDir = activityCoverPublicDir) {
  const releaseCoverDirectoryPath = path.join(coverOutputDir, releaseCoverDirectoryName);

  try {
    const entries = await readdir(releaseCoverDirectoryPath, { withFileTypes: true });

    await Promise.all(entries
      .filter((entry) => entry.isFile())
      .map(async (entry) => {
        const relativePath = path.posix.join(releaseCoverDirectoryName, entry.name);

        if (!usedRelativePaths.has(relativePath)) {
          await rm(path.join(releaseCoverDirectoryPath, entry.name), { force: true });
        }
      }));
  }
  catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return;
    }

    throw error;
  }
}
