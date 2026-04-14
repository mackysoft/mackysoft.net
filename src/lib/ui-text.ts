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
};

const commonUiTextSupplementMap: Record<SiteLocale, Pick<CommonUiText, "rssFeed">> = {
  ja: {
    rssFeed: "RSS フィード",
  },
  en: {
    rssFeed: "RSS feed",
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
        ja: "JP",
        en: "EN",
      },
      languageName: {
        ja: "日本語",
        en: "English",
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
        ja: "JP",
        en: "EN",
      },
      languageName: {
        ja: "Japanese",
        en: "English",
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
};

const searchResultCountFormatterMap: Record<SiteLocale, (count: number) => string> = {
  ja: (count) => `${count} 件の検索結果`,
  en: (count) => `${count} search result${count === 1 ? "" : "s"}`,
};

const searchResultPreviewFormatterMap: Record<SiteLocale, (totalCount: number, visibleCount: number) => string> = {
  ja: (totalCount, visibleCount) => `${totalCount} 件の検索結果（上位 ${visibleCount} 件を表示）`,
  en: (totalCount, visibleCount) => `${totalCount} search result${totalCount === 1 ? "" : "s"} (showing top ${visibleCount})`,
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
