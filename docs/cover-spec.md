# カバー仕様

このドキュメントは、記事カード、記事詳細、検索、OGP 生成で使うカバー画像の契約をまとめたものです。対象は記事まわりのカバーのみで、ゲームやリリースのカバー契約は含みません。

## 用語

- 著者指定カバー
  - 記事 frontmatter の `cover` と `coverAlt` により与えられるローカル画像
- 生成カバー
  - サムネ未設定のローカル記事に対してビルド時に生成するタイトルカード画像
- カード用カバー
  - 記事一覧や検索結果のような一覧 UI で使う縮小版カバー
- SEO 用カバー
  - `og:image` と `twitter:image` に使う高解像度カバー

## 入力契約

### 記事 frontmatter

記事コンテンツの入力契約は `src/content.config.ts` の `articles` / `articleTranslations` schema に従います。

- `cover?: image()`
- `coverAlt?: string`

制約:

- `cover` を指定した場合は `coverAlt` が必須
- `cover` 未指定の記事は、自動で生成カバーへフォールバックする

## 出力契約

### 1. 記事カード用契約

記事一覧系 UI に渡す契約は `src/lib/articles.ts` の `ArticleItem.cover?: ArticleCardCover` です。

```ts
type ArticleCardCover =
  | { kind: "generated"; src: string; alt: string; width: number; height: number }
  | { kind: "remote"; src: string; alt: string }
  | { kind: "local"; src: ImageMetadata; alt: string; width: number; height: number };
```

意味:

- `generated`
  - サムネ未設定のローカル記事向け
  - `src` は `/og/articles/cards/...` 系の PNG
- `remote`
  - 外部記事向け
  - `src` は外部 URL
- `local`
  - 著者指定カバー向け
  - `src` は Astro の `ImageMetadata`

利用先:

- `src/components/ArticleCard.astro`

注意:

- `ArticleItem` 自体には `coverAlt` を持たせず、`cover.alt` に内包する
- `ArticleCard` は cover の種類を推測せず、`kind` だけを見て描画する

### 2. SEO / 検索 / 画像生成用契約

用途別画像解決に使う契約は `src/features/site/social-image.ts` の `SocialImage` です。

```ts
type SocialImage = {
  src: string | ImageMetadata;
  alt: string;
  width: number;
  height: number;
};
```

利用先:

- 記事詳細ページの SEO メタ
- `SearchMetadata`
- OGP 画像生成ルート

補助契約:

```ts
type ResolvedLocalArticlePageImages = {
  social: SocialImage;
  search: SocialImage;
};
```

- `social`
  - 記事詳細の `og:image` / `twitter:image` 用
- `search`
  - Pagefind の `image` / `imageAlt` 用

## 解決ルール

### ローカル記事カード

`src/lib/articles.ts` の `toLocalizedLocalArticleItem()` がカード用カバーを決めます。

- 著者指定カバーがある
  - `kind: "local"`
- 著者指定カバーがない
  - `kind: "generated"`
  - `/og/articles/cards/<slug>.png` を使う

### 外部記事カード

`src/lib/articles.ts` の `toExternalArticleItem()` がカード用カバーを決めます。

- `coverUrl` がある
  - `kind: "remote"`
- `coverUrl` がない
  - `cover` 自体を持たない

### 記事詳細ページ

`src/routes/articles/[slug].astro` は `resolveLocalArticlePageImages()` を使います。

- `social`
  - 著者指定カバーがあればそれを使う
  - なければ `/og/articles/<slug>.png` を使う
- `search`
  - 著者指定カバーがあればそれを使う
  - なければ `/og/articles/cards/<slug>.png` を使う

注意:

- 記事本文上部のヒーローには生成カバーを表示しない
- ヒーローで表示するのは著者指定カバーだけ

## 生成ルート

### SEO 用生成カバー

- 日本語: `/og/articles/[slug].png`
- ローカライズ記事: `/en/og/articles/[slug].png`

実装:

- `src/pages/og/articles/[slug].png.ts`
- `src/pages/[locale]/og/articles/[slug].png.ts`

サイズ:

- `1200x630`

### カード用生成カバー

- 日本語: `/og/articles/cards/[slug].png`
- ローカライズ記事: `/en/og/articles/cards/[slug].png`

実装:

- `src/pages/og/articles/cards/[slug].png.ts`
- `src/pages/[locale]/og/articles/cards/[slug].png.ts`

サイズ:

- `480x252`

## 外部公開されるメタ契約

記事詳細ページでは `src/layouts/SiteLayout.astro` から `src/components/head/SiteSeo.astro` を通して、次のメタを出します。

- `og:image`
- `og:image:alt`
- `og:image:width`
- `og:image:height`
- `twitter:image`
- `twitter:image:alt`

サムネ未設定のローカル記事では、外部サービスに公開される画像はカード用ではなく SEO 用の `/og/articles/...` です。つまり、Twitter/X などの OGP 消費側が使うのは高解像度側です。

## 検索結果での扱い

`src/components/search/SearchMetadata.astro` は `image` と `imageAlt` を Pagefind のメタに流します。検索結果ページの `src/scripts/site-search.ts` はその値を `480x252` の `<img>` として描画します。

そのため、ローカル記事の検索結果に使う画像は必ず `search` 側の契約を使い、サムネ未設定記事では `/og/articles/cards/...` を渡します。

## 変更時の判断基準

- カード表示の契約を変えるなら `ArticleCardCover` を変える
- SEO / OGP / 検索メタの契約を変えるなら `SocialImage` を変える
- 記事詳細で用途別画像の選択ルールを変えるなら `resolveLocalArticlePageImages()` を変える
- 生成画像の見た目やサイズを変えるなら `src/features/site/og-image/*` と生成ルートを変える
