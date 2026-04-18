import type { SiteLocale } from "../../lib/i18n";

export type SiteVocabulary = {
  home: string;
  about: string;
  games: string;
  assets: string;
  articles: string;
  search: string;
  contact: string;
  privacyPolicy: string;
  tag: string;
  archive: string;
};

type SiteVocabularyBundle = {
  display: SiteVocabulary;
  breadcrumb: SiteVocabulary;
};

const englishVocabulary: SiteVocabulary = {
  home: "Home",
  about: "About",
  games: "Games",
  assets: "Assets",
  articles: "Articles",
  search: "Search",
  contact: "Contact",
  privacyPolicy: "Privacy Policy",
  tag: "Tag",
  archive: "Archive",
};

export const siteVocabularyMap: Record<SiteLocale, SiteVocabularyBundle> = {
  ja: {
    display: {
      home: "ホーム",
      about: "プロフィール",
      games: "ゲーム",
      assets: "アセット",
      articles: "記事",
      search: "検索",
      contact: "問い合わせ",
      privacyPolicy: "プライバシーポリシー",
      tag: "タグ",
      archive: "アーカイブ",
    },
    breadcrumb: englishVocabulary,
  },
  en: {
    display: englishVocabulary,
    breadcrumb: englishVocabulary,
  },
  "zh-hant": {
    display: {
      home: "首頁",
      about: "個人簡介",
      games: "遊戲",
      assets: "資產",
      articles: "文章",
      search: "搜尋",
      contact: "聯絡",
      privacyPolicy: "隱私權政策",
      tag: "標籤",
      archive: "歸檔",
    },
    breadcrumb: englishVocabulary,
  },
  ko: {
    display: {
      home: "홈",
      about: "소개",
      games: "게임",
      assets: "에셋",
      articles: "글",
      search: "검색",
      contact: "문의",
      privacyPolicy: "개인정보 처리방침",
      tag: "태그",
      archive: "아카이브",
    },
    breadcrumb: englishVocabulary,
  },
};

export function getSiteVocabulary(locale: SiteLocale) {
  return siteVocabularyMap[locale].display;
}

export function getBreadcrumbVocabulary(locale: SiteLocale) {
  return siteVocabularyMap[locale].breadcrumb;
}
