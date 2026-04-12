import type { SiteLocale } from "./i18n";

type UiText = {
  header: {
    toolsLabel: string;
    searchPlaceholder: string;
    themeToggle: string;
    languageMenu: string;
    languageShortLabel: Record<SiteLocale, string>;
    languageName: Record<SiteLocale, string>;
  };
  common: {
    home: string;
    about: string;
    games: string;
    assets: string;
    articles: string;
    contact: string;
    privacyPolicy: string;
    tag: string;
    archive: string;
    japaneseOnlyBadge: string;
    fallbackNotice: string;
  };
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
};

const uiTextMap: Record<SiteLocale, UiText> = {
  ja: {
    header: {
      toolsLabel: "ヘッダーツール",
      searchPlaceholder: "検索プレースホルダー",
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
    common: {
      home: "Home",
      about: "About",
      games: "Games",
      assets: "Assets",
      articles: "Articles",
      contact: "Contact",
      privacyPolicy: "Privacy Policy",
      tag: "Tag",
      archive: "Archive",
      japaneseOnlyBadge: "日本語のみ",
      fallbackNotice: "このページは現在日本語のみです。",
    },
    article: {
      publishedAt: "公開日",
      updatedAt: "更新日",
      tagsAriaLabel: "Article tags",
      tocTitle: "目次",
      tocNavLabel: "Article table of contents",
      shareTitle: "シェア",
      copyLink: "コピーリンク",
      nativeShare: "ネイティブシェア",
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
  },
  en: {
    header: {
      toolsLabel: "Header tools",
      searchPlaceholder: "Search placeholder",
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
    common: {
      home: "Home",
      about: "About",
      games: "Games",
      assets: "Assets",
      articles: "Articles",
      contact: "Contact",
      privacyPolicy: "Privacy Policy",
      tag: "Tag",
      archive: "Archive",
      japaneseOnlyBadge: "Japanese only",
      fallbackNotice: "This page is currently available only in Japanese.",
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
  },
};

export function getUiText(locale: SiteLocale) {
  return uiTextMap[locale];
}

const articleCountFormatterMap: Record<SiteLocale, (count: number) => string> = {
  ja: (count) => `${count} 件の記事があります。`,
  en: (count) => `${count} article${count === 1 ? "" : "s"}`,
};

export function formatArticleCount(count: number, locale: SiteLocale) {
  return articleCountFormatterMap[locale](count);
}
