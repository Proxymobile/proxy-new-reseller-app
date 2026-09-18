-- First-party, cookieless page-view counts for the admin traffic panel.
-- Aggregated per day/path/source/device: no IP addresses, user agents,
-- cookies or per-visitor identifiers are stored.
CREATE TABLE IF NOT EXISTS page_views_daily (
  day     DATE    NOT NULL,
  path    TEXT    NOT NULL,
  source  TEXT    NOT NULL DEFAULT 'direct',
  device  TEXT    NOT NULL DEFAULT 'desktop' CHECK (device IN ('mobile', 'desktop')),
  views   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, path, source, device)
);
CREATE INDEX IF NOT EXISTS idx_page_views_day ON page_views_daily(day DESC);
