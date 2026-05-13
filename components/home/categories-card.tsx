import Link from 'next/link';
import { categorySlug } from '@/lib/url';

type CategoryEntry = {
  name: string;
  count: number;
};

type Props = {
  categories: CategoryEntry[];
  totalCount: number;
};

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-sage';

export function CategoriesCard({ categories, totalCount }: Props) {
  return (
    <div className="col-span-12 flex flex-col rounded-card-xl bg-bento-sage p-6 md:col-span-5 md:p-7">
      <div className="text-[10px] uppercase tracking-[0.1em] text-bento-ink/60">Topics</div>
      <h3 className="mt-2 text-2xl font-bold leading-tight tracking-tighter text-bento-ink md:text-3xl">
        {totalCount}편을<br />
        {categories.length}개의 결로
      </h3>
      <div className="mt-auto flex flex-wrap gap-2 pt-6">
        {categories.map((c) => (
          <Link
            key={c.name}
            href={`/category/${encodeURIComponent(categorySlug(c.name))}`}
            className={[
              'inline-flex items-center gap-2 rounded-full bg-bento-ink/[0.08] px-3 py-1.5 text-[12px] text-bento-ink no-underline transition hover:bg-bento-ink/[0.12]',
              FOCUS_RING,
            ].join(' ')}
          >
            <span className="capitalize">{c.name}</span>
            <span className="text-[10px] text-bento-ink/60">{c.count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
