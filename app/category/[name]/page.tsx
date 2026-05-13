import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getAllArticles,
  getArticlesByCategory,
  getArticleTitleFromSlug,
} from '@/lib/articles';
import { formatDate } from '@/lib/utils';
import { Breadcrumb } from '@/components/breadcrumb';

interface PageProps {
  params: Promise<{ name: string }>;
}

export const dynamicParams = false;

const TONES = ['sage', 'butter', 'rose', 'cream'] as const;
type Tone = (typeof TONES)[number];
const TONE_BG: Record<Tone, string> = {
  sage: 'bg-bento-sage',
  butter: 'bg-bento-butter',
  rose: 'bg-bento-rose',
  cream: 'bg-bento-cream',
};

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

export async function generateStaticParams() {
  const all = await getAllArticles();
  const cats = Array.from(new Set(all.map((a) => a.category.toLowerCase())));
  return cats.map((name) => ({ name }));
}

export async function generateMetadata({ params }: PageProps) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  const displayName = decoded.charAt(0).toUpperCase() + decoded.slice(1);
  return {
    title: `${displayName} | Frank's IT Blog`,
    description: `${displayName} 카테고리 글 모음`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { name } = await params;
  const decoded = decodeURIComponent(name).toLowerCase();

  const all = await getAllArticles();
  const matchedCategory = all.find(
    (a) => a.category.toLowerCase() === decoded,
  )?.category;
  if (!matchedCategory) notFound();

  const articles = (await getArticlesByCategory(matchedCategory)).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  if (articles.length === 0) notFound();

  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <main className="min-h-screen bg-bento-bg pb-20">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Posts', href: '/posts' },
          { label: matchedCategory },
        ]}
      />
      <header className="mx-auto max-w-canvas px-6 pt-8 md:px-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-bento-dim">
          Category
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tighter text-bento-ink md:text-4xl">
          <span className="capitalize">{matchedCategory}</span>
        </h1>
        <p className="mt-2 text-sm text-bento-dim">
          {articles.length}편
        </p>
      </header>

      <section className="mx-auto mt-8 grid max-w-canvas grid-cols-12 gap-3 px-6 md:gap-4 md:px-10">
        <Link
          href={`/${encodeURIComponent(getArticleTitleFromSlug(featured.slug))}`}
          className={[
            'relative col-span-12 flex min-h-[260px] flex-col justify-between overflow-hidden rounded-card-xl bg-bento-hero-dark p-8 text-white no-underline md:min-h-[320px] md:p-10',
            FOCUS_RING,
          ].join(' ')}
        >
          <div
            aria-hidden="true"
            className="absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-50"
            style={{ background: 'radial-gradient(circle, rgb(var(--bento-accent)) 0%, transparent 70%)' }}
          />
          <div className="relative">
            <div className="mb-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-bento-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
                Latest
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] capitalize">
                {matchedCategory}
              </span>
            </div>
            <h2 className="text-2xl font-bold leading-tight tracking-tighter md:text-3xl">
              {featured.title}
            </h2>
            {featured.excerpt && (
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/75 md:text-base">
                {featured.excerpt}
              </p>
            )}
          </div>
          <div className="relative flex items-end justify-between text-xs text-white/70">
            <span>{formatDate(featured.date)}</span>
            <span aria-hidden="true">→</span>
          </div>
        </Link>

        {rest.map((a, i) => (
          <Link
            key={a.slug}
            href={`/${encodeURIComponent(getArticleTitleFromSlug(a.slug))}`}
            className={[
              'col-span-6 flex min-h-[140px] flex-col justify-between rounded-card-lg p-5 text-bento-ink no-underline md:col-span-3 md:min-h-[180px]',
              TONE_BG[TONES[i % TONES.length]],
              FOCUS_RING,
            ].join(' ')}
          >
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-wider text-bento-dim">
                {formatDate(a.date)}
              </div>
              <h3 className="text-[14px] font-semibold leading-snug tracking-tight md:text-[15px]">
                {a.title}
              </h3>
            </div>
            <div className="mt-3 text-[10px] text-bento-dim" aria-hidden="true">→</div>
          </Link>
        ))}
      </section>
    </main>
  );
}
