"use client";
import { useState, type ComponentType } from "react";

interface Segment {
  key: string;
  label: string;
  count: number;
  barClass: string;
  iconClass: string;
  icon: ComponentType<{ className?: string }>;
}

/** Part-to-whole composition of the deadline list by status. Every segment is
 *  always paired with an icon + label in the legend below it, so the status
 *  color is never the only way to tell segments apart. */
export function StatusBreakdownBar({ segments }: { segments: Segment[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const total = segments.reduce((sum, s) => sum + s.count, 0);
  if (total === 0) return null;

  const visible = segments.filter((s) => s.count > 0);
  const positioned = visible.reduce<Array<Segment & { pct: number; left: number }>>((acc, s) => {
    const pct = (s.count / total) * 100;
    const left = acc.length > 0 ? acc[acc.length - 1].left + acc[acc.length - 1].pct : 0;
    return [...acc, { ...s, pct, left }];
  }, []);
  const active = positioned.find((s) => s.key === hovered);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Status breakdown</h2>
        <span className="text-xs text-slate-400">{total} total</span>
      </div>

      <div className="relative">
        <div className="flex h-5 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100">
          {positioned.map((s) => (
            <div
              key={s.key}
              tabIndex={0}
              className="h-full outline-none"
              style={{ width: `${s.pct}%` }}
              aria-label={`${s.label}: ${s.count} of ${total}`}
              onMouseEnter={() => setHovered(s.key)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(s.key)}
              onBlur={() => setHovered(null)}
            >
              <div className={`h-full w-full ${s.barClass}`}>
                {s.pct >= 12 && (
                  <span className="flex h-full items-center justify-center text-[10px] font-semibold text-white">
                    {s.count}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {active && (
          <div
            className="pointer-events-none absolute top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white shadow-lg"
            style={{ left: `${active.left + active.pct / 2}%` }}
          >
            {active.label}: {active.count}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {segments.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5 text-xs text-slate-600">
            <s.icon className={`h-3.5 w-3.5 ${s.iconClass}`} />
            {s.label} <span className="font-medium text-slate-900">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
