import { beforeEach, describe, expect, test, vi } from "vitest";

import { sendAnalyticsEvent } from "../../src/scripts/site-analytics";
import {
  buildInlineSearchNavigationUrl,
  consumeInlineSearchPageVisit,
  trackSiteSearchSubmit,
} from "../../src/scripts/site-search-analytics";

vi.mock("../../src/scripts/site-analytics", () => ({
  sendAnalyticsEvent: vi.fn(),
}));

type TestWindow = typeof globalThis & {
  location: URL;
  sessionStorage: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
  };
};

function installWindow() {
  const storedValues: Record<string, string> = {};
  const windowMock = {
    location: new URL("https://mackysoft.net/about/"),
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
  } as unknown as TestWindow;

  Object.assign(globalThis, { window: windowMock });
  return {
    storedValues,
    windowMock,
  };
}

describe("site search analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installWindow();
  });

  test("tracks page-mode searches immediately on submit", () => {
    expect(trackSiteSearchSubmit("page", "BoundingSphereUpdateMode")).toBe(true);

    expect(sendAnalyticsEvent).toHaveBeenCalledWith("site_search", {
      search_term: "BoundingSphereUpdateMode",
      ui_location: "search-page",
    });
  });

  test("does not emit analytics for inline submissions before navigation", () => {
    expect(trackSiteSearchSubmit("inline", "BoundingSphereUpdateMode")).toBe(false);
    expect(sendAnalyticsEvent).not.toHaveBeenCalled();
  });

  test("adds a one-time token to inline search navigation urls", () => {
    const nextUrl = buildInlineSearchNavigationUrl("/en/search/", " BoundingSphereUpdateMode ");

    expect(nextUrl.pathname).toBe("/en/search/");
    expect(nextUrl.searchParams.get("q")).toBe("BoundingSphereUpdateMode");
    expect(nextUrl.searchParams.get("search-token")).toMatch(/\S+/);
  });

  test("tracks the first search-page visit after an inline search and strips the token", () => {
    const nextUrl = buildInlineSearchNavigationUrl("/en/search/", "BoundingSphereUpdateMode");
    const { tracked, sanitizedUrl } = consumeInlineSearchPageVisit(nextUrl);

    expect(tracked).toBe(true);
    expect(sendAnalyticsEvent).toHaveBeenCalledWith("site_search", {
      search_term: "BoundingSphereUpdateMode",
      ui_location: "site-header-search",
    });
    expect(sanitizedUrl.pathname).toBe("/en/search/");
    expect(sanitizedUrl.searchParams.get("q")).toBe("BoundingSphereUpdateMode");
    expect(sanitizedUrl.searchParams.has("search-token")).toBe(false);
  });

  test("does not track direct visits that only carry the public token", () => {
    const nextUrl = new URL("https://mackysoft.net/search/?q=BoundingSphereUpdateMode&search-token=manual-token");
    const { tracked, sanitizedUrl } = consumeInlineSearchPageVisit(nextUrl);

    expect(tracked).toBe(false);
    expect(sendAnalyticsEvent).not.toHaveBeenCalled();
    expect(sanitizedUrl.toString()).toBe("https://mackysoft.net/search/?q=BoundingSphereUpdateMode");
  });
});
