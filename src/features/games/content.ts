import type { SiteLocale } from "../../lib/i18n";

const gamesPageDescriptionMap: Record<SiteLocale, string> = {
  ja: "公開しているゲームの一覧です。",
  en: "A list of published games.",
  "zh-hant": "公開中的遊戲列表。",
  ko: "공개 중인 게임 목록입니다.",
};

export function getGamesPageContent(locale: SiteLocale, title: string) {
  return {
    title,
    description: gamesPageDescriptionMap[locale],
  };
}
