import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getAllArticles,
  getArticlesByCategory,
  getArticleTitleFromSlug,
} from '@/lib/articles';
import { formatDate } from '@/lib/utils';
import { Breadcrumb } from '@/components/breadcrumb';
import { categorySlug } from '@/lib/url';

interface PageProps {
  params: Promise<{ name: string }>;
}

export const dynamicParams = false;

const TINTS = ['bg-bento-sage', 'bg-bento-butter', 'bg-bento-rose', 'bg-bento-lavender'] as const;

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

export async function generateStaticParams() {
  const all = await getAllArticles('en');
  const cats = Array.from(new Set(all.map((a) => a.category.toLowerCase())));
  return cats.map((name) => ({ name }));
}

export async function generateMetadata({ params }: PageProps) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  const displayName = decoded.charAt(0).toUpperCase() + decoded.slice(1);
  return {
    title: `${displayName} | Frank's IT Blog`,
    description: `A collection of posts in the ${displayName} category`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { name } = await params;
  const decoded = decodeURIComponent(name).toLowerCase();

  const all = await getAllArticles('en');
  const matchedCategory = all.find(
    (a) => a.category.toLowerCase() === decoded,
  )?.category;
  if (!matchedCategory) notFound();

  const articles = (await getArticlesByCategory(matchedCategory, 'en')).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  if (articles.length === 0) notFound();

  const countByCat = new Map<string, number>();
  for (const a of all) countByCat.set(a.category, (countByCat.get(a.category) ?? 0) + 1);
  const otherCats = Array.from(countByCat.entries())
    .filter(([cat]) => cat !== matchedCategory)
    .map(([cat, count]) => ({ name: cat, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <main className="min-h-screen bg-bento-bg pb-20">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/en' },
          { label: 'Posts', href: '/en/posts' },
          { label: matchedCategory },
        ]}
      />

      {/* Hero: 2-col (dark + cream sidebar) */}
      <section className="mx-auto grid max-w-canvas grid-cols-12 gap-4 px-6 md:px-10">
        <div className="relative col-span-12 overflow-hidden rounded-card-xl bg-bento-hero-dark p-8 text-white md:col-span-8 md:p-12">
          <div
            aria-hidden="true"
            className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full opacity-55"
            style={{ background: 'radial-gradient(circle, rgb(var(--bento-accent)) 0%, transparent 70%)' }}
          />
          <div className="relative">
            <p className="text-[12px] uppercase tracking-[0.12em] text-white/70">Category</p>
            <div className="my-4 text-[56px] font-bold capitalize leading-[0.95] tracking-tightest md:text-[88px]">
              {matchedCategory}.
            </div>
            <div className="flex gap-6 text-xs text-white/70">
              <span><strong className="text-base text-white">{articles.length}</strong> posts</span>
            </div>
          </div>
        </div>

        <aside className="col-span-12 rounded-card-lg bg-bento-cream p-5 md:col-span-4">
          <div className="mb-3 text-[11px] uppercase tracking-wider text-bento-dim">
            Other categories
          </div>
          <div className="flex flex-wrap gap-2">
            {otherCats.map((c) => (
              <Link
                key={c.name}
                href={`/en/category/${encodeURIComponent(categorySlug(c.name))}`}
                className={[
                  'inline-flex items-center gap-1.5 rounded-full bg-bento-card px-3.5 py-2 text-[13px] text-bento-ink no-underline',
                  FOCUS_RING,
                ].join(' ')}
              >
                <span className="capitalize">{c.name}</span>
                <span className="text-[11px] text-bento-dim">{c.count}</span>
              </Link>
            ))}
          </div>
        </aside>
      </section>

      {/* Article Bento grid (variable col-span) */}
      <section className="mx-auto mt-8 grid max-w-canvas grid-cols-12 gap-3 px-6 md:gap-4 md:px-10">
        {articles.map((a, i) => {
          const isFirst = i === 0;
          const colSpan = isFirst
            ? 'col-span-12'
            : i % 3 === 1
              ? 'col-span-12 md:col-span-7'
              : i % 3 === 2
                ? 'col-span-12 md:col-span-5'
                : 'col-span-6 md:col-span-4';
          const bg = isFirst
            ? 'bg-bento-hero-dark text-white'
            : `${TINTS[i % TINTS.length]} text-bento-ink`;
          const minH = isFirst ? 'min-h-[220px] md:min-h-[260px]' : 'min-h-[160px] md:min-h-[200px]';
          const dimColor = isFirst ? 'text-white/60' : 'text-bento-dim';
          return (
            <Link
              key={a.slug}
              href={`/en/${encodeURIComponent(getArticleTitleFromSlug(a.slug))}`}
              className={[
                'flex flex-col justify-between rounded-card-lg p-5 no-underline md:p-6',
                colSpan,
                bg,
                minH,
                FOCUS_RING,
              ].join(' ')}
            >
              <div>
                <div className={['mb-2 text-[10px] uppercase tracking-wider', dimColor].join(' ')}>
                  <span className="capitalize">{a.category}</span> · {formatDate(a.date)}
                </div>
                <h3
                  className={[
                    'font-bold leading-tight tracking-tighter',
                    isFirst ? 'text-2xl md:text-3xl' : 'text-base md:text-lg',
                  ].join(' ')}
                >
                  {a.title}
                </h3>
                {isFirst && a.excerpt && (
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75">{a.excerpt}</p>
                )}
              </div>
              {a.tags && a.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {a.tags.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className={[
                        'rounded-full px-2 py-0.5 text-[10px]',
                        isFirst ? 'bg-white/10 text-white/85' : 'bg-bento-ink/[0.06] text-bento-ink',
                      ].join(' ')}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          );
        })}
      </section>
    </main>
  );
}
