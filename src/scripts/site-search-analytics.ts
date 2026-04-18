import { buildSiteSearchAnalyticsEventPayload } from "../lib/analytics";
import { sendAnalyticsEvent } from "./site-analytics";

export type SiteSearchMode = "page" | "inline";
const searchAnalyticsLocationMap = {
  page: "search-page",
  inline: "site-header-search",
} as const;

function getSearchAnalyticsLocation(mode: SiteSearchMode) {
  return searchAnalyticsLocationMap[mode];
}

export function trackSiteSearchSubmit(mode: SiteSearchMode, query: string, onComplete?: () => void) {
  const payload = buildSiteSearchAnalyticsEventPayload({
    searchTerm: query,
    location: getSearchAnalyticsLocation(mode),
  });

  if (!payload) {
    onComplete?.();
    return;
  }

  sendAnalyticsEvent(payload.eventName, payload.params, {
    onComplete,
    persistWhenUnavailable: true,
  });
}
