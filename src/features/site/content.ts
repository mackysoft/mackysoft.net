import type { SiteLocale } from "../../lib/i18n";

const siteContentMap = {
  ja: {
    description: "ゲーム、アセット、技術記事を整理して残すための活動ハブ。",
    primaryNav: [
      { path: "/about/", label: "About" },
      { path: "/games/", label: "Games" },
      { path: "/assets/", label: "Assets" },
      { path: "/articles/", label: "Articles" },
      { path: "/contact/", label: "Contact" },
    ],
  },
  en: {
    description: "An activity hub for games, assets, and technical articles.",
    primaryNav: [
      { path: "/about/", label: "About" },
      { path: "/games/", label: "Games" },
      { path: "/assets/", label: "Assets" },
      { path: "/articles/", label: "Articles" },
      { path: "/contact/", label: "Contact" },
    ],
  },
} as const;

export function getSiteContent(locale: SiteLocale) {
  return siteContentMap[locale];
}
