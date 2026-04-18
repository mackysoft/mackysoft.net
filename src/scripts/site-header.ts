import { localeStorageKey } from "../lib/i18n";
import {
  closeDropdownPanel,
  openDropdownPanel,
  prepareDropdownPanel,
} from "./site-dropdown";

const scrollRestoreStorageKey = "mackysoft-locale-scroll";
const scrollRestoreMaxAgeMs = 15_000;
const scrollRestoreObserveDurationMs = 8_000;
const scrollRestoreIgnoreScrollWindowMs = 250;
const scrollRestoreReapplyIntervalMs = 150;
const scrollRestoreProgressTolerance = 0.01;
const scrollRestoreNavigationKeys = new Set([
  "ArrowDown",
  "ArrowUp",
  "End",
  "Home",
  "PageDown",
  "PageUp",
  " ",
  "Space",
  "Spacebar",
]);
const desktopHeaderQuery = "(min-width: 900px)";

let headerInteractionsReady = false;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getDocumentHeight() {
  return Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0);
}

function getScrollableHeight() {
  return Math.max(getDocumentHeight() - window.innerHeight, 0);
}

function getScrollProgress() {
  const scrollableHeight = getScrollableHeight();

  if (scrollableHeight === 0) {
    return 0;
  }

  return clamp(window.scrollY / scrollableHeight, 0, 1);
}

function clearScrollRestoreState() {
  try {
    window.sessionStorage.removeItem(scrollRestoreStorageKey);
  } catch {
    // Ignore storage failures and continue without restoration state.
  }
}

function consumeScrollRestoreState() {
  try {
    const rawValue = window.sessionStorage.getItem(scrollRestoreStorageKey);

    clearScrollRestoreState();

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);

    if (
      typeof parsedValue !== "object"
      || parsedValue === null
      || typeof parsedValue.pathname !== "string"
      || typeof parsedValue.progress !== "number"
      || typeof parsedValue.timestamp !== "number"
    ) {
      return null;
    }

    if (!Number.isFinite(parsedValue.progress) || !Number.isFinite(parsedValue.timestamp)) {
      return null;
    }

    if (Date.now() - parsedValue.timestamp > scrollRestoreMaxAgeMs) {
      return null;
    }

    return {
      pathname: parsedValue.pathname,
      progress: clamp(parsedValue.progress, 0, 1),
    };
  } catch {
    clearScrollRestoreState();
    return null;
  }
}

function applyScrollProgress(progress: number) {
  const scrollableHeight = getScrollableHeight();
  const nextScrollTop = clamp(Math.round(scrollableHeight * progress), 0, scrollableHeight);

  window.scrollTo({
    left: 0,
    top: nextScrollTop,
    behavior: "auto",
  });

  return nextScrollTop;
}

function scheduleScrollRestore(progress: number) {
  let observer: ResizeObserver | null = null;
  let disconnectTimeout: number | null = null;
  let reapplyInterval: number | null = null;
  let isDisposed = false;
  let ignoreScrollEventsUntil = 0;
  const applyRestoredScroll = (force = false) => {
    if (isDisposed) {
      return;
    }

    if (!force && Math.abs(getScrollProgress() - progress) <= scrollRestoreProgressTolerance) {
      return;
    }

    // Layout and programmatic restoration can emit multiple delayed scroll events on slower runners.
    // Keep a short grace window so those events do not cancel restoration prematurely.
    ignoreScrollEventsUntil = window.performance.now() + scrollRestoreIgnoreScrollWindowMs;
    applyScrollProgress(progress);
  };
  const handleLoad = () => {
    if (!isDisposed) {
      applyRestoredScroll(true);
    }
  };
  const handleScroll = () => {
    if (window.performance.now() <= ignoreScrollEventsUntil) {
      return;
    }

    dispose();
  };

  const dispose = () => {
    if (isDisposed) {
      return;
    }

    isDisposed = true;
    observer?.disconnect();

    if (disconnectTimeout !== null) {
      window.clearTimeout(disconnectTimeout);
    }

    if (reapplyInterval !== null) {
      window.clearInterval(reapplyInterval);
    }

    window.removeEventListener("wheel", dispose);
    window.removeEventListener("pointerdown", dispose);
    window.removeEventListener("touchmove", dispose);
    window.removeEventListener("keydown", disposeOnNavigationKey);
    window.removeEventListener("load", handleLoad);
    window.removeEventListener("scroll", handleScroll);
  };

  const disposeOnNavigationKey = (event: KeyboardEvent) => {
    if (scrollRestoreNavigationKeys.has(event.key)) {
      dispose();
    }
  };

  const scheduleApply = (force = false) => {
    if (isDisposed) {
      return;
    }

    window.requestAnimationFrame(() => {
      applyRestoredScroll(force);
    });
  };

  scheduleApply(true);
  window.addEventListener("load", handleLoad, { once: true });

  if ("fonts" in document) {
    document.fonts.ready.then(() => {
      if (!isDisposed) {
        applyRestoredScroll(true);
      }
    });
  }

  window.addEventListener("wheel", dispose, { passive: true });
  window.addEventListener("pointerdown", dispose, { passive: true });
  window.addEventListener("touchmove", dispose, { passive: true });
  window.addEventListener("keydown", disposeOnNavigationKey);
  window.addEventListener("scroll", handleScroll, { passive: true });

  reapplyInterval = window.setInterval(() => {
    applyRestoredScroll();
  }, scrollRestoreReapplyIntervalMs);

  if ("ResizeObserver" in window) {
    observer = new ResizeObserver(() => {
      scheduleApply(true);
    });

    observer.observe(document.documentElement);
    if (document.body) {
      observer.observe(document.body);
    }

    disconnectTimeout = window.setTimeout(() => {
      dispose();
    }, scrollRestoreObserveDurationMs);
  }
}

