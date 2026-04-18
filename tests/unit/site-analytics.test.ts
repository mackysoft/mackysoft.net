import { describe, expect, test } from "vitest";

import {
  initAnalyticsWindow,
  markAnalyticsReady,
  queueAnalyticsConfig,
  sendAnalyticsEvent,
} from "../../src/scripts/site-analytics";

type TestWindow = typeof globalThis & {
  __mackysoftAnalyticsScriptLoaded?: boolean;
  dataLayer: unknown[];
  gtag?: (...args: unknown[]) => void;
};

function installWindow() {
  const windowMock = {
    dataLayer: [] as unknown[],
  } as unknown as TestWindow;

  Object.assign(globalThis, { window: windowMock });
  return windowMock;
}

describe("site analytics", () => {
  test("initializes a dataLayer-backed gtag stub", () => {
    const windowMock = installWindow();

    initAnalyticsWindow();
    windowMock.gtag?.("event", "site_search", {
      search_term: "BoundingSphereUpdateMode",
      ui_location: "search-page",
    });

    expect(typeof windowMock.gtag).toBe("function");
    expect(windowMock.dataLayer).toEqual([
      [
        "event",
        "site_search",
        {
          search_term: "BoundingSphereUpdateMode",
          ui_location: "search-page",
        },
      ],
    ]);
  });

  test("queues the initial analytics config through gtag", () => {
    const windowMock = installWindow();

    queueAnalyticsConfig("G-TEST123456", {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      send_page_view: true,
      page_location: "https://mackysoft.net/search/",
    });

    expect(windowMock.dataLayer).toEqual([
      [
        "config",
        "G-TEST123456",
        {
          allow_google_signals: false,
          allow_ad_personalization_signals: false,
          send_page_view: true,
          page_location: "https://mackysoft.net/search/",
        },
      ],
    ]);
  });

  test("queues analytics events without a durable replay layer", () => {
    const windowMock = installWindow();

    sendAnalyticsEvent("site_search", {
      search_term: "BoundingSphereUpdateMode",
      ui_location: "site-header-search",
    });

    expect(windowMock.dataLayer).toEqual([
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

  test("marks the analytics script as ready when the loader completes", () => {
    const windowMock = installWindow();

    markAnalyticsReady();

    expect(windowMock.__mackysoftAnalyticsScriptLoaded).toBe(true);
  });
});
