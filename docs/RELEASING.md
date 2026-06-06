# Releasing LoyaltyCards

**Single source of truth for the version: `package.json` → `"version"`.**
Vite injects it at build time (`__APP_VERSION__`, see `vite.config.ts`); it's shown in Settings
(`src/lib/version.ts`), and the same number is used as the Docker image tag and the git tag.

## To cut a release `X.Y.Z`

1. **Bump the version** in `package.json` and commit it on its own:
   ```bash
   # edit package.json "version" -> X.Y.Z
   git add package.json && git commit -m "LoyaltyCards: bump version to X.Y.Z"
   git push origin main
   git tag vX.Y.Z && git push origin vX.Y.Z
   ```
2. **Build + push the image** with the same tag (include the logo.dev token; the backend URL
   defaults to the live origin in code):
   ```bash
   docker build --build-arg VITE_LOGODEV_TOKEN="$VITE_LOGODEV_TOKEN" \
     -t tomigorn/loyalty-cards:X.Y.Z -t tomigorn/loyalty-cards:latest .
   docker push tomigorn/loyalty-cards:X.Y.Z && docker push tomigorn/loyalty-cards:latest
   ```
3. **Deploy:** bump `IMAGE_TAG=X.Y.Z` in `/home/pi/Projects/Docker/LoyaltyCards/.env`, then
   `docker compose up -d --pull always` and verify `https://loyalty-cards.holy-grail.ch` → 200.
4. Confirm **Settings shows `v X.Y.Z`** after the PWA updates.

Versioning is semver-ish for a 0.x app: patch (`0.9.0`→`0.9.1`) for fixes/small additions,
minor (`0.9.x`→`0.10.0`) for notable features.
