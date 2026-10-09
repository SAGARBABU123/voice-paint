# Release & Deployment — Voice Over Paint

## Build

```bash
npm ci
npm run build      # outputs a static site to dist/
npm run preview    # serve dist/ locally at http://localhost:4173
```

`dist/` contains static HTML/CSS/JS only. There is **no backend, database,
environment variable, or secret** required.

## Deploy

Serve `dist/` from any static host, for example Netlify, Vercel, GitHub Pages,
Cloudflare Pages, or an S3 bucket. Because the app is a single screen with no
client-side routing, no rewrite/redirect rules are needed.

- Build command: `npm run build`
- Publish directory: `dist`

### Current live deployment

- App: `https://voice-over-paint.gudipudisagarbabu9.workers.dev`
- Whisper Worker: `https://voice-over-paint-whisper.gudipudisagarbabu9.workers.dev`

Deploy both from the repo root (committed `wrangler.jsonc` covers the app):

```bash
VITE_WHISPER_ENDPOINT=https://voice-over-paint-whisper.<sub>.workers.dev \
VITE_WHISPER_LANGUAGE=en \
CLOUDFLARE_API_TOKEN=<token> CLOUDFLARE_ACCOUNT_ID=<id> \
  ./scripts/deploy-cloudflare.sh
```

or manually: build with the `VITE_WHISPER_*` env vars, then
`wrangler deploy --config whisper-worker/wrangler.toml` (worker) and
`wrangler deploy` (app). Note: Cloudflare's CLI sometimes scaffolds a Vite
plugin into `package.json`/`vite.config.ts` during deploys; `git checkout`
those files afterwards so the repo stays a plain static build.

### Cloudflare (recommended)

The app is a PWA (manifest + service worker), so a host with **unlimited static
bandwidth** is ideal — Cloudflare Pages fits. The Whisper speech engine is a
separate Worker (`whisper-worker/`) using Workers AI.

1. Create a Cloudflare account, then a **Pages project** (`voice-over-paint`).
2. Deploy the Whisper worker once: `cd whisper-worker && npx wrangler deploy`.
3. Add repository secrets in GitHub: `CLOUDFLARE_API_TOKEN`,
   `CLOUDFLARE_ACCOUNT_ID`, and optionally `VITE_WHISPER_ENDPOINT` +
   `VITE_WHISPER_LANGUAGE` (worker URL and `te`).
4. Push to `main` — `.github/workflows/deploy.yml` deploys the app and the
   worker automatically (or trigger it manually).
5. Set a **spend limit of $0** on Workers AI so the free 10,000 Neurons/day can
   never turn into a bill. Set `ALLOWED_ORIGINS` in `wrangler.toml` to your
   Pages URL before going public.

## Branching & review flow

- `main` is always the **shippable, deployed** branch. Deploys to Cloudflare only
  happen from `main` (deploy.yml waits for CI to pass on `main`).
- All new work happens on a child branch from `main` (currently **`develop`**).
  CI runs on **every** branch push and pull request.
- To ship: push to `develop` → open a **pull request to `main`** → CI runs on
  the PR → merge only when it is green (branch protection should require the
  `Typecheck · Lint · Format · Unit · Build` status check).
- The local pre-push hook (`npm run typecheck && lint && format:check &&
test:run`) blocks pushing anything that would fail CI anyway.

```text
develop ──────────────► main ──► deploy.yml ──► Cloudflare
   │                       (CI must pass)
   └── (feature commit) ───┘
```

## Continuous integration

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs on push and pull
request:

1. **quality** — `npm ci`, typecheck, lint, format check, unit tests, build.
2. **e2e** — installs Chromium, Firefox, and WebKit, builds, and runs the
   Playwright suite across all three browsers; uploads the HTML report as an
   artifact.

## Pre-release checklist

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run format:check` passes
- [ ] `npm run test:run` passes
- [ ] `npm run test:e2e` passes (build + Playwright)
- [ ] Version bumped in `package.json`
- [ ] `README.md`, `docs/USAGE.md`, and `docs/BROWSERS.md` are current
- [ ] Known limitations reviewed and documented
