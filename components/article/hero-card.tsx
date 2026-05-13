import { formatDate } from '@/lib/utils';

type Props = {
  category: string;
  title: string;
  excerpt?: string;
  date: string;
  readingTime: number;
  series?: string;
  seriesOrder?: number;
  author?: string;
};

export function HeroCard({
  category,
  title,
  excerpt,
  date,
  readingTime,
  series,
  seriesOrder,
  author = 'Frank Advenoh',
}: Props) {
  return (
    <section className="mx-auto max-w-canvas px-6 pt-4 md:px-10">
      <div className="rounded-card-xl bg-bento-lavender p-6 text-bento-ink md:p-10">
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-bento-ink/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider capitalize">
            {category}
          </span>
          {series && (
            <span className="rounded-full bg-bento-ink px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              EP {String(seriesOrder ?? 0).padStart(2, '0')} · {series}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold leading-[1.15] tracking-tighter md:text-5xl md:leading-[1.1]">
          {title}
        </h1>
        {excerpt && (
          <p className="mt-5 max-w-2xl text-base leading-relaxed opacity-75 md:text-lg">
            {excerpt}
          </p>
        )}
        <div className="mt-8 flex items-center justify-between border-t border-bento-ink/10 pt-5 text-xs text-bento-dim">
          <span>{author} · {formatDate(date)}</span>
          <span>{readingTime}분 읽기</span>
        </div>
      </div>
    </section>
  );
}
