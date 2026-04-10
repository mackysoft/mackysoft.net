export const siteMeta = {
  name: "mackysoft.net",
  description: "ゲーム、アセット、技術記事を整理して残すための活動ハブ。",
  role: "Game Developer / Engineer",
  heroLabel: "静かな技術系ポートフォリオ",
} as const;

export const primaryNav = [
  { href: "/about/", label: "About" },
  { href: "/games/", label: "Games" },
  { href: "/assets/", label: "Assets" },
  { href: "/articles/", label: "Articles" },
  { href: "/contact/", label: "Contact" },
] as const;

export const externalLinks = [
  { id: "github", href: "https://github.com/mackysoft", label: "GitHub" },
  { id: "twitter", href: "https://twitter.com/makihiro_dev", label: "Twitter" },
  { id: "zenn", href: "https://zenn.dev/makihiro_dev", label: "Zenn" },
] as const;

type ExternalLink = (typeof externalLinks)[number];
export type ExternalLinkId = (typeof externalLinks)[number]["id"];

const externalLinkMap = new Map<ExternalLinkId, ExternalLink>(externalLinks.map((link) => [link.id, link]));

export function getExternalLink(id: ExternalLinkId) {
  const link = externalLinkMap.get(id);

  if (!link) {
    throw new Error(`Unknown external link id: ${id}`);
  }

  return link;
}
