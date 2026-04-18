type SiteUrl = URL | string;

export const releaseCoverWidths = [320, 480];
export const releaseCoverWidth = 1200;
export const releaseCoverHeight = 630;

export function resolveReleaseCoverImageUrl(coverUrl: string, siteUrl: SiteUrl) {
  if (coverUrl.startsWith("/")) {
    return new URL(coverUrl, "https://mackysoft.net").pathname;
  }

  return new URL(coverUrl, siteUrl).toString();
}
