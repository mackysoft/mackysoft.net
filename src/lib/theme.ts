export const SITE_THEME_CHROME_COLORS = {
  light: "#f0f9ff",
  dark: "#081823",
} as const;

export type SiteTheme = keyof typeof SITE_THEME_CHROME_COLORS;
