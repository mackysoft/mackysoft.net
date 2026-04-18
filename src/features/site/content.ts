import type { SiteLocale } from "../../lib/i18n";
import { getSiteVocabulary } from "./vocabulary";

const primaryNavPaths = [
  { path: "/about/", labelKey: "about" },
  { path: "/games/", labelKey: "games" },
  { path: "/assets/", labelKey: "assets" },
  { path: "/articles/", labelKey: "articles" },
  { path: "/contact/", labelKey: "contact" },
] as const;

const siteContentMap: Record<SiteLocale, { description: string }> = {
  ja: {
    description: "ゲーム、アセット、技術記事を整理して残すための活動ハブ。",
  },
  en: {
    description: "An activity hub for games, assets, and technical articles.",
  },
  "zh-hant": {
    description: "整理遊戲、資產與技術文章的活動樞紐。",
  },
};

export function getSiteContent(locale: SiteLocale) {
  const vocabulary = getSiteVocabulary(locale);

  return {
    ...siteContentMap[locale],
    primaryNav: primaryNavPaths.map((item) => ({
      path: item.path,
      label: vocabulary[item.labelKey],
    })),
  };
}
