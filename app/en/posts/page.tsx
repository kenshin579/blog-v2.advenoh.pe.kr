import { Suspense } from 'react';
import { getAllArticles, getArticleTitleFromSlug } from '@/lib/articles';
import { PostsPageClient } from '@/components/posts/posts-page-client';

export const metadata = {
  title: 'All Posts',
  description: 'All published posts — browse by year and category',
};

export default async function PostsPage() {
  const all = await getAllArticles('en');
  const articles = all.map((a) => ({
    slug: getArticleTitleFromSlug(a.slug),
    title: a.title,
    category: a.category,
    date: a.date,
  }));

  const categoryCounts = new Map<string, number>();
  for (const a of all) {
    categoryCounts.set(a.category, (categoryCounts.get(a.category) ?? 0) + 1);
  }
  const categories = Array.from(categoryCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <main className="min-h-screen bg-bento-bg pb-20">
      <div className="mx-auto max-w-canvas px-6 pt-8 md:px-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tighter text-bento-ink md:text-4xl">
            All Posts
          </h1>
          <p className="mt-2 text-sm text-bento-dim">
            {articles.length} posts · filter by category
          </p>
        </header>

        <Suspense fallback={<div className="py-20 text-center text-sm text-bento-dim">Loading…</div>}>
          <PostsPageClient articles={articles} categories={categories} basePath="/en" />
        </Suspense>
      </div>
    </main>
  );
}
