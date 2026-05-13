import Link from 'next/link';

type Item = {
  slug: string;
  title: string;
  date: string;
};

type Props = {
  items: Item[];
};

export function LatestCard({ items }: Props) {
  return (
    <div className="col-span-12 rounded-card-xl bg-bento-accent p-6 text-white md:col-span-7 md:p-7">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold md:text-xl">Latest</h3>
        <span className="text-[11px] uppercase tracking-wider opacity-75">최신순</span>
      </div>
      <ul>
        {items.map((it, i) => (
          <li key={it.slug}>
            <Link
              href={`/${encodeURIComponent(it.slug)}`}
              className={`flex items-start gap-3 py-3 text-white no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bento-accent ${
                i > 0 ? 'border-t border-white/20' : ''
              }`}
            >
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold leading-snug md:text-[15px]">{it.title}</div>
                <div className="mt-1 text-[11px] opacity-75">{it.date}</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
