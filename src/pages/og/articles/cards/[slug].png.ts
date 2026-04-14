import type { APIRoute } from "astro";

import { renderArticleTitleSocialImagePng } from "../../../../features/site/og-image.mjs";
import { articleTitleCardImageWidth } from "../../../../features/site/social-image";
import { getStaticPaths as getArticleOgStaticPaths } from "../[slug].png";
import type { SiteLocale } from "../../../../lib/i18n";

type StaticImageProps = {
  title: string;
  locale: SiteLocale;
};

export const getStaticPaths = getArticleOgStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { title, locale } = props as StaticImageProps;
  const pngBuffer = await renderArticleTitleSocialImagePng({
    title,
    locale,
    width: articleTitleCardImageWidth,
  });

  return new Response(new Uint8Array(pngBuffer), {
    headers: {
      "Content-Type": "image/png",
    },
  });
};
