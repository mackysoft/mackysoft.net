import { load } from "cheerio";

import { defaultLocale, localizeContentHref, type SiteLocale } from "./i18n";

export function localizeHtmlLinks(html: string, locale: SiteLocale = defaultLocale) {
  if (html.length === 0 || locale === defaultLocale) {
    return html;
  }

  const $ = load(html, null, false);

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");

    if (!href) {
      return;
    }

    $(element).attr("href", localizeContentHref(href, locale));
  });

  return $.html();
}
