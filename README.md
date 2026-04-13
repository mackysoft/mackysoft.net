# mackysoft.net

Astro で構築した静的サイトです。`dist/` を生成し、Cloudflare Workers で配信します。

## 環境構築

前提:

- Node.js `22.17.0`
- npm `10` 以上

`.nvmrc` を使う場合は次を実行します。

```bash
nvm use
```

依存関係をインストールします。

```bash
npm ci
```

ローカル開発では追加の環境変数は不要です。GA4 の動作確認が必要な場合だけ `PUBLIC_GA4_MEASUREMENT_ID` を指定してください。GitHub の公開リポジトリ README を検索インデックスへ取り込みたい場合は、任意で `GITHUB_TOKEN` または `GH_TOKEN` を設定します。

## 開発とプレビュー

開発サーバーを起動します。

```bash
npm run dev
```

- ホットリロード付きで編集内容を確認できます。
- Astro の既定ポートは `4321` です。

本番ビルド結果をローカルで確認するときは、先にビルドしてからプレビューを起動します。

```bash
npm run build
npm run preview
```

`npm run build` では Astro の静的出力に加えて、検索インデックスと旧 URL からの静的リダイレクトも `dist/` に生成します。公開前の確認は `npm run dev` ではなくこちらを使ってください。未認証のままでもビルドは通りますが、GitHub API の rate limit に達すると一部の外部 README を検索インデックスへ取り込めない場合があります。

## よく使うコマンド

```bash
npm run dev
npm run build
npm run preview
npm run check
npm run new:article -- my-new-article
npm run test:unit
npm run test:e2e
npm run test
npm run sync:activity
npm run import:wordpress
npm run deploy:workers
```

- `npm run check`: Astro と TypeScript の整合性を確認します。
- `npm run test:e2e`: ビルド後に Playwright で E2E テストを実行します。初回は Chromium のセットアップを含みます。
- `npm run sync:activity`: GitHub と Zenn の活動データを `src/generated/activity.json` に同期します。
- `npm run import:wordpress`: 旧 WordPress 記事を `src/content/articles` 配下へ取り込みます。

## 記事の追加方法

新規記事の最低限の雛形を作るときは次を実行します。

```bash
npm run new:article -- my-new-article
```

これで `src/content/articles/my-new-article/` に `index.md` が作成されます。生成直後は `draft: true` になっているため、公開準備が整うまで記事一覧には出ません。

記事は `src/content/articles/<slug>/index.md` に配置します。`<slug>` がそのまま記事 URL の一部になり、公開パスは `/articles/<slug>/` です。

画像を含める場合は記事ディレクトリに同梱し、Markdown から相対パスで参照します。

```text
src/content/articles/my-article/
├── index.md
└── cover.png
```

生成されるテンプレート:

```md
---
title: "Title"
description: "Description"
publishedAt: "2026-04-14 13:37"
tags: []
draft: true
---
```

記事 frontmatter の扱い:

- `title`, `description`, `publishedAt` は必須です。
- `updatedAt`, `tags`, `cover`, `coverAlt`, `draft` は任意です。
- `publishedAt` と `updatedAt` は `YYYY-MM-DD HH:mm` 形式を基本にします。
- `cover` を指定する場合は `coverAlt` も必須です。
- `draft: true` にすると記事一覧と記事ページの取得対象から外れます。

翻訳版を追加する場合は同じディレクトリに `index.<locale>.md` を置きます。現在の対応ロケールは `en` です。

```text
src/content/articles/my-article/
├── index.md
├── index.en.md
└── cover.png
```

翻訳記事で使う frontmatter は次だけです。

```md
---
title: "English title"
description: "English description"
cover: "./cover.png"
coverAlt: "English cover description"
draft: false
---
```

- 翻訳ファイルが無い場合、英語ページは日本語記事へフォールバックします。
- 公開日、更新日、タグはベース記事の `index.md` 側を使います。

## デプロイ

`master` への push 後、CI が成功すると GitHub Actions から Cloudflare Workers へデプロイします。手元から手動で反映する場合は、Cloudflare の認証情報を環境変数に設定したうえで次を実行します。

```bash
npm run build
npm run deploy:workers
```

必要な環境変数:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- Release checklist: [`docs/cloudflare-workers-release-checklist.md`](docs/cloudflare-workers-release-checklist.md)

`workers.dev` の URL は `workers_dev: true` の設定により Cloudflare 側で払い出されますが、この README では正規の利用先として案内しません。公開導線はカスタムドメイン側に寄せて管理してください。
