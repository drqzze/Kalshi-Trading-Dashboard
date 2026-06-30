# Kalshi Odds Dashboard

Self-hosted, read-only dashboard that tracks Kalshi market odds over time. Paste a
market ticker or URL, and a cron job snapshots the yes/no prices every 15 minutes so
you can see a sparkline of price movement instead of a single snapshot.

This app does not place trades, fund accounts, or predict outcomes. All Kalshi data
is read from the public, unauthenticated `/trade-api/v2` endpoints.

## 1. Create a Supabase project (free tier)

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the SQL editor, run the contents of [`supabase/schema.sql`](supabase/schema.sql)
   to create the `tracked_markets` and `odds_snapshots` tables.
3. Go to **Project Settings > API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret — it's only
     used server-side, in route handlers and server components, never sent to the
     browser)

This app reads and writes using the service role key from the server only, so Row
Level Security policies are not required for v1. If you'd rather lock things down
with RLS + the anon key, that's a reasonable follow-up but isn't necessary to run
this.

## 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

`CRON_SECRET` is a random string you choose yourself (e.g. `openssl rand -hex 32`).
It protects `/api/cron/poll` from being called by anyone else.

## 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), paste a Kalshi ticker (e.g.
`KXFED-27APR-T4.25`) or a market URL, and click "Track market". This immediately
fetches and stores one snapshot so you see data right away.

To manually trigger a poll of all tracked markets locally:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/poll
```

## 4. Deploy to Vercel

1. Push this repo to GitHub and import it into Vercel, or run `vercel` from this
   directory.
2. In the Vercel project's **Settings > Environment Variables**, add the same
   variables from `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`).
3. `vercel.json` already defines a cron job that hits `/api/cron/poll` every 15
   minutes. Vercel automatically sends `Authorization: Bearer $CRON_SECRET` on cron
   invocations when `CRON_SECRET` is set as an env var, so no extra wiring is
   needed. Adjust the schedule in `vercel.json` if you want a different interval
   (15-30 min is plenty given Kalshi's public data refresh rate).

## How it works

- **Adding a market** (`POST /api/track`) resolves the ticker (or guesses one from
  a pasted URL), validates it against `GET /markets/{ticker}`, looks up its
  `series_ticker` via `GET /events/{event_ticker}`, upserts it into
  `tracked_markets`, and inserts an immediate snapshot.
- **Polling** (`GET /api/cron/poll`) re-fetches every tracked market's current
  prices and inserts a new row into `odds_snapshots`. Snapshot rows accumulate over
  time, which is what powers the sparklines.
- **Dashboard** (`/`) is a server component that loads tracked markets and their
  recent snapshot history from Supabase, then renders sortable/filterable rows
  with a price (mid of yes bid/ask), 24h change, and sparkline. Sorting/filtering
  by series and by 24h movement happens client-side in `src/components/Dashboard.tsx`.

Kalshi's public market endpoints return prices as decimal-dollar strings (e.g.
`"0.4400"` for 44¢), not integer cents as older docs describe — `marketToSnapshotFields`
in `src/lib/kalshi.ts` parses these directly into the numeric columns.
