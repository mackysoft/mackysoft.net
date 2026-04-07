export const homePageContent = {
  title: "mackysoft.net",
  statusMessage: "Astro minimum bootstrap is ready.",
} as const;

export function getHomePageTitle() {
  return homePageContent.title;
}
