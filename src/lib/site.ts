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
  { href: "https://github.com/mackysoft", label: "GitHub" },
  { href: "https://twitter.com/makihiro_dev", label: "X" },
  { href: "https://zenn.dev/makihiro_dev", label: "Zenn" },
  { href: "https://www.youtube.com/channel/UCzO3iwkiy6u1mARt-HOysZA", label: "YouTube" },
] as const;
