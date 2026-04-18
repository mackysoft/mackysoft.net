type SiteUrl = URL | string;

export const releaseCoverWidths = [320, 480];

export function resolveReleaseCoverImageUrl(coverUrl: string, siteUrl: SiteUrl) {
  return new URL(coverUrl, siteUrl).toString();
}
