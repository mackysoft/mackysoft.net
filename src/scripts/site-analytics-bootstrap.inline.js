(() => {
  const analyticsReadyEventName = "mackysoft:analytics-ready";
  const pendingAnalyticsStorageKey = "__pending_analytics_events__";
  const pendingAnalyticsCallLimit = 20;
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

  function isAnalyticsParams(value) {
    if (typeof value !== "object" || value === null) {
      return false;
    }

    return Object.values(value).every((entry) => {
      return typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean";
    });
  }

  function isPendingAnalyticsReplayCondition(value) {
    if (typeof value !== "object" || value === null) {
      return false;
    }

    return (
      value.kind === "search-page"
      && typeof value.pathname === "string"
      && typeof value.searchParam === "string"
      && typeof value.value === "string"
    );
  }

  function isPendingAnalyticsCall(value) {
    if (typeof value !== "object" || value === null) {
      return false;
    }

    return (
      (value.command === "config" || value.command === "event")
      && typeof value.target === "string"
      && isAnalyticsParams(value.params)
      && (
        value.replayCondition === undefined
        || (value.command === "event" && isPendingAnalyticsReplayCondition(value.replayCondition))
      )
    );
  }

  function readPendingAnalyticsCalls() {
    try {
      const rawValue = window.sessionStorage.getItem(pendingAnalyticsStorageKey);

      if (!rawValue) {
        return [];
      }

      const parsedValue = JSON.parse(rawValue);

      if (!Array.isArray(parsedValue)) {
        clearPendingAnalyticsCalls();
        return [];
      }

      const calls = parsedValue.filter(isPendingAnalyticsCall);

      if (calls.length !== parsedValue.length) {
        clearPendingAnalyticsCalls();
        return [];
      }

      return calls;
    } catch {
      clearPendingAnalyticsCalls();
      return [];
    }
  }

  function writePendingAnalyticsCalls(calls) {
    try {
      window.sessionStorage.setItem(
        pendingAnalyticsStorageKey,
        JSON.stringify(calls.slice(-pendingAnalyticsCallLimit)),
      );
    } catch {
      // Ignore storage failures and keep analytics best-effort.
    }
  }

  function persistPendingAnalyticsCall(call) {
    const pendingCalls = readPendingAnalyticsCalls();
    pendingCalls.push(call);
    writePendingAnalyticsCalls(pendingCalls);
  }

  function clearPendingAnalyticsCalls() {
    try {
      window.sessionStorage.removeItem(pendingAnalyticsStorageKey);
    } catch {
      // Ignore storage failures and keep analytics best-effort.
    }
  }

  function getPendingAnalyticsCallDisposition(call, location) {
    if (call.command !== "event" || !call.replayCondition) {
      return "flush";
    }

    if (call.replayCondition.kind === "search-page") {
      if (location.pathname !== call.replayCondition.pathname) {
        return "retain";
      }

      const currentValue = location.searchParams.get(call.replayCondition.searchParam)?.trim() ?? "";
      return currentValue === call.replayCondition.value ? "flush" : "drop";
    }

    return "flush";
  }

  function isCurrentPageConfigCall(call, location) {
    if (call.command !== "config" || typeof call.params.page_location !== "string") {
      return false;
    }

    try {
      return new URL(call.params.page_location).pathname === location.pathname;
    } catch {
      return false;
    }
  }

  function findCurrentPageConfigIndex(calls, location) {
    for (let index = calls.length - 1; index >= 0; index -= 1) {
      if (isCurrentPageConfigCall(calls[index], location)) {
        return index;
      }
    }

    return -1;
  }

  function flushPendingAnalyticsEventCalls(calls) {
    if (typeof window.gtag !== "function") {
      return;
    }

    for (const call of calls) {
      window.gtag(call.command, call.target, call.params);
    }
  }

  function initAnalyticsWindow() {
    window.__mackysoftAnalyticsScriptLoaded = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag(...args) {
      window.dataLayer.push(args);
    };
  }

  function isAnalyticsReady() {
    return window.__mackysoftAnalyticsScriptLoaded === true && typeof window.gtag === "function";
  }

  function flushPendingAnalyticsCalls() {
    if (!isAnalyticsReady()) {
      return;
    }

    const pendingCalls = readPendingAnalyticsCalls();

    if (pendingCalls.length === 0 || typeof window.gtag !== "function") {
      return;
    }

    const currentLocation = new URL(window.location.href);
    const remainingCalls = [];
    const delayedReplayCalls = [];
    const currentPageConfigIndex = findCurrentPageConfigIndex(pendingCalls, currentLocation);
    let didFlushCurrentPageConfig = false;

    for (const [index, call] of pendingCalls.entries()) {
      const disposition = getPendingAnalyticsCallDisposition(call, currentLocation);

      if (disposition === "retain") {
        remainingCalls.push(call);
        continue;
      }

      if (disposition === "drop") {
        continue;
      }

      if (call.command === "event" && call.replayCondition) {
        if (didFlushCurrentPageConfig) {
          window.gtag(call.command, call.target, call.params);
          continue;
        }

        delayedReplayCalls.push(call);
        continue;
      }

      window.gtag(call.command, call.target, call.params);

      if (index === currentPageConfigIndex) {
        didFlushCurrentPageConfig = true;

        if (delayedReplayCalls.length > 0) {
          flushPendingAnalyticsEventCalls(delayedReplayCalls);
          delayedReplayCalls.length = 0;
        }
      }
    }

    if (delayedReplayCalls.length > 0) {
      flushPendingAnalyticsEventCalls(delayedReplayCalls);
    }

    if (remainingCalls.length > 0) {
      writePendingAnalyticsCalls(remainingCalls);
      return;
    }

    clearPendingAnalyticsCalls();
  }

  function markAnalyticsReady() {
    window.__mackysoftAnalyticsScriptLoaded = true;
    flushPendingAnalyticsCalls();
    window.dispatchEvent(new Event(analyticsReadyEventName));
  }

  function queueAnalyticsConfig(measurementId, params) {
    if (isAnalyticsReady()) {
      window.gtag?.("config", measurementId, params);
      return;
    }

    persistPendingAnalyticsCall({
      command: "config",
      target: measurementId,
      params,
    });
  }

  function sendAnalyticsEvent(eventName, params, options) {
    const { onComplete, persistWhenUnavailable = true, replayCondition } = options ?? {};

    if (!isAnalyticsReady() || typeof window.gtag !== "function") {
      if (persistWhenUnavailable) {
        persistPendingAnalyticsCall({
          command: "event",
          target: eventName,
          params,
          replayCondition,
        });
      }

      onComplete?.();
      return false;
    }

    if (!onComplete) {
      window.gtag("event", eventName, params);
      return true;
    }

    let completed = false;
    const complete = () => {
      if (completed) {
        return;
      }

      completed = true;
      onComplete();
    };

    window.gtag("event", eventName, {
      ...params,
      event_callback: complete,
      transport_type: "beacon",
    });
    window.setTimeout(complete, 1000);

    return true;
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

    window.gtag?.("js", new Date());

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

        sendAnalyticsEvent(payload.eventName, payload.params, { persistWhenUnavailable: true });
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
    queueAnalyticsConfig(analyticsConfig.measurementId, buildAnalyticsConfigOptions(analyticsConfig));
    scheduleAnalyticsScriptLoad(analyticsConfig.analyticsScriptUrl);
    registerAnalyticsClickTracking();
  }

  initSiteAnalytics();
})();
