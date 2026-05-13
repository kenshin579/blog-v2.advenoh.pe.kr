type DayCount = {
  /** ISO yyyy-MM-dd */
  date: string;
  count: number;
};

type Props = {
  /** 최근 N일 (older first → newest last) — 정확히 7×weeks 길이 */
  days: DayCount[];
  /** 표시할 주 수 (prototype 그대로 26) */
  weeks: number;
  /** 메타: 가장 최근 발행 주 기준 streak */
  streakWeeks: number;
  /** 메타: 한 주 최대 발행 수 */
  peakPerWeek: number;
};

function opacityFor(count: number): number {
  if (count <= 0) return 0.06;
  if (count === 1) return 0.4;
  if (count === 2) return 0.7;
  return 1.0;
}

export function ActivityHeatmap({ days, weeks, streakWeeks, peakPerWeek }: Props) {
  return (
    <div className="col-span-12 flex flex-col rounded-card-xl bg-bento-card p-6 md:col-span-4 md:p-7">
      <div className="text-[10px] uppercase tracking-[0.1em] text-bento-dim">Last 12 months</div>
      <h3 className="mt-2 text-xl font-bold tracking-tighter text-bento-ink md:text-2xl">
        꾸준함의 기록
      </h3>
      <div
        className="mt-6 flex-1 grid gap-1"
        style={{
          gridTemplateRows: 'repeat(7, 1fr)',
          gridTemplateColumns: `repeat(${weeks}, 1fr)`,
          gridAutoFlow: 'column',
        }}
        aria-hidden="true"
      >
        {days.map((d) => (
          <div
            key={d.date}
            className="rounded-[3px] bg-bento-accent"
            style={{ opacity: opacityFor(d.count), minHeight: '8px' }}
            title={`${d.date}: ${d.count}편`}
          />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between text-[11px] text-bento-dim">
        <span>{streakWeeks} streak</span>
        <span>peak {peakPerWeek} / week</span>
      </div>
    </div>
  );
}
