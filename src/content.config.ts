import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

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

export const collections = {
  articles,
};
