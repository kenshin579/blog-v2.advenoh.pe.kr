'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { CategoryRail } from './category-rail';
import { PostsList } from './posts-list';

type Article = {
  slug: string;
  title: string;
  category: string;
  date: string;
};

type CategoryEntry = {
  name: string;
  count: number;
};

type Props = {
  articles: Article[];
  categories: CategoryEntry[];
};

export function PostsPageClient({ articles, categories }: Props) {
  const params = useSearchParams();
  const cat = params.get('cat');
  const selectedCategory = cat && cat.trim() ? cat : null;

  const filtered = useMemo(() => {
    if (!selectedCategory) return articles;
    return articles.filter((a) => a.category === selectedCategory);
  }, [articles, selectedCategory]);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr] md:gap-10">
      <CategoryRail
        categories={categories}
        totalCount={articles.length}
        selectedCategory={selectedCategory}
      />
      <div>
        {selectedCategory && (
          <p className="mb-4 text-sm text-bento-dim">
            <span className="capitalize">{selectedCategory}</span> · {filtered.length}편
          </p>
        )}
        <PostsList articles={filtered} />
      </div>
    </div>
  );
}
