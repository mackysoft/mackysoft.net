export const homePageContent = {
  title: "mackysoft.net",
  heroLabel: "静かな技術系ポートフォリオ",
  role: "Game Developer / Engineer",
  intro: [
    "ゲーム、アセット、技術記事を長く追える形で残すための拠点です。",
    "旧ブログ記事はローカル原本として移し直し、ブログ以外のページは新しい構成で再設計していきます。",
  ],
} as const;

export function getHomePageTitle() {
  return homePageContent.title;
}
