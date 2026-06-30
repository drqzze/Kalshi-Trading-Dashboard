"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardRow } from "@/lib/dashboard";
import { Sparkline } from "./Sparkline";
import { BiggestMover } from "./BiggestMover";

type SortKey = "movement" | "yes-price" | "title";

export function Dashboard({ rows }: { rows: DashboardRow[] }) {
  const router = useRouter();
  const [seriesFilter, setSeriesFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("movement");
  const [removing, setRemoving] = useState<string | null>(null);

  const seriesOptions = useMemo(() => {
    const set = new Set(rows.map((r) => r.series_ticker).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [rows]);

  const biggestMover = useMemo(() => {
    if (rows.length === 0) return null;
    return [...rows].sort(
      (a, b) => Math.abs(b.change24h ?? 0) - Math.abs(a.change24h ?? 0)
    )[0];
  }, [rows]);

  const filtered = useMemo(() => {
    let result =
      seriesFilter === "all"
        ? rows
        : rows.filter((r) => r.series_ticker === seriesFilter);

    result = [...result].sort((a, b) => {
      if (sortKey === "movement") {
        return Math.abs(b.change24h ?? 0) - Math.abs(a.change24h ?? 0);
      }
      if (sortKey === "yes-price") {
        return (b.yesPrice ?? 0) - (a.yesPrice ?? 0);
      }
      return a.title.localeCompare(b.title);
    });

    return result;
  }, [rows, seriesFilter, sortKey]);

  async function handleRemove(ticker: string) {
    setRemoving(ticker);
    await fetch(`/api/track?ticker=${encodeURIComponent(ticker)}`, {
      method: "DELETE",
    });
    setRemoving(null);
    router.refresh();
  }

  if (rows.length === 0) {
    return (
      <div className="glass rounded-2xl px-6 py-10 text-center">
        <p className="font-data text-sm text-dim">
          no markets tracked — paste a ticker above to start collecting odds history
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {biggestMover && <BiggestMover row={biggestMover} />}

      <div className="flex flex-wrap items-center gap-3 font-data text-xs text-dim">
        <label className="flex items-center gap-2">
          series:
          <select
            value={seriesFilter}
            onChange={(e) => setSeriesFilter(e.target.value)}
            className="rounded-md border border-line bg-surface px-2 py-1 text-text"
          >
            <option value="all">all</option>
            {seriesOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          sort:
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-md border border-line bg-surface px-2 py-1 text-text"
          >
            <option value="movement">biggest 24h move</option>
            <option value="yes-price">yes price</option>
            <option value="title">title</option>
          </select>
        </label>
      </div>

      <div className="glass overflow-x-auto rounded-2xl">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-line">
              {["market", "series", "yes", "no", "24h", "history", "vol 24h", ""].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-data text-[10px] uppercase tracking-widest text-dim"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.ticker}
                className="border-b border-line/60 transition-colors last:border-0 hover:bg-surface-2/60"
              >
                <td className="px-4 py-3">
                  <div className="font-body text-sm text-text">{row.title}</div>
                  <div className="font-data text-[11px] text-dim">{row.ticker}</div>
                </td>
                <td className="px-4 py-3 font-data text-xs text-dim">
                  {row.series_ticker ?? "—"}
                </td>
                <td className="px-4 py-3 font-data text-sm tabular-nums text-text">
                  {row.yesPrice !== null ? `${(row.yesPrice * 100).toFixed(0)}¢` : "—"}
                </td>
                <td className="px-4 py-3 font-data text-sm tabular-nums text-text">
                  {row.noPrice !== null ? `${(row.noPrice * 100).toFixed(0)}¢` : "—"}
                </td>
                <td
                  className={`px-4 py-3 font-data text-sm tabular-nums ${
                    (row.change24h ?? 0) > 0
                      ? "text-nova"
                      : (row.change24h ?? 0) < 0
                        ? "text-nova-red"
                        : "text-dim"
                  }`}
                >
                  {row.change24h !== null
                    ? `${row.change24h >= 0 ? "+" : ""}${(row.change24h * 100).toFixed(1)}pt`
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <Sparkline values={row.sparkline} />
                </td>
                <td className="px-4 py-3 font-data text-xs tabular-nums text-dim">
                  {row.volume24h !== null ? row.volume24h.toLocaleString() : "—"}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleRemove(row.ticker)}
                    disabled={removing === row.ticker}
                    className="font-data text-[11px] text-dim transition-colors hover:text-nova-red disabled:opacity-50"
                  >
                    remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
