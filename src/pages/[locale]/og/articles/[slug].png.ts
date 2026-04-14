import type { APIRoute } from "astro";

import { renderArticleTitleSocialImagePng } from "../../../../features/site/og-image.mjs";
import { getLocalizedLocalArticles } from "../../../../lib/articles";
import { getLocalePathPrefix, getNonDefaultLocales, type SiteLocale } from "../../../../lib/i18n";

type StaticImageProps = {
  title: string;
  locale: SiteLocale;
};

export async function getStaticPaths() {
  const localizedPaths = await Promise.all(
    getNonDefaultLocales().map(async (locale) => {
      const pathPrefix = getLocalePathPrefix(locale);
      const articles = await getLocalizedLocalArticles(locale);

      return articles.flatMap((article) => {
        if (!article || article.contentLocale !== locale || article.data.cover) {
          return [];
        }

        return [
          {
            params: {
              locale: pathPrefix,
              slug: article.slug,
            },
            props: {
              title: article.data.title,
              locale,
            } satisfies StaticImageProps,
          },
        ];
      });
    }),
  );

  return localizedPaths.flat();
}

export const GET: APIRoute = async ({ props }) => {
  const { title, locale } = props as StaticImageProps;
  const pngBuffer = await renderArticleTitleSocialImagePng({ title, locale });

  return new Response(new Uint8Array(pngBuffer), {
    headers: {
      "Content-Type": "image/png",
    },
  });
};
