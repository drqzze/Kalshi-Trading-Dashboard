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
    <div className="min-h-screen bg-white px-6 py-10 dark:bg-black dark:text-neutral-100">
      <main className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold">Kalshi Odds Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Read-only tracking of Kalshi market prices over time. Not trading advice.
        </p>

        <div className="mt-6">
          <TrackMarketForm />
        </div>

        <div className="mt-8">
          <Dashboard rows={rows} />
        </div>
      </main>
    </div>
  );
}
