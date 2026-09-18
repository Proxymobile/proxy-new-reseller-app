# Release readiness — 2026-09-15

## Completed

- Updated Next.js to 15.5.25, Auth.js to 5.0.0-beta.32, and affected transitive
  dependencies. Pinned PostCSS to 8.5.28 with an override to remove Next.js's
  vulnerable bundled version. The dependency audit reports zero vulnerabilities.
- Moved authentication middleware to the supported Node.js runtime to avoid
  Edge incompatibilities in the patched authentication library.
- Added Docker context exclusions for secrets and local artifacts, production
  configuration validation, and a container HTTP health check. The deployment
  script validates configuration and waits for health before reporting success.
- Production wallet challenges now require AUTH_SECRET.

## Verification

- Production build: passed, 62 generated pages, no compilation warnings.
- TypeScript check and deployment script syntax: passed.
- Six configuration validator checks: valid fixture accepted; missing values,
  HTTP origin, short secret, placeholder API key, and invalid database URL rejected.
- Packaged standalone server: homepage, login, API guide, representative country
  and use-case pages, terms, privacy, robots, sitemap, and logo returned HTTP 200.
- Signed-out dashboard/admin requests redirect to login. Pool keys API returns
  401, admin accounts API returns 403, unknown pages return 404.
- Browser checks: pricing amount selection and billing tabs work. Mobile menu
  opens and reaches login. Homepage and login fit a 390px viewport. No browser
  console errors were observed during these checks.

## Still required on the deployment environment

- The local `.env` has development/placeholder values for AUTH_SECRET,
  PROXIES_SX_API_KEY, STRIPE_SECRET_KEY, and AUTH_URL. These are not release
  credentials. Validate the server configuration independently; no server
  configuration was inspected or changed during this preparation.
- Docker is not installed locally, so the container image and Compose release
  path still require verification on the deployment host. The standalone Node
  output was tested locally.
- Check database migrations, authenticated account access, payments/webhooks,
  and actual proxy traffic with a designated test account before opening sales.
  No accounts were created and no payments or production database writes were made.
- Public gateway environment overrides must be supplied at image build time if
  changing the defaults; Next.js embeds NEXT_PUBLIC values into browser bundles.

No release has been published. Follow DEPLOY.md for the guarded deployment path.
