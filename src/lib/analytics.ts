const implementedAnalyticsEventNames = [
  "theme_switch",
  "locale_switch",
  "project_cta_click",
  "external_link_click",
] as const;

const reservedAnalyticsEventNames = ["view_search_results"] as const;

export type ImplementedAnalyticsEventName = (typeof implementedAnalyticsEventNames)[number];
export type AnalyticsEventName = ImplementedAnalyticsEventName | (typeof reservedAnalyticsEventNames)[number];

export type AnalyticsEventPayload = {
  eventName: ImplementedAnalyticsEventName;
  params: Record<string, string>;
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

function normalizeAnalyticsValue(value: string | null | undefined) {
  const normalizedValue = value?.replace(/\s+/g, " ").trim();

  return normalizedValue ? normalizedValue : null;
}

function isImplementedAnalyticsEventName(value: string): value is ImplementedAnalyticsEventName {
  return (implementedAnalyticsEventNames as readonly string[]).includes(value);
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

export function buildAnalyticsEventPayload(input: AnalyticsPayloadInput): AnalyticsEventPayload | null {
  const eventName = normalizeAnalyticsValue(input.eventName);

  if (!eventName || !isImplementedAnalyticsEventName(eventName)) {
    return null;
  }

  const label =
    normalizeAnalyticsValue(input.explicitLabel)
    ?? normalizeAnalyticsValue(input.ariaLabel)
    ?? normalizeAnalyticsValue(input.textContent);
  const location = normalizeAnalyticsValue(input.location);
  const href = normalizeAnalyticsValue(input.href);
  const params: Record<string, string> = {};

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
