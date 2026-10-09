#!/bin/sh
# Deploy the app + Whisper worker to Cloudflare in one step.
#
# Required env:
#   CLOUDFLARE_API_TOKEN   (Pages Edit + Workers Scripts Edit + Workers AI Edit)
#   CLOUDFLARE_ACCOUNT_ID
#   VITE_WHISPER_ENDPOINT  (your deployed Whisper worker URL)
#   VITE_WHISPER_LANGUAGE  (optional, e.g. te)
set -e

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

# Cloudflare's CLI occasionally scaffolds a vite plugin into these files.
# Undo any such local writes so the repo's build stays the plain static build.
git checkout -- package.json package-lock.json vite.config.ts 2>/dev/null || true
rm -rf .wrangler

if [ -z "$CLOUDFLARE_API_TOKEN" ] || [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
  echo "CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID must be set." >&2
  exit 1
fi
if [ -z "$VITE_WHISPER_ENDPOINT" ]; then
  echo "VITE_WHISPER_ENDPOINT must be set (see docs/RELEASE.md)." >&2
  exit 1
fi

echo "Building app (VITE_WHISPER_ENDPOINT=$VITE_WHISPER_ENDPOINT)…"
npm run build

echo "Deploying Whisper worker…"
npx wrangler@latest deploy --config whisper-worker/wrangler.toml

echo "Deploying app (Pages)…"
npx wrangler@latest deploy

git checkout -- package.json package-lock.json vite.config.ts 2>/dev/null || true
echo "Done. App and worker are live."