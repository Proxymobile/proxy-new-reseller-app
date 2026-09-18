# Google Analytics and Search Console

Configured measurement ID: `G-KNF0HKV37K`. It is set locally and as the Docker
build default. An explicit empty `NEXT_PUBLIC_GA_MEASUREMENT_ID` disables tracking.
The site still needs deployment and a GA4 Realtime check to confirm collection.

## Activate Google Analytics 4

1. In Google Analytics, create or select the property and a Web data stream for
   `https://proxymobile.shop`. Copy its measurement ID (`G-…`).
2. Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in the server's `.env`.
3. **Turn off Enhanced Measurement for this web stream.** The app sends its own
   page views and selected clicks. Automatic history/form events can duplicate
   views or collect private page information. Do not enable Google Signals or
   advertising features for this implementation.
4. Rebuild and deploy with `bash deploy/deploy.sh`. The ID is public and is
   included during the Docker build. Changing only the running container's
   environment is insufficient. No tag is loaded when the ID is blank/invalid.
5. Open the deployed site, allow analytics, and verify `page_view` and `cta_click`
   in GA4 Realtime. Reject analytics in a fresh browser session to confirm that
   the Google tag is not loaded. Cookie settings allows consent withdrawal.

## What is measured

- Public homepage, country pages, use-case pages, API guide, and legal pages.
- `page_view` on initial consent and subsequent public route changes.
- `cta_click` with an `action` of `get_started`, `view_pricing`, or `view_api_guide`.
- No account or checkout events, revenue, form content, or proxy traffic.
- No query strings or referrer URLs are supplied. This intentionally omits UTM
  campaign attribution. No events are intentionally sent on private routes.
- The tag only loads after opt-in; advertising consent remains denied. Consent
  choice is saved locally. Analytics cookie lifetime is 180 days with renewal.

Mark `cta_click` as a key event only if CTA clicks are the desired conversion;
it does not prove signup or purchase completion.

## Google Search Console

Search Console measures Google Search visibility separately from GA4.

1. Add `https://proxymobile.shop/` as a URL-prefix property.
2. Select HTML tag verification and copy only its `content` token into
   `GOOGLE_SITE_VERIFICATION` in `.env`. Rebuild and deploy.
3. Click Verify in Search Console, then submit `https://proxymobile.shop/sitemap.xml`.
   A Domain property uses DNS verification instead and does not use this token.

## References

- [Google's manual page-view guidance](https://developers.google.com/analytics/devguides/collection/ga4/views)
- [Google's consent implementation guidance](https://developers.google.com/tag-platform/security/guides/consent)

Activation and receipt of events still require the real measurement ID and a
deployment. No Google property or Search Console property was created by these code changes.
