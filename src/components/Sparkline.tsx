"use client";

type SparklineProps = {
  values: number[];
  width?: number;
  height?: number;
};

export function Sparkline({ values, width = 130, height = 36 }: SparklineProps) {
  if (values.length < 2) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center font-data text-[10px] text-dim"
      >
        no history
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 4;

  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (width - pad * 2);
    const y = pad + (height - pad * 2) - ((v - min) / range) * (height - pad * 2);
    return { x, y };
  });

  const trendUp = values[values.length - 1] >= values[0];
  const color = trendUp ? "var(--nova)" : "var(--nova-red)";
  const last = points[points.length - 1];

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ")}
        fill="none"
        stroke={color}
        strokeOpacity={0.45}
        strokeWidth={1}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {points.map((p, i) => {
        const isLast = i === points.length - 1;
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={isLast ? 2.4 : 1}
            fill={color}
            opacity={isLast ? 1 : 0.55}
          />
        );
      })}
      <circle
        cx={last.x}
        cy={last.y}
        r={4.5}
        fill={color}
        opacity={0.25}
        style={{ animation: "pulse-dot 1.8s ease-in-out infinite" }}
      />
    </svg>
  );
}
