"use client";
import { useState } from "react";

interface TrendPoint {
  date: string;
  balance: number;
}

const WIDTH = 600;
const HEIGHT = 180;
const PAD_LEFT = 56;
const PAD_RIGHT = 12;
const PAD_TOP = 26;
const PAD_BOTTOM = 8;
const PLOT_W = WIDTH - PAD_LEFT - PAD_RIGHT;
const PLOT_H = HEIGHT - PAD_TOP - PAD_BOTTOM;

const formatNaira = (n: number) => `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

/** Wallet balance over the recent transaction history. A single series, so
 *  it carries its own color with no legend needed — the card title says
 *  what's plotted, and every value here is also visible in the transaction
 *  list below, so the hover tooltip only ever adds convenience. */
export function BalanceTrendChart({ points }: { points: TrendPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const values = points.map((p) => p.balance);
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const span = max - min || 1;

  const x = (i: number) =>
    PAD_LEFT + (points.length === 1 ? PLOT_W / 2 : (i / (points.length - 1)) * PLOT_W);
  const y = (v: number) => PAD_TOP + PLOT_H - ((v - min) / span) * PLOT_H;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.balance)}`).join(" ");
  const areaPath = `${linePath} L ${x(points.length - 1)} ${PAD_TOP + PLOT_H} L ${x(0)} ${PAD_TOP + PLOT_H} Z`;

  const ticks = [max, (max + min) / 2, min];
  const activeIndex = hoverIndex ?? points.length - 1;
  const active = points[activeIndex];
  const last = points[points.length - 1];

  const handleMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach((_, i) => {
      const d = Math.abs(x(i) - relX);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  };

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full touch-none"
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeWidth={1} />
            <text x={PAD_LEFT - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize={10} className="fill-slate-400">
              {formatNaira(t)}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="#059669" fillOpacity={0.1} stroke="none" />
        <path d={linePath} fill="none" stroke="#059669" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {hoverIndex !== null && (
          <line x1={x(hoverIndex)} x2={x(hoverIndex)} y1={PAD_TOP} y2={PAD_TOP + PLOT_H} stroke="#cbd5e1" strokeWidth={1} />
        )}

        <circle cx={x(activeIndex)} cy={y(active.balance)} r={5} fill="#059669" stroke="#fff" strokeWidth={2} />

        <text x={x(points.length - 1)} y={y(last.balance) - 10} textAnchor="end" fontSize={11} fontWeight={600} className="fill-slate-900">
          {formatNaira(last.balance)}
        </text>
      </svg>

      {hoverIndex !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-[calc(100%+10px)] whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
          style={{ left: `${(x(hoverIndex) / WIDTH) * 100}%`, top: `${(y(active.balance) / HEIGHT) * 100}%` }}
        >
          <p className="font-semibold">{formatNaira(active.balance)}</p>
          <p className="text-slate-300">{new Date(active.date).toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
}
