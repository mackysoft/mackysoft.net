import type { CollectionEntry } from "astro:content";

export type GameEntry = CollectionEntry<"games">;
export type GameStatus = GameEntry["data"]["status"];
export type GameAction = GameEntry["data"]["actions"][number];
export type GameActionKind = GameAction["kind"];

const gameStatusLabelMap: Record<GameStatus, string> = {
  active: "公開中",
  archived: "アーカイブ済み",
  prototype: "プロトタイプ",
};

const gamePlatformLabelMap: Record<string, string> = {
  Browser: "ブラウザ",
};

const gameActionOrder: GameActionKind[] = ["play", "store", "press-kit", "streaming-guidelines", "privacy-policy", "repository"];
const supportedYouTubeHosts = new Set(["youtu.be", "youtube.com", "www.youtube.com", "m.youtube.com"]);

export function getGameStatusLabel(status: GameStatus) {
  return gameStatusLabelMap[status];
}

export function getGamePlatformLabel(platform: string) {
  return gamePlatformLabelMap[platform] ?? platform;
}

export function getGameDateValue(game: GameEntry) {
  return game.data.publishedAt?.valueOf() ?? 0;
}

export function sortGames(games: GameEntry[]) {
  return [...games].sort((left, right) => getGameDateValue(right) - getGameDateValue(left));
}

export async function getGames() {
  const { getCollection } = await import("astro:content");
  return sortGames(await getCollection("games"));
}

export function sortGameActions(actions: GameAction[]) {
  return [...actions].sort((left, right) => gameActionOrder.indexOf(left.kind) - gameActionOrder.indexOf(right.kind));
}

export function isExternalGameActionHref(href: string) {
  if (href.startsWith("/")) {
    return false;
  }

  try {
    new URL(href);
    return true;
  } catch {
    return false;
  }
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
