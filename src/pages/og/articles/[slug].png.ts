import type { APIRoute } from "astro";

import { renderArticleTitleSocialImagePng } from "../../../features/site/og-image.mjs";
import { getLocalArticles } from "../../../lib/articles";
import { defaultLocale, type SiteLocale } from "../../../lib/i18n";

type StaticImageProps = {
  title: string;
  locale: SiteLocale;
};

export async function getStaticPaths() {
  const articles = await getLocalArticles();

  return articles
    .filter((article) => !article.data.cover)
    .map((article) => ({
      params: { slug: article.id },
      props: {
        title: article.data.title,
        locale: defaultLocale,
      } satisfies StaticImageProps,
    }));
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
