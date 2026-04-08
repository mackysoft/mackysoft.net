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
* ローカル + GitHub で全管理する
* 静的サイトとして構築する
* サイト本体は **Astro**
* ホスティングは当面 **GitHub Pages**
* 将来必要なら Cloudflare 系へ移行可能な構成にする
* **旧URL移行を先に設計してから実装する**
* **canonical host はコードに直書きせず、Astro の `site` 設定1か所で切り替える**

---

# 3. 技術スタック

* **フレームワーク**: Astro
* **言語**: TypeScript
* **記事**: Markdown / MDX
* **ゲーム / アセット詳細**: MDX または専用 `.astro`
* **コンテンツ管理**: Astro Content Collections
* **検索**: Pagefind
* **分析**: Google Analytics 4
* **テーマ**: Light / Dark
* **多言語基盤**: Astro i18n
* **デプロイ**: GitHub Actions
* **ホスティング**: GitHub Pages
* **メタ**: OGP / Sitemap / RSS / `hreflang`
* **画像**: Astro の画像機能
* **移行補助**: `url-map.csv`, `taxonomy-map.yml`, `media-audit.csv`

---

# 4. コンテンツ設計

Content Collection は最初から増やしすぎない。

Collection に入れるのはこれだけにする。

* `articles`
* `games`
* `assets`

固定ページは Collection に入れない。

* `about`
* `contact`
* `privacy-policy`
* `search`

役割はこう。

* `articles`: 自サイト記事の原本と詳細ページ
* `games`: ゲーム一覧・詳細
* `assets`: アセット一覧・詳細
* `about`: プロフィールと外部活動への正式導線

`Writing` 一覧は、自サイト記事と外部記事をまとめて見せる。

## `article` frontmatter

必須項目は最小限に絞る。

* `title`
* `description`
* `publishedAt`

任意項目:

* `updatedAt`
* `tags`
* `cover`
* `coverAlt` (`cover` がある場合は必須)
* `draft`

## `game` / `asset` frontmatter

必須項目はこれで固定する。

* `title`
* `description`
* `status`
* `cover`
* `coverAlt`

任意項目:

* `publishedAt`
* `updatedAt`
* `tags`
* `platforms`
* `repoUrl`
* `demoUrl`

`status` は次の3値に固定する。

* `active`
* `archived`
* `prototype`

---

# 5. URL設計

正式ルートはこれで固定する。

* `/`
* `/about/`
* `/games/`
* `/games/[slug]/`
* `/assets/`
* `/assets/[slug]/`
* `/articles/`
* `/articles/[slug]/`
* `/tags/[tag]/`
* `/archive/[yyyy]/`
* `/archive/[yyyy]/[mm]/`
* `/search/`
* `/contact/`
* `/privacy-policy/`

補足:

* `/articles/` は自サイト記事と外部記事を含む記事一覧
* `/articles/[slug]/` は自サイト記事の詳細ページ

補助:

* `/feed.xml`
* `/sitemap.xml`
* `/llms.txt`（任意）

## 旧URL移行契約

旧 WordPress 記事の個別URLは主に `/<slug>/` のフラット構造なので、**新記事URLとは別に移行契約を持つ**。

方針:

* 新サイトの記事URLは **`/articles/[slug]/`**
* 旧 WordPress 記事URL **`/<slug>/`** はすべて新URLへ誘導
* 旧ゲームURL **`/treasure-rogue/`** は `/games/treasure-rogue/` へ誘導
* 旧 Privacy Policy **`/treasure-rogue/privacy-policy/`** は `/privacy-policy/` へ誘導

移行の正本は `docs/migration/url-map.csv` にする。

列はこれで固定する。

* `legacy_path`
* `new_path`
* `content_type`
* `redirect_kind`
* `status`

この表を次の両方で使える形にする。

* GitHub Pages 上の静的リダイレクト生成
* 将来ホスト側で 301 を張るときの元データ

---

# 6. 多言語設計

