import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

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
      publishedAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      trailerUrl: z.string().min(1).refine((value) => {
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      }, "有効な URL を指定してください。").optional(),
      tags: z.array(z.string().min(1)).default([]),
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
            href: z.string().min(1).refine((value) => {
              if (value.startsWith("/")) {
                return true;
              }

              try {
                new URL(value);
                return true;
              } catch {
                return false;
              }
            }, "有効な URL を指定してください。"),
          }),
        )
        .default([]),
    }),
});

export const collections = {
  articles,
  games,
};
