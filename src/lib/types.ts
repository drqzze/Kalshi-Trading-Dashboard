export type TrackedMarket = {
  id: string;
  ticker: string;
  title: string;
  series_ticker: string | null;
  created_at: string;
};

export type OddsSnapshot = {
  id: string;
  ticker: string;
  yes_bid: number | null;
  yes_ask: number | null;
  no_bid: number | null;
  no_ask: number | null;
  volume_24h: number | null;
  captured_at: string;
};

export type MarketWithHistory = TrackedMarket & {
  snapshots: OddsSnapshot[];
};
