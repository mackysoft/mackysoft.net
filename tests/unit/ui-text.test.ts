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

  test("uses zh-hant labels while keeping breadcrumb labels unchanged", () => {
    const uiText = getUiText("zh-hant");

    expect(uiText.header.primaryNavLabel).toBe("全域導覽");
    expect(uiText.header.menuToggle).toBe("開啟選單");
    expect(uiText.header.languageShortLabel.ja).toBe("JA");
    expect(uiText.header.languageShortLabel.en).toBe("EN");
    expect(uiText.header.languageShortLabel["zh-hant"]).toBe("ZH");
    expect(uiText.header.languageName["zh-hant"]).toBe("繁體中文");
    expect(uiText.common.home).toBe("首頁");
    expect(uiText.common.about).toBe("個人簡介");
    expect(uiText.common.games).toBe("遊戲");
    expect(uiText.common.assets).toBe("資產");
    expect(uiText.common.articles).toBe("文章");
    expect(uiText.common.search).toBe("搜尋");
    expect(uiText.common.contact).toBe("聯絡");
    expect(uiText.common.privacyPolicy).toBe("隱私權政策");
    expect(uiText.common.rssFeed).toBe("RSS 摘要");

    expect(uiText.breadcrumb.home).toBe("Home");
    expect(uiText.breadcrumb.about).toBe("About");
  });
});
