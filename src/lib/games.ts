import type { CollectionEntry } from "astro:content";

export type GameEntry = CollectionEntry<"games">;
export type GameStatus = GameEntry["data"]["status"];
export type GameAction = GameEntry["data"]["actions"][number];
export type GameActionKind = GameAction["kind"];

const gameStatusLabelMap: Record<GameStatus, string> = {
  active: "公開中",
  archived: "アーカイブ",
  prototype: "プロトタイプ",
};

const gamePlatformLabelMap: Record<string, string> = {
  Browser: "ブラウザ",
};

const gameActionOrder: GameActionKind[] = ["play", "store", "press-kit", "streaming-guidelines", "privacy-policy", "repository"];

export function getGameStatusLabel(status: GameStatus) {
  return gameStatusLabelMap[status];
}

export function getGamePlatformLabel(platform: string) {
  return gamePlatformLabelMap[platform] ?? platform;
}

export function getGameDateValue(game: GameEntry) {
  return game.data.updatedAt?.valueOf() ?? game.data.publishedAt?.valueOf() ?? 0;
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
