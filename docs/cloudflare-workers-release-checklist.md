# Cloudflare Workers 公開チェックリスト

Cloudflare Workers へ公開する前後で、URL 契約と主要導線を確認するための手順です。DNS 切替手順と Search Console 運用は対象外です。

## 公開前

- `npm run check` を実行し、型と Astro の整合性を確認する
- `npm run test:unit` を実行し、canonical、redirect、公開 URL の契約テストを確認する
- `npm run build` を実行し、静的生成、`sitemap.xml`、`feed.xml`、redirect 生成が成功することを確認する
- 公開判断前にブラウザ確認が必要な変更を含む場合は `npm run test:e2e:run` を実行する

## 公開コマンド

- `npm run deploy:workers` を実行する
- GitHub Actions から公開する場合は `master` への push 後に `Deploy Workers` workflow が成功していることを確認する

## 公開後の確認

- `https://site.mackysoft.workers.dev/` が表示できる
- `https://site.mackysoft.workers.dev/sitemap.xml` が `astro.config.mjs` の `site` で組み立てた canonical URL だけを返す
- `https://site.mackysoft.workers.dev/feed.xml` が公開済みローカル記事だけを返す
- `https://site.mackysoft.workers.dev/robots.txt` が sitemap の absolute URL を返す
- `https://site.mackysoft.workers.dev/llms.txt` が主要ページと structured endpoint の absolute URL を返す
- 主要ページ `/`、`/articles/`、`/games/`、`/assets/`、`/about/`、`/contact/`、`/privacy-policy/` が表示できる
- canonical と `og:url` が `astro.config.mjs` の `site` に一致する
- 代表的な旧 URL が HTTP の permanent redirect として正しい新 URL へ移動する

## メモ

- canonical host を切り替える場合、変更箇所は `astro.config.mjs` の `site` のみとする
