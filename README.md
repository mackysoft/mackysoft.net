# mackysoft.net

## Prerequisites

- Node.js 22.12.0 以上 23 未満
- npm 10 以上

## Setup

```bash
npm install
```

## Available Commands

```bash
npm run dev
npm run build
npm run deploy:workers
npm run preview
npm run check
npm run import:wordpress
```

## WordPress Import

旧 WordPress ブログ記事をローカル原本へ移すときは、次を実行します。

```bash
npm run import:wordpress
```

## Cloudflare Workers Preview

- Preview URL: `https://site.mackysoft.workers.dev`
- Required secrets: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`
- Local deploy command:

```bash
npm run build
npm run deploy:workers
```

- `master` への push 後は、CI 成功を条件に GitHub Actions から Cloudflare Workers へ deploy されます。
- `mackysoft.net` の custom domain 切替は後続タスクです。
