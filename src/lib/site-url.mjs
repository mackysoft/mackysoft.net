/**
 * @typedef {URL | string} SiteUrlLike
 */

/**
 * @typedef {{
 *   locale: string;
 *   path: string;
 * }} AlternateLocalePathEntry
 */

/**
 * @typedef {{
 *   canonicalPath: string;
 *   alternateLocales?: readonly AlternateLocalePathEntry[];
 * }} SiteLayoutUrlInput
 */

/**
 * @param {SiteUrlLike | undefined | null} site
 * @param {string} errorMessage
 * @returns {URL}
 */
export function requireSiteUrl(site, errorMessage) {
  if (!site) {
    throw new Error(errorMessage);
  }

  return toSiteUrl(site);
}

/**
 * @param {SiteUrlLike} site
 * @returns {URL}
 */
export function toSiteUrl(site) {
  return site instanceof URL ? site : new URL(site);
}

/**
 * @param {SiteUrlLike} site
 * @param {string} path
 * @returns {string}
 */
export function toAbsoluteSiteUrl(site, path) {
  return new URL(path, toSiteUrl(site)).toString();
}

/**
 * @param {SiteUrlLike} site
 * @param {SiteLayoutUrlInput} input
 */
export function buildSiteLayoutUrls(site, { canonicalPath, alternateLocales = [] }) {
  return {
    canonicalUrl: toAbsoluteSiteUrl(site, canonicalPath),
    rssFeedUrl: toAbsoluteSiteUrl(site, "/feed.xml"),
    alternateLocaleUrls: alternateLocales.map((entry) => ({
      ...entry,
      href: toAbsoluteSiteUrl(site, entry.path),
    })),
  };
}
