"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardRow } from "@/lib/dashboard";
import { Sparkline } from "./Sparkline";

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
      <p className="text-sm text-neutral-500">
        No markets tracked yet. Add one above to start collecting odds history.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          Series:
          <select
            value={seriesFilter}
            onChange={(e) => setSeriesFilter(e.target.value)}
            className="rounded-md border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="all">All</option>
            {seriesOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          Sort by:
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-md border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="movement">Biggest 24h movement</option>
            <option value="yes-price">Yes price</option>
            <option value="title">Title</option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500 dark:border-neutral-800">
              <th className="py-2 pr-4 font-medium">Market</th>
              <th className="py-2 pr-4 font-medium">Series</th>
              <th className="py-2 pr-4 font-medium">Yes</th>
              <th className="py-2 pr-4 font-medium">No</th>
              <th className="py-2 pr-4 font-medium">24h change</th>
              <th className="py-2 pr-4 font-medium">History</th>
              <th className="py-2 pr-4 font-medium">Volume 24h</th>
              <th className="py-2 pr-4 font-medium" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.ticker}
                className="border-b border-neutral-100 dark:border-neutral-900"
              >
                <td className="py-2 pr-4">
                  <div className="font-medium">{row.title}</div>
                  <div className="text-xs text-neutral-500">{row.ticker}</div>
                </td>
                <td className="py-2 pr-4 text-neutral-500">
                  {row.series_ticker ?? "—"}
                </td>
                <td className="py-2 pr-4 tabular-nums">
                  {row.yesPrice !== null ? `${(row.yesPrice * 100).toFixed(0)}¢` : "—"}
                </td>
                <td className="py-2 pr-4 tabular-nums">
                  {row.noPrice !== null ? `${(row.noPrice * 100).toFixed(0)}¢` : "—"}
                </td>
                <td
                  className={`py-2 pr-4 tabular-nums ${
                    (row.change24h ?? 0) > 0
                      ? "text-green-600"
                      : (row.change24h ?? 0) < 0
                        ? "text-red-600"
                        : ""
                  }`}
                >
                  {row.change24h !== null
                    ? `${row.change24h >= 0 ? "+" : ""}${(row.change24h * 100).toFixed(1)}pt`
                    : "—"}
                </td>
                <td className="py-2 pr-4">
                  <Sparkline values={row.sparkline} />
                </td>
                <td className="py-2 pr-4 tabular-nums text-neutral-500">
                  {row.volume24h !== null ? row.volume24h.toLocaleString() : "—"}
                </td>
                <td className="py-2 pr-4">
                  <button
                    onClick={() => handleRemove(row.ticker)}
                    disabled={removing === row.ticker}
                    className="text-xs text-neutral-400 hover:text-red-600 disabled:opacity-50"
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
