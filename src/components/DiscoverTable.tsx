"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DiscoverRow } from "@/lib/discover";

type SortKey = "volume" | "move" | "spread" | "tossup";

const PAGE_SIZE = 100;

export function DiscoverTable({ rows }: { rows: DiscoverRow[] }) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("volume");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tracking, setTracking] = useState<string | null>(null);
  const [tracked, setTracked] = useState<Set<string>>(new Set());

  const categories = useMemo(() => {
    const set = new Set(rows.map((r) => r.category));
    return Array.from(set).sort();
  }, [rows]);

  const sorted = useMemo(() => {
    const filteredRows =
      categoryFilter === "all"
        ? rows
        : rows.filter((r) => r.category === categoryFilter);
    const copy = [...filteredRows];
    copy.sort((a, b) => {
      if (sortKey === "volume") return b.volume24h - a.volume24h;
      if (sortKey === "move")
        return Math.abs(b.recentMove ?? 0) - Math.abs(a.recentMove ?? 0);
      if (sortKey === "spread")
        return (a.spread ?? 1) - (b.spread ?? 1);
      // tossup: closest to 50/50 first
      const da = a.yesPrice !== null ? Math.abs(a.yesPrice - 0.5) : 1;
      const db = b.yesPrice !== null ? Math.abs(b.yesPrice - 0.5) : 1;
      return da - db;
    });
    return copy.slice(0, PAGE_SIZE);
  }, [rows, sortKey, categoryFilter]);

  async function handleTrack(ticker: string) {
    setTracking(ticker);
    const res = await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: ticker }),
    });
    setTracking(null);
    if (res.ok) {
      setTracked((prev) => new Set(prev).add(ticker));
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3 font-data text-xs text-dim">
        <label className="flex items-center gap-2">
          category:
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-md border border-line bg-surface px-2 py-1 text-text"
          >
            <option value="all">all</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
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
            <option value="volume">volume 24h</option>
            <option value="move">biggest recent move</option>
            <option value="spread">tightest spread</option>
            <option value="tossup">closest to 50/50</option>
          </select>
        </label>
        <span>
          showing top {sorted.length} of {rows.length}
        </span>
      </div>

      <div className="glass overflow-x-auto rounded-2xl">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-line">
              {["market", "yes", "no", "spread", "move", "vol 24h", "signals", ""].map(
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
            {sorted.map((row) => (
              <tr
                key={row.ticker}
                className="border-b border-line/60 transition-colors last:border-0 hover:bg-surface-2/60"
              >
                <td className="px-4 py-3 max-w-xs">
                  <div className="truncate font-body text-sm text-text">
                    {row.title}
                  </div>
                  <div className="font-data text-[11px] text-dim">
                    {row.ticker} · {row.category}
                  </div>
                </td>
                <td className="px-4 py-3 font-data text-sm tabular-nums text-text">
                  {row.yesPrice !== null ? `${(row.yesPrice * 100).toFixed(0)}¢` : "—"}
                </td>
                <td className="px-4 py-3 font-data text-sm tabular-nums text-text">
                  {row.noPrice !== null ? `${(row.noPrice * 100).toFixed(0)}¢` : "—"}
                </td>
                <td className="px-4 py-3 font-data text-xs tabular-nums text-dim">
                  {row.spread !== null ? `${(row.spread * 100).toFixed(0)}¢` : "—"}
                </td>
                <td
                  className={`px-4 py-3 font-data text-xs tabular-nums ${
                    (row.recentMove ?? 0) > 0
                      ? "text-nova"
                      : (row.recentMove ?? 0) < 0
                        ? "text-nova-red"
                        : "text-dim"
                  }`}
                >
                  {row.recentMove !== null
                    ? `${row.recentMove >= 0 ? "+" : ""}${(row.recentMove * 100).toFixed(1)}pt`
                    : "—"}
                </td>
                <td className="px-4 py-3 font-data text-xs tabular-nums text-dim">
                  {row.volume24h.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {row.tossUp && <Badge color="nebula">toss-up</Badge>}
                    {row.highVolume && <Badge color="amber">high vol</Badge>}
                    {row.tightSpread && <Badge color="nova">tight spread</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleTrack(row.ticker)}
                    disabled={tracking === row.ticker || tracked.has(row.ticker)}
                    className="font-data text-[11px] text-amber transition-opacity hover:opacity-80 disabled:text-dim disabled:opacity-50"
                  >
                    {tracked.has(row.ticker)
                      ? "tracked"
                      : tracking === row.ticker
                        ? "tracking…"
                        : "+ track"}
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

function Badge({
  children,
  color,
}: {
  children: React.ReactNode;
  color: "nebula" | "amber" | "nova";
}) {
  const styles = {
    nebula: "border-nebula/40 text-nebula bg-nebula/10",
    amber: "border-amber/40 text-amber bg-amber/10",
    nova: "border-nova/40 text-nova bg-nova/10",
  }[color];

  return (
    <span
      className={`rounded-full border px-2 py-0.5 font-data text-[10px] uppercase tracking-wide ${styles}`}
    >
      {children}
    </span>
  );
}
