import type { CollectionEntry } from "astro:content";

import { defaultLocale, localizePath, type SiteLocale } from "./i18n";
import { createTranslationMap, type TranslationEntryMap, resolveLocalizedEntryBySlug } from "./localized-entry";

export type GameEntry = CollectionEntry<"games">;
export type GameTranslationEntry = CollectionEntry<"gameTranslations">;
export type GameStatus = GameEntry["data"]["status"];
export type GameAction = GameEntry["data"]["actions"][number];
export type GameActionKind = GameAction["kind"];

export type LocalizedGameEntry = {
  slug: string;
  requestedLocale: SiteLocale;
  contentLocale: SiteLocale;
  isFallback: boolean;
  availableLocales: SiteLocale[];
  data: GameEntry["data"];
  href: string;
};

const gameStatusLabelMap: Record<SiteLocale, Record<GameStatus, string>> = {
  ja: {
    active: "公開中",
    archived: "アーカイブ済み",
    prototype: "プロトタイプ",
  },
  en: {
    active: "Live",
    archived: "Archived",
    prototype: "Prototype",
  },
};

const gamePlatformLabelMap: Record<SiteLocale, Record<string, string>> = {
  ja: {
    Browser: "ブラウザ",
  },
  en: {
    Browser: "Browser",
  },
};

const gameActionOrder: GameActionKind[] = ["play", "store", "press-kit", "streaming-guidelines", "privacy-policy", "repository"];
const supportedYouTubeHosts = new Set(["youtu.be", "youtube.com", "www.youtube.com", "m.youtube.com"]);

let gamesPromise: Promise<GameEntry[]> | undefined;
let gameTranslationsPromise: Promise<TranslationEntryMap<GameTranslationEntry>> | undefined;

function mergeGameData(baseEntry: GameEntry, translationEntry?: GameTranslationEntry): GameEntry["data"] {
  const translatedScreenshots = translationEntry?.data.screenshots;
  const screenshots = translatedScreenshots && translatedScreenshots.length === baseEntry.data.screenshots.length
    ? baseEntry.data.screenshots.map((screenshot, index) => ({
        ...screenshot,
        alt: translatedScreenshots[index]?.alt ?? screenshot.alt,
      }))
    : baseEntry.data.screenshots;

  return {
    ...baseEntry.data,
    title: translationEntry?.data.title ?? baseEntry.data.title,
    description: translationEntry?.data.description ?? baseEntry.data.description,
    coverAlt: translationEntry?.data.coverAlt ?? baseEntry.data.coverAlt,
    genre: translationEntry?.data.genre ?? baseEntry.data.genre,
    features: translationEntry?.data.features ?? baseEntry.data.features,
    screenshots,
    actions: translationEntry?.data.actions ?? baseEntry.data.actions,
    languages: translationEntry?.data.languages ?? baseEntry.data.languages,
    platforms: translationEntry?.data.platforms ?? baseEntry.data.platforms,
  };
}

async function getGameTranslationMap() {
  if (!gameTranslationsPromise) {
    gameTranslationsPromise = (async () => {
      const { getCollection } = await import("astro:content");
      const entries = await getCollection("gameTranslations", ({ data }) => !data.draft);
      return createTranslationMap(entries, { stripPrefix: "src/content/games/" });
    })();
  }

  return gameTranslationsPromise;
}

export function getGameStatusLabel(status: GameStatus, locale: SiteLocale = defaultLocale) {
  return gameStatusLabelMap[locale][status];
}

export function getGamePlatformLabel(platform: string, locale: SiteLocale = defaultLocale) {
  return gamePlatformLabelMap[locale][platform] ?? platform;
}

export function getGameDateValue(game: Pick<GameEntry, "data">) {
  return game.data.publishedAt?.valueOf() ?? 0;
}

export function sortGames<T extends Pick<GameEntry, "data">>(games: T[]) {
  return [...games].sort((left, right) => getGameDateValue(right) - getGameDateValue(left));
}

export async function getGames() {
  if (!gamesPromise) {
    gamesPromise = (async () => {
      const { getCollection } = await import("astro:content");
      return sortGames(await getCollection("games"));
    })();
  }

  return gamesPromise;
}

export async function resolveLocalizedGameBySlug(slug: string, locale: SiteLocale = defaultLocale): Promise<LocalizedGameEntry | null> {
  const localizedEntry = await resolveLocalizedEntryBySlug({
    slug,
    locale,
    getBaseEntries: getGames,
    getTranslationMap: getGameTranslationMap,
    mergeData: mergeGameData,
  });

  if (!localizedEntry) {
    return null;
  }

  const { baseEntry: _baseEntry, translationEntry: _translationEntry, ...localizedGame } = localizedEntry;

  return {
    ...localizedGame,
    href: localizePath(`/games/${slug}/`, locale),
  };
}

export async function getLocalizedGames(locale: SiteLocale = defaultLocale) {
  const games = await getGames();
  return Promise.all(games.map((game) => resolveLocalizedGameBySlug(game.id, locale))) as Promise<Array<LocalizedGameEntry | null>>;
}

export function sortGameActions(actions: GameAction[]) {
  return [...actions].sort((left, right) => gameActionOrder.indexOf(left.kind) - gameActionOrder.indexOf(right.kind));
}

export function isInternalGameActionHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

export function isSafeExternalGameActionHref(href: string) {
  try {
    const parsedUrl = new URL(href);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidGameActionHref(href: string) {
  return isInternalGameActionHref(href) || isSafeExternalGameActionHref(href);
}

export function isExternalGameActionHref(href: string) {
  return isSafeExternalGameActionHref(href);
}

export function getGameTrailerVideoId(url: string) {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    return null;
  }

  if (!supportedYouTubeHosts.has(parsedUrl.hostname)) {
    return null;
  }

  if (parsedUrl.hostname === "youtu.be") {
    const videoId = parsedUrl.pathname.split("/").filter(Boolean)[0];
    return videoId || null;
  }

  if (parsedUrl.pathname === "/watch") {
    return parsedUrl.searchParams.get("v");
  }

  if (parsedUrl.pathname.startsWith("/embed/")) {
    const videoId = parsedUrl.pathname.split("/")[2];
    return videoId || null;
  }

  return null;
}

export function isSupportedGameTrailerUrl(url: string) {
  return getGameTrailerVideoId(url) !== null;
}

export function getGameTrailerEmbedUrl(url: string) {
  const videoId = getGameTrailerVideoId(url);
  return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
}