方針はこれで固定する。

* デフォルト言語は **日本語**
* 日本語URLには `ja` を付けない
* 追加言語はそれぞれの言語プレフィックス以下に置く

例:

* `/about/`
* `/en/about/`

つまり、

* `defaultLocale = ja`
* `prefixDefaultLocale = false`

## 初期運用

追加言語は段階導入にする。

* 最初に対応する追加言語は固定ページ中心
* 記事、ゲーム詳細、アセット詳細は**翻訳がある言語だけ** `/<locale>/...` を作る
* 未翻訳ページの `/<locale>/...` は生成しない
* 未翻訳ページの `/<locale>/...` はデフォルト言語のURLへ誘導する

## SEOルール

* `canonical` はそのページ自身の正式URLを出す
* `hreflang` は**実在する言語ペアだけ**出す
* 日本語しか存在しないページでは、追加言語向け `hreflang` は出さない
* 未翻訳ページへの `/<locale>/...` アクセスは、日本語版の正式URLへ誘導する

## 翻訳運用

* 日本語原文を正本にする
* 固定ページは手書きで管理する
* 各言語版は LLM 生成を補助に使ってよいが、公開前に人間が確認する
* 翻訳がないページは、追加言語版として見せず日本語版へ誘導する

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

TOP は記事一覧ホームではなく**活動ハブの玄関**として作る。

順番はこれで確定。

1. Header
2. Hero
3. 代表ゲーム
4. 代表アセット
5. About Preview
6. Latest Writing
7. Latest Releases
8. Search Teaser
9. About / Contact CTA
10. Footer

## Hero

含めるもの:

* 名前 / ブランド
* 一行の肩書き
* 2〜4行の短い説明
* CTA: `Games / Assets / Writing`
* 外部導線: `GitHub / X / Zenn / note / YouTube`

## 代表ゲーム / 代表アセット

* 代表作だけ固定表示
* カルーセルは使わない
* 各カードにサムネ、短い説明、CTA
* TOP に載せる対象は手動で選ぶ
* 表示順は編集方針として管理する

## Latest Writing

* 自サイト記事と外部記事を同じ一覧で扱う
* 外部記事のリンク先は元サイト
* 最大3件
* 記事系だけ表示
* 生の時系列ログではなく、**表示契約を満たした活動サマリ**として扱う
* `/articles/` も同じ方針で一覧を作る

## Latest Releases

* GitHub Releases を表示
* **同一リポジトリのリリースは1件に集約**
* 最大3件
* 記事欄とは分離

## Search Teaser

* `Open Search` 導線を TOP にも置く

## About / Contact

* `About` に外部活動への正式導線をまとめる
* `/about/` と `/contact/` への導線を TOP 下部に置く

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
* 言語切替
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
* **About**
* **フッター**

補助的に:

* 作品ページ
* 記事末尾

ヘッダーには SNS アイコン群を常設しない。

---

# 14. Contact 設計

`/contact/` を作る。

外部活動への導線は `About` に集約し、`/contact/` は連絡手段に絞る。

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

この章は**自サイト記事**の設計とする。

記事は **1記事1フォルダ** で管理する。

例:

```text
src/content/articles/some-article/
  index.mdx
  cover.png
  image-1.png
  diagram.svg
```

これで、記事専用画像を記事の近くに置ける。

外部記事は `src/content/` に持たず、記事一覧では外部同期データから混在表示する。

frontmatter の最小実用セット:

* `title`
* `description`
* `publishedAt`

任意項目:

* `updatedAt`
* `tags`
* `cover`
* `coverAlt` (`cover` がある場合は必須)
* `draft`

記事カードは frontmatter を正本にして作る。

表示項目:

* `title`
* `description`
* `publishedAt`
* `tags`
* `cover`（ある場合）

移行補助:

* WordPress categories / tags の変換表は `docs/migration/taxonomy-map.yml`
* 画像棚卸しは `docs/migration/media-audit.csv`

