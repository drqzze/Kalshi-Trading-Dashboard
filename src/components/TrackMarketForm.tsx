"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TrackMarketForm() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });
    const data = await res.json();

    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to track market.");
      return;
    }

    setInput("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="glass flex items-center gap-2 rounded-lg px-3 py-2.5">
        <span className="font-data text-sm text-amber select-none">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="track KXFED-26MAR19  (or paste a Kalshi market URL)"
          className="flex-1 bg-transparent font-data text-sm text-text placeholder:text-dim focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-amber px-3 py-1.5 font-body text-xs font-semibold tracking-wide text-void transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "tracking…" : "track"}
        </button>
      </div>
      {error && (
        <p className="font-data text-xs text-nova-red">{error}</p>
      )}
    </form>
  );
}
