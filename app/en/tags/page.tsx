import Link from 'next/link';
import { getAllArticles } from '@/lib/articles';
import { Breadcrumb } from '@/components/breadcrumb';
import { TagsBentoGrid, type TagEntry } from '@/components/tags-bento-grid';

export const metadata = {
  title: "Tags | Frank's IT Blog",
  description: 'A collection of tech blog posts organized by tag',
};

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

export default async function TagsPage() {
  const all = await getAllArticles('en');

  // tag별 count + 관련 카테고리 + 최근 사용일 집계
  type Agg = { count: number; categories: Map<string, number>; lastUsed: string };
  const agg = new Map<string, Agg>();

  for (const a of all) {
    if (!a.tags) continue;
    for (const t of a.tags) {
      const existing = agg.get(t) ?? { count: 0, categories: new Map(), lastUsed: '' };
      existing.count += 1;
      existing.categories.set(a.category, (existing.categories.get(a.category) ?? 0) + 1);
      if (a.date > existing.lastUsed) existing.lastUsed = a.date;
      agg.set(t, existing);
    }
  }

  const entries: TagEntry[] = Array.from(agg.entries()).map(([tag, v]) => ({
    tag,
    count: v.count,
    categories: Array.from(v.categories.entries())
      .sort((x, y) => y[1] - x[1])
      .map(([cat]) => cat),
    lastUsed: v.lastUsed,
  }));

  const totalUses = entries.reduce((s, e) => s + e.count, 0);
  const byCount = [...entries].sort(
    (a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'en'),
  );
  const top5 = byCount.slice(0, 5);
  const heroCloud = byCount.slice(0, 24);

  return (
    <main className="min-h-screen bg-bento-bg pb-20">
      <Breadcrumb items={[{ label: 'Home', href: '/en' }, { label: 'Tags' }]} />

      {/* Hero — two columns */}
      <section className="mx-auto max-w-canvas px-6 md:px-10">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
          {/* Left: dark hero with inline tag cloud */}
          <div className="relative overflow-hidden rounded-card-xl bg-bento-hero-dark p-8 text-white md:p-12">
            <div
              aria-hidden="true"
              className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full opacity-55"
              style={{
                background:
                  'radial-gradient(circle, rgb(var(--bento-accent)) 0%, transparent 70%)',
              }}
            />
            <div className="relative">
              <p className="text-[12px] uppercase tracking-[0.12em] text-white/70">
                Index
              </p>
              <h1 className="my-4 text-[56px] font-bold leading-[0.95] tracking-tightest md:text-[88px]">
                Tags.
              </h1>
              <p className="max-w-lg text-base leading-relaxed text-white/75 md:text-lg">
                Topics that cut across categories. The same #{top5[0]?.tag ?? 'tag'} tag can be
                found spanning multiple categories.
              </p>

              {heroCloud.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-x-3 gap-y-2 leading-tight">
                  {heroCloud.map((e, i) => {
                    const size =
                      i < 3
                        ? 'text-[36px] font-extrabold text-white md:text-[44px]'
                        : i < 7
                          ? 'text-[24px] font-bold text-white/85 md:text-[28px]'
                          : 'text-[16px] font-medium text-white/55 md:text-[18px]';
                    return (
                      <Link
                        key={e.tag}
                        href={`/en/tags/${encodeURIComponent(e.tag)}`}
                        className={[
                          'no-underline tracking-tight transition hover:text-white',
                          size,
                          FOCUS_RING,
                        ].join(' ')}
                      >
                        #{e.tag}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: stats + top 5 */}
          <div className="flex flex-col gap-4">
            <div className="rounded-card-xl bg-bento-butter p-7 text-bento-ink">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-bento-ink/60">
                At a glance
              </p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-4xl font-extrabold leading-none md:text-[44px]">
                    {entries.length}
                  </div>
                  <div className="mt-1 text-[12px] text-bento-ink/70">Total tags</div>
                </div>
                <div>
                  <div className="text-4xl font-extrabold leading-none md:text-[44px]">
                    {totalUses}
                  </div>
                  <div className="mt-1 text-[12px] text-bento-ink/70">Total uses</div>
                </div>
              </div>
            </div>

            <div className="flex-1 rounded-card-xl bg-bento-card p-6 text-bento-ink">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-bento-ink/60">
                Top 5 — Most written
              </p>
              <ol className="mt-4 space-y-2.5">
                {top5.map((e, i) => (
                  <li key={e.tag}>
                    <Link
                      href={`/en/tags/${encodeURIComponent(e.tag)}`}
                      className={[
                        'flex items-center justify-between gap-3 rounded-card-sm px-2 py-1.5 no-underline transition hover:bg-bento-ink/5',
                        FOCUS_RING,
                      ].join(' ')}
                    >
                      <span className="flex items-center gap-3">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-bento-ink text-[10px] font-bold text-white">
                          {i + 1}
                        </span>
                        <span className="text-[14px] font-medium text-bento-ink">
                          #{e.tag}
                        </span>
                      </span>
                      <span className="font-mono text-[11px] text-bento-dim">
                        {e.count} posts
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Bento grid (sortable) */}
      {entries.length > 0 && <TagsBentoGrid entries={entries} basePath="/en" />}
    </main>
  );
}