---

# 16. ページ形式の使い分け

* 軽い固定ページ: `.md`
* 文章中心だがコンポーネントを差し込みたい: `.mdx`
* 完全に自由なページ: `.astro`

つまり、**md でもリッチなページでも両方いける構成**にする。

固定ページは `src/pages/` 側で持つ。

---

# 17. リポジトリ構造

考え方はこれで固定。

* `src/pages/` = URL を決める層
* `src/content/` = 原本データ
* `src/components/` = 再利用UI
* `src/layouts/` = 共通レイアウト
* `src/lib/` = ロジック
* `src/generated/` = 自動収集データと保持する生成JSON
* `public/` = そのまま配るファイル
* `tests/` = テスト
* `docs/migration/` = 移行契約と棚卸し

つまり、
**pages = 入口、content = 原本、components = 部品、lib = 処理、generated = 自動生成、public = 生ファイル、docs/migration = 移行の正本**

---

# 18. 外部更新の自動取り込み

TOP の更新欄は自動更新にする。

取得元:

* Zenn
* note
* GitHub Releases

方法:

* GitHub Actions の **定期実行**
* GitHub Actions の **手動実行**
* 外部データ取得
* 正規化して `activity.json` を生成
* Astro が読んでビルド
* GitHub Pages に再公開

## 公開契約

記事系とリリース系は分ける。

`writing`:

* `id`
* `source`
* `title`
* `url`
* `publishedAt`

`release`:

* `groupId`
* `source`
* `repo`
* `name`
* `version`
* `url`
* `publishedAt`

`groupId` は **`source:repo`** で固定する。

集約単位は **repo 単位** にする。

対象にするのは、**GitHub Releases として公開したリリース**だけにする。

v1 では、1つの repo から複数の package や asset を配布していても区別しない。

## 重要ルール

* **記事系とリリース系は分離**
* **同一リポジトリのリリースは1件に集約**
* **依存 package の更新通知は対象外**
* **package registry への publish 通知は対象外**
* **機械的な更新通知は対象外**
* TOP は生の時系列ログではなく、**編集された活動サマリ**
* `activity.json` の保存先は **`src/generated/activity.json`**
* 取得成功時だけ `activity.json` を更新する
* 取得失敗時は `activity.json` を上書きしない
* **取得失敗時は前回成功した `activity.json` を使い続ける**
* 失敗時に空の `activity.json` を生成しない
* 失敗時に TOP を空にしない

---

# 19. 検索

* Pagefind を採用
* 検索対象は `articles`, `games`, `assets`, `about` を基本とする
* `contact`, `privacy-policy`, 検索ページ, 404, リダイレクト用ページは検索対象外
* 将来的に type フィルタを持てる構成にする

## 検索メタ契約

各検索対象ページでは、共通メタを同じ意味と既定値で扱う。

必須:

* `type`

`type` は次の4値に固定する。

* `article`
* `game`
* `asset`
* `page`

`about` は `type = page` とする。

既定値つき共通メタ:

* `tags`: 未設定時は空配列として扱う
* `updatedAt`: `updatedAt` → `publishedAt` → 未出力
* `image`: 未設定可
* `imageAlt`: `image` がある場合のみ出力

最初からこの契約でカード設計とテンプレートを作る。

---

# 20. Google Analytics

* GA4 を導入
* 共通レイアウトに直埋め

イベント名はこれで固定する。

* `view_search_results`
* `external_link_click`
* `project_cta_click`
* `locale_switch`
* `theme_switch`

---

# 21. 品質要件 / テスト / CI

最小構成はこれ。

* **Vitest**: ロジックテスト
* **Playwright**: E2E テスト
* **GitHub Actions**: CI

## build / CI で止めるもの

* schema 不整合
* 存在しない画像参照
* 重複URL
* 移行対象なのに `url-map.csv` 未登録
* `url-map.csv` と content の不整合

## 単体テスト対象

