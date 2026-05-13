import Link from 'next/link';
import { categorySlug } from '@/lib/url';

type CategoryEntry = {
  name: string;
  count: number;
};

type Props = {
  categories: CategoryEntry[];
};

export function CategoriesCard({ categories }: Props) {
  return (
    <div className="col-span-12 rounded-card-xl bg-bento-cream p-6 md:col-span-5 md:p-7">
      <h3 className="mb-4 text-base font-bold text-bento-ink">Browse by topic</h3>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <Link
            key={c.name}
            href={`/category/${encodeURIComponent(categorySlug(c.name))}`}
            className="inline-flex items-center gap-2 rounded-full bg-bento-card px-3.5 py-2 text-[13px] text-bento-ink no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bento-cream"
          >
            <span className="capitalize">{c.name}</span>
            <span className="text-[11px] text-bento-dim">{c.count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
