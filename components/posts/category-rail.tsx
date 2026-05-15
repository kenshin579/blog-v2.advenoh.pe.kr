'use client';

import Link from 'next/link';

type CategoryEntry = {
  name: string;
  count: number;
};

type Props = {
  categories: CategoryEntry[];
  totalCount: number;
  selectedCategory: string | null;
};

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-bg';

export function CategoryRail({ categories, totalCount, selectedCategory }: Props) {
  return (
    <>
      {/* Desktop sticky rail */}
      <aside className="hidden md:block">
        <div className="sticky top-24 flex flex-col gap-1">
          <CategoryItem
            href="/posts"
            name="All"
            count={totalCount}
            active={selectedCategory === null}
          />
          {categories.map((c) => (
            <CategoryItem
              key={c.name}
              href={`/posts?cat=${encodeURIComponent(c.name)}`}
              name={c.name}
              count={c.count}
              active={selectedCategory === c.name}
            />
          ))}
        </div>
      </aside>

      {/* Mobile horizontal chip rail */}
      <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-2 no-scrollbar md:hidden">
        <CategoryChip
          href="/posts"
          name="All"
          count={totalCount}
          active={selectedCategory === null}
        />
        {categories.map((c) => (
          <CategoryChip
            key={c.name}
            href={`/posts?cat=${encodeURIComponent(c.name)}`}
            name={c.name}
            count={c.count}
            active={selectedCategory === c.name}
          />
        ))}
      </div>
    </>
  );
}

function CategoryItem({
  href,
  name,
  count,
  active,
}: {
  href: string;
  name: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? 'page' : undefined}
      className={[
        'flex items-center justify-between rounded-card-sm px-3 py-2 text-sm no-underline transition',
        FOCUS_RING,
        active
          ? 'bg-bento-ink text-white dark:bg-white dark:text-bento-bg'
          : 'text-bento-ink hover:bg-bento-ink/5 dark:text-white dark:hover:bg-white/10',
      ].join(' ')}
    >
      <span className="capitalize">{name}</span>
      <span className={['text-xs', active ? 'opacity-70' : 'text-bento-dim'].join(' ')}>
        {count}
      </span>
    </Link>
  );
}

function CategoryChip({
  href,
  name,
  count,
  active,
}: {
  href: string;
  name: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? 'page' : undefined}
      className={[
        'inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] no-underline transition',
        FOCUS_RING,
        active
          ? 'bg-bento-ink text-white dark:bg-white dark:text-bento-bg'
          : 'bg-bento-ink/[0.06] text-bento-ink hover:bg-bento-ink/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15',
      ].join(' ')}
    >
      <span className="capitalize">{name}</span>
      <span className={['text-[11px]', active ? 'opacity-70' : 'text-bento-dim'].join(' ')}>
        {count}
      </span>
    </Link>
  );
}
