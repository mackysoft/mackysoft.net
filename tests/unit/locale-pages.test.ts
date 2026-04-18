import { describe, expect, test } from "vitest";

import { getNonDefaultLocaleStaticPaths, mapPrefixedLocaleStaticPaths } from "../../src/lib/locale-pages";
import { getLocalePathPrefix } from "../../src/lib/i18n";

describe("locale page helpers", () => {
  test("builds static paths for non-default locales", () => {
    expect(getNonDefaultLocaleStaticPaths()).toEqual([
      {
        params: { locale: getLocalePathPrefix("en") },
      },
      {
        params: { locale: getLocalePathPrefix("zh-hant") },
      },
      {
        params: { locale: getLocalePathPrefix("ko") },
      },
    ]);
  });

  test("adds non-default locale params to route static paths", () => {
    expect(
      mapPrefixedLocaleStaticPaths([
        {
          params: { slug: "vision-introduction" },
          props: { slug: "vision-introduction" },
        },
      ]),
    ).toEqual([
      {
        params: { locale: getLocalePathPrefix("en"), slug: "vision-introduction" },
        props: { slug: "vision-introduction" },
      },
      {
        params: { locale: getLocalePathPrefix("zh-hant"), slug: "vision-introduction" },
        props: { slug: "vision-introduction" },
      },
      {
        params: { locale: getLocalePathPrefix("ko"), slug: "vision-introduction" },
        props: { slug: "vision-introduction" },
      },
    ]);
  });
});
