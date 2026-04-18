import { describe, expect, test } from "vitest";

import {
  flushPendingAnalyticsCalls,
  initAnalyticsWindow,
  markAnalyticsReady,
  queueAnalyticsConfig,
  sendAnalyticsEvent,
} from "../../src/scripts/site-analytics";

type StoredValueMap = Record<string, string>;

type TestWindow = typeof globalThis & {
  __mackysoftAnalyticsScriptLoaded?: boolean;
  dataLayer: unknown[];
  gtag?: (...args: unknown[]) => void;
  location: URL;
  sessionStorage: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
  };
  dispatchEvent: (event: Event) => boolean;
  setTimeout: (callback: () => void, timeout?: number) => number;
};

function installWindow(url: string) {
  const storedValues: StoredValueMap = {};
  const dispatchedEvents: string[] = [];

  const windowMock = {
    location: new URL(url),
    dataLayer: [] as unknown[],
    sessionStorage: {
      getItem(key: string) {
        return storedValues[key] ?? null;
      },
      setItem(key: string, value: string) {
        storedValues[key] = value;
      },
      removeItem(key: string) {
        delete storedValues[key];
      },
    },
    dispatchEvent(event: Event) {
      dispatchedEvents.push(event.type);
      return true;
    },
    setTimeout(callback: () => void) {
      callback();
      return 0;
    },
  } as unknown as TestWindow;

  Object.assign(globalThis, { window: windowMock });

  return {
    storedValues,
    dispatchedEvents,
    windowMock,
  };
}

describe("site analytics queue", () => {
  test("flushes search replay after the current search page config", () => {
    const { windowMock } = installWindow("https://mackysoft.net/about/");
    const measurementId = "G-TEST123456";
    const sharedConfigParams = {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      send_page_view: true,
    } as const;

    initAnalyticsWindow();
    queueAnalyticsConfig(measurementId, {
      ...sharedConfigParams,
      page_location: "https://mackysoft.net/about/",
    });
    sendAnalyticsEvent("site_search", {
      search_term: "BoundingSphereUpdateMode",
      ui_location: "site-header-search",
    }, {
      persistWhenUnavailable: true,
      replayCondition: {
        kind: "search-page",
        pathname: "/search/",
        searchParam: "q",
        value: "BoundingSphereUpdateMode",
      },
    });

    Object.assign(windowMock, {
      location: new URL("https://mackysoft.net/search/?q=BoundingSphereUpdateMode"),
    });
    queueAnalyticsConfig(measurementId, {
      ...sharedConfigParams,
      page_location: "https://mackysoft.net/search/",
    });

    windowMock.gtag = (...args: unknown[]) => {
      windowMock.dataLayer.push(args);
    };
    markAnalyticsReady();

    expect(windowMock.dataLayer).toEqual([
      [
        "config",
        measurementId,
        {
          ...sharedConfigParams,
          page_location: "https://mackysoft.net/about/",
        },
      ],
      [
        "config",
        measurementId,
        {
          ...sharedConfigParams,
          page_location: "https://mackysoft.net/search/",
        },
      ],
      [
        "event",
        "site_search",
        {
          search_term: "BoundingSphereUpdateMode",
          ui_location: "site-header-search",
        },
      ],
    ]);
  });

  test("replays site search only on the matching search page", () => {
    const pendingStorageKey = "__pending_analytics_events__";
    const { storedValues, windowMock } = installWindow("https://mackysoft.net/about/");

    initAnalyticsWindow();
    sendAnalyticsEvent("site_search", {
      search_term: "BoundingSphereUpdateMode",
      ui_location: "site-header-search",
    }, {
      persistWhenUnavailable: true,
      replayCondition: {
        kind: "search-page",
        pathname: "/search/",
        searchParam: "q",
        value: "BoundingSphereUpdateMode",
      },
    });

    expect(JSON.parse(storedValues[pendingStorageKey] ?? "[]")).toHaveLength(1);

    windowMock.gtag = (...args: unknown[]) => {
      windowMock.dataLayer.push(args);
    };
    windowMock.__mackysoftAnalyticsScriptLoaded = true;
    flushPendingAnalyticsCalls();

    expect(windowMock.dataLayer).toHaveLength(0);
    expect(JSON.parse(storedValues[pendingStorageKey] ?? "[]")).toHaveLength(1);

    Object.assign(windowMock, {
      location: new URL("https://mackysoft.net/search/?q=DifferentQuery"),
    });
    flushPendingAnalyticsCalls();

    expect(windowMock.dataLayer).toHaveLength(0);
    expect(storedValues[pendingStorageKey]).toBeUndefined();

    windowMock.__mackysoftAnalyticsScriptLoaded = false;
    sendAnalyticsEvent("site_search", {
      search_term: "BoundingSphereUpdateMode",
      ui_location: "site-header-search",
    }, {
      persistWhenUnavailable: true,
      replayCondition: {
        kind: "search-page",
        pathname: "/search/",
        searchParam: "q",
        value: "BoundingSphereUpdateMode",
      },
    });

    Object.assign(windowMock, {
      location: new URL("https://mackysoft.net/search/?q=BoundingSphereUpdateMode"),
    });
    markAnalyticsReady();

    expect(windowMock.dataLayer).toContainEqual([
      "event",
      "site_search",
      {
        search_term: "BoundingSphereUpdateMode",
        ui_location: "site-header-search",
      },
    ]);
    expect(storedValues[pendingStorageKey]).toBeUndefined();
  });
});
