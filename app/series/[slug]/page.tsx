import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getAllSeries,
  getArticlesBySeries,
  getArticleTitleFromSlug,
} from '@/lib/articles';
import { seriesSlug } from '@/lib/url';
import { formatDate } from '@/lib/utils';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

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

  return (
    <main className="min-h-screen bg-bento-bg pb-20">
      <section className="mx-auto max-w-canvas px-6 pt-4 md:px-10">
        <div className="rounded-card-xl bg-bento-lavender p-6 text-bento-ink md:p-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] opacity-60">
            Series
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tighter md:text-5xl">
            {matched}
          </h1>
          <p className="mt-3 text-sm opacity-75 md:text-base">
            {sorted.length}편 발행
          </p>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-prose px-6 md:px-0">
        <ul className="flex flex-col gap-3">
          {sorted.map((ep, idx) => {
            const titlePart = getArticleTitleFromSlug(ep.slug);
            const epNum = ep.seriesOrder ?? idx + 1;
            return (
              <li key={ep.slug}>
                <Link
                  href={`/${encodeURIComponent(titlePart)}`}
                  className={[
                    'flex items-start gap-4 rounded-card-lg border border-bento-ink/10 bg-bento-card p-5 no-underline text-bento-ink transition hover:bg-bento-ink/[0.03] dark:border-white/10 dark:hover:bg-white/[0.03]',
                    FOCUS_RING,
                  ].join(' ')}
                >
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-bento-ink text-sm font-bold text-white">
                    {epNum}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold leading-snug tracking-tight md:text-lg">
                      {ep.title}
                    </h2>
                    {ep.excerpt && (
                      <p className="mt-2 text-sm leading-relaxed text-bento-dim line-clamp-2">
                        {ep.excerpt}
                      </p>
                    )}
                    <div className="mt-3 text-[11px] text-bento-dim">
                      {formatDate(ep.date)}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
