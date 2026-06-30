import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { fetchMarket, marketToSnapshotFields } from "@/lib/kalshi";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  const { data: markets, error } = await supabase
    .from("tracked_markets")
    .select("ticker");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = await Promise.allSettled(
    (markets ?? []).map(async ({ ticker }) => {
      const market = await fetchMarket(ticker);
      const { error: insertError } = await supabase
        .from("odds_snapshots")
        .insert({ ticker, ...marketToSnapshotFields(market) });
      if (insertError) throw insertError;
      return ticker;
    })
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results
    .map((r, i) => ({ r, ticker: markets?.[i]?.ticker }))
    .filter(({ r }) => r.status === "rejected")
    .map(({ r, ticker }) => ({
      ticker,
      error: (r as PromiseRejectedResult).reason?.message ?? "unknown error",
    }));

  return NextResponse.json({ polled: results.length, succeeded, failed });
}
