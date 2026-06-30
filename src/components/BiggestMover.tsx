import { DashboardRow } from "@/lib/dashboard";
import { Sparkline } from "./Sparkline";

export function BiggestMover({ row }: { row: DashboardRow }) {
  const change = row.change24h ?? 0;
  const up = change >= 0;
  const color = up ? "text-nova" : "text-nova-red";

  return (
    <div className="glass glow-amber rounded-2xl px-6 py-7 sm:px-8">
      <p className="font-data text-[11px] uppercase tracking-[0.2em] text-dim">
        biggest mover · 24h
      </p>
      <div className="mt-3 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold leading-tight text-text sm:text-3xl">
            {row.title}
          </h2>
          <p className="mt-1 font-data text-xs text-dim">{row.ticker}</p>
        </div>
        <div className="flex items-center gap-5">
          <Sparkline values={row.sparkline} width={150} height={44} />
          <div className={`font-data text-3xl font-semibold ${color}`}>
            {up ? "▲" : "▼"} {Math.abs(change * 100).toFixed(1)}
            <span className="text-base">pt</span>
          </div>
        </div>
      </div>
    </div>
  );
}
