import { beforeEach, describe, expect, test, vi } from "vitest";

import { sendAnalyticsEvent } from "../../src/scripts/site-analytics";
import { trackSiteSearchSubmit } from "../../src/scripts/site-search-analytics";

vi.mock("../../src/scripts/site-analytics", () => ({
  sendAnalyticsEvent: vi.fn(),
}));

describe("site search analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(globalThis, {
      window: {
        location: new URL("https://mackysoft.net/about/"),
      },
    });
  });

  test("tracks page-mode searches without replay conditions", () => {
    trackSiteSearchSubmit("page", "BoundingSphereUpdateMode", {
      searchPath: "/search/",
    });

    const sendAnalyticsEventMock = vi.mocked(sendAnalyticsEvent);
    expect(sendAnalyticsEventMock).toHaveBeenCalledTimes(1);

    const analyticsOptions = sendAnalyticsEventMock.mock.calls[0]?.[2];

    expect(sendAnalyticsEventMock.mock.calls[0]?.[0]).toBe("site_search");
    expect(sendAnalyticsEventMock.mock.calls[0]?.[1]).toEqual({
      search_term: "BoundingSphereUpdateMode",
      ui_location: "search-page",
    });
    expect(analyticsOptions).toMatchObject({
      persistWhenUnavailable: true,
    });
    expect(analyticsOptions && "replayCondition" in analyticsOptions).toBe(false);
  });

  test("tracks inline searches with a replay condition for the destination page", () => {
    const onComplete = vi.fn();

    trackSiteSearchSubmit("inline", " BoundingSphereUpdateMode ", {
      onComplete,
      searchPath: "/en/search/",
    });

    expect(sendAnalyticsEvent).toHaveBeenCalledWith("site_search", {
      search_term: "BoundingSphereUpdateMode",
      ui_location: "site-header-search",
    }, {
      onComplete,
      persistWhenUnavailable: true,
      replayCondition: {
        kind: "search-page",
        pathname: "/en/search/",
        searchParam: "q",
        value: "BoundingSphereUpdateMode",
      },
    });
  });
});
