import { defaultLocale, type SiteLocale } from "./i18n";

type ArticleTagDefinition = {
  label: Partial<Record<SiteLocale, string>>;
};

export const articleTagKeys = [
  "animationcurve",
  "asset",
  "cinemachine",
  "completion-detection",
  "csharp",
  "cullinggroup",
  "evaluate",
  "game-design",
  "keyframe",
  "lod",
  "misc",
  "modiferty",
  "particlesystem",
  "play-memo",
  "playfab",
  "script",
  "stopaction",
  "textmesh-pro",
  "treasure-rogue",
  "tutorial",
  "ugui",
  "ui",
  "unity",
  "vision",
  "wrapmode",
] as const;

export type ArticleTagKey = typeof articleTagKeys[number];

export const articleTagDefinitions = {
  animationcurve: {
    label: {
      ja: "AnimationCurve",
      en: "AnimationCurve",
    },
  },
  asset: {
    label: {
      ja: "アセット",
      en: "Asset",
    },
  },
  cinemachine: {
    label: {
      ja: "Cinemachine",
      en: "Cinemachine",
    },
  },
  "completion-detection": {
    label: {
      ja: "終了判定",
      en: "Completion Detection",
    },
  },
  csharp: {
    label: {
      ja: "C#",
      en: "C#",
    },
  },
  cullinggroup: {
    label: {
      ja: "CullingGroup",
      en: "CullingGroup",
    },
  },
  evaluate: {
    label: {
      ja: "Evaluate",
      en: "Evaluate",
    },
  },
  "game-design": {
    label: {
      ja: "ゲームデザイン",
      en: "Game Design",
    },
  },
  keyframe: {
    label: {
      ja: "Keyframe",
      en: "Keyframe",
    },
  },
  lod: {
    label: {
      ja: "LOD",
      en: "LOD",
    },
  },
  misc: {
    label: {
      ja: "雑記",
      en: "Misc",
    },
  },
  modiferty: {
    label: {
      ja: "Modiferty",
      en: "Modiferty",
    },
  },
  particlesystem: {
    label: {
      ja: "ParticleSystem",
      en: "ParticleSystem",
    },
  },
  "play-memo": {
    label: {
      ja: "プレイメモ",
      en: "Play Memo",
    },
  },
  playfab: {
    label: {
      ja: "PlayFab",
      en: "PlayFab",
    },
  },
  script: {
    label: {
      ja: "スクリプト",
      en: "Script",
    },
  },
  stopaction: {
    label: {
      ja: "StopAction",
      en: "StopAction",
    },
  },
  "textmesh-pro": {
    label: {
      ja: "TextMesh Pro",
      en: "TextMesh Pro",
    },
  },
  "treasure-rogue": {
    label: {
      ja: "Treasure Rogue",
      en: "Treasure Rogue",
    },
  },
  tutorial: {
    label: {
      ja: "チュートリアル",
      en: "Tutorial",
    },
  },
  ugui: {
    label: {
      ja: "uGUI",
      en: "uGUI",
    },
  },
  ui: {
    label: {
      ja: "UI",
      en: "UI",
    },
  },
  unity: {
    label: {
      ja: "Unity",
      en: "Unity",
    },
  },
  vision: {
    label: {
      ja: "Vision",
      en: "Vision",
    },
  },
  wrapmode: {
    label: {
      ja: "WrapMode",
      en: "WrapMode",
    },
  },
} satisfies Record<ArticleTagKey, ArticleTagDefinition>;

const articleTagKeySet = new Set<string>(articleTagKeys);

export function isArticleTagKey(value: string): value is ArticleTagKey {
  return articleTagKeySet.has(value);
}

export function getArticleTagLabel(tagKey: string, locale: SiteLocale = defaultLocale) {
  if (!isArticleTagKey(tagKey)) {
    return tagKey;
  }

  return articleTagDefinitions[tagKey].label[locale] ?? tagKey;
}
