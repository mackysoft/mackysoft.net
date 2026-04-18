import { defaultLocale, type SiteLocale } from "./i18n";
import type { GameAction, GameActionKind, GameStatus } from "./game-repository";

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
  "zh-hant": {
    active: "公開中",
    archived: "已封存",
    prototype: "原型",
  },
};

const gamePlatformLabelMap: Record<SiteLocale, Record<string, string>> = {
  ja: {
    Browser: "ブラウザ",
  },
  en: {
    Browser: "Browser",
  },
  "zh-hant": {
    Browser: "瀏覽器",
  },
};

const gameActionOrder: GameActionKind[] = ["play", "store", "press-kit", "streaming-guidelines", "privacy-policy", "repository"];

export function getGameStatusLabel(status: GameStatus, locale: SiteLocale = defaultLocale) {
  return gameStatusLabelMap[locale][status];
}

export function getGamePlatformLabel(platform: string, locale: SiteLocale = defaultLocale) {
  return gamePlatformLabelMap[locale][platform] ?? platform;
}

export function sortGameActions(actions: GameAction[]) {
  return [...actions].sort((left, right) => gameActionOrder.indexOf(left.kind) - gameActionOrder.indexOf(right.kind));
}
