import { defaultLocale, type SiteLocale } from "./i18n";

type ArticleTagDefinition = {
  label: Partial<Record<SiteLocale, string>>;
};

export const articleTagDefinitions: Record<string, ArticleTagDefinition> = {
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
      "zh-hant": "資產",
      ko: "에셋",
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
      "zh-hant": "結束判定",
      ko: "종료 판정",
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
      "zh-hant": "遊戲設計",
      ko: "게임 디자인",
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
      "zh-hant": "雜記",
      ko: "잡담",
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
  "play-review": {
    label: {
      ja: "プレイレビュー",
      en: "Play Review",
      "zh-hant": "遊玩評測",
      ko: "플레이 리뷰",
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
      "zh-hant": "腳本",
      ko: "스크립트",
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
      "zh-hant": "教學",
      ko: "튜토리얼",
    },
  },
  "tsukuru-uozu": {
    label: {
      ja: "つくるUOZU",
      en: "Tsukuru UOZU",
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
};

export function getArticleTagLabel(tagKey: string, locale: SiteLocale = defaultLocale) {
  return articleTagDefinitions[tagKey]?.label[locale]
    ?? articleTagDefinitions[tagKey]?.label.en
    ?? articleTagDefinitions[tagKey]?.label[defaultLocale]
    ?? tagKey;
}
