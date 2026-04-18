import { getBreadcrumbVocabulary, getSiteVocabulary, type SiteVocabulary } from "../features/site/vocabulary";
import type { SiteLocale } from "./i18n";

type CommonUiText = SiteVocabulary & {
  japaneseOnlyBadge: string;
  fallbackNotice: string;
  rssFeed: string;
};

type UiText = {
  header: {
    primaryNavLabel: string;
    toolsLabel: string;
    menuToggle: string;
    searchOpen: string;
    themeToggle: string;
    languageMenu: string;
    languageShortLabel: Record<SiteLocale, string>;
    languageName: Record<SiteLocale, string>;
  };
  footer: {
    linksHeading: string;
    legalHeading: string;
  };
  common: CommonUiText;
  article: {
    publishedAt: string;
    updatedAt: string;
    tagsAriaLabel: string;
    tocTitle: string;
    tocNavLabel: string;
    shareTitle: string;
    copyLink: string;
    nativeShare: string;
    twitter: string;
    linkCopied: string;
    copyFailed: string;
  };
  release: {
    latestReleaseDate: string;
  };
  game: {
    linksAriaLabel: string;
    screenshotsAriaLabel: string;
    screenshotTrailerTitle: string;
    featuresAriaLabel: string;
    basicInfoAriaLabel: string;
    genre: string;
    publishedAt: string;
    languages: string;
    platforms: string;
  };
  search: {
    pageDescription: string;
    lead: string;
    modalTitle: string;
    inputLabel: string;
    inputPlaceholder: string;
    submit: string;
    close: string;
    openPage: string;
    noQueryTitle: string;
    noQueryBody: string;
    loading: string;
    emptyTitle: string;
    emptyBody: string;
    errorTitle: string;
    errorBody: string;
    externalBadge: string;
    typeLabel: Record<"article" | "game" | "asset" | "page", string>;
  };
  breadcrumb: SiteVocabulary;
};

const commonUiTextOverrides: Record<SiteLocale, Pick<CommonUiText, "japaneseOnlyBadge" | "fallbackNotice">> = {
  ja: {
    japaneseOnlyBadge: "日本語のみ",
    fallbackNotice: "このページは現在日本語のみです。",
  },
  en: {
    japaneseOnlyBadge: "Japanese only",
    fallbackNotice: "This page is currently available only in Japanese.",
  },
  "zh-hant": {
    japaneseOnlyBadge: "僅提供日文",
    fallbackNotice: "此頁面目前僅提供日文。",
  },
  ko: {
    japaneseOnlyBadge: "일본어만 제공",
    fallbackNotice: "이 페이지는 현재 일본어로만 제공됩니다.",
  },
};

const commonUiTextSupplementMap: Record<SiteLocale, Pick<CommonUiText, "rssFeed">> = {
  ja: {
    rssFeed: "RSS フィード",
  },
  en: {
    rssFeed: "RSS feed",
  },
  "zh-hant": {
    rssFeed: "RSS 摘要",
  },
  ko: {
    rssFeed: "RSS 피드",
  },
};

