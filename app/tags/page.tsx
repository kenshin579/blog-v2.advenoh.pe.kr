import Link from 'next/link';
import { getAllArticles } from '@/lib/articles';
import { Breadcrumb } from '@/components/breadcrumb';

export const metadata = {
  title: "Tags | Frank's IT Blog",
  description: '태그별로 정리된 기술 블로그 글 모음',
};

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

export default async function TagsPage() {
  const all = await getAllArticles();

  // Aggregate tag counts (raw, case-sensitive)
  const counts = new Map<string, number>();
  for (const a of all) {
    if (!a.tags) continue;
    for (const t of a.tags) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }

  const entries = Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.tag.localeCompare(b.tag, 'ko'));

  const maxCount = entries.reduce((acc, e) => Math.max(acc, e.count), 0);

  return (
    <main className="min-h-screen bg-bento-bg pb-20">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Tags' },
        ]}
      />

      {/* Hero */}
      <section className="mx-auto max-w-canvas px-6 md:px-10">
        <div className="relative overflow-hidden rounded-card-xl bg-bento-hero-dark p-8 text-white md:p-12">
          <div
            aria-hidden="true"
            className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full opacity-55"
            style={{ background: 'radial-gradient(circle, rgb(var(--bento-accent)) 0%, transparent 70%)' }}
          />
          <div className="relative">
            <p className="text-[12px] uppercase tracking-[0.12em] text-white/70">All tags</p>
            <div className="my-4 text-[56px] font-bold leading-[0.95] tracking-tightest md:text-[88px]">
              #{entries.length}
              <span className="text-white/40"> tags</span>
            </div>
            <p className="max-w-lg text-base leading-relaxed text-white/75 md:text-lg">
              {all.length}편의 글을 가로지르는 주제어. 클릭해서 관련된 모든 글을 모아보세요.
            </p>
          </div>
        </div>
      </section>

      {/* Tag cloud (chips, 3-tier sizes) */}
      {entries.length > 0 && (
        <section className="mx-auto mt-8 max-w-canvas px-6 md:px-10">
          <div className="flex flex-wrap gap-2 rounded-card-xl bg-bento-card p-6 md:p-8">
            {entries.map((e) => {
              const weight = maxCount > 0 ? e.count / maxCount : 0;
              const sizeClass =
                weight > 0.66
                  ? 'text-2xl font-semibold'
                  : weight > 0.33
                    ? 'text-lg font-medium'
                    : 'text-sm';
              return (
                <Link
                  key={e.tag}
                  href={`/tags/${encodeURIComponent(e.tag)}`}
                  className={[
                    'inline-flex items-baseline gap-1.5 rounded-full bg-bento-ink/[0.05] px-4 py-2 text-bento-ink no-underline transition hover:bg-bento-ink/10 dark:bg-white/10 dark:hover:bg-white/15',
                    sizeClass,
                    FOCUS_RING,
                  ].join(' ')}
                >
                  <span className="text-bento-accent">#</span>
                  <span>{e.tag}</span>
                  <span className="font-mono text-[11px] font-normal text-bento-dim">{e.count}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
