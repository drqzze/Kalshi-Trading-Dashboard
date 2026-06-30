import { MarketWithEvent } from "./kalshi";

export type DiscoverRow = {
  ticker: string;
  title: string;
  eventTicker: string;
  seriesTicker: string;
  category: string;
  yesPrice: number | null;
  noPrice: number | null;
  spread: number | null;
  volume24h: number;
  recentMove: number | null;
  tossUp: boolean;
  highVolume: boolean;
  tightSpread: boolean;
};

function parseDollars(v: string | undefined): number | null {
  if (v === undefined) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

export function buildDiscoverRows(markets: MarketWithEvent[]): DiscoverRow[] {
  const volumes = markets
    .map((m) => parseFloat(m.volume_24h_fp ?? "0"))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  const volumeP75 = volumes.length
    ? volumes[Math.floor(volumes.length * 0.75)]
    : 0;

  return markets.map((m) => {
    const yesBid = parseDollars(m.yes_bid_dollars);
    const yesAsk = parseDollars(m.yes_ask_dollars);
    const yesPrice = yesBid !== null && yesAsk !== null ? (yesBid + yesAsk) / 2 : null;
    const noPrice = yesPrice !== null ? 1 - yesPrice : null;
    const spread = yesBid !== null && yesAsk !== null ? yesAsk - yesBid : null;
    const volume24h = parseFloat(m.volume_24h_fp ?? "0") || 0;

    const prevBid = parseDollars(m.previous_yes_bid_dollars);
    const prevAsk = parseDollars(m.previous_yes_ask_dollars);
    const prevMid = prevBid !== null && prevAsk !== null ? (prevBid + prevAsk) / 2 : null;
    const recentMove = yesPrice !== null && prevMid !== null ? yesPrice - prevMid : null;

    return {
      ticker: m.ticker,
      title: m.title,
      eventTicker: m.event_ticker,
      seriesTicker: m.seriesTicker,
      category: m.category,
      yesPrice,
      noPrice,
      spread,
      volume24h,
      recentMove,
      tossUp: yesPrice !== null && Math.abs(yesPrice - 0.5) <= 0.1,
      highVolume: volume24h > 0 && volume24h >= volumeP75 && volumeP75 > 0,
      tightSpread: spread !== null && spread <= 0.05,
    };
  });
}
