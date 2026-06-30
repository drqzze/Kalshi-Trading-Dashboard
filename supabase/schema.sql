create extension if not exists pgcrypto;

create table if not exists tracked_markets (
  id uuid primary key default gen_random_uuid(),
  ticker text not null unique,
  title text not null,
  series_ticker text,
  created_at timestamp default now()
);

create table if not exists odds_snapshots (
  id uuid primary key default gen_random_uuid(),
  ticker text not null references tracked_markets(ticker) on delete cascade,
  yes_bid numeric,
  yes_ask numeric,
  no_bid numeric,
  no_ask numeric,
  volume_24h numeric,
  captured_at timestamp default now()
);

create index if not exists odds_snapshots_ticker_captured_at_idx
  on odds_snapshots (ticker, captured_at desc);
