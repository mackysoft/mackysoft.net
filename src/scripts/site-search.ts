import {
  createSearchQueryVariants,
  formatSearchResultDate,
  getSearchContentType,
  hasExactSearchVariant,
  isExternalSearchUrl,
  prepareVisibleSearchResults,
  selectSearchExcerpt,
  selectSearchImage,
  selectSearchSubResult,
  selectSearchTargetUrl,
  type RankedSearchResult,
  type SearchResultDataLike,
} from "../lib/search";
import {
  formatSearchResultCountLabel,
  formatSearchResultPreviewLabel,
  getUiText,
} from "../lib/ui-text";
import { isSiteLocale, type SiteLocale } from "../lib/i18n";
import {
  closeDropdownPanel,
  openDropdownPanel,
  prepareDropdownPanel,
} from "./site-dropdown";

type PagefindResult = {
  id: string;
  score: number;
  data: () => Promise<PagefindSearchResultData>;
};

type PagefindSearchResponse = {
  results: PagefindResult[];
};

type PagefindSearchResultData = SearchResultDataLike & {
  meta: {
    title?: string;
    description?: string;
    image?: string;
    imageAlt?: string;
    updatedAt?: string;
    source?: string;
    type?: string;
    targetUrl?: string;
  };
};

type PagefindModule = {
  options: (options: { bundlePath: string }) => Promise<void> | void;
  init: () => Promise<void>;
  search: (term: string) => Promise<PagefindSearchResponse>;
  debouncedSearch: (term: string, options?: Record<string, never>, debounceMs?: number) => Promise<PagefindSearchResponse | null>;
};

type SearchPanelElements = {
  root: HTMLElement;
  form: HTMLFormElement;
  input: HTMLInputElement;
  results: HTMLElement;
  summary: HTMLElement;
  content: HTMLElement;
  live: HTMLElement;
  locale: SiteLocale;
  mode: "page" | "inline";
  searchPath: string;
};

let pagefindPromise: Promise<PagefindModule> | null = null;
let activeSearchTrigger: HTMLElement | null = null;
let activeSearchPanel: HTMLElement | null = null;
let searchInteractionsReady = false;
const pagefindBundlePath = "/pagefind/pagefind.js";
const searchInlineViewportPadding = 16;

async function importPagefindBundle(bundlePath: string) {
  return new Function("path", "return import(path)")(bundlePath) as Promise<PagefindModule>;
}

async function loadPagefind() {
  if (!pagefindPromise) {
    pagefindPromise = (async () => {
      const pagefind = await importPagefindBundle(pagefindBundlePath);
      await pagefind.options({ bundlePath: "/pagefind/" });
      await pagefind.init();
      return pagefind;
    })().catch((error) => {
      pagefindPromise = null;
      throw error;
    });
  }

  return pagefindPromise;
}

function createStateBlock(title: string, body: string, modifier?: string) {
  const wrapper = document.createElement("div");
  wrapper.className = ["site-search__state", modifier].filter(Boolean).join(" ");

  const heading = document.createElement("p");
  heading.className = "site-search__state-title";
  heading.textContent = title;
  wrapper.append(heading);

  const description = document.createElement("p");
  description.className = "site-search__state-body";
  description.textContent = body;
  wrapper.append(description);

  return wrapper;
}

function hideSummary(elements: SearchPanelElements) {
  elements.summary.hidden = true;
  elements.summary.textContent = "";
}

function hideResultsArea(elements: SearchPanelElements) {
  if (elements.mode === "inline") {
    elements.results.hidden = true;
  }
}

function showResultsArea(elements: SearchPanelElements) {
  elements.results.hidden = false;
}

function showSummary(elements: SearchPanelElements, text: string) {
  elements.summary.hidden = false;
  elements.summary.textContent = text;
}

function renderIdleState(elements: SearchPanelElements) {
  hideSummary(elements);

  if (elements.mode === "inline") {
    hideResultsArea(elements);
    elements.content.replaceChildren();
    elements.live.textContent = "";
    return;
  }

  showResultsArea(elements);
  const uiText = getUiText(elements.locale);
  elements.content.replaceChildren(createStateBlock(uiText.search.noQueryTitle, uiText.search.noQueryBody));
  elements.live.textContent = uiText.search.noQueryTitle;
}

function renderLoadingState(elements: SearchPanelElements) {
  const uiText = getUiText(elements.locale);
  showResultsArea(elements);
  hideSummary(elements);
  elements.content.replaceChildren(createStateBlock(uiText.search.loading, "", "site-search__state--loading"));
  elements.live.textContent = uiText.search.loading;
}

