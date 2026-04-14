import type { SiteLocale } from "../../lib/i18n";

const assetsPageContentMap = {
  ja: {
    description: "GitHub Releases として公開しているアセットの一覧です。",
    support: {
      ariaLabel: "GitHub Sponsors",
      body: "GitHub Sponsors で支援を受け付けています。継続的な開発資金として役立ちます。",
      ctaLabel: "GitHub Sponsors で支援する",
    },
  },
  en: {
    description: "Assets published as GitHub Releases.",
    support: {
      ariaLabel: "GitHub Sponsors",
      body:
        "Support is available through GitHub Sponsors. It helps fund ongoing development.",
      ctaLabel: "Support on GitHub Sponsors",
    },
  },
} as const;

export function getAssetsPageContent(locale: SiteLocale, title: string) {
  const content = assetsPageContentMap[locale];

  return {
    title,
    description: content.description,
    support: content.support,
  };
}
