import Link from 'next/link';

type Item = {
  slug: string;
  title: string;
  date: string;
};

type Props = {
  items: Item[];
  basePath?: string;
  subtitle?: string;
};

export function LatestCard({ items, basePath = '', subtitle = '격주에 한 편씩' }: Props) {
  return (
    <div className="col-span-12 flex flex-col rounded-card-xl bg-bento-accent p-6 text-white md:col-span-4 md:p-7">
      <div className="text-[11px] uppercase tracking-[0.1em] text-white/70">Biweekly</div>
      <h3 className="mt-2 text-xl font-bold tracking-tighter md:text-2xl">{subtitle}</h3>
      <ul className="mt-auto flex flex-col gap-2 pt-6">
        {items.map((it, i) => {
          const active = i < 2;
          return (
            <li key={it.slug}>
              <Link
                href={`${basePath}/${encodeURIComponent(it.slug)}`}
                className="flex items-center gap-3 text-white no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bento-accent"
              >
                <span
                  className={[
                    'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                    active
                      ? 'bg-white text-bento-accent'
                      : 'bg-white/20 text-white/60',
                  ].join(' ')}
                >
                  {i + 1}
                </span>
                <span
                  className={[
                    'line-clamp-1 text-[13px]',
                    active ? 'text-white' : 'text-white/60',
                  ].join(' ')}
                >
                  {it.title}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
