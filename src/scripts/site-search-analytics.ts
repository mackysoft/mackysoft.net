import { buildSiteSearchAnalyticsEventPayload } from "../lib/analytics";
import { sendAnalyticsEvent } from "./site-analytics";

export type SiteSearchMode = "page" | "inline";

const inlineSearchTrackingParam = "search-token";
const inlineSearchTrackingStorageKey = "mackysoft-inline-search-tracking";
const inlineSearchTrackingValue = "site-header-search";

type InlineSearchTrackingState = {
  query: string;
  source: string;
  pathname: string;
  token: string;
};

const searchAnalyticsLocationMap = {
  page: "search-page",
  inline: "site-header-search",
} as const;

function getSearchAnalyticsLocation(mode: SiteSearchMode) {
  return searchAnalyticsLocationMap[mode];
}

function isInlineSearchTrackingState(value: unknown): value is InlineSearchTrackingState {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as {
    query?: unknown;
    source?: unknown;
    pathname?: unknown;
    token?: unknown;
  };

  return (
    typeof candidate.query === "string"
    && typeof candidate.source === "string"
    && typeof candidate.pathname === "string"
    && typeof candidate.token === "string"
  );
}

function createInlineSearchTrackingToken() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function readInlineSearchTrackingState() {
  try {
    const rawValue = window.sessionStorage.getItem(inlineSearchTrackingStorageKey);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);
    return isInlineSearchTrackingState(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

function writeInlineSearchTrackingState(state: InlineSearchTrackingState) {
  try {
    window.sessionStorage.setItem(inlineSearchTrackingStorageKey, JSON.stringify(state));
  } catch {
    // Ignore storage failures and keep analytics best-effort.
  }
}

function clearInlineSearchTrackingState() {
  try {
    window.sessionStorage.removeItem(inlineSearchTrackingStorageKey);
  } catch {
    // Ignore storage failures and keep analytics best-effort.
  }
}

function buildTrackedSiteSearchUrl(searchPath: string, query: string, baseUrl: string) {
  const nextUrl = new URL(searchPath, baseUrl);
  const trimmedQuery = query.trim();

  if (trimmedQuery) {
    const token = createInlineSearchTrackingToken();

    nextUrl.searchParams.set("q", trimmedQuery);
    nextUrl.searchParams.set(inlineSearchTrackingParam, token);
    writeInlineSearchTrackingState({
      query: trimmedQuery,
      source: inlineSearchTrackingValue,
      pathname: nextUrl.pathname,
      token,
    });
    return nextUrl;
  }

  nextUrl.searchParams.delete("q");
  nextUrl.searchParams.delete(inlineSearchTrackingParam);
  clearInlineSearchTrackingState();
  return nextUrl;
}

function buildSiteSearchPayload(mode: SiteSearchMode, query: string) {
  return buildSiteSearchAnalyticsEventPayload({
    searchTerm: query,
    location: getSearchAnalyticsLocation(mode),
  });
}

export function buildInlineSearchNavigationUrl(searchPath: string, query: string, baseUrl = window.location.href) {
  return buildTrackedSiteSearchUrl(searchPath, query, baseUrl);
}

export function trackSiteSearchSubmit(mode: SiteSearchMode, query: string) {
  if (mode !== "page") {
    return false;
  }

  const payload = buildSiteSearchPayload(mode, query);

  if (!payload) {
    return false;
  }

  sendAnalyticsEvent(payload.eventName, payload.params);
  return true;
}

export function consumeInlineSearchPageVisit(currentUrl = new URL(window.location.href)) {
  const sanitizedUrl = new URL(currentUrl.toString());
  sanitizedUrl.searchParams.delete(inlineSearchTrackingParam);

  const trackingToken = currentUrl.searchParams.get(inlineSearchTrackingParam)?.trim() ?? "";
  const trackingState = readInlineSearchTrackingState();

  if (
    !trackingToken
    || !trackingState
    || trackingState.source !== inlineSearchTrackingValue
    || trackingState.token !== trackingToken
    || trackingState.pathname !== currentUrl.pathname
    || trackingState.query !== (currentUrl.searchParams.get("q")?.trim() ?? "")
  ) {
    if (trackingToken || trackingState) {
      clearInlineSearchTrackingState();
    }

    return {
      tracked: false,
      sanitizedUrl,
    };
  }

  clearInlineSearchTrackingState();

  const payload = buildSiteSearchPayload("inline", trackingState.query);

  if (!payload) {
    return {
      tracked: false,
      sanitizedUrl,
    };
  }

  sendAnalyticsEvent(payload.eventName, payload.params);
  return {
    tracked: true,
    sanitizedUrl,
  };
}
