import type { SiteLocale } from "../../lib/i18n";

const assetsPageContentMap = {
  ja: {
    description: "GitHub Releases として公開しているアセットの一覧です。",
    support: {
      ariaLabel: "GitHub Sponsors",
      body: "アセットや OSS が役に立ったら、GitHub Sponsors から支援できます。開発の資金源として役立ちます。",
      ctaLabel: "GitHub Sponsors で支援する",
    },
  },
  en: {
    description: "Assets published as GitHub Releases.",
    support: {
      ariaLabel: "GitHub Sponsors",
      body:
        "If these assets or OSS projects are useful to you, you can support them through GitHub Sponsors. It helps with ongoing maintenance and improvements.",
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
