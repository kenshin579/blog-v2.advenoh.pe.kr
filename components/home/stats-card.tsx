type StatItem = {
  value: string;
  label: string;
};

type Props = {
  stats: StatItem[];
};

export function StatsCard({ stats }: Props) {
  return (
    <div className="col-span-12 grid grid-cols-3 gap-4 rounded-card-xl bg-bento-cream p-6 md:col-span-4 md:p-7">
      {stats.map((s) => (
        <div key={s.label}>
          <div className="text-4xl font-bold leading-none tracking-tightest text-bento-ink md:text-5xl">
            {s.value}
          </div>
          <div className="mt-2 text-[10px] uppercase tracking-[0.08em] text-bento-dim md:text-[11px]">
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
