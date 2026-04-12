import { getSiteContent } from "../features/site/content";
import { localizePath, type SiteLocale } from "./i18n";

export const siteName = "mackysoft.net";

export function getSiteMeta(locale: SiteLocale) {
  const content = getSiteContent(locale);

  return {
    name: siteName,
    description: content.description,
  } as const;
}

export function getPrimaryNav(locale: SiteLocale) {
  return getSiteContent(locale).primaryNav.map((item) => ({
    href: localizePath(item.path, locale),
    label: item.label,
  }));
}

export const externalLinks = [
  { id: "github", href: "https://github.com/mackysoft", label: "GitHub" },
  { id: "twitter", href: "https://twitter.com/makihiro_dev", label: "Twitter" },
  { id: "zenn", href: "https://zenn.dev/makihiro_dev", label: "Zenn" },
] as const;

type ExternalLink = (typeof externalLinks)[number];
export type ExternalLinkId = (typeof externalLinks)[number]["id"];

const externalLinkMap = new Map<ExternalLinkId, ExternalLink>(externalLinks.map((link) => [link.id, link]));

export function getExternalLink(id: ExternalLinkId) {
  const link = externalLinkMap.get(id);

  if (!link) {
    throw new Error(`Unknown external link id: ${id}`);
  }

  return link;
}
