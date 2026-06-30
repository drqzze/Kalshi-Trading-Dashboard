import { OddsSnapshot, TrackedMarket } from "./types";

export type DashboardRow = {
  ticker: string;
  title: string;
  series_ticker: string | null;
  yesPrice: number | null;
  noPrice: number | null;
  volume24h: number | null;
  change24h: number | null;
  sparkline: number[];
  lastUpdated: string | null;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function buildDashboardRows(
  markets: TrackedMarket[],
  snapshotsByTicker: Map<string, OddsSnapshot[]>
): DashboardRow[] {
  return markets.map((market) => {
    // snapshots are expected sorted ascending by captured_at
    const snapshots = snapshotsByTicker.get(market.ticker) ?? [];
    const latest = snapshots[snapshots.length - 1];

    const sparkline = snapshots
      .map((s) => midPrice(s))
      .filter((v): v is number => v !== null);

    const yesPrice = latest ? midPrice(latest) : null;
    const noPrice = yesPrice !== null ? 1 - yesPrice : null;

    const cutoff = Date.now() - ONE_DAY_MS;
    const dayAgoSnapshot = snapshots.find(
      (s) => new Date(s.captured_at).getTime() >= cutoff
    );
    const baseline = dayAgoSnapshot ? midPrice(dayAgoSnapshot) : sparkline[0] ?? null;

    const change24h =
      yesPrice !== null && baseline !== null ? yesPrice - baseline : null;

    return {
      ticker: market.ticker,
      title: market.title,
      series_ticker: market.series_ticker,
      yesPrice,
      noPrice,
      volume24h: latest?.volume_24h ?? null,
      change24h,
      sparkline,
      lastUpdated: latest?.captured_at ?? null,
    };
  });
}

function midPrice(s: OddsSnapshot): number | null {
  if (s.yes_bid === null || s.yes_ask === null) return null;
  return (s.yes_bid + s.yes_ask) / 2;
}
