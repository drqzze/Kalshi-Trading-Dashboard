"use client";

type SparklineProps = {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
};

export function Sparkline({
  values,
  width = 120,
  height = 32,
  color,
}: SparklineProps) {
  if (values.length < 2) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center text-xs text-neutral-500"
      >
        no history
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const trendColor = color ?? (values[values.length - 1] >= values[0] ? "#16a34a" : "#dc2626");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={trendColor}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
