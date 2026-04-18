import { formatBreadcrumb } from "../../lib/breadcrumb";
import type { ExternalLinkId } from "../../lib/site";
import type { SiteLocale } from "../../lib/i18n";
import { getProfileContent } from "../profile/content";

const aboutPageContentMap = {
  ja: {
    title: "プロフィール | Hiroya Aramaki（荒牧裕也）/ Makihiro",
    description:
      "Hiroya Aramaki（荒牧裕也）/ Makihiro のプロフィール、ゲーム開発を軸にした活動領域、このサイトの役割、外部リンク、連絡導線をまとめたページです。",
    hero: {
      eyebrow: formatBreadcrumb("Home", "About"),
      title: "プロフィール",
    },
    whatIDo: {
      heading: "何をしている人か",
      paragraphs: [
        "主な活動はゲーム開発です。個人制作のゲームを形にするだけでなく、制作中に必要になる設計、実装、ツール整備まで含めて継続的に積み上げています。",
        "あわせて、開発中に得た知見を技術記事や公開リポジトリとして整理し、ゲーム開発やソフトウェア開発に再利用できる形で残しています。",
      ],
    },
    domainsAndInterests: {
      heading: "主な領域と関心",
      items: [
        "ゲーム開発とゲームシステム設計",
        "Unity を中心とした実装、ツール整備、開発フロー改善",
        "アセット制作と制作補助の仕組みづくり",
        "技術記事や OSS を通じた知見の整理と発信",
      ],
    },
    siteGuide: {
      heading: "このサイトで見られるもの",
      paragraphs: [
        "このサイトでは、公開しているゲーム、アセット、記事、問い合わせ先をまとめています。",
      ],
      items: [
        {
          label: "ゲーム",
          href: "/games/",
          description: "制作したゲームや公開中の作品を見られます。",
        },
        {
          label: "アセット",
          href: "/assets/",
          description: "開発用アセットやツールをまとめています。",
        },
        {
          label: "記事",
          href: "/articles/",
          description: "技術記事や開発に関する文章を読めます。",
        },
        {
          label: "問い合わせ",
          href: "/contact/",
          description: "仕事や相談、問い合わせ方法を案内しています。",
        },
      ],
    },
    externalLinksHeading: "外部リンク",
    externalLinks: [
      {
        id: "github" as ExternalLinkId,
        description: "OSS、ライブラリ、公開リポジトリをまとめています。",
      },
      {
        id: "twitter" as ExternalLinkId,
        description: "短い近況や日々の発信はこちらです。",
      },
      {
        id: "zenn" as ExternalLinkId,
        description: "技術記事やまとまった知見を公開しています。",
      },
    ],
    contact: {
      heading: "仕事・問い合わせ",
      paragraphs: [
        "仕事の相談や OSS 関連の連絡は、問い合わせページから受け付けています。",
      ],
      ctaLabel: "問い合わせ先を見る",
      href: "/contact/",
    },
  },
  en: {
    title: "About | Hiroya Aramaki / Makihiro",
    description:
      "A profile page for Hiroya Aramaki / Makihiro, covering game development, interests, site purpose, external links, and contact paths.",
    hero: {
      eyebrow: formatBreadcrumb("Home", "About"),
      title: "About",
    },
    whatIDo: {
      heading: "What I Do",
      paragraphs: [
        "My primary focus is game development. I keep shipping not only game ideas themselves, but also the design, implementation, and tooling needed to sustain production.",
        "I also turn the knowledge gained during development into technical articles and public repositories so it can be reused in game development and software work.",
      ],
    },
    domainsAndInterests: {
      heading: "Domains and Interests",
      items: [
        "Game development and game system design",
        "Unity implementation, tooling, and workflow improvement",
        "Asset creation and production support systems",
        "Organizing and publishing knowledge through articles and OSS",
      ],
    },
    siteGuide: {
      heading: "What You Can Find Here",
      paragraphs: [
        "This site collects the games, assets, and writing that I publish.",
      ],
      items: [
        {
          label: "Games",
          href: "/games/",
          description: "Browse games and published projects.",
        },
        {
          label: "Assets",
          href: "/assets/",
          description: "See reusable assets and tools for development.",
        },
        {
          label: "Articles",
          href: "/articles/",
          description: "Read technical writing and development notes.",
        },
        {
          label: "Contact",
          href: "/contact/",
          description: "Find contact paths for work and inquiries.",
        },
      ],
    },
    externalLinksHeading: "Links",
    externalLinks: [
      {
        id: "github" as ExternalLinkId,
        description: "Open-source projects, libraries, and public repositories.",
      },
      {
        id: "twitter" as ExternalLinkId,
        description: "Short updates and day-to-day posts.",
      },
      {
        id: "zenn" as ExternalLinkId,
        description: "Technical articles and longer writeups.",
      },
    ],
    contact: {
      heading: "Work and Contact",
      paragraphs: [
        "For work, consulting, or OSS-related messages, start from the Contact page.",
      ],
      ctaLabel: "Open Contact",
      href: "/contact/",
    },
  },
  "zh-hant": {
    title: "個人簡介 | Hiroya Aramaki / Makihiro",
    description:
      "整理 Hiroya Aramaki / Makihiro 的個人簡介、以遊戲開發為核心的活動領域、網站定位、外部連結與聯絡方式的頁面。",
    hero: {
      eyebrow: formatBreadcrumb("Home", "About"),
      title: "個人簡介",
    },
    whatIDo: {
      heading: "我在做什麼",
      paragraphs: [
        "我的主要活動是遊戲開發。我不只把遊戲點子做成作品，也持續累積支撐製作所需的設計、實作與工具整備。",
        "同時，我也會把開發中得到的知識整理成技術文章與公開儲存庫，留下可重複利用於遊戲開發與軟體開發的形式。",
      ],
    },
    domainsAndInterests: {
      heading: "主要領域與興趣",
      items: [
        "遊戲開發與遊戲系統設計",
        "以 Unity 為中心的實作、工具整備與工作流程改善",
        "資產製作與製作輔助機制",
        "透過文章與 OSS 整理並公開知識",
      ],
    },
    siteGuide: {
      heading: "這個網站可以看到什麼",
      paragraphs: [
        "這個網站整理了我公開的遊戲、資產、文章與聯絡方式。",
      ],
      items: [
        {
          label: "遊戲",
          href: "/games/",
          description: "可查看我製作的遊戲與公開作品。",
        },
        {
          label: "資產",
          href: "/assets/",
          description: "整理可重複利用的開發資產與工具。",
        },
        {
          label: "文章",
          href: "/articles/",
          description: "可閱讀技術文章與開發相關筆記。",
        },
        {
          label: "聯絡",
          href: "/contact/",
          description: "提供工作洽談、諮詢與聯絡方式。",
        },
      ],
    },
    externalLinksHeading: "外部連結",
    externalLinks: [
      {
        id: "github" as ExternalLinkId,
        description: "整理 OSS、函式庫與公開儲存庫。",
      },
      {
        id: "twitter" as ExternalLinkId,
        description: "較短的近況更新與日常發文。",
      },
      {
        id: "zenn" as ExternalLinkId,
        description: "公開技術文章與較完整的知識整理。",
      },
    ],
    contact: {
      heading: "工作與聯絡",
      paragraphs: [
        "如有工作洽談、顧問需求或 OSS 相關聯絡，請從聯絡頁面開始。",
      ],
      ctaLabel: "開啟聯絡頁面",
      href: "/contact/",
    },
  },
} as const;

export function getAboutPageContent(locale: SiteLocale) {
  const profile = getProfileContent(locale);

  return {
    ...aboutPageContentMap[locale],
    profile: {
      name: profile.about.name,
      summary: profile.about.summary,
      avatarLinkAriaLabel: profile.avatarLinkAriaLabel,
      avatar: profile.avatar,
      primaryExternalLinkId: profile.primaryExternalLinkId,
    },
  };
}
