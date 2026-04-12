import { localizePath, type SiteLocale } from "./i18n";

const siteDescriptionMap = {
  ja: "ゲーム、アセット、技術記事を整理して残すための活動ハブ。",
  en: "An activity hub for games, assets, and technical articles.",
} as const;

const primaryNavLabels = [
  { path: "/about/", label: "About" },
  { path: "/games/", label: "Games" },
  { path: "/assets/", label: "Assets" },
  { path: "/articles/", label: "Articles" },
  { path: "/contact/", label: "Contact" },
] as const;

export function getSiteMeta(locale: SiteLocale) {
  return {
    name: "mackysoft.net",
    description: siteDescriptionMap[locale],
  } as const;
}

export function getPrimaryNav(locale: SiteLocale) {
  return primaryNavLabels.map((item) => ({
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
