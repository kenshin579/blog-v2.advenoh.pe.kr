import Link from 'next/link';
import { getAllArticles } from '@/lib/articles';

export const metadata = {
  title: "Tags | Frank's IT Blog",
  description: '태그별로 정리된 기술 블로그 글 모음',
};

const MIN_FONT = 12;
const MAX_FONT = 32;

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

export default async function TagsPage() {
  const all = await getAllArticles();

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

  const minCount = entries.reduce((acc, e) => Math.min(acc, e.count), Infinity);
  const maxCount = entries.reduce((acc, e) => Math.max(acc, e.count), 0);
  const fontSize = (count: number): number => {
    if (maxCount === minCount) return (MIN_FONT + MAX_FONT) / 2;
    const ratio = (count - minCount) / (maxCount - minCount);
    return MIN_FONT + ratio * (MAX_FONT - MIN_FONT);
  };

  return (
    <main className="min-h-screen bg-bento-bg pb-20">
      <header className="mx-auto max-w-canvas px-6 pt-8 md:px-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-bento-dim">
          Tags
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tighter text-bento-ink md:text-4xl">
          Tags
        </h1>
        <p className="mt-2 text-sm text-bento-dim">
          {entries.length}개의 태그 · 글 개수에 따라 크기가 달라요
        </p>
      </header>

      {entries.length === 0 ? (
        <section className="mx-auto max-w-canvas px-6 py-20 text-center text-bento-dim md:px-10">
          등록된 태그가 없습니다.
        </section>
      ) : (
        <section className="mx-auto mt-8 max-w-canvas px-6 md:px-10">
          <div className="flex flex-wrap items-end gap-x-4 gap-y-3 rounded-card-xl bg-bento-card p-6 md:p-10">
            {entries.map((e) => (
              <Link
                key={e.tag}
                href={`/tags/${encodeURIComponent(e.tag)}`}
                className={[
                  'inline-flex items-baseline gap-1 no-underline text-bento-ink transition hover:text-bento-accent',
                  FOCUS_RING,
                ].join(' ')}
                style={{
                  fontSize: `${fontSize(e.count)}px`,
                  lineHeight: 1.1,
                }}
              >
                <span className="font-semibold tracking-tight">{e.tag}</span>
                <span className="text-bento-dim" style={{ fontSize: '0.65em' }}>
                  {e.count}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
