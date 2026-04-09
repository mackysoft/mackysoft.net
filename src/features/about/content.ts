import { formatPageBreadcrumb } from "../../lib/page-header";
import type { ExternalLinkId } from "../../lib/site";

export const aboutPageContent = {
  title: "About | Hiroya Aramaki（荒牧裕也）/ Makihiro",
  description:
    "Hiroya Aramaki（荒牧裕也）/ Makihiro のプロフィール、ゲーム開発を軸にした活動領域、このサイトの役割、外部リンク、連絡導線をまとめたページです。",
  hero: {
    eyebrow: formatPageBreadcrumb("Home", "About"),
    title: "About",
  },
  profile: {
    name: "Hiroya Aramaki（荒牧裕也）/ Makihiro",
    summary: "ゲームと開発アセットを作っている個人開発者です。ゲーム開発を軸に、技術・アセット制作・発信を続けています。",
    avatar: {
      src: "https://github.com/mackysoft.png",
      alt: "Makihiro のアイコン",
    },
    primaryExternalLinkId: "twitter" as ExternalLinkId,
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
      "このサイトでは、公開しているゲーム、アセット、執筆をまとめています。",
    ],
    items: [
      {
        label: "Games",
        href: "/games/",
        description: "制作したゲームや公開中の作品を見られます。",
      },
      {
        label: "Assets",
        href: "/assets/",
        description: "開発用アセットやツールをまとめています。",
      },
      {
        label: "Articles",
        href: "/articles/",
        description: "技術記事や開発に関する文章を読めます。",
      },
      {
        label: "Contact",
        href: "/contact/",
        description: "仕事や相談、問い合わせの案内です。",
      },
    ],
  },
  externalLinksHeading: "リンク",
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
      "仕事や相談、問い合わせは Contact からどうぞ。",
      "OSS やアセットに関する話は GitHub も利用できます。",
    ],
    ctaLabel: "Contact を開く",
    href: "/contact/",
  },
} as const;
