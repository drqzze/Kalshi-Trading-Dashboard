"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Dashboard" },
  { href: "/discover", label: "Discover" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="glass sticky top-0 z-20 px-4 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <span aria-hidden className="text-amber text-glow-amber text-lg">
            ✦
          </span>
          <span className="font-body text-sm font-semibold tracking-[0.18em] text-text uppercase">
            Kalshi Odds Dashboard
          </span>
          <span className="hidden items-center gap-1.5 rounded-full border border-line bg-surface px-2 py-0.5 text-[10px] font-data uppercase tracking-widest text-dim sm:flex">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-nova"
              style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
            />
            live
          </span>
        </div>

        <nav className="flex items-center gap-1 rounded-full border border-line bg-surface p-1">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`rounded-full px-3 py-1.5 font-body text-xs font-medium tracking-wide transition-colors ${
                  active
                    ? "bg-surface-2 text-amber"
                    : "text-dim hover:text-text"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
