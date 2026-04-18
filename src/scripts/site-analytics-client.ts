import { buildAnalyticsEventPayload } from "../lib/analytics";
import {
  initAnalyticsWindow,
  markAnalyticsReady,
  queueAnalyticsConfig,
  sendAnalyticsEvent,
} from "./site-analytics";

type SiteAnalyticsConfig = {
  analyticsScriptUrl: string;
  measurementId: string;
  pageLocation: string | null;
  searchPaths: string[];
};

type AnalyticsConfigOptions = {
  allow_google_signals: false;
  allow_ad_personalization_signals: false;
  send_page_view: boolean;
  page_location?: string;
  page_referrer?: string;
};

type AnalyticsWindow = Window & typeof globalThis & {
  __mackysoftAnalyticsScriptLoaded?: boolean;
  __mackysoftSkipInitialPageView?: boolean;
  gtag?: (...args: unknown[]) => void;
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
};

const analyticsConfigElementId = "site-analytics-config";
const analyticsScriptAttribute = "data-site-analytics-script";

function getAnalyticsWindow() {
  return window as AnalyticsWindow;
}

function isSiteAnalyticsConfig(value: unknown): value is SiteAnalyticsConfig {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as {
    analyticsScriptUrl?: unknown;
    measurementId?: unknown;
    pageLocation?: unknown;
    searchPaths?: unknown;
  };

  return (
    typeof candidate.analyticsScriptUrl === "string"
    && typeof candidate.measurementId === "string"
    && (typeof candidate.pageLocation === "string" || candidate.pageLocation === null)
    && Array.isArray(candidate.searchPaths)
    && candidate.searchPaths.every((entry) => typeof entry === "string")
  );
}

function readSiteAnalyticsConfig() {
  const configElement = document.getElementById(analyticsConfigElementId);

  if (!(configElement instanceof HTMLScriptElement)) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(configElement.textContent ?? "");
    return isSiteAnalyticsConfig(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

function buildAnalyticsConfigOptions(config: SiteAnalyticsConfig) {
  const analyticsWindow = getAnalyticsWindow();
  const skipInitialPageView = analyticsWindow.__mackysoftSkipInitialPageView === true;
  const configOptions: AnalyticsConfigOptions = {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    send_page_view: !skipInitialPageView,
  };

  if (config.pageLocation) {
    configOptions.page_location = config.pageLocation;
  }

  if (typeof document.referrer === "string" && document.referrer.length > 0) {
    try {
      const currentUrl = new URL(window.location.href);
      const referrerUrl = new URL(document.referrer);

      if (
        referrerUrl.origin === currentUrl.origin
        && config.searchPaths.includes(referrerUrl.pathname)
        && referrerUrl.searchParams.has("q")
      ) {
        referrerUrl.search = "";
        configOptions.page_referrer = referrerUrl.toString();
      }
    } catch {
      // Ignore invalid referrers and keep the default analytics behavior.
    }
  }

  return configOptions;
}

function loadAnalyticsScript(analyticsScriptUrl: string) {
  const analyticsWindow = getAnalyticsWindow();

  if (document.head.querySelector(`script[${analyticsScriptAttribute}]`)) {
    return;
  }

  analyticsWindow.gtag?.("js", new Date());

  const analyticsScript = document.createElement("script");
  analyticsScript.async = true;
  analyticsScript.src = analyticsScriptUrl;
  analyticsScript.setAttribute(analyticsScriptAttribute, "true");
  analyticsScript.addEventListener("load", () => {
    markAnalyticsReady();
  }, { once: true });
  analyticsScript.addEventListener("error", () => {
    analyticsWindow.__mackysoftAnalyticsScriptLoaded = false;
  }, { once: true });
  document.head.append(analyticsScript);
}

function scheduleAnalyticsScriptLoad(analyticsScriptUrl: string) {
  const analyticsWindow = getAnalyticsWindow();
  const queueScriptLoad = () => {
    if (typeof analyticsWindow.requestIdleCallback === "function") {
      analyticsWindow.requestIdleCallback(() => {
        loadAnalyticsScript(analyticsScriptUrl);
      }, { timeout: 2000 });
      return;
    }

    setTimeout(() => {
      loadAnalyticsScript(analyticsScriptUrl);
    }, 0);
  };

  if (document.readyState === "complete") {
    queueScriptLoad();
    return;
  }

  window.addEventListener("load", queueScriptLoad, { once: true });
}

function registerAnalyticsClickTracking() {
  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const trackedElement = target.closest<HTMLElement>("[data-analytics-event]");

      if (!trackedElement) {
        return;
      }

      const payload = buildAnalyticsEventPayload({
        eventName: trackedElement.dataset.analyticsEvent,
        explicitLabel: trackedElement.dataset.analyticsLabel,
        location: trackedElement.dataset.analyticsLocation,
        href: trackedElement instanceof HTMLAnchorElement ? trackedElement.href : null,
        currentTheme: trackedElement.dataset.currentTheme,
        targetLocale: trackedElement.dataset.localeSwitchLink,
        textContent: trackedElement.textContent,
        ariaLabel: trackedElement.getAttribute("aria-label"),
      });

      if (!payload) {
        return;
      }

      sendAnalyticsEvent(payload.eventName, payload.params, { persistWhenUnavailable: true });
    },
    { capture: true },
  );
}

export function initSiteAnalytics() {
  const analyticsConfig = readSiteAnalyticsConfig();

  if (!analyticsConfig) {
    return;
  }

  initAnalyticsWindow();
  queueAnalyticsConfig(analyticsConfig.measurementId, buildAnalyticsConfigOptions(analyticsConfig));
  scheduleAnalyticsScriptLoad(analyticsConfig.analyticsScriptUrl);
  registerAnalyticsClickTracking();
}
