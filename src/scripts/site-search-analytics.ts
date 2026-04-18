import { buildSiteSearchAnalyticsEventPayload } from "../lib/analytics";
import { sendAnalyticsEvent } from "./site-analytics";

export type SiteSearchMode = "page" | "inline";
type TrackSiteSearchSubmitOptions = {
  onComplete?: () => void;
  searchPath: string;
};
const searchAnalyticsLocationMap = {
  page: "search-page",
  inline: "site-header-search",
} as const;

function getSearchAnalyticsLocation(mode: SiteSearchMode) {
  return searchAnalyticsLocationMap[mode];
}

function buildSearchReplayCondition(searchPath: string, searchTerm: string) {
  const searchUrl = new URL(searchPath, window.location.href);

  return {
    kind: "search-page" as const,
    pathname: searchUrl.pathname,
    searchParam: "q",
    value: searchTerm,
  };
}

export function trackSiteSearchSubmit(mode: SiteSearchMode, query: string, options: TrackSiteSearchSubmitOptions) {
  const { onComplete, searchPath } = options;
  const payload = buildSiteSearchAnalyticsEventPayload({
    searchTerm: query,
    location: getSearchAnalyticsLocation(mode),
  });

  if (!payload) {
    onComplete?.();
    return;
  }

  const searchTerm = payload.params.search_term;

  if (typeof searchTerm !== "string") {
    onComplete?.();
    return;
  }

  sendAnalyticsEvent(payload.eventName, payload.params, {
    onComplete,
    persistWhenUnavailable: true,
    replayCondition: buildSearchReplayCondition(searchPath, searchTerm),
  });
}
