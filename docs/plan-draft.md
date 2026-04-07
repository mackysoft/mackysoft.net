# 1. サイトの目的

`mackysoft.net` は次の4役を持つ。

* **ポートフォリオ**
  ゲーム、アセット、技術活動を見せる
* **避難所**
  外部サービスに何かあっても、ここを見れば追える
* **活動ハブ**
  GitHub、X、Zenn、note、YouTube などへの正式導線
* **長期保存庫**
  過去記事や作品情報を保持する

つまり、**ブログではなく活動全体の本拠地**として作る。

---

# 2. 基本方針

* WordPress はやめる
* GitHub を正本にする
* ローカル + GitHub で全管理
* 静的サイトとして構築
* サイト本体は **Astro**
* ホスティングは当面 **GitHub Pages**
* 将来必要なら Cloudflare 系へ移行可能な構成にする

---

# 3. 技術スタック

* **フレームワーク**: Astro
* **言語**: TypeScript
* **記事**: Markdown
* **ゲーム / アセット詳細**: MDX または専用 `.astro`
* **コンテンツ管理**: Astro Content Collections
* **検索**: Pagefind
* **分析**: Google Analytics 4
* **テーマ**: Light / Dark
* **多言語基盤**: Astro i18n
* **デプロイ**: GitHub Actions
* **ホスティング**: GitHub Pages
* **メタ**: OGP / Sitemap / RSS
* **画像**: Astro の画像機能

---

# 4. コンテンツ設計

コンテンツは最初から型で分ける。

* `blog`
* `games`
* `assets`
* `pages`
* `links`
* `contact`

役割はこう。

* `blog`: 過去記事アーカイブ
* `games`: ゲーム一覧・詳細
* `assets`: アセット一覧・詳細
* `pages`: About など固定ページ
* `links`: 外部活動の正式一覧
* `contact`: 連絡先ページ

---

# 5. URL設計

* `/`
* `/about/`
* `/games/`
* `/games/[slug]/`
* `/assets/`
* `/assets/[slug]/`
* `/blog/`
* `/blog/[slug]/`
* `/tags/[tag]/`
* `/archive/[yyyy]/`
* `/archive/[yyyy]/[mm]/`
* `/search/`
* `/links/`
* `/contact/`

補助:

* `/feed.xml`
* `/sitemap.xml`
* `/llms.txt`（任意）

---

# 6. 多言語設計

方針はこれで固定。

* デフォルト言語は **日本語**
* 日本語URLには `ja` を付けない
* 英語だけ `/en/` 以下に置く

例:

* `/about/`
* `/en/about/`

つまり、

* `defaultLocale = ja`
* `prefixDefaultLocale = false`

翻訳運用:

* 固定ページは手書き
* 記事は日本語原文を正本にして、英語版は LLM 生成 + 必要なら手修正

---

# 7. デザインテーマ

全体テーマはこれ。

**静かな技術系ポートフォリオ**

キーワード:

* シンプル
* 静か
* 精密
* 信頼感
* 作品主役

ルール:

* 背景はニュートラル
* アクセントは1色
* 装飾より余白
* 影より境界線
* 派手な常時アニメーションは避ける
* 作品画像を主役にする

---

# 8. ヘッダー設計

Desktop:

* 左: `mackysoft.net`
* 中: `About / Games / Assets / Writing / Search / Contact`
* 右: `Theme Toggle / Language`

Mobile:

* 左: `mackysoft.net`
* 右: `Theme Toggle / Menu`

モバイルメニュー内:

* About
* Games
* Assets
* Writing
* Search
* Contact
* Language

ルール:

* SNS アイコン群はヘッダー常設しない

---

# 9. TOP構成

TOP はブログホームではなく**活動ハブの玄関**として作る。

順番はこれで確定。

1. Header
2. Hero
3. Featured Games
4. Featured Assets
5. About Preview
6. Latest Writing
7. Latest Releases
8. Search Teaser
9. Links / Activity Hub CTA
10. Contact CTA
11. Footer

## Hero

含めるもの:

* 名前 / ブランド
* 一行の肩書き
* 2〜4行の短い説明
* CTA: `Games / Assets / Writing`
* 外部導線: `GitHub / X / Zenn / note / YouTube`

## Featured Games / Assets

* 代表作だけ固定表示
* カルーセルは使わない
* 各カードにサムネ、短い説明、CTA

## Latest Writing

* 自サイト記事
* Zenn
* note
* 最大3件
* 記事系だけ表示

## Latest Releases

* GitHub Releases を表示
* **同じパッケージのリリースは1件に集約**
* 最大3件
* 記事欄とは分離

## Search Teaser

* `Open Search` 導線をTOPにも置く

## Links / Contact

* 外部活動一覧 `/links/`
* 連絡先 `/contact/`
  への導線をTOP下部に置く

---

# 10. カルーセル方針

TOPでは使わない。

理由:

* 情報が隠れる
* 主役が曖昧になる
* モバイルで弱い
* 古いテンプレ感が出やすい

使ってよい場所:

* ゲーム詳細ページのスクリーンショットギャラリー
* アセット詳細ページの画像比較
* メディアビューア

---

# 11. サイドバー方針

* **全体常設サイドバーは不要**
* **局所的な補助カラムはあり**

ありなもの:

* 記事ページの目次
* 作品詳細ページの右カラム

  * 概要
  * リンク
  * 技術情報
  * CTA

---

# 12. アニメーション方針

入れるべき場所:

