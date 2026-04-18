import type { SiteLocale } from "../../lib/i18n";

const sharedFamilies = [
  "IBM Plex Sans:wght@600;700",
  "Roboto:wght@400;500;700",
  "Roboto Mono:wght@400;500;700",
] as const;

const japaneseFamilies = [
  "Zen Kaku Gothic New:wght@400;500;700",
] as const;

export function getGoogleFontsStylesheetUrl(locale: SiteLocale) {
  const params = new URLSearchParams();

  for (const family of sharedFamilies) {
    params.append("family", family);
  }

  if (locale === "ja") {
    for (const family of japaneseFamilies) {
      params.append("family", family);
    }
  }

  params.set("display", "swap");

  return `https://fonts.googleapis.com/css2?${params.toString()}`;
}
