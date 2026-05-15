"use client";

import { Star } from 'lucide-react';

type Trend = { value: number; up: boolean } | null;

export function StatCard({
  label,
  value,
  sub,
  trend,
  stars,
  light,
}: {
  label: string;
  value: string | number;
  sub?: string;
  trend?: Trend;
  stars?: number;
  light?: boolean;
}) {
  const card = light
    ? 'border-slate-200 bg-white shadow-sm'
    : 'border-white/[0.08] bg-[#0d1117]/80';
  const labelC = light ? 'text-slate-500' : 'text-slate-500';
  const heading = light ? 'text-slate-900' : 'text-white';
  const subC = light ? 'text-slate-500' : 'text-slate-500';

  return (
    <div
      className={`rounded-2xl border p-5 hover:opacity-[0.97] transition-colors ${light ? 'hover:border-slate-300' : 'hover:border-white/[0.12]'} ${card}`}
    >
      <p className={`text-[10px] font-bold uppercase tracking-[0.15em] mb-3 ${labelC}`}>
        {label}
      </p>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className={`text-3xl font-bold tracking-tight ${heading}`}>{value}</p>
          {sub && <p className={`text-sm mt-1 ${subC}`}>{sub}</p>}
        </div>
        {trend != null && (
          <span
            className={`text-xs font-semibold shrink-0 ${
              trend.up ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {trend.up ? '+' : ''}
            {trend.value}% {trend.up ? '↑' : '↓'}
          </span>
        )}
        {stars !== undefined && (
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i <= Math.round(stars) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