const uiTextMap: Record<SiteLocale, Omit<UiText, "common" | "breadcrumb">> = {
  ja: {
    header: {
      primaryNavLabel: "グローバルナビゲーション",
      toolsLabel: "ヘッダーツール",
      menuToggle: "メニューを開く",
      searchOpen: "検索を開く",
      themeToggle: "テーマを切り替え",
      languageMenu: "表示言語を切り替え",
      languageShortLabel: {
        ja: "JA",
        en: "EN",
        "zh-hant": "ZH",
        ko: "KO",
      },
      languageName: {
        ja: "日本語",
        en: "English",
        "zh-hant": "繁體中文",
        ko: "한국어",
      },
    },
    footer: {
      linksHeading: "外部リンク",
      legalHeading: "ポリシー",
    },
    article: {
      publishedAt: "公開日",
      updatedAt: "更新日",
      tagsAriaLabel: "記事のタグ",
      tocTitle: "目次",
      tocNavLabel: "記事の目次",
      shareTitle: "共有",
      copyLink: "コピーリンク",
      nativeShare: "共有する",
      twitter: "Twitter",
      linkCopied: "リンクをコピーしました",
      copyFailed: "コピーに失敗しました",
    },
    release: {
      latestReleaseDate: "最新リリース日",
    },
    game: {
      linksAriaLabel: "リンク",
      screenshotsAriaLabel: "スクリーンショット",
      screenshotTrailerTitle: "のトレーラー",
      featuresAriaLabel: "ゲームの特徴",
      basicInfoAriaLabel: "ゲームの基本情報",
      genre: "ジャンル",
      publishedAt: "公開日",
      languages: "対応言語",
      platforms: "プラットフォーム",
    },
    search: {
      pageDescription: "サイト内の記事、ゲーム、外部記事、公開アセットを検索できます。",
      lead: "記事本文や作品詳細、外部記事、公開中アセットを横断して検索できます。",
      modalTitle: "検索",
      inputLabel: "検索キーワード",
      inputPlaceholder: "キーワードを入力",
      submit: "検索",
      close: "閉じる",
      openPage: "検索ページを開く",
      noQueryTitle: "検索キーワードを入力してください",
      noQueryBody: "記事本文、ゲーム詳細、外部記事、公開アセットを対象に検索できます。",
      loading: "検索中...",
      emptyTitle: "一致する結果がありません",
      emptyBody: "別のキーワードで試してください。",
      errorTitle: "検索を読み込めませんでした",
      errorBody: "時間を置いてもう一度試してください。",
      externalBadge: "外部",
      typeLabel: {
        article: "記事",
        game: "ゲーム",
        asset: "アセット",
        page: "ページ",
      },
    },
  },
  en: {
    header: {
      primaryNavLabel: "Global navigation",
      toolsLabel: "Header tools",
      menuToggle: "Open menu",
      searchOpen: "Open search",
      themeToggle: "Toggle theme",
      languageMenu: "Switch language",
      languageShortLabel: {
        ja: "JA",
        en: "EN",
        "zh-hant": "ZH",
        ko: "KO",
      },
      languageName: {
        ja: "Japanese",
        en: "English",
        "zh-hant": "Traditional Chinese",
        ko: "Korean",
      },
    },
    footer: {
      linksHeading: "External Links",
      legalHeading: "Policy",
    },
    article: {
      publishedAt: "Published",
      updatedAt: "Updated",
      tagsAriaLabel: "Article tags",
      tocTitle: "Contents",
      tocNavLabel: "Article table of contents",
      shareTitle: "Share",
      copyLink: "Copy link",
      nativeShare: "Native share",
      twitter: "Twitter",
      linkCopied: "Link copied",
      copyFailed: "Copy failed",
    },
    release: {
      latestReleaseDate: "Latest release",
    },
    game: {
      linksAriaLabel: "Links",
      screenshotsAriaLabel: "Screenshots",
      screenshotTrailerTitle: " trailer",
      featuresAriaLabel: "Game features",
      basicInfoAriaLabel: "Game details",
      genre: "Genre",
      publishedAt: "Published",
      languages: "Languages",
      platforms: "Platforms",
    },
    search: {
      pageDescription: "Search across local articles, games, external articles, and published assets.",
      lead: "Search across article bodies, game details, external writing, and published assets.",
      modalTitle: "Search",
      inputLabel: "Search query",
      inputPlaceholder: "Enter keywords",
      submit: "Search",
      close: "Close",
      openPage: "Open search page",
      noQueryTitle: "Enter a search query",
      noQueryBody: "Search across article bodies, game details, external articles, and published assets.",
      loading: "Searching...",
      emptyTitle: "No results found",
      emptyBody: "Try another keyword.",
      errorTitle: "Search is unavailable",
      errorBody: "Please try again later.",
      externalBadge: "External",
      typeLabel: {
        article: "Article",
        game: "Game",
        asset: "Asset",
        page: "Page",
      },
    },
  },
  "zh-hant": {
    header: {
      primaryNavLabel: "全域導覽",
      toolsLabel: "頁首工具",
      menuToggle: "開啟選單",
      searchOpen: "開啟搜尋",
      themeToggle: "切換主題",
      languageMenu: "切換顯示語言",
      languageShortLabel: {
        ja: "JA",
        en: "EN",
        "zh-hant": "ZH",
        ko: "KO",
      },
      languageName: {
        ja: "日文",
        en: "English",
        "zh-hant": "繁體中文",
        ko: "한국어",
      },
    },
    footer: {
      linksHeading: "外部連結",
      legalHeading: "政策",
    },
    article: {
      publishedAt: "發布日",
      updatedAt: "更新日",
      tagsAriaLabel: "文章標籤",
      tocTitle: "目錄",
      tocNavLabel: "文章目錄",
      shareTitle: "分享",
      copyLink: "複製連結",
      nativeShare: "分享",
      twitter: "Twitter",
      linkCopied: "已複製連結",
      copyFailed: "複製失敗",
    },
    release: {
      latestReleaseDate: "最新發佈日",
    },
    game: {
      linksAriaLabel: "連結",
      screenshotsAriaLabel: "截圖",
      screenshotTrailerTitle: " 的預告片",
      featuresAriaLabel: "遊戲特色",
      basicInfoAriaLabel: "遊戲資訊",
      genre: "類型",
      publishedAt: "發布日",
      languages: "支援語言",
      platforms: "平台",
    },
    search: {
      pageDescription: "可搜尋站內文章、遊戲、外部文章與已公開資產。",
      lead: "可跨文章正文、遊戲詳情、外部文章與已公開資產進行搜尋。",
      modalTitle: "搜尋",
      inputLabel: "搜尋關鍵字",
      inputPlaceholder: "輸入關鍵字",
      submit: "搜尋",
      close: "關閉",
      openPage: "開啟搜尋頁面",
      noQueryTitle: "請輸入搜尋關鍵字",
      noQueryBody: "可搜尋文章正文、遊戲詳情、外部文章與已公開資產。",
      loading: "搜尋中...",
      emptyTitle: "找不到相符結果",
      emptyBody: "請嘗試其他關鍵字。",
      errorTitle: "無法載入搜尋結果",
      errorBody: "請稍後再試。",
      externalBadge: "外部",
      typeLabel: {
        article: "文章",
        game: "遊戲",
        asset: "資產",
        page: "頁面",
      },
    },
  },
  ko: {
    header: {
      primaryNavLabel: "글로벌 내비게이션",
      toolsLabel: "헤더 도구",
      menuToggle: "메뉴 열기",
      searchOpen: "검색 열기",
      themeToggle: "테마 전환",
      languageMenu: "표시 언어 전환",
      languageShortLabel: {
        ja: "JA",
        en: "EN",
        "zh-hant": "ZH",
        ko: "KO",
      },
      languageName: {
        ja: "日本語",
        en: "English",
        "zh-hant": "繁體中文",
        ko: "한국어",
      },
    },
    footer: {
      linksHeading: "외부 링크",
      legalHeading: "정책",
    },
    article: {
      publishedAt: "공개일",
      updatedAt: "업데이트일",
      tagsAriaLabel: "글 태그",
      tocTitle: "목차",
      tocNavLabel: "글 목차",
      shareTitle: "공유",
      copyLink: "링크 복사",
      nativeShare: "공유하기",
      twitter: "Twitter",
      linkCopied: "링크를 복사했습니다",
      copyFailed: "복사에 실패했습니다",
    },
    release: {
      latestReleaseDate: "최신 릴리스 날짜",
    },
    game: {
      linksAriaLabel: "링크",
      screenshotsAriaLabel: "스크린샷",
      screenshotTrailerTitle: " 트레일러",
      featuresAriaLabel: "게임 특징",
      basicInfoAriaLabel: "게임 기본 정보",
      genre: "장르",
      publishedAt: "공개일",
      languages: "지원 언어",
      platforms: "플랫폼",
    },
    search: {
      pageDescription: "사이트 안의 글, 게임, 외부 글, 공개된 에셋을 검색할 수 있습니다.",
      lead: "글 본문, 게임 상세, 외부 글, 공개된 에셋을 한 번에 검색할 수 있습니다.",
      modalTitle: "검색",
      inputLabel: "검색어",
      inputPlaceholder: "키워드 입력",
      submit: "검색",
      close: "닫기",
      openPage: "검색 페이지 열기",
      noQueryTitle: "검색어를 입력해 주세요",
      noQueryBody: "글 본문, 게임 상세, 외부 글, 공개된 에셋을 검색할 수 있습니다.",
      loading: "검색 중...",
      emptyTitle: "일치하는 결과가 없습니다",
      emptyBody: "다른 키워드로 다시 시도해 보세요.",
      errorTitle: "검색 결과를 불러올 수 없습니다",
      errorBody: "잠시 후 다시 시도해 주세요.",
      externalBadge: "외부",
      typeLabel: {
        article: "글",
        game: "게임",
        asset: "에셋",
        page: "페이지",
      },
    },
  },
};

