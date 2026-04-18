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
  "zh-hant": {
    description: "以 GitHub Releases 形式公開的資產列表。",
    support: {
      ariaLabel: "GitHub Sponsors",
      body: "可透過 GitHub Sponsors 提供支持，作為持續開發的資金來源。",
      ctaLabel: "在 GitHub Sponsors 支持",
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