function persistSelectedLocale(link: HTMLAnchorElement) {
  try {
    window.localStorage.setItem(localeStorageKey, link.dataset.localeSwitchLink ?? "");
  } catch {
    // Ignore storage failures and continue navigation.
  }
}

function persistScrollRestoreState(link: HTMLAnchorElement) {
  try {
    const nextUrl = new URL(link.href, window.location.href);

    window.sessionStorage.setItem(scrollRestoreStorageKey, JSON.stringify({
      pathname: nextUrl.pathname,
      progress: getScrollProgress(),
      timestamp: Date.now(),
    }));
  } catch {
    clearScrollRestoreState();
  }
}

function isSameTabNavigation(link: HTMLAnchorElement, event?: MouseEvent) {
  if (event?.defaultPrevented) {
    return false;
  }

  if (event && (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) {
    return false;
  }

  if (link.target && link.target.toLowerCase() !== "_self") {
    return false;
  }

  return !link.hasAttribute("download");
}

function getDisclosureElements() {
  return Array.from(document.querySelectorAll("[data-site-disclosure]")).filter((element): element is HTMLDetailsElement => {
    return element instanceof HTMLDetailsElement;
  });
}

function getDisclosureToggle(disclosure: HTMLDetailsElement) {
  const toggle = disclosure.querySelector("[data-site-disclosure-toggle]");
  return toggle instanceof HTMLElement ? toggle : null;
}

function getDisclosurePanel(disclosure: HTMLDetailsElement) {
  const panel = disclosure.querySelector("[data-site-disclosure-panel]");
  return panel instanceof HTMLElement ? panel : null;
}

function syncDisclosureState(disclosure: HTMLDetailsElement) {
  const toggle = getDisclosureToggle(disclosure);

  if (toggle) {
    toggle.setAttribute("aria-expanded", String(disclosure.open));
  }
}

function closeDisclosure(disclosure: HTMLDetailsElement, restoreFocus = false) {
  disclosure.open = false;
  const panel = getDisclosurePanel(disclosure);

  if (panel) {
    closeDropdownPanel(panel);
  }

  syncDisclosureState(disclosure);

  if (restoreFocus) {
    getDisclosureToggle(disclosure)?.focus();
  }
}

function closeDisclosures(except?: HTMLDetailsElement | null) {
  for (const disclosure of getDisclosureElements()) {
    if (disclosure === except) {
      continue;
    }

    closeDisclosure(disclosure);
  }
}

function initLocaleSwitchLinks() {
  const persistedScrollState = consumeScrollRestoreState();

  if (persistedScrollState?.pathname === window.location.pathname) {
    scheduleScrollRestore(persistedScrollState.progress);
  }

  for (const link of document.querySelectorAll("[data-locale-switch-link]")) {
    if (!(link instanceof HTMLAnchorElement) || link.dataset.localeSwitchReady === "true") {
      continue;
    }

    link.dataset.localeSwitchReady = "true";
    link.addEventListener("click", (event) => {
      persistSelectedLocale(link);

      if (!isSameTabNavigation(link, event)) {
        return;
      }

      persistScrollRestoreState(link);
    });
  }
}

function initHeaderDisclosures() {
  for (const disclosure of getDisclosureElements()) {
    if (disclosure.dataset.siteDisclosureReady === "true") {
      syncDisclosureState(disclosure);
      continue;
    }

    disclosure.dataset.siteDisclosureReady = "true";
    const panel = getDisclosurePanel(disclosure);

    if (panel) {
      prepareDropdownPanel(panel, disclosure.open);
    }

    syncDisclosureState(disclosure);

    disclosure.addEventListener("toggle", () => {
      syncDisclosureState(disclosure);

      if (!panel) {
        return;
      }

      if (!disclosure.open) {
        closeDropdownPanel(panel);
        return;
      }

      openDropdownPanel(panel);
      closeDisclosures(disclosure);
      document.dispatchEvent(new CustomEvent("site-header:close-search"));
    });

    disclosure.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      closeDisclosure(disclosure, true);
    });

    disclosure.addEventListener("click", (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const link = target.closest("a[href]");

      if (!(link instanceof HTMLAnchorElement) || !disclosure.contains(link)) {
        return;
      }

      if (isSameTabNavigation(link, event)) {
        closeDisclosure(disclosure);
      }
    });
  }
}

function initMobileNavBreakpointSync() {
  const mediaQuery = window.matchMedia(desktopHeaderQuery);
  const closeMobileNavs = () => {
    if (!mediaQuery.matches) {
      return;
    }

    for (const disclosure of document.querySelectorAll("[data-site-mobile-nav]")) {
      if (disclosure instanceof HTMLDetailsElement) {
        closeDisclosure(disclosure);
      }
    }
  };

  closeMobileNavs();
  mediaQuery.addEventListener("change", closeMobileNavs);
}

export function initSiteHeader() {
  initLocaleSwitchLinks();
  initHeaderDisclosures();

  if (headerInteractionsReady) {
    return;
  }

  headerInteractionsReady = true;

  document.addEventListener("pointerdown", (event) => {
    const target = event.target;

    if (!(target instanceof Node)) {
      return;
    }

    for (const disclosure of getDisclosureElements()) {
      if (!disclosure.open || disclosure.contains(target)) {
        continue;
      }

      closeDisclosure(disclosure);
    }
  });

  document.addEventListener("site-header:close-disclosures", () => {
    closeDisclosures();
  });

  initMobileNavBreakpointSync();
}