export function getUiText(locale: SiteLocale) {
  return {
    ...uiTextMap[locale],
    common: {
      ...getSiteVocabulary(locale),
      ...commonUiTextOverrides[locale],
      ...commonUiTextSupplementMap[locale],
    },
    breadcrumb: getBreadcrumbVocabulary(locale),
  };
}

const articleCountFormatterMap: Record<SiteLocale, (count: number) => string> = {
  ja: (count) => `${count} 件の記事があります。`,
  en: (count) => `${count} article${count === 1 ? "" : "s"}`,
  "zh-hant": (count) => `共有 ${count} 篇文章`,
  ko: (count) => `총 ${count}개의 글`,
};

const searchResultCountFormatterMap: Record<SiteLocale, (count: number) => string> = {
  ja: (count) => `${count} 件の検索結果`,
  en: (count) => `${count} search result${count === 1 ? "" : "s"}`,
  "zh-hant": (count) => `${count} 筆搜尋結果`,
  ko: (count) => `${count}개의 검색 결과`,
};

const searchResultPreviewFormatterMap: Record<SiteLocale, (totalCount: number, visibleCount: number) => string> = {
  ja: (totalCount, visibleCount) => `${totalCount} 件の検索結果（上位 ${visibleCount} 件を表示）`,
  en: (totalCount, visibleCount) => `${totalCount} search result${totalCount === 1 ? "" : "s"} (showing top ${visibleCount})`,
  "zh-hant": (totalCount, visibleCount) => `${totalCount} 筆搜尋結果（顯示前 ${visibleCount} 筆）`,
  ko: (totalCount, visibleCount) => `${totalCount}개의 검색 결과 (상위 ${visibleCount}개 표시)`,
};

export function formatArticleCountLabel(count: number, locale: SiteLocale) {
  return articleCountFormatterMap[locale](count);
}

export function formatSearchResultCountLabel(count: number, locale: SiteLocale) {
  return searchResultCountFormatterMap[locale](count);
}

export function formatSearchResultPreviewLabel(totalCount: number, visibleCount: number, locale: SiteLocale) {
  return searchResultPreviewFormatterMap[locale](totalCount, visibleCount);
}
