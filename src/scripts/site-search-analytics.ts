import { buildSiteSearchAnalyticsEventPayload } from "../lib/analytics";

export type SiteSearchMode = "page" | "inline";

type AnalyticsWindow = Window & typeof globalThis & {
  gtag?: (...args: unknown[]) => void;
  __mackysoftAnalyticsScriptLoaded?: boolean;
};

type SiteSearchAnalyticsPayload = NonNullable<ReturnType<typeof buildSiteSearchAnalyticsEventPayload>>;

const pendingSiteSearchStorageKey = "__pending_site_search__";
export const analyticsReadyEventName = "mackysoft:analytics-ready";
const searchAnalyticsLocationMap = {
  page: "search-page",
  inline: "site-header-search",
} as const;

function getSearchAnalyticsLocation(mode: SiteSearchMode) {
  return searchAnalyticsLocationMap[mode];
}

function persistPendingSiteSearch(payload: SiteSearchAnalyticsPayload) {
  try {
    window.sessionStorage.setItem(pendingSiteSearchStorageKey, JSON.stringify(payload));
  } catch {
    // Ignore storage failures and continue navigation without replay support.
  }
}

function clearPendingSiteSearch() {
  try {
    window.sessionStorage.removeItem(pendingSiteSearchStorageKey);
  } catch {
    // Ignore storage failures and leave analytics replay best-effort.
  }
}

function readPendingSiteSearch() {
  try {
    const rawValue = window.sessionStorage.getItem(pendingSiteSearchStorageKey);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);

    if (
      !parsedValue
      || typeof parsedValue !== "object"
      || parsedValue.eventName !== "site_search"
      || !("params" in parsedValue)
      || !parsedValue.params
      || typeof parsedValue.params !== "object"
    ) {
      clearPendingSiteSearch();
      return null;
    }

    return parsedValue as SiteSearchAnalyticsPayload;
  } catch {
    clearPendingSiteSearch();
    return null;
  }
}

function sendSiteSearchPayload(payload: SiteSearchAnalyticsPayload) {
  const analyticsWindow = window as AnalyticsWindow;

  if (typeof analyticsWindow.gtag !== "function") {
    return false;
  }

  analyticsWindow.gtag("event", payload.eventName, payload.params);
  return true;
}

export function replayPendingSiteSearch(expectedQuery: string) {
  const pendingPayload = readPendingSiteSearch();

  if (!pendingPayload) {
    return;
  }

  const pendingSearchTerm =
    "search_term" in pendingPayload.params && typeof pendingPayload.params.search_term === "string"
      ? pendingPayload.params.search_term
      : null;

  if (!expectedQuery || pendingSearchTerm !== expectedQuery) {
    clearPendingSiteSearch();
    return;
  }

  const flushPendingPayload = () => {
    const analyticsWindow = window as AnalyticsWindow;

    if (analyticsWindow.__mackysoftAnalyticsScriptLoaded !== true) {
      return;
    }

    if (sendSiteSearchPayload(pendingPayload)) {
      clearPendingSiteSearch();
    }
  };

  flushPendingPayload();

  if (readPendingSiteSearch()) {
    window.addEventListener(analyticsReadyEventName, flushPendingPayload, { once: true });
  }
}

export function trackSiteSearchSubmit(mode: SiteSearchMode, query: string, onComplete?: () => void) {
  const analyticsWindow = window as AnalyticsWindow;
  const payload = buildSiteSearchAnalyticsEventPayload({
    searchTerm: query,
    location: getSearchAnalyticsLocation(mode),
  });

  if (!payload || typeof analyticsWindow.gtag !== "function") {
    onComplete?.();
    return;
  }

  if (!onComplete) {
    analyticsWindow.gtag("event", payload.eventName, payload.params);
    return;
  }

  if (analyticsWindow.__mackysoftAnalyticsScriptLoaded !== true) {
    persistPendingSiteSearch(payload);
    onComplete();
    return;
  }

  let completed = false;
  const complete = () => {
    if (completed) {
      return;
    }

    completed = true;
    onComplete();
  };

  analyticsWindow.gtag("event", payload.eventName, {
    ...payload.params,
    event_callback: complete,
    transport_type: "beacon",
  });
  window.setTimeout(complete, 1000);
}
