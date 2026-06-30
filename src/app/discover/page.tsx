import { fetchOpenEventMarkets } from "@/lib/kalshi";
import { buildDiscoverRows } from "@/lib/discover";
import { DiscoverTable } from "@/components/DiscoverTable";

export const dynamic = "force-dynamic";

// Cap what's sent to the client: thousands of low-volume markets would bloat
// the page payload for no benefit, since they're rarely what anyone is after.
const MAX_ROWS = 400;

export default async function DiscoverPage() {
  const markets = await fetchOpenEventMarkets();
  const rows = buildDiscoverRows(markets)
    .sort((a, b) => b.volume24h - a.volume24h)
    .slice(0, MAX_ROWS);

  return (
    <div className="px-4 py-10 sm:px-6">
      <main className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="font-data text-xs uppercase tracking-[0.2em] text-dim">
            open markets · {rows.length}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-text sm:text-4xl">
            Discover
          </h1>
          <p className="mt-2 max-w-2xl font-body text-sm text-dim">
            All open Kalshi markets, ranked by what the order book actually shows —
            volume, spread, and how close to a coinflip the price is. Not predictions,
            not advice. Click track on anything you want price history for.
          </p>
        </div>

        <DiscoverTable rows={rows} />
      </main>
    </div>
  );
}