* テーマトグル
* 言語ドロップダウン
* モバイルメニュー
* カード hover / focus
* 検索UI
* 作品ページのギャラリー / モーダル

入れない場所:

* 記事本文
* 常時動く背景
* 派手なヘッダー変形
* 過剰なスクロール演出
* 全要素への一律フェード

原則:

* 短い
* 静か
* 意味がある
* `prefers-reduced-motion` 対応

---

# 13. 外部導線の配置

置く場所は3層。

* **TOP の Hero 直下**
* **フッター**
* **`/links/`**

補助的に:

* About
* 作品ページ
* 記事末尾

ヘッダーにはSNSアイコン群を常設しない。

---

# 14. Contact 設計

`/contact/` を作る。

連絡手段は用途で分ける。

* 仕事 / 相談: メール
* 軽い連絡: X
* OSS / ライブラリ関連: GitHub

配置:

* フッター常設
* About に導線
* TOP 下部に CTA

フォームは最初は不要。

---

# 15. 記事設計

記事は **1記事1フォルダ** で管理する。

例:

```text
src/content/blog/some-article/
  index.mdx
  cover.png
  image-1.png
  diagram.svg
```

これで、記事専用画像を記事の近くに置ける。

frontmatter の最小実用セット:

* `title`
* `description`
* `publishedAt`
* `updatedAt`
* `tags`
* `cover`
* `coverAlt`
* `draft`
* `lang`

記事カードは frontmatter を正本にして作る。

表示項目:

* cover
* title
* description
* publishedAt
* tags

---

# 16. ページ形式の使い分け

* 軽い固定ページ: `.md`
* 文章中心だがコンポーネントを差し込みたい: `.mdx`
* 完全に自由なページ: `.astro`

つまり、**md でもリッチなページでも両方いける構成**にする。

---

# 17. リポジトリ構造

考え方はこれで固定。

* `src/pages/` = URL を決める層
* `src/content/` = 原本データ
* `src/components/` = 再利用UI
* `src/layouts/` = 共通レイアウト
* `src/lib/` = ロジック
* `src/generated/` = 自動収集データ
* `public/` = そのまま配るファイル
* `tests/` = テスト

つまり、
**pages = 入口、content = 原本、components = 部品、lib = 処理、generated = 自動生成、public = 生ファイル**

---

# 18. 外部更新の自動取り込み

TOP の更新欄は自動更新にする。

取得元:

* Zenn
* note
* GitHub Releases

方法:

* GitHub Actions の定期実行
* 外部データ取得
* 正規化して `activity.json` などを生成
* Astro が読んでビルド
* GitHub Pages に再公開

重要ルール:

* **記事系とリリース系は分離**
* **同一パッケージのリリースは1件に集約**
* TOP は生の時系列ログではなく、**編集された活動サマリ**

---

# 19. 検索

* Pagefind を採用
* 記事だけでなく `games`, `assets`, `pages` も検索対象
* 将来的に type フィルタを持てる構成にする

---

# 20. Google Analytics

* GA4 を導入
* 共通レイアウトに直埋め

最低限計測するもの:

* page_view
* 検索
* 外部リンククリック
* ゲーム / アセットページの CTA クリック

---

# 21. テスト / CI

最小構成はこれ。

* **Vitest**: 小さなロジックテスト
* **Playwright**: E2E テスト
* **GitHub Actions**: CI

CI で回すもの:

* `npm run build`
* unit test
* Playwright の基本導線テスト

優先度:

1. build が通ること
2. 主要導線の E2E
3. ロジックテスト

---

# 22. ドメイン方針

* `mackysoft.net` は維持する
* サイト本体は Xserver から外す
* 当面は GitHub Pages
* 将来は Cloudflare DNS / Registrar へ移行余地あり

注意:

* Xserver は先に解約しない
* 移行と維持方針を固めてから動く

---

# 23. Cloudflare / Workers の位置づけ

* 今すぐ必須ではない
* 第一段階は GitHub Pages で十分
* 将来、DNS・ドメイン管理・軽い動的処理・高度な言語振り分けが必要なら Cloudflare を検討

---

# 24. 設計思想

このサイトに適用するモダン設計は次の7本柱。

* Hub-and-Spoke の情報設計
* 型付きコンテンツ設計
* コンポーネントベースUI
* デザインシステム
* モバイルファースト
* 静的ファースト
* Progressive Enhancement

要するに、

**ページを都度作るのではなく、ルールと部品を作って、ビルドで完成させる**

設計にする。

---

# 25. 実装フェーズ

## フェーズ1: 土台

* Astro プロジェクト作成
* Content Collections 設計
* Header / Footer / Theme / Language
* Light / Dark
* レスポンシブ
* OGP / Sitemap / RSS
* GA4
* Pagefind

## フェーズ2: 情報設計

* About
* Games
* Assets
* Writing
* Search
* Links
* Contact

## フェーズ3: TOP

* Hero
* Featured Games
* Featured Assets
* About Preview
* Latest Writing
* Latest Releases
* Search Teaser
* Links CTA
* Contact CTA

## フェーズ4: コンテンツ移行

* WordPress 旧記事の Markdown 化
* ゲーム / アセット情報整理
* 画像 / 動画 / 外部リンク整理

## フェーズ5: 自動化

* Zenn / note / GitHub Releases 自動収集
* TOP 更新欄の自動生成

## フェーズ6: 公開

* GitHub Pages 公開
* `mackysoft.net` 接続
* DNS 切替

## フェーズ7: 将来拡張

* `/en/`
* 記事翻訳運用
* Cloudflare 検討
* Playwright 拡張