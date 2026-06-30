import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import {
  fetchEvent,
  fetchMarket,
  KalshiNotFoundError,
  marketToSnapshotFields,
  resolveTickerInput,
} from "@/lib/kalshi";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const input = body?.input;
  if (typeof input !== "string" || input.trim().length === 0) {
    return NextResponse.json(
      { error: "Provide a ticker or Kalshi market URL." },
      { status: 400 }
    );
  }

  const ticker = resolveTickerInput(input);

  let market;
  try {
    market = await fetchMarket(ticker);
  } catch (err) {
    if (err instanceof KalshiNotFoundError) {
      return NextResponse.json(
        {
          error: `No market found for "${ticker}". If you pasted a URL, try pasting the raw ticker instead (e.g. KXFED-26MAR19).`,
        },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to reach Kalshi API." },
      { status: 502 }
    );
  }

  let seriesTicker: string | null = null;
  try {
    const event = await fetchEvent(market.event_ticker);
    seriesTicker = event.series_ticker ?? null;
  } catch {
    seriesTicker = null;
  }

  const supabase = getSupabaseAdminClient();

  const { error: upsertError } = await supabase
    .from("tracked_markets")
    .upsert(
      {
        ticker: market.ticker,
        title: market.title,
        series_ticker: seriesTicker,
      },
      { onConflict: "ticker" }
    );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  const { error: snapshotError } = await supabase.from("odds_snapshots").insert({
    ticker: market.ticker,
    ...marketToSnapshotFields(market),
  });

  if (snapshotError) {
    return NextResponse.json({ error: snapshotError.message }, { status: 500 });
  }

  return NextResponse.json({
    ticker: market.ticker,
    title: market.title,
    series_ticker: seriesTicker,
  });
}

export async function DELETE(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker");
  if (!ticker) {
    return NextResponse.json({ error: "Missing ticker." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("tracked_markets")
    .delete()
    .eq("ticker", ticker);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
