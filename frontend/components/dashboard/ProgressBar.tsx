"use client";

export function ProgressBar({ value, light }: { value: number; light?: boolean }) {
  const pct = Math.min(100, Math.max(0, value));
  const track = light ? 'bg-slate-200' : 'bg-white/[0.06]';
  return (
    <div className={`h-2 rounded-full overflow-hidden ${track}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#3b82f6] to-[#7c5cfc] transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
