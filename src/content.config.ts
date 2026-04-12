import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

import { isValidActionHref } from "./lib/safe-href";
import { isSupportedYouTubeUrl } from "./lib/youtube";

const gameActionKindSchema = z.enum(["play", "store", "press-kit", "streaming-guidelines", "privacy-policy", "repository"]);
const gameStatusSchema = z.enum(["active", "archived", "prototype"]);

const articles = defineCollection({
  loader: glob({
    base: "./src/content/articles",
    pattern: "**/index.md",
  }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(1),
        description: z.string().min(1),
        publishedAt: z.coerce.date(),
        updatedAt: z.coerce.date().optional(),
        tags: z.array(z.string().min(1)).default([]),
        cover: image().optional(),
        coverAlt: z.string().optional(),
        draft: z.boolean().default(false),
      })
      .superRefine((value, context) => {
        if (value.cover && !value.coverAlt) {
          context.addIssue({
            code: "custom",
            message: "cover がある場合は coverAlt が必要です。",
            path: ["coverAlt"],
          });
        }
      }),
});

const articleTranslations = defineCollection({
  loader: glob({
    base: "./src/content/articles",
    pattern: "**/index.*.md",
  }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(1),
        description: z.string().min(1),
        cover: image().optional(),
        coverAlt: z.string().optional(),
        draft: z.boolean().default(false),
      })
      .superRefine((value, context) => {
        if (value.cover && !value.coverAlt) {
          context.addIssue({
            code: "custom",
            message: "cover がある場合は coverAlt が必要です。",
            path: ["coverAlt"],
          });
        }
      }),
});

const games = defineCollection({
  loader: glob({
    base: "./src/content/games",
    pattern: "*/index.md",
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      status: gameStatusSchema,
      cover: image(),
      coverAlt: z.string().min(1),
      genre: z.string().min(1).optional(),
      publishedAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      trailerUrl: z.string().min(1).refine(isSupportedYouTubeUrl, "現在は YouTube の URL のみ対応しています。").optional(),
      tags: z.array(z.string().min(1)).default([]),
      languages: z.array(z.string().min(1)).default([]),
      platforms: z.array(z.string().min(1)).default([]),
      features: z.array(z.string().min(1)).default([]),
      screenshots: z
        .array(
          z.object({
            image: image(),
            alt: z.string().min(1),
          }),
        )
        .default([]),
      actions: z
        .array(
          z.object({
            kind: gameActionKindSchema,
            label: z.string().min(1),
            href: z.string().min(1).refine(isValidActionHref, "有効な http(s) URL またはサイト内パスを指定してください。"),
          }),
        )
        .default([]),
    }),
});

const gameTranslations = defineCollection({
  loader: glob({
    base: "./src/content/games",
    pattern: "*/index.*.md",
  }),
  schema: () =>
    z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      coverAlt: z.string().min(1).optional(),
      genre: z.string().min(1).optional(),
      features: z.array(z.string().min(1)).optional(),
      screenshots: z
        .array(
          z.object({
            alt: z.string().min(1),
          }),
        )
        .optional(),
      actions: z
        .array(
          z.object({
            kind: gameActionKindSchema,
            label: z.string().min(1),
            href: z.string().min(1).refine(isValidActionHref, "有効な http(s) URL またはサイト内パスを指定してください。"),
          }),
        )
        .optional(),
      languages: z.array(z.string().min(1)).optional(),
      platforms: z.array(z.string().min(1)).optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = {
  articles,
  articleTranslations,
  games,
  gameTranslations,
};
