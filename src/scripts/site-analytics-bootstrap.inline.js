(() => {
  const analyticsConfigElementId = "site-analytics-config";
  const analyticsScriptAttribute = "data-site-analytics-script";
  const clickAnalyticsEventNames = new Set([
    "theme_switch",
    "locale_switch",
    "external_link_click",
  ]);

  function normalizeAnalyticsValue(value) {
    const normalizedValue = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : null;
    return normalizedValue ? normalizedValue : null;
  }

  function normalizeAnalyticsHref(value) {
    const normalizedValue = normalizeAnalyticsValue(value);

    if (!normalizedValue) {
      return null;
    }

    try {
      const url = new URL(normalizedValue);

      if (url.protocol === "http:" || url.protocol === "https:") {
        return url.toString();
      }
    } catch {
      return null;
    }

    return null;
  }

  function getTargetTheme(currentTheme) {
    if (currentTheme === "dark") {
      return "light";
    }

    if (currentTheme === "light") {
      return "dark";
    }

    return null;
  }

  function buildAnalyticsEventPayload(trackedElement) {
    const eventName = normalizeAnalyticsValue(trackedElement.dataset.analyticsEvent);

    if (!eventName || !clickAnalyticsEventNames.has(eventName)) {
      return null;
    }

    const label =
      normalizeAnalyticsValue(trackedElement.dataset.analyticsLabel)
      ?? normalizeAnalyticsValue(trackedElement.getAttribute("aria-label"))
      ?? normalizeAnalyticsValue(trackedElement.textContent);
    const location = normalizeAnalyticsValue(trackedElement.dataset.analyticsLocation);
    const href = normalizeAnalyticsHref(trackedElement instanceof HTMLAnchorElement ? trackedElement.href : null);
    const params = {};

    if (label) {
      params.target_label = label;
    }

    if (location) {
      params.ui_location = location;
    }

    if (href) {
      params.target_href = href;
    }

    if (eventName === "theme_switch") {
      const targetTheme = getTargetTheme(normalizeAnalyticsValue(trackedElement.dataset.currentTheme));

      if (targetTheme) {
        params.target_theme = targetTheme;
      }
    }

    if (eventName === "locale_switch") {
      const targetLocale = normalizeAnalyticsValue(trackedElement.dataset.localeSwitchLink) ?? label;

      if (targetLocale) {
        params.target_locale = targetLocale;
      }
    }

    return {
      eventName,
      params,
    };
  }

  function initAnalyticsWindow() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag(...args) {
      window.dataLayer.push(args);
    };
  }

  function queueAnalyticsConfig(measurementId, params) {
    window.gtag?.("config", measurementId, params);
  }

  function queueAnalyticsBootstrap() {
    window.gtag?.("js", new Date());
  }

  function trackAnalyticsEvent(eventName, params) {
    window.gtag?.("event", eventName, params);
  }

  function markAnalyticsReady() {
    window.__mackysoftAnalyticsScriptLoaded = true;
  }

  function isSiteAnalyticsConfig(value) {
    if (typeof value !== "object" || value === null) {
      return false;
    }

    return (
      typeof value.analyticsScriptUrl === "string"
      && typeof value.measurementId === "string"
      && (typeof value.pageLocation === "string" || value.pageLocation === null)
      && Array.isArray(value.searchPaths)
      && value.searchPaths.every((entry) => typeof entry === "string")
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

  function buildAnalyticsConfigOptions(config) {
    const skipInitialPageView = window.__mackysoftSkipInitialPageView === true;
    const configOptions = {
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

  function loadAnalyticsScript(analyticsScriptUrl) {
    if (document.head.querySelector(`script[${analyticsScriptAttribute}]`)) {
      return;
    }

    const analyticsScript = document.createElement("script");
    analyticsScript.async = true;
    analyticsScript.src = analyticsScriptUrl;
    analyticsScript.setAttribute(analyticsScriptAttribute, "true");
    analyticsScript.addEventListener("load", () => {
      markAnalyticsReady();
    }, { once: true });
    analyticsScript.addEventListener("error", () => {
      window.__mackysoftAnalyticsScriptLoaded = false;
    }, { once: true });
    document.head.append(analyticsScript);
  }

  function scheduleAnalyticsScriptLoad(analyticsScriptUrl) {
    const queueScriptLoad = () => {
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(() => {
          loadAnalyticsScript(analyticsScriptUrl);
        }, { timeout: 2000 });
        return;
      }

      window.setTimeout(() => {
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
    if (window.__mackysoftAnalyticsClickTrackingReady === true) {
      return;
    }

    window.__mackysoftAnalyticsClickTrackingReady = true;
    document.addEventListener(
      "click",
      (event) => {
        const target = event.target;

        if (!(target instanceof Element)) {
          return;
        }

        const trackedElement = target.closest("[data-analytics-event]");

        if (!(trackedElement instanceof HTMLElement)) {
          return;
        }

        const payload = buildAnalyticsEventPayload(trackedElement);

        if (!payload) {
          return;
        }

        trackAnalyticsEvent(payload.eventName, payload.params);
      },
      { capture: true },
    );
  }

  function initSiteAnalytics() {
    const analyticsConfig = readSiteAnalyticsConfig();

    if (!analyticsConfig) {
      return;
    }

    initAnalyticsWindow();
    queueAnalyticsBootstrap();
    queueAnalyticsConfig(analyticsConfig.measurementId, buildAnalyticsConfigOptions(analyticsConfig));
    scheduleAnalyticsScriptLoad(analyticsConfig.analyticsScriptUrl);
    registerAnalyticsClickTracking();
  }

  initSiteAnalytics();
})();