function renderErrorState(elements: SearchPanelElements) {
  const uiText = getUiText(elements.locale);
  showResultsArea(elements);
  hideSummary(elements);
  elements.content.replaceChildren(createStateBlock(uiText.search.errorTitle, uiText.search.errorBody, "site-search__state--error"));
  elements.live.textContent = uiText.search.errorTitle;
}

function renderEmptyState(elements: SearchPanelElements) {
  const uiText = getUiText(elements.locale);
  showResultsArea(elements);
  hideSummary(elements);
  elements.content.replaceChildren(createStateBlock(uiText.search.emptyTitle, uiText.search.emptyBody));
  elements.live.textContent = uiText.search.emptyTitle;
}

function syncSearchPageUrl(elements: SearchPanelElements, query: string) {
  if (elements.mode !== "page") {
    return;
  }

  const nextUrl = new URL(window.location.href);
  nextUrl.pathname = elements.searchPath;

  if (query) {
    nextUrl.searchParams.set("q", query);
  } else {
    nextUrl.searchParams.delete("q");
  }

  window.history.replaceState(null, "", `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
}

function createMetaItem(text: string) {
  const item = document.createElement("span");
  item.textContent = text;
  return item;
}

function createResultCard(result: PagefindSearchResultData, locale: SiteLocale, mode: "page" | "inline") {
  const uiText = getUiText(locale);
  const card = document.createElement("article");
  card.className = "site-search-card activity-card";

  const title = result.meta.title?.trim() || selectSearchTargetUrl(result);
  const targetUrl = selectSearchTargetUrl(result);
  const excerpt = selectSearchExcerpt(result);
  const excerptHtml = selectSearchSubResult(result)?.excerpt ?? result.excerpt ?? undefined;
  const type = getSearchContentType(result.meta.type);
  const source = result.meta.source?.trim();
  const formattedDate = formatSearchResultDate(result.meta.updatedAt, locale);
  const external = isExternalSearchUrl(targetUrl, window.location.origin);
  const image = selectSearchImage(result);

  const link = document.createElement("a");
  link.className = "activity-card__link-layer";
  link.href = targetUrl;
  link.setAttribute("aria-label", title);

  if (external) {
    link.target = "_blank";
    link.rel = "noreferrer";
  }

  card.append(link);

  if (mode === "page") {
    const cover = document.createElement("div");
    cover.className = "site-search-card__cover activity-card__cover";

    if (image) {
      cover.dataset.coverState = "ready";

      const img = document.createElement("img");
      img.src = image.src;
      img.alt = image.alt;
      img.width = 480;
      img.height = 252;
      img.sizes = "(max-width: 720px) 100vw, 28rem";
      img.loading = "lazy";
      img.decoding = "async";

      cover.append(img);
    } else {
      cover.dataset.coverState = "empty";
      cover.setAttribute("aria-hidden", "true");
    }

    card.append(cover);
  }

  const body = document.createElement("div");
  body.className = "site-search-card__body activity-card__body";

  const heading = document.createElement("h2");
  heading.className = "site-search-card__title activity-card__title";
  heading.textContent = title;
  body.append(heading);

  const copy = document.createElement("div");
  copy.className = "site-search-card__copy";

  if (excerpt) {
    const excerptElement = document.createElement("p");
    excerptElement.className = "site-search-card__excerpt";

    if (excerptHtml) {
      excerptElement.innerHTML = excerptHtml;
    } else {
      excerptElement.textContent = excerpt;
    }

    copy.append(excerptElement);
  }

  body.append(copy);

  const footer = document.createElement("div");
  footer.className = "site-search-card__footer";

  const meta = document.createElement("p");
  meta.className = "site-search-card__meta activity-card__meta";

  if (formattedDate) {
    meta.append(createMetaItem(formattedDate));
  }

  if (source) {
    meta.append(createMetaItem(source));
  }

  if (meta.childElementCount > 0) {
    footer.append(meta);
  }

  const badges = document.createElement("div");
  badges.className = "activity-card__badges";

  const typeBadge = document.createElement("span");
  typeBadge.className = "activity-card__badge";
  typeBadge.textContent = uiText.search.typeLabel[type];
  badges.append(typeBadge);

  if (external) {
    const externalBadge = document.createElement("span");
    externalBadge.className = "activity-card__badge";
    externalBadge.textContent = uiText.search.externalBadge;
    badges.append(externalBadge);
  }

  footer.append(badges);
  body.append(footer);

  card.append(body);

  return card;
}

function renderResults(
  elements: SearchPanelElements,
  results: PagefindSearchResultData[],
  totalCount = results.length,
) {
  if (results.length === 0) {
    renderEmptyState(elements);
    return;
  }

  const summaryText = totalCount > results.length
    ? formatSearchResultPreviewLabel(totalCount, results.length, elements.locale)
    : formatSearchResultCountLabel(totalCount, elements.locale);

  const cards = document.createElement("div");
  cards.className = "site-search__results-grid";

  for (const result of results) {
    cards.append(createResultCard(result, elements.locale, elements.mode));
  }

  showResultsArea(elements);
  showSummary(elements, summaryText);
  elements.content.replaceChildren(cards);
  elements.live.textContent = summaryText;
}

function getPanelElements(root: HTMLElement): SearchPanelElements | null {
  const form = root.querySelector("[data-site-search-form]");
  const input = root.querySelector("[data-site-search-input]");
  const results = root.querySelector("[data-site-search-results]");
  const summary = root.querySelector("[data-site-search-summary]");
  const content = root.querySelector("[data-site-search-content]");
  const live = root.querySelector("[data-site-search-live]");
  const locale = root.dataset.searchLocale;
  const mode = root.dataset.searchMode;
  const searchPath = root.dataset.searchPath;

  if (
    !(form instanceof HTMLFormElement)
    || !(input instanceof HTMLInputElement)
    || !(results instanceof HTMLElement)
    || !(summary instanceof HTMLElement)
    || !(content instanceof HTMLElement)
    || !(live instanceof HTMLElement)
    || !locale
    || !isSiteLocale(locale)
    || (mode !== "page" && mode !== "inline")
    || !searchPath
  ) {
    return null;
  }

  return {
    root,
    form,
    input,
    results,
    summary,
    content,
    live,
    locale,
    mode,
    searchPath,
  };
}

function focusSearchInput(container: ParentNode) {
  const input = container.querySelector("[data-site-search-input]");

  if (input instanceof HTMLInputElement) {
    window.requestAnimationFrame(() => {
      input.focus();
      input.select();
    });
  }
}

function initSearchPanel(root: HTMLElement) {
  if (root.dataset.searchReady === "true") {
    return;
  }

  const elements = getPanelElements(root);

  if (!elements) {
    return;
  }

  root.dataset.searchReady = "true";

  let currentRequestId = 0;
  const initialQueryFromUrl = elements.mode === "page"
    ? new URL(window.location.href).searchParams.get("q")?.trim() ?? ""
    : "";

  if (initialQueryFromUrl && elements.input.value !== initialQueryFromUrl) {
    elements.input.value = initialQueryFromUrl;
  }

  const searchPagefind = async (pagefind: PagefindModule, queryVariants: ReturnType<typeof createSearchQueryVariants>, immediate: boolean) => {
    if (queryVariants.length === 0) {
      return [];
    }

    const [primaryQuery, fallbackQuery] = queryVariants;
    const primaryResponse = immediate
      ? await pagefind.search(primaryQuery.value)
      : await pagefind.debouncedSearch(primaryQuery.value, {}, 250);

    if (primaryResponse === null) {
      return null;
    }

    const mergedEntries = new Map<string, { entry: PagefindResult; variantOrder: number; resultOrder: number }>();

    for (const [variantOrder, response] of [primaryResponse].entries()) {
      for (const [resultOrder, entry] of response.results.entries()) {
        mergedEntries.set(entry.id, {
          entry,
          variantOrder,
          resultOrder,
        });
      }
    }

    if (fallbackQuery) {
      const fallbackResponse = await pagefind.search(fallbackQuery.value);

      for (const [resultOrder, entry] of fallbackResponse.results.entries()) {
        if (!mergedEntries.has(entry.id)) {
          mergedEntries.set(entry.id, {
            entry,
            variantOrder: 1,
            resultOrder,
          });
        }
      }
    }

    return [...mergedEntries.values()];
  };

  const runSearch = async (rawQuery: string, immediate = false) => {
    const query = rawQuery.trim();
    currentRequestId += 1;
    const requestId = currentRequestId;
    syncSearchPageUrl(elements, query);

    if (!query) {
      renderIdleState(elements);
      return;
    }

    renderLoadingState(elements);

    try {
      const pagefind = await loadPagefind();
      const queryVariants = createSearchQueryVariants(query, elements.locale);
      const shouldRerank = hasExactSearchVariant(queryVariants);
      const responseEntries = await searchPagefind(pagefind, queryVariants, immediate);

      if (responseEntries === null || requestId !== currentRequestId) {
        return;
      }

      const totalCount = responseEntries.length;
      const entriesToLoad = !shouldRerank && elements.mode === "inline"
        ? responseEntries.slice(0, 20)
        : responseEntries;
      const results = await Promise.all(entriesToLoad.map(async ({ entry, variantOrder, resultOrder }) => ({
        data: await entry.data(),
        variantOrder,
        resultOrder,
        score: entry.score,
      } satisfies RankedSearchResult)));

      if (requestId !== currentRequestId) {
        return;
      }

      const visibleResults = prepareVisibleSearchResults(results, query, shouldRerank, elements.mode);

      renderResults(elements, visibleResults.map((result) => result.data), totalCount);
    } catch {
      if (requestId !== currentRequestId) {
        return;
      }

      renderErrorState(elements);
    }
  };

  elements.input.addEventListener("focus", () => {
    void loadPagefind();
  }, { once: true });

  elements.input.addEventListener("input", () => {
    void runSearch(elements.input.value);
  });

  elements.form.addEventListener("submit", (event) => {
    if (elements.mode === "inline") {
      elements.input.value = elements.input.value.trim();
      return;
    }

    event.preventDefault();
    void runSearch(elements.input.value, true);
  });

  const initialQuery = elements.input.value.trim();

  if (initialQuery) {
    void runSearch(initialQuery, true);
  } else {
    renderIdleState(elements);
  }
}

function closeInlinePanel(panel: HTMLElement, restoreFocus = true) {
  closeDropdownPanel(panel);
  activeSearchTrigger?.setAttribute("aria-expanded", "false");

  if (restoreFocus) {
    activeSearchTrigger?.focus();
  }

  if (activeSearchPanel === panel) {
    activeSearchPanel = null;
  }
  activeSearchTrigger = null;
}

function closeActiveSearchPanel(restoreFocus = true) {
  if (!activeSearchPanel) {
    return;
  }

  closeInlinePanel(activeSearchPanel, restoreFocus);
}

function syncInlinePanelWidth(panel: HTMLElement) {
  panel.style.removeProperty("width");

  const rect = panel.getBoundingClientRect();
  const minLeft = searchInlineViewportPadding;

  if (rect.left < minLeft) {
    const nextWidth = Math.max(rect.right - minLeft, 0);
    panel.style.width = `${nextWidth}px`;
  }
}

function openInlinePanel(panel: HTMLElement, trigger: HTMLElement) {
  document.dispatchEvent(new CustomEvent("site-header:close-disclosures"));
  openDropdownPanel(panel);
  trigger.setAttribute("aria-expanded", "true");
  activeSearchTrigger = trigger;
  activeSearchPanel = panel;
  syncInlinePanelWidth(panel);
  focusSearchInput(panel);
}

function initSearchInlinePanel(panel: HTMLElement) {
  if (panel.dataset.searchInlineReady === "true") {
    return;
  }

  panel.dataset.searchInlineReady = "true";
  prepareDropdownPanel(panel, !panel.hidden);

  panel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeInlinePanel(panel);
    }
  });

  const closeButton = panel.querySelector("[data-site-search-close]");

  if (closeButton instanceof HTMLButtonElement) {
    closeButton.addEventListener("click", () => {
      closeInlinePanel(panel);
    });
  }
}

function initSearchTrigger(trigger: HTMLElement) {
  if (trigger.dataset.searchTriggerReady === "true") {
    return;
  }

  const panelId = trigger.dataset.siteSearchPanelId;

  if (!panelId) {
    return;
  }

  const panel = document.getElementById(panelId);

  if (!(panel instanceof HTMLElement)) {
    return;
  }

  trigger.dataset.searchTriggerReady = "true";
  initSearchInlinePanel(panel);

  trigger.addEventListener("click", (event) => {
    event.preventDefault();

    if (panel.hidden) {
      openInlinePanel(panel, trigger);
      return;
    }

    closeInlinePanel(panel);
  });
}

export function initSiteSearch() {
  if (!searchInteractionsReady) {
    searchInteractionsReady = true;

    document.addEventListener("site-header:close-search", () => {
      closeActiveSearchPanel(false);
    });

    document.addEventListener("pointerdown", (event) => {
      const target = event.target;

      if (!(target instanceof Node) || !activeSearchPanel || !activeSearchTrigger) {
        return;
      }

      if (activeSearchPanel.contains(target) || activeSearchTrigger.contains(target)) {
        return;
      }

      closeActiveSearchPanel(false);
    });

    window.addEventListener("resize", () => {
      if (activeSearchPanel) {
        syncInlinePanelWidth(activeSearchPanel);
      }
    }, { passive: true });
  }

  for (const panel of document.querySelectorAll("[data-site-search-panel]")) {
    if (panel instanceof HTMLElement) {
      initSearchPanel(panel);
    }
  }

  for (const panel of document.querySelectorAll("[data-site-search-inline]")) {
    if (panel instanceof HTMLElement) {
      initSearchInlinePanel(panel);
    }
  }

  for (const trigger of document.querySelectorAll("[data-site-search-trigger]")) {
    if (trigger instanceof HTMLElement) {
      initSearchTrigger(trigger);
    }
  }
}