* URL 生成
* redirect 生成
* taxonomy 変換
* activity 正規化
* canonical / `hreflang` 生成

## E2E 対象

* ヘッダー導線
* テーマ切替
* 検索
* 代表的な `articles`, `games`, `assets` 詳細
* 旧URLから新URLへの誘導
* 代表的な追加言語ページの表示
* 未翻訳 `/<locale>/articles/...` から日本語版への誘導

## 非機能要件

アクセシビリティ:

* キーボード操作可能
* `focus-visible` 対応
* モーダルの focus trap
* 言語切替とテーマ切替に明示ラベル

性能:

* OGP / カバー画像サイズを管理する
* LCP 対象を意識して Hero と代表作品を設計する
* 一覧ページのカード数は初期表示を絞る

運用:

* broken link チェック
* OGP 崩れチェック
* 外部同期失敗時の fallback 確認

Definition of Done:

* 各フェーズで `npm run build` と `npm run check` が通る
* そのフェーズで追加した受け入れ条件を満たす

---

# 22. ドメイン移行方針

`mackysoft.net` は維持する。

ただし、これは「公開」ではなく**独立した移行計画**として扱う。

## 固定事項

* サイト本体は Xserver から外す
* 当面は GitHub Pages
* 将来は Cloudflare DNS / Registrar へ移行余地あり
* Xserver は先に解約しない

## 実装時に持つ前提

* canonical host は**まだ未決定**
* ただし、切替点は `site` 設定1か所に限定する
* 公開前に **domain verification** を済ませる
* **apex / `www` の両方**を張れる前提で準備する
* 最終的にどちらか一方を canonical とし、もう一方は redirect

## 切替当日の確認項目

* DNS 反映
* GitHub Pages 側の custom domain 設定
* HTTPS 有効化
* canonical URL
* `www` / apex の redirect
* 主要ページ表示
* 旧URLから新URLへの誘導

## Xserver 停止条件

* custom domain が安定して解決する
* 主要ページが新環境で表示できる
* redirect と HTTPS を確認済み

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

## フェーズ0: 決定事項の凍結

* Collection 構成
* frontmatter スキーマ
* 正式ルート
* `url-map.csv` 形式
* 検索メタ契約
* GA4 イベント名
* フェーズごとの Definition of Done
* `site` 設定の切替点

## フェーズ1: 基盤

* Astro プロジェクト土台
* 共通 Layout / Components
* Header / Footer / Theme / Language
* Light / Dark
* レスポンシブ
* Content Collections
* OGP / Sitemap / RSS
* build / CI

## フェーズ2: コアページ

* About
* Games
* Assets
* Writing
* Search
* Contact
* Privacy Policy
* 各詳細ページ

## フェーズ3: 既存コンテンツ移行

* WordPress 旧記事の Markdown / MDX 化
* `url-map.csv` 作成
* `url-map.csv` と content の照合
* `taxonomy-map.yml` 作成
* `media-audit.csv` 作成
* 画像 / 埋め込み / 外部リンク整理

## フェーズ4: TOP の編集設計

* Hero
* 代表ゲーム
* 代表アセット
* About Preview
* Latest Writing
* Latest Releases
* Search Teaser
* About / Contact CTA

## フェーズ5: 検索と計測

* Pagefind 導入
* 検索メタ埋め込み
* GA4 導入
* 最低限の E2E

## フェーズ6: 外部同期

* Zenn / note / GitHub Releases 自動収集
* `schedule` + `workflow_dispatch`
* `activity.json` の自動生成
* 失敗時 fallback の確認

## フェーズ7: 多言語

* 追加言語プレフィックス導入
* 固定ページの多言語対応
* 未翻訳ページのデフォルト言語への誘導方針適用
* `hreflang` / canonical の調整

## フェーズ8: 公開 / ドメイン切替

* GitHub Pages 公開
* custom domain 設定
* domain verification
* `mackysoft.net` 接続
* DNS 切替
* apex / `www` redirect 確認
