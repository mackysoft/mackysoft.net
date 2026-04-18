import type { AnalyticsEventParamValue } from "../lib/analytics";

export const analyticsReadyEventName = "mackysoft:analytics-ready";

const pendingAnalyticsStorageKey = "__pending_analytics_events__";
const pendingAnalyticsCallLimit = 20;

type AnalyticsParamValue = AnalyticsEventParamValue | boolean;

type AnalyticsParams = Record<string, AnalyticsParamValue>;

type PendingAnalyticsReplayCondition = {
  kind: "search-page";
  pathname: string;
  searchParam: string;
  value: string;
};

type PendingAnalyticsCall =
  | {
    command: "config";
    target: string;
    params: AnalyticsParams;
  }
  | {
    command: "event";
    target: string;
    params: AnalyticsParams;
    replayCondition?: PendingAnalyticsReplayCondition;
  };

type AnalyticsWindow = Window & typeof globalThis & {
  __mackysoftAnalyticsScriptLoaded?: boolean;
  dataLayer: unknown[];
  gtag?: (...args: unknown[]) => void;
};

function isPendingAnalyticsReplayCondition(value: unknown): value is PendingAnalyticsReplayCondition {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as {
    kind?: unknown;
    pathname?: unknown;
    searchParam?: unknown;
    value?: unknown;
  };

  return (
    candidate.kind === "search-page"
    && typeof candidate.pathname === "string"
    && typeof candidate.searchParam === "string"
    && typeof candidate.value === "string"
  );
}

function isAnalyticsParams(value: unknown): value is AnalyticsParams {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return Object.values(value).every((entry) => {
    return typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean";
  });
}

function isPendingAnalyticsCall(value: unknown): value is PendingAnalyticsCall {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("command" in value) || !("target" in value) || !("params" in value)) {
    return false;
  }

  const candidate = value as {
    command?: unknown;
    target?: unknown;
    params?: unknown;
    replayCondition?: unknown;
  };

  return (
    (candidate.command === "config" || candidate.command === "event")
    && typeof candidate.target === "string"
    && isAnalyticsParams(candidate.params)
    && (
      candidate.replayCondition === undefined
      || (candidate.command === "event" && isPendingAnalyticsReplayCondition(candidate.replayCondition))
    )
  );
}

function readPendingAnalyticsCalls() {
  try {
    const rawValue = window.sessionStorage.getItem(pendingAnalyticsStorageKey);

    if (!rawValue) {
      return [] as PendingAnalyticsCall[];
    }

    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      clearPendingAnalyticsCalls();
      return [] as PendingAnalyticsCall[];
    }

    const calls = parsedValue.filter(isPendingAnalyticsCall);

    if (calls.length !== parsedValue.length) {
      clearPendingAnalyticsCalls();
      return [] as PendingAnalyticsCall[];
    }

    return calls;
  } catch {
    clearPendingAnalyticsCalls();
    return [] as PendingAnalyticsCall[];
  }
}

function writePendingAnalyticsCalls(calls: PendingAnalyticsCall[]) {
  try {
    window.sessionStorage.setItem(pendingAnalyticsStorageKey, JSON.stringify(calls.slice(-pendingAnalyticsCallLimit)));
  } catch {
    // Ignore storage failures and keep analytics best-effort.
  }
}

function persistPendingAnalyticsCall(call: PendingAnalyticsCall) {
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

function getAnalyticsWindow() {
  return window as AnalyticsWindow;
}

function getPendingAnalyticsCallDisposition(call: PendingAnalyticsCall, location: URL) {
  if (call.command !== "event" || !call.replayCondition) {
    return "flush" as const;
  }

  if (call.replayCondition.kind === "search-page") {
    if (location.pathname !== call.replayCondition.pathname) {
      return "retain" as const;
    }

    const currentValue = location.searchParams.get(call.replayCondition.searchParam)?.trim() ?? "";
    return currentValue === call.replayCondition.value ? "flush" as const : "drop" as const;
  }

  return "flush" as const;
}

export function initAnalyticsWindow() {
  const analyticsWindow = getAnalyticsWindow();

  analyticsWindow.__mackysoftAnalyticsScriptLoaded = false;
  analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];
  analyticsWindow.gtag = analyticsWindow.gtag || function gtag(...args: unknown[]) {
    analyticsWindow.dataLayer.push(args);
  };
}

export function isAnalyticsReady() {
  const analyticsWindow = getAnalyticsWindow();
  return analyticsWindow.__mackysoftAnalyticsScriptLoaded === true && typeof analyticsWindow.gtag === "function";
}

export function flushPendingAnalyticsCalls() {
  if (!isAnalyticsReady()) {
    return;
  }

  const analyticsWindow = getAnalyticsWindow();
  const pendingCalls = readPendingAnalyticsCalls();

  if (pendingCalls.length === 0 || typeof analyticsWindow.gtag !== "function") {
    return;
  }

  const currentLocation = new URL(window.location.href);
  const remainingCalls: PendingAnalyticsCall[] = [];

  for (const call of pendingCalls) {
    const disposition = getPendingAnalyticsCallDisposition(call, currentLocation);

    if (disposition === "retain") {
      remainingCalls.push(call);
      continue;
    }

    if (disposition === "drop") {
      continue;
    }

    analyticsWindow.gtag(call.command, call.target, call.params);
  }

  if (remainingCalls.length > 0) {
    writePendingAnalyticsCalls(remainingCalls);
    return;
  }

  clearPendingAnalyticsCalls();
}

export function markAnalyticsReady() {
  const analyticsWindow = getAnalyticsWindow();
  analyticsWindow.__mackysoftAnalyticsScriptLoaded = true;
  flushPendingAnalyticsCalls();
  window.dispatchEvent(new Event(analyticsReadyEventName));
}

export function queueAnalyticsConfig(measurementId: string, params: AnalyticsParams) {
  if (isAnalyticsReady()) {
    getAnalyticsWindow().gtag?.("config", measurementId, params);
    return;
  }

  persistPendingAnalyticsCall({
    command: "config",
    target: measurementId,
    params,
  });
}

export function sendAnalyticsEvent(
  eventName: string,
  params: AnalyticsParams,
  options?: {
    onComplete?: () => void;
    persistWhenUnavailable?: boolean;
    replayCondition?: PendingAnalyticsReplayCondition;
  },
) {
  const { onComplete, persistWhenUnavailable = true, replayCondition } = options ?? {};
  const analyticsWindow = getAnalyticsWindow();

  if (!isAnalyticsReady() || typeof analyticsWindow.gtag !== "function") {
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
    analyticsWindow.gtag("event", eventName, params);
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

  analyticsWindow.gtag("event", eventName, {
    ...params,
    event_callback: complete,
    transport_type: "beacon",
  });
  window.setTimeout(complete, 1000);

  return true;
}
