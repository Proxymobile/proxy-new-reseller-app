# SEO Tracker

The `/admin/seo` page tracks how the site performs in Google search. It has
three parts, and only the first needs setup.

| Part | Source | Needs setup |
|------|--------|-------------|
| Clicks, impressions, CTR, position, top queries, top pages | Google Search Console API | Yes — see below |
| Tracked keywords | Your list in `seo_keywords`, joined to Search Console data | No |
| On-page audit | Live fetch of the site's own pages | No |

## Connecting Search Console

1. **Google Cloud console** → create (or pick) a project → *APIs & Services* →
   enable **Google Search Console API**.
2. *IAM & Admin* → *Service Accounts* → create one → *Keys* → *Add key* →
   *JSON*. Download it.
3. **Search Console** → your property → *Settings* → *Users and permissions* →
   *Add user* → paste the service account's `client_email` → role **Full** (or
   Restricted; read access is all that is used).
4. Set the environment on the server and redeploy:

   ```sh
   GSC_SERVICE_ACCOUNT_JSON='<the whole key JSON on one line>'
   GSC_SITE_URL='sc-domain:proxymobile.shop'
   ```

   `GSC_SERVICE_ACCOUNT_JSON` also accepts the JSON base64-encoded, which is
   easier to paste into some hosts. For a URL-prefix property rather than a
   domain property, use `GSC_SITE_URL='https://proxymobile.shop/'`.

5. Open `/admin/seo` and press **Sync from Search Console**.

## How the data is stored

Search Console is slow and rate-limited, so the panel never queries it live.
`syncSearchConsole()` writes into `seo_daily`:

- `dimension = 'site'` — one row per day, the property totals. This drives the
  KPI tiles, the deltas and the daily chart.
- `dimension = 'query'` / `'page'` — one row per query (or page) per *sync*,
  stamped with the sync window's end date. Each row is the total for the whole
  window, not for that one day.

That second shape is deliberate: per-day-per-query rows explode in size and
Google samples them heavily. It means query and page **movement** compares the
latest sync against the sync nearest one period earlier — so the movement
column only becomes useful once syncs have been running for a while.

Google's data lags about two days and query rows are sampled. Treat positions
as directional, not exact.

## Scheduling the sync

Daily is plenty. Set `SEO_CRON_SECRET` on the deployment, then from anywhere:

```sh
SEO_CRON_SECRET=... APP_URL=https://proxymobile.shop npm run seo:sync
```

Or straight from cron on the VPS:

```cron
17 4 * * * cd /opt/proxy-app && SEO_CRON_SECRET=... node scripts/seo-sync.mjs >> /var/log/seo-sync.log 2>&1
```

Without `SEO_CRON_SECRET` the endpoint only accepts a signed-in admin, and the
button in the panel is the only way to sync.

## Tracked keywords

Add the terms you are targeting under *Tracked keywords*. They are matched
case-insensitively against Search Console queries, so a keyword shows a
position only once Google records impressions for that exact query. A keyword
with no data yet shows `—` rather than a fake number.

*Quick wins* lists queries ranking 9–25 with real impressions — the highest
leverage work available, since those are one push away from page one.

## On-page audit

Fetches the pages in `AUDIT_PATHS` (in `src/app/admin/seo/page.tsx`) and checks
title length, meta description, `<h1>` count, canonical URL, JSON-LD and
`noindex`. Results are cached for 15 minutes. This catches the regressions that
silently kill rankings — a lost canonical, a stray `noindex` — without a
third-party crawler.
