import { getSupabaseAdminClient } from "@/lib/supabase";
import { buildDashboardRows } from "@/lib/dashboard";
import { OddsSnapshot, TrackedMarket } from "@/lib/types";
import { Dashboard } from "@/components/Dashboard";
import { TrackMarketForm } from "@/components/TrackMarketForm";

export const dynamic = "force-dynamic";

const SNAPSHOTS_PER_MARKET = 200;

async function getDashboardData() {
  const supabase = getSupabaseAdminClient();

  const { data: markets, error: marketsError } = await supabase
    .from("tracked_markets")
    .select("*")
    .order("created_at", { ascending: true });

  if (marketsError) {
    throw new Error(marketsError.message);
  }

  const tickers = (markets ?? []).map((m) => m.ticker);
  const snapshotsByTicker = new Map<string, OddsSnapshot[]>();

  if (tickers.length > 0) {
    const results = await Promise.all(
      tickers.map((ticker) =>
        supabase
          .from("odds_snapshots")
          .select("*")
          .eq("ticker", ticker)
          .order("captured_at", { ascending: false })
          .limit(SNAPSHOTS_PER_MARKET)
      )
    );

    results.forEach((res, i) => {
      const rows = (res.data ?? []) as OddsSnapshot[];
      snapshotsByTicker.set(tickers[i], rows.slice().reverse());
    });
  }

  return buildDashboardRows((markets ?? []) as TrackedMarket[], snapshotsByTicker);
}

export default async function Home() {
  const rows = await getDashboardData();

  return (
    <div className="px-4 py-10 sm:px-6">
      <main className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="font-data text-xs uppercase tracking-[0.2em] text-dim">
            tracked markets · {rows.length}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-text sm:text-4xl">
            Price history, not a snapshot.
          </h1>
          <p className="mt-2 max-w-xl font-body text-sm text-dim">
            Read-only odds tracking for the Kalshi markets you choose. Not trading
            advice — you act on Kalshi yourself.
          </p>
        </div>

        <div className="mb-8">
          <TrackMarketForm />
        </div>

        <Dashboard rows={rows} />
      </main>
    </div>
  );
}
