export const assetsPagePath = "/assets/";

function normalizeComparableKey(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function getReleasedAssetKeys(activityData) {
  const releases = Array.isArray(activityData?.releases) ? activityData.releases : [];
  const releaseKeys = new Set();

  for (const release of releases) {
    const repoName = String(release?.repo ?? "").split("/").at(-1) ?? "";
    const comparableKey = normalizeComparableKey(repoName);

    if (comparableKey) {
      releaseKeys.add(comparableKey);
    }
  }

  return releaseKeys;
}

export function isReleasedAssetTaxonomyEntry(entry, releasedAssetKeys) {
  if (entry.kind !== "category") {
    return false;
  }

  if (!entry.legacyPath.startsWith("/category/asset/") || entry.legacyPath === "/category/asset/") {
    return false;
  }

  return releasedAssetKeys.has(normalizeComparableKey(entry.newTag));
}

export function resolveTaxonomyEntryPath(entry, { publicTags, releasedAssetKeys }) {
  if (publicTags.has(entry.newTag)) {
    return `/tags/${entry.newTag}/`;
  }

  if (isReleasedAssetTaxonomyEntry(entry, releasedAssetKeys)) {
    return assetsPagePath;
  }

  return "";
}
