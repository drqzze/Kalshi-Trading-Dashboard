const KALSHI_BASE_URL = "https://api.elections.kalshi.com/trade-api/v2";

export type KalshiMarket = {
  ticker: string;
  event_ticker: string;
  title: string;
  status: string;
  yes_bid_dollars: string;
  yes_ask_dollars: string;
  no_bid_dollars: string;
  no_ask_dollars: string;
  volume_24h_fp: string;
  volume_fp?: string;
  previous_yes_bid_dollars?: string;
  previous_yes_ask_dollars?: string;
  mve_collection_ticker?: string;
};

export type KalshiEvent = {
  event_ticker: string;
  series_ticker: string;
  title: string;
  category?: string;
};

export type MarketWithEvent = KalshiMarket & {
  seriesTicker: string;
  category: string;
};

export class KalshiNotFoundError extends Error {}

export async function fetchMarket(ticker: string): Promise<KalshiMarket> {
  const res = await fetch(
    `${KALSHI_BASE_URL}/markets/${encodeURIComponent(ticker)}`,
    { cache: "no-store" }
  );
  if (res.status === 404) {
    throw new KalshiNotFoundError(`Market not found: ${ticker}`);
  }
  if (!res.ok) {
    throw new Error(`Kalshi API error (${res.status}) for market ${ticker}`);
  }
  const data = await res.json();
  return data.market as KalshiMarket;
}

/**
 * Pages through Kalshi's public /events endpoint (with nested markets) for
 * currently open events. /markets?status=open is dominated by auto-generated
 * combinatorial multi-leg markets (tens of thousands of them); /events only
 * surfaces real, single-question markets, so Discover is built on this instead.
 */
export async function fetchOpenEventMarkets(maxPages = 6): Promise<MarketWithEvent[]> {
  const all: MarketWithEvent[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const url = new URL(`${KALSHI_BASE_URL}/events`);
    url.searchParams.set("status", "open");
    url.searchParams.set("limit", "200");
    url.searchParams.set("with_nested_markets", "true");
    if (cursor) url.searchParams.set("cursor", cursor);

    // Each page is several MB raw (well over Next's 2MB data-cache limit),
    // so there's no benefit pretending this is cacheable — fetch fresh.
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Kalshi API error (${res.status}) listing events`);
    }
    const data = await res.json();
    type EventWithMarkets = KalshiEvent & { markets?: KalshiMarket[] };
    for (const event of (data.events ?? []) as EventWithMarkets[]) {
      for (const market of event.markets ?? []) {
        all.push({
          ...market,
          seriesTicker: event.series_ticker,
          category: event.category ?? "Other",
        });
      }
    }
    cursor = data.cursor || undefined;
    if (!cursor) break;
  }

  return all;
}

export async function fetchEvent(eventTicker: string): Promise<KalshiEvent> {
  const res = await fetch(
    `${KALSHI_BASE_URL}/events/${encodeURIComponent(eventTicker)}`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    throw new Error(`Kalshi API error (${res.status}) for event ${eventTicker}`);
  }
  const data = await res.json();
  return data.event as KalshiEvent;
}

export function marketToSnapshotFields(market: KalshiMarket) {
  return {
    yes_bid: parseFloat(market.yes_bid_dollars),
    yes_ask: parseFloat(market.yes_ask_dollars),
    no_bid: parseFloat(market.no_bid_dollars),
    no_ask: parseFloat(market.no_ask_dollars),
    volume_24h: parseFloat(market.volume_24h_fp),
  };
}

/**
 * Accepts either a raw ticker (e.g. KXFED-26MAR19) or a Kalshi market URL
 * and returns a best-guess ticker. URL parsing is a heuristic: it takes the
 * last path segment and uppercases it, since callers still validate the
 * result against the live API and surface an error if it doesn't resolve.
 */
export function resolveTickerInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed.includes("kalshi.com")) {
    return trimmed.toUpperCase();
  }
  const withoutQuery = trimmed.split(/[?#]/)[0];
  const segments = withoutQuery.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1] ?? trimmed;
  return lastSegment.toUpperCase();
}
