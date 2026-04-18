import type { AnalyticsEventParamValue } from "../lib/analytics";

type AnalyticsParamValue = AnalyticsEventParamValue | boolean;

type AnalyticsParams = Record<string, AnalyticsParamValue>;

type AnalyticsWindow = Window & typeof globalThis & {
  __mackysoftAnalyticsScriptLoaded?: boolean;
  dataLayer: unknown[];
  gtag?: (...args: unknown[]) => void;
};

function getAnalyticsWindow() {
  return window as AnalyticsWindow;
}

export function initAnalyticsWindow() {
  const analyticsWindow = getAnalyticsWindow();

  analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];
  analyticsWindow.gtag = analyticsWindow.gtag || function gtag(...args: unknown[]) {
    analyticsWindow.dataLayer.push(args);
  };
}

export function markAnalyticsReady() {
  getAnalyticsWindow().__mackysoftAnalyticsScriptLoaded = true;
}

export function queueAnalyticsConfig(measurementId: string, params: AnalyticsParams) {
  initAnalyticsWindow();
  getAnalyticsWindow().gtag?.("config", measurementId, params);
}

export function sendAnalyticsEvent(eventName: string, params: AnalyticsParams) {
  initAnalyticsWindow();
  getAnalyticsWindow().gtag?.("event", eventName, params);
}
