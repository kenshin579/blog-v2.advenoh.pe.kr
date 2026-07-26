import { formatDate } from '@/lib/utils';

type Props = {
  category: string;
  title: string;
  excerpt?: string;
  date: string;
  readingTime: number;
  series?: string;
  seriesOrder?: number;
  totalEpisodes?: number;
  tags?: string[];
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
  totalEpisodes,
  tags,
  author = 'Frank',
}: Props) {
  return (
    <section className="mx-auto max-w-canvas px-6 pt-2 md:px-10">
      <div className="relative overflow-hidden rounded-card-xl bg-bento-hero-dark p-6 text-white md:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full opacity-50"
          style={{ background: 'radial-gradient(circle, rgb(var(--bento-accent)) 0%, transparent 70%)' }}
        />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/70">
            <span className="rounded-full border border-white/20 bg-transparent px-3 py-1 capitalize text-white">
              {category}
            </span>
            {series && (
              <span className="rounded-full bg-bento-accent px-3 py-1 font-semibold uppercase tracking-wider text-white">
                Series · {seriesOrder ?? 1}/{totalEpisodes ?? '?'}
              </span>
            )}
            <span aria-hidden="true">·</span>
            <span>{formatDate(date)}</span>
            <span aria-hidden="true">·</span>
            <span>{readingTime} min read</span>
          </div>

          {series && (
            <div className="mt-5 font-mono text-[12px] uppercase tracking-[0.08em] text-white/60">
              {series}
            </div>
          )}

          <h1 className="mt-3 text-3xl font-bold leading-[1.1] tracking-tighter md:text-5xl md:leading-[1.05]">
            {title}
          </h1>

          {excerpt && (
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
              {excerpt}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-bento-accent text-sm font-bold text-white">
              {author.charAt(0)}
            </span>
            <span className="text-sm font-medium text-white">{author}</span>
            {tags && tags.length > 0 && (
              <>
                <span aria-hidden="true" className="text-white/30">·</span>
                <div className="flex flex-wrap items-center gap-2">
                  {tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[12px] text-white/80"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
