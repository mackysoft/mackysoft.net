import type { SiteLocale } from "../../lib/i18n";
import type { ExternalLinkId } from "../../lib/site";

const profileContentMap = {
  ja: {
    avatarLinkAriaLabel: "Twitter を開く",
    avatar: {
      src: "https://github.com/mackysoft.png",
      alt: "Makihiro のアイコン",
    },
    primaryExternalLinkId: "twitter" as ExternalLinkId,
    home: {
      name: "Makihiro",
      summary: "ゲームと開発アセットを作る個人開発者です。作品・アセット・執筆をまとめています。",
    },
    about: {
      name: "Hiroya Aramaki（荒牧裕也）/ Makihiro",
      summary: "ゲームと開発アセットを作っている個人開発者です。ゲーム開発を軸に、技術・アセット制作・発信を続けています。",
    },
  },
  en: {
    avatarLinkAriaLabel: "Open Twitter",
    avatar: {
      src: "https://github.com/mackysoft.png",
      alt: "Makihiro avatar",
    },
    primaryExternalLinkId: "twitter" as ExternalLinkId,
    home: {
      name: "Makihiro",
      summary: "Makihiro is an indie developer creating games and development assets, and this site brings together projects, assets, and writing.",
    },
    about: {
      name: "Hiroya Aramaki / Makihiro",
      summary: "I am an indie developer building games and development assets, and I keep publishing what I learn along the way.",
    },
  },
} as const;

export function getProfileContent(locale: SiteLocale) {
  return profileContentMap[locale];
}
