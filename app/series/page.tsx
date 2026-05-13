import Link from 'next/link';
import { getAllSeries, getArticlesBySeries } from '@/lib/articles';
import { seriesSlug } from '@/lib/url';
import { formatDate } from '@/lib/utils';

export const metadata = {
  title: "Series | Frank's IT Blog",
  description: '시리즈별로 정리된 기술 블로그 글 모음',
};

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

export default async function SeriesPage() {
  const seriesNames = await getAllSeries();

  const seriesData = await Promise.all(
    seriesNames.map(async (name) => {
      const eps = await getArticlesBySeries(name);
      const sorted = eps.slice().sort(
        (a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0),
      );
      const byDateDesc = eps.slice().sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      const latest = byDateDesc[0];
      return {
        name,
        slug: seriesSlug(name),
        count: sorted.length,
        latestTitle: latest?.title ?? '',
        latestDate: latest?.date ?? '',
      };
    }),
  );

  seriesData.sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime());

  return (
    <main className="min-h-screen bg-bento-bg pb-20">
      <header className="mx-auto max-w-canvas px-6 pt-8 md:px-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-bento-dim">
          Series
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tighter text-bento-ink md:text-4xl">
          Series
        </h1>
        <p className="mt-2 text-sm text-bento-dim">
          {seriesData.length}개의 시리즈
        </p>
      </header>

      {seriesData.length === 0 ? (
        <section className="mx-auto max-w-canvas px-6 py-20 text-center text-bento-dim md:px-10">
          등록된 시리즈가 없습니다.
        </section>
      ) : (
        <section className="mx-auto mt-8 grid max-w-canvas grid-cols-12 gap-3 px-6 md:gap-4 md:px-10">
          {seriesData.map((s) => (
            <Link
              key={s.name}
              href={`/series/${encodeURIComponent(s.slug)}`}
              className={[
                'col-span-12 flex flex-col rounded-card-xl bg-bento-lavender p-6 text-bento-ink no-underline md:col-span-6 md:p-7',
                FOCUS_RING,
              ].join(' ')}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[0.1em] opacity-60">Series</span>
                <span className="text-xs text-bento-dim">{s.count}편</span>
              </div>
              <h2 className="mb-4 text-xl font-bold tracking-tighter md:text-2xl">{s.name}</h2>
              {s.latestTitle && (
                <div className="mt-auto border-t border-bento-ink/10 pt-3">
                  <div className="text-[10px] uppercase tracking-wider text-bento-dim">Latest</div>
                  <div className="mt-1 line-clamp-2 text-[13px] font-medium leading-snug">
                    {s.latestTitle}
                  </div>
                  {s.latestDate && (
                    <div className="mt-1 text-[11px] text-bento-dim">
                      {formatDate(s.latestDate)}
                    </div>
                  )}
                </div>
              )}
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
