import { describe, expect, test } from "vitest";

import {
  buildAnalyticsEventPayload,
  buildSearchResultsAnalyticsEventPayload,
  getAnalyticsMeasurementId,
  isAnalyticsEnabled,
} from "../../src/lib/analytics";

describe("analytics helpers", () => {
  test("disables analytics when the measurement ID is missing", () => {
    expect(getAnalyticsMeasurementId(undefined)).toBeNull();
    expect(getAnalyticsMeasurementId("   ")).toBeNull();
    expect(isAnalyticsEnabled(undefined)).toBe(false);
    expect(isAnalyticsEnabled("")).toBe(false);
    expect(isAnalyticsEnabled("G-TEST123456")).toBe(true);
  });

  test("builds the theme switch payload from the current theme", () => {
    expect(
      buildAnalyticsEventPayload({
        eventName: "theme_switch",
        location: "site-header",
        currentTheme: "dark",
        ariaLabel: "テーマを切り替え",
      }),
    ).toEqual({
      eventName: "theme_switch",
      params: {
        target_label: "テーマを切り替え",
        ui_location: "site-header",
        target_theme: "light",
      },
    });
  });

  test("builds the locale switch payload with the target locale", () => {
    expect(
      buildAnalyticsEventPayload({
        eventName: "locale_switch",
        explicitLabel: "English",
        location: "site-header",
        href: "https://mackysoft.net/en/articles/vision-introduction/",
        targetLocale: "en",
      }),
    ).toEqual({
      eventName: "locale_switch",
      params: {
        target_label: "English",
        ui_location: "site-header",
        target_href: "https://mackysoft.net/en/articles/vision-introduction/",
        target_locale: "en",
      },
    });
  });

  test("builds project and external link payloads from stable metadata", () => {
    expect(
      buildAnalyticsEventPayload({
        eventName: "project_cta_click",
        explicitLabel: "play",
        location: "game-action-panel",
        href: "https://unityroom.com/games/treasure-rogue",
      }),
    ).toEqual({
      eventName: "project_cta_click",
      params: {
        target_label: "play",
        ui_location: "game-action-panel",
        target_href: "https://unityroom.com/games/treasure-rogue",
      },
    });

    expect(
      buildAnalyticsEventPayload({
        eventName: "external_link_click",
        explicitLabel: "GitHub",
        location: "site-footer",
        href: "https://github.com/mackysoft",
      }),
    ).toEqual({
      eventName: "external_link_click",
      params: {
        target_label: "GitHub",
        ui_location: "site-footer",
        target_href: "https://github.com/mackysoft",
      },
    });
  });

  test("omits unsupported link schemes from analytics payloads", () => {
    expect(
      buildAnalyticsEventPayload({
        eventName: "external_link_click",
        explicitLabel: "Send email",
        location: "contact-page",
        href: "mailto:mackysoft0129@gmail.com",
      }),
    ).toEqual({
      eventName: "external_link_click",
      params: {
        target_label: "Send email",
        ui_location: "contact-page",
      },
    });
  });

  test("builds the search results payload from fixed metadata only", () => {
    expect(
      buildSearchResultsAnalyticsEventPayload({
        location: "search-page",
        resultsCount: 24,
      }),
    ).toEqual({
      eventName: "view_search_results",
      params: {
        ui_location: "search-page",
        results_count: 24,
      },
    });
  });

  test("keeps the click payload builder scoped to click events", () => {
    expect(
      buildAnalyticsEventPayload({
        eventName: "view_search_results",
        explicitLabel: "search",
      }),
    ).toBeNull();
  });
});
