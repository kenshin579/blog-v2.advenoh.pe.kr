import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getAllSeries,
  getArticlesBySeries,
  getArticleTitleFromSlug,
} from '@/lib/articles';
import { seriesSlug } from '@/lib/url';
import { formatDate } from '@/lib/utils';
import { Breadcrumb } from '@/components/breadcrumb';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

const OTHER_TINTS = ['bg-bento-sage', 'bg-bento-rose', 'bg-bento-butter'] as const;

export async function generateStaticParams() {
  const names = await getAllSeries();
  return names.map((name) => ({ slug: seriesSlug(name) }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const names = await getAllSeries();
  const matched = names.find((n) => seriesSlug(n) === decoded);
  if (!matched) return { title: '시리즈를 찾을 수 없습니다' };
  return {
    title: `${matched} | Frank's IT Blog`,
    description: `${matched} 시리즈 — 에피소드 모음`,
  };
}

export default async function SeriesDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);

  const names = await getAllSeries();
  const matched = names.find((n) => seriesSlug(n) === decoded);
  if (!matched) notFound();

  const eps = await getArticlesBySeries(matched);
  const sorted = eps.slice().sort((a, b) => {
    const ao = a.seriesOrder ?? Number.POSITIVE_INFINITY;
    const bo = b.seriesOrder ?? Number.POSITIVE_INFINITY;
    if (ao !== bo) return ao - bo;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
  if (sorted.length === 0) notFound();

  const firstEpisode = sorted[0];
  const blurb = firstEpisode.excerpt || '';

  const others = await Promise.all(
    names
      .filter((n) => n !== matched)
      .sort((a, b) => a.localeCompare(b, 'ko'))
      .slice(0, 3)
      .map(async (name) => {
        const list = await getArticlesBySeries(name);
        return { name, count: list.length, slug: seriesSlug(name) };
      }),
  );

  return (
    <main className="min-h-screen bg-bento-bg pb-20">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Series', href: '/series' },
          { label: matched },
        ]}
      />

      {/* Hero: 2-col (lavender main + white/50 mini card) */}
      <section className="mx-auto max-w-canvas px-6 md:px-10">
        <div className="grid grid-cols-12 gap-4 rounded-card-xl bg-bento-lavender p-6 text-bento-ink md:p-10">
          <div className="col-span-12 md:col-span-8">
            <p className="text-[12px] uppercase tracking-[0.12em] opacity-60">Series</p>
            <h1 className="my-4 text-4xl font-bold leading-[1.05] tracking-tightest md:text-6xl">
              {matched}.
            </h1>
            {blurb && (
              <p className="mb-7 max-w-xl text-base leading-relaxed opacity-75 md:text-lg">
                {blurb}
              </p>
            )}
            <Link
              href={`/${encodeURIComponent(getArticleTitleFromSlug(firstEpisode.slug))}`}
              className={[
                'inline-flex items-center gap-2 rounded-full bg-bento-ink px-5 py-3 text-sm font-semibold text-white no-underline transition hover:bg-bento-ink/90',
                FOCUS_RING,
              ].join(' ')}
            >
              처음부터 읽기
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <aside className="col-span-12 rounded-card-lg bg-white/50 p-6 text-center md:col-span-4">
            <div className="text-[11px] uppercase tracking-wider text-bento-dim">전체</div>
            <div className="mt-2 text-6xl font-bold leading-none tracking-tightest md:text-7xl">
              {sorted.length}
            </div>
            <div className="mt-2 text-sm text-bento-dim">편 발행</div>
            <div className="mt-4 border-t border-bento-ink/10 pt-3 text-xs text-bento-dim">
              <div className="uppercase tracking-wider">최신</div>
              <div className="mt-1 line-clamp-1 font-medium text-bento-ink">{sorted[sorted.length - 1].title}</div>
              <div className="mt-1 text-[11px]">{formatDate(sorted[sorted.length - 1].date)}</div>
            </div>
          </aside>
        </div>
      </section>

      {/* Episodes timeline */}
      <section className="mx-auto mt-12 max-w-3xl px-6 md:px-0">
        <h2 className="mb-5 text-2xl font-bold tracking-tighter text-bento-ink md:text-3xl">편별 목록</h2>
        <ol className="flex flex-col">
          {sorted.map((ep, i) => {
            const epNum = ep.seriesOrder ?? i + 1;
            const isLast = i === sorted.length - 1;
            return (
              <li key={ep.slug} className="grid grid-cols-[44px_1fr] gap-5">
                <div className="flex flex-col items-center">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-bento-ink text-sm font-bold text-white">
                    {epNum}
                  </div>
                  {!isLast && (
                    <div className="my-1 min-h-[40px] w-0.5 flex-1 bg-bento-ink/10" />
                  )}
                </div>
                <Link
                  href={`/${encodeURIComponent(getArticleTitleFromSlug(ep.slug))}`}
                  className={[
                    'mb-4 block rounded-card border border-bento-ink/10 bg-bento-card p-5 no-underline transition hover:bg-bento-ink/[0.03] dark:border-white/10 dark:hover:bg-white/[0.03]',
                    FOCUS_RING,
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-bento-dim">
                    <span>EP {String(epNum).padStart(2, '0')}</span>
                    <span>·</span>
                    <span>{formatDate(ep.date)}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-bold tracking-tighter text-bento-ink md:text-xl">
                    {ep.title}
                  </h3>
                  {ep.excerpt && (
                    <p className="mt-2 text-sm leading-relaxed text-bento-dim line-clamp-2">{ep.excerpt}</p>
                  )}
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Other series */}
      {others.length > 0 && (
        <section className="mx-auto mt-16 max-w-canvas px-6 md:px-10">
          <h3 className="mb-4 text-xl font-bold tracking-tighter text-bento-ink md:text-2xl">다른 시리즈</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
            {others.map((s, i) => (
              <Link
                key={s.name}
                href={`/series/${encodeURIComponent(s.slug)}`}
                className={[
                  'flex flex-col gap-3 rounded-card-lg p-6 no-underline text-bento-ink',
                  OTHER_TINTS[i % OTHER_TINTS.length],
                  FOCUS_RING,
                ].join(' ')}
              >
                <div className="text-[11px] uppercase tracking-wider text-bento-dim opacity-80">Series</div>
                <div className="text-lg font-bold leading-snug tracking-tighter md:text-xl">{s.name}</div>
                <div className="mt-auto text-xs text-bento-dim">{s.count}편</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
