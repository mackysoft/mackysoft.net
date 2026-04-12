import type { SiteLocale } from "../../lib/i18n";

const assetsPageDescriptionMap: Record<SiteLocale, string> = {
  ja: "GitHub Releases として公開しているアセットの一覧です。",
  en: "Assets published as GitHub Releases.",
};

export function getAssetsPageContent(locale: SiteLocale, title: string) {
  return {
    title,
    description: assetsPageDescriptionMap[locale],
  };
}
