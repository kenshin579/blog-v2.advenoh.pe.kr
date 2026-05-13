import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getAllArticles,
  getArticlesByTag,
  getArticleTitleFromSlug,
} from '@/lib/articles';
import { PostsList } from '@/components/posts/posts-list';
import { Breadcrumb } from '@/components/breadcrumb';

interface PageProps {
  params: Promise<{ name: string }>;
}

export const dynamicParams = false;

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

export async function generateStaticParams() {
  const all = await getAllArticles();
  const tags = new Set<string>();
  for (const a of all) {
    if (!a.tags) continue;
    for (const t of a.tags) tags.add(t);
  }
  return Array.from(tags).map((tag) => ({ name: tag }));
}

export async function generateMetadata({ params }: PageProps) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  return {
    title: `#${decoded} | Frank's IT Blog`,
    description: `#${decoded} 태그가 붙은 글 모음`,
  };
}

export default async function TagDetailPage({ params }: PageProps) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);

  const matched = await getArticlesByTag(decoded);
  if (matched.length === 0) notFound();

  const sorted = matched
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const articles = sorted.map((a) => ({
    slug: getArticleTitleFromSlug(a.slug),
    title: a.title,
    category: a.category,
    date: a.date,
  }));

  // Related tags: aggregate from all articles, exclude current, top 12 by count
  const all = await getAllArticles();
  const counts = new Map<string, number>();
  for (const a of all) {
    if (!a.tags) continue;
    for (const t of a.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  const related = Array.from(counts.entries())
    .filter(([t]) => t !== decoded)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  return (
    <main className="min-h-screen bg-bento-bg pb-20">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Tags', href: '/tags' },
          { label: `#${decoded}` },
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
            <p className="text-[12px] uppercase tracking-[0.12em] text-white/70">Tag</p>
            <div className="my-4 text-[48px] font-bold leading-[0.95] tracking-tightest md:text-[80px]">
              <span className="text-bento-accent">#</span>
              {decoded}
            </div>
            <div className="flex gap-6 text-xs text-white/70">
              <span><strong className="text-base text-white">{articles.length}</strong> 편</span>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <aside className="col-span-12 rounded-card-lg bg-bento-cream p-5 md:col-span-4">
            <div className="mb-3 text-[11px] uppercase tracking-wider text-bento-dim">
              Related tags
            </div>
            <div className="flex flex-wrap gap-2">
              {related.map((t) => (
                <Link
                  key={t.tag}
                  href={`/tags/${encodeURIComponent(t.tag)}`}
                  className={[
                    'inline-flex items-center gap-1.5 rounded-full bg-bento-card px-3.5 py-2 text-[13px] text-bento-ink no-underline',
                    FOCUS_RING,
                  ].join(' ')}
                >
                  <span className="text-bento-accent">#</span>
                  {t.tag}
                  <span className="text-[11px] text-bento-dim">{t.count}</span>
                </Link>
              ))}
            </div>
          </aside>
        )}
      </section>

      {/* Article list */}
      <section className="mx-auto mt-8 max-w-canvas px-6 md:px-10">
        <PostsList articles={articles} />
      </section>
    </main>
  );
}
