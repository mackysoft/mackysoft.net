const clickAnalyticsEventNames = [
  "theme_switch",
  "locale_switch",
  "project_cta_click",
  "external_link_click",
] as const;

const analyticsEventNames = [
  ...clickAnalyticsEventNames,
  "site_search",
] as const;

export type ClickAnalyticsEventName = (typeof clickAnalyticsEventNames)[number];
export type AnalyticsEventName = (typeof analyticsEventNames)[number];
export type AnalyticsEventParamValue = string | number;

export type AnalyticsEventPayload = {
  eventName: AnalyticsEventName;
  params: Record<string, AnalyticsEventParamValue>;
};

export type ClickAnalyticsEventPayload = {
  eventName: ClickAnalyticsEventName;
  params: Record<string, AnalyticsEventParamValue>;
};

export type AnalyticsPayloadInput = {
  eventName: string | null | undefined;
  explicitLabel?: string | null | undefined;
  location?: string | null | undefined;
  href?: string | null | undefined;
  currentTheme?: string | null | undefined;
  targetLocale?: string | null | undefined;
  textContent?: string | null | undefined;
  ariaLabel?: string | null | undefined;
};

export type SiteSearchAnalyticsPayloadInput = {
  searchTerm?: string | null | undefined;
  location?: string | null | undefined;
};

function normalizeAnalyticsValue(value: string | null | undefined) {
  const normalizedValue = value?.replace(/\s+/g, " ").trim();

  return normalizedValue ? normalizedValue : null;
}

function normalizeAnalyticsHref(value: string | null | undefined) {
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

function isClickAnalyticsEventName(value: string): value is ClickAnalyticsEventName {
  return (clickAnalyticsEventNames as readonly string[]).includes(value);
}

function getTargetTheme(currentTheme: string | null) {
  if (currentTheme === "dark") {
    return "light";
  }

  if (currentTheme === "light") {
    return "dark";
  }

  return null;
}

export function getAnalyticsMeasurementId(value: string | null | undefined) {
  return normalizeAnalyticsValue(value);
}

export function isAnalyticsEnabled(value: string | null | undefined) {
  return getAnalyticsMeasurementId(value) !== null;
}

export function buildAnalyticsEventPayload(input: AnalyticsPayloadInput): ClickAnalyticsEventPayload | null {
  const eventName = normalizeAnalyticsValue(input.eventName);

  if (!eventName || !isClickAnalyticsEventName(eventName)) {
    return null;
  }

  const label =
    normalizeAnalyticsValue(input.explicitLabel)
    ?? normalizeAnalyticsValue(input.ariaLabel)
    ?? normalizeAnalyticsValue(input.textContent);
  const location = normalizeAnalyticsValue(input.location);
  const href = normalizeAnalyticsHref(input.href);
  const params: Record<string, AnalyticsEventParamValue> = {};

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
    const targetTheme = getTargetTheme(normalizeAnalyticsValue(input.currentTheme));

    if (targetTheme) {
      params.target_theme = targetTheme;
    }
  }

  if (eventName === "locale_switch") {
    const targetLocale = normalizeAnalyticsValue(input.targetLocale) ?? label;

    if (targetLocale) {
      params.target_locale = targetLocale;
    }
  }

  return {
    eventName,
    params,
  };
}

export function buildSiteSearchAnalyticsEventPayload(input: SiteSearchAnalyticsPayloadInput): AnalyticsEventPayload | null {
  const searchTerm = normalizeAnalyticsValue(input.searchTerm);
  const location = normalizeAnalyticsValue(input.location);

  if (!searchTerm || !location) {
    return null;
  }

  return {
    eventName: "site_search",
    params: {
      search_term: searchTerm,
      ui_location: location,
    },
  };
}
