import { describe, expect, test } from "vitest";

import { getUiText } from "../../src/lib/ui-text";

describe("ui text", () => {
  test("uses Japanese labels for display text while keeping breadcrumb labels unchanged", () => {
    const uiText = getUiText("ja");

    expect(uiText.header.primaryNavLabel).toBe("グローバルナビゲーション");
    expect(uiText.header.menuToggle).toBe("メニューを開く");
    expect(uiText.common.home).toBe("ホーム");
    expect(uiText.common.about).toBe("プロフィール");
    expect(uiText.common.games).toBe("ゲーム");
    expect(uiText.common.assets).toBe("アセット");
    expect(uiText.common.articles).toBe("記事");
    expect(uiText.common.search).toBe("検索");
    expect(uiText.common.contact).toBe("問い合わせ");
    expect(uiText.common.privacyPolicy).toBe("プライバシーポリシー");
    expect(uiText.common.rssFeed).toBe("RSS フィード");

    expect(uiText.breadcrumb.home).toBe("Home");
    expect(uiText.breadcrumb.about).toBe("About");
    expect(uiText.breadcrumb.games).toBe("Games");
    expect(uiText.breadcrumb.assets).toBe("Assets");
    expect(uiText.breadcrumb.articles).toBe("Articles");
    expect(uiText.breadcrumb.search).toBe("Search");
    expect(uiText.breadcrumb.contact).toBe("Contact");
    expect(uiText.breadcrumb.privacyPolicy).toBe("Privacy Policy");
  });

  test("keeps English display and breadcrumb labels aligned", () => {
    const uiText = getUiText("en");

    expect(uiText.header.primaryNavLabel).toBe("Global navigation");
    expect(uiText.header.menuToggle).toBe("Open menu");
    expect(uiText.common.home).toBe(uiText.breadcrumb.home);
    expect(uiText.common.about).toBe(uiText.breadcrumb.about);
    expect(uiText.common.games).toBe(uiText.breadcrumb.games);
    expect(uiText.common.assets).toBe(uiText.breadcrumb.assets);
    expect(uiText.common.articles).toBe(uiText.breadcrumb.articles);
    expect(uiText.common.search).toBe(uiText.breadcrumb.search);
    expect(uiText.common.contact).toBe(uiText.breadcrumb.contact);
    expect(uiText.common.privacyPolicy).toBe(uiText.breadcrumb.privacyPolicy);
    expect(uiText.common.rssFeed).toBe("RSS feed");
  });
});
