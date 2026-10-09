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
