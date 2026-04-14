import { describe, expect, test } from "vitest";

import { parseTaxonomyMapYaml, stringifyTaxonomyMapYaml } from "../../scripts/migration/taxonomy-map.mjs";
import { assetsPagePath, resolveTaxonomyEntryPath } from "../../scripts/migration/taxonomy-targets.mjs";

describe("taxonomy map", () => {
  test("parses yaml entries and preserves their sections", () => {
    const entries = parseTaxonomyMapYaml([
      "categories:",
      '  - legacy_path: "/category/playfab/"',
      '    legacy_slug: "playfab"',
      '    legacy_name: "PlayFab"',
      '    new_tag: "playfab"',
      '    new_path: "/tags/playfab/"',
      '    status: "mapped"',
      '    notes: ""',
      "tags:",
      '  - legacy_path: "/tag/%e3%81%a4%e3%81%8f%e3%82%8buozu/"',
      '    legacy_slug: "つくるuozu"',
      '    legacy_name: "つくるUOZU"',
      '    new_tag: "tsukuru-uozu"',
      '    new_path: ""',
      '    status: "excluded"',
      '    notes: ""',
      "",
    ].join("\n"));

    expect(entries).toEqual([
      {
        kind: "category",
        legacyPath: "/category/playfab/",
        legacySlug: "playfab",
        legacyName: "PlayFab",
        newTag: "playfab",
        newPath: "/tags/playfab/",
        status: "mapped",
        notes: "",
      },
      {
        kind: "tag",
        legacyPath: "/tag/%e3%81%a4%e3%81%8f%e3%82%8buozu/",
        legacySlug: "つくるuozu",
        legacyName: "つくるUOZU",
        newTag: "tsukuru-uozu",
        newPath: "",
        status: "excluded",
        notes: "",
      },
    ]);
  });

  test("stringifies entries back into the expected yaml shape", () => {
    const yaml = stringifyTaxonomyMapYaml([
      {
        kind: "category",
        legacyPath: "/category/playfab/",
        legacySlug: "playfab",
        legacyName: "PlayFab",
        newTag: "playfab",
        newPath: "/tags/playfab/",
        status: "mapped",
        notes: "",
      },
      {
        kind: "tag",
        legacyPath: "/tag/%e3%81%a4%e3%81%8f%e3%82%8buozu/",
        legacySlug: "つくるuozu",
        legacyName: "つくるUOZU",
        newTag: "tsukuru-uozu",
        newPath: "/tags/tsukuru-uozu/",
        status: "mapped",
        notes: "",
      },
    ]);

    expect(yaml).toContain('new_tag: "playfab"');
    expect(yaml).toContain('new_tag: "tsukuru-uozu"');
    expect(yaml).toContain('new_path: "/tags/tsukuru-uozu/"');
  });

  test("maps released asset categories to the assets page when no public tag page exists", () => {
    expect(resolveTaxonomyEntryPath(
      {
        kind: "category",
        legacyPath: "/category/asset/x-pool/",
        legacySlug: "x-pool",
        legacyName: "X Pool",
        newTag: "x-pool",
        newPath: "",
        status: "excluded",
        notes: "",
      },
      {
        publicTags: new Set(["playfab"]),
        releasedAssetKeys: new Set(["xpool"]),
      },
    )).toBe(assetsPagePath);
  });
});
