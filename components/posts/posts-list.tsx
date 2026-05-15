import Link from 'next/link';

type Article = {
  slug: string;
  title: string;
  category: string;
  date: string;
};

type Props = {
  articles: Article[];
};

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

function yearOf(iso: string): number {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? 0 : d.getFullYear();
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function PostsList({ articles }: Props) {
  if (articles.length === 0) {
    return (
      <div className="py-20 text-center text-sm text-bento-dim">
        해당 카테고리에 글이 없습니다.
      </div>
    );
  }

  const byYear = new Map<number, Article[]>();
  for (const a of articles) {
    const y = yearOf(a.date);
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y)!.push(a);
  }
  const years = Array.from(byYear.keys()).sort((a, b) => b - a);

  return (
    <div className="flex flex-col gap-10">
      {years.map((year) => (
        <section key={year}>
          <h2 className="mb-3 font-mono text-lg font-bold tracking-tight text-bento-ink">
            {year}
          </h2>
          <ul className="flex flex-col">
            {byYear.get(year)!.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/${encodeURIComponent(a.slug)}`}
                  className={[
                    'group grid grid-cols-[44px_72px_1fr] items-baseline gap-3 rounded-card-sm px-2 py-2.5 no-underline text-bento-ink transition hover:bg-bento-ink/[0.04] dark:hover:bg-white/[0.04]',
                    FOCUS_RING,
                  ].join(' ')}
                >
                  <span className="font-mono text-[12px] text-bento-dim">
                    {shortDate(a.date)}
                  </span>
                  <span className="truncate text-[11px] uppercase tracking-wider text-bento-dim">
                    {a.category}
                  </span>
                  <span className="truncate text-[14px] font-medium tracking-tight group-hover:text-bento-accent">
                    {a.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
