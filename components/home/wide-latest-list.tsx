import Link from 'next/link';

type Item = {
  slug: string;
  title: string;
  category: string;
  date: string;
  readTime?: number;
};

type Props = {
  items: Item[];
  totalCount: number;
  basePath?: string;
  heading?: string;
};

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-card';

function shortDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function WideLatestList({ items, totalCount, basePath = '', heading = '이번 달 글' }: Props) {
  if (items.length === 0) return null;
  return (
    <div className="col-span-12 flex flex-col rounded-card-xl bg-bento-card p-6 md:col-span-8 md:p-7">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.1em] text-bento-dim">Latest</div>
          <h3 className="mt-1 text-xl font-bold tracking-tighter text-bento-ink md:text-2xl">
            {heading}
          </h3>
        </div>
        <Link
          href={`${basePath}/posts`}
          className={[
            'text-[13px] text-bento-dim no-underline transition hover:text-bento-ink',
            FOCUS_RING,
          ].join(' ')}
        >
          See all {totalCount} <span aria-hidden="true">→</span>
        </Link>
      </div>
      <ul className="flex flex-col">
        {items.map((a, i) => (
          <li key={a.slug}>
            <Link
              href={`${basePath}/${encodeURIComponent(a.slug)}`}
              className={[
                'grid grid-cols-[52px_1fr] items-baseline gap-3 py-3 no-underline text-bento-ink transition hover:bg-bento-ink/[0.02] dark:hover:bg-white/[0.02] md:grid-cols-[60px_1fr_80px_50px]',
                i > 0 ? 'border-t border-bento-ink/[0.06]' : '',
                FOCUS_RING,
              ].join(' ')}
            >
              <span className="font-mono text-[12px] text-bento-dim">{shortDate(a.date)}</span>
              <span className="truncate text-[14px] font-medium md:text-[15px]">{a.title}</span>
              <span className="hidden truncate text-[11px] text-bento-dim capitalize md:block">{a.category}</span>
              <span className="hidden text-right text-[11px] text-bento-dim md:block">
                {a.readTime !== undefined ? `${a.readTime}m` : ''}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
