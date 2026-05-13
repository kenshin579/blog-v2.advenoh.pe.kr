import { notFound } from 'next/navigation';
import {
  getAllArticles,
  getArticlesByTag,
  getArticleTitleFromSlug,
} from '@/lib/articles';
import { PostsList } from '@/components/posts/posts-list';
import { Breadcrumb } from '@/components/breadcrumb';

interface PageProps {
  params: Promise<{ name: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const all = await getAllArticles();
  const tags = new Set<string>();
  for (const a of all) {
    if (!a.tags) continue;
    for (const t of a.tags) tags.add(t);
  }
  // Pass RAW tag names — Next.js handles URL encoding for filesystem paths.
  return Array.from(tags).map((tag) => ({ name: tag }));
}

export async function generateMetadata({ params }: PageProps) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  return {
    title: `#${decoded} | Frank's IT Blog`,
    description: `#${decoded} 태그가 붙은 글 모음`,
  };
}

export default async function TagDetailPage({ params }: PageProps) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);

  const matched = await getArticlesByTag(decoded);
  if (matched.length === 0) notFound();

  const sorted = matched
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const articles = sorted.map((a) => ({
    slug: getArticleTitleFromSlug(a.slug),
    title: a.title,
    category: a.category,
    date: a.date,
  }));

  return (
    <main className="min-h-screen bg-bento-bg pb-20">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Tags', href: '/tags' },
          { label: `#${decoded}` },
        ]}
      />
      <header className="mx-auto max-w-canvas px-6 pt-8 md:px-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-bento-dim">
          Tag
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tighter text-bento-ink md:text-4xl">
          <span className="text-bento-accent">#</span>
          {decoded}
        </h1>
        <p className="mt-2 text-sm text-bento-dim">
          {articles.length}편
        </p>
      </header>

      <section className="mx-auto mt-8 max-w-canvas px-6 md:px-10">
        <PostsList articles={articles} />
      </section>
    </main>
  );
}
