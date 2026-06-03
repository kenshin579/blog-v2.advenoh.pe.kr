import { notFound } from 'next/navigation';
import {
  getArticleByTitle,
  getAllArticles,
  getRelatedArticles,
  getArticleTitleFromSlug,
  getArticlesBySeries,
  findArticleByTitle,
} from '@/lib/articles';
import { extractTOC, calculateReadingTime } from '@/lib/markdown';
import { MermaidRenderer } from '@/components/article/mermaid-renderer';
import { TableOfContents } from '@/components/article/table-of-contents';
import { SeriesNavigation } from '@/components/article/series-navigation';
import { HeroCard } from '@/components/article/hero-card';
import { PrevNext } from '@/components/article/prev-next';
import { RelatedCards } from '@/components/article/related-cards';
import { RecordView } from '@/components/article/record-view';
import { ReadingProgress } from '@/components/article/reading-progress';
import { Breadcrumb } from '@/components/breadcrumb';
import { seriesSlug, categorySlug } from '@/lib/url';

interface ArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const articles = await getAllArticles('en');
  return articles.map((article) => ({
    slug: getArticleTitleFromSlug(article.slug),
  }));
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const resolvedParams = await params;
  if (!resolvedParams.slug) return { title: '게시글을 찾을 수 없습니다' };

  const decodedSlug = decodeURIComponent(resolvedParams.slug);
  const article = await getArticleByTitle(decodedSlug, 'en');
  if (!article) return { title: '게시글을 찾을 수 없습니다' };

  return {
    title: article.frontmatter.title,
    description: article.frontmatter.excerpt || article.frontmatter.title,
    alternates: {
      languages: {
        ko: `/${decodedSlug}/`,
        en: `/en/${decodedSlug}/`,
      },
    },
    openGraph: {
      title: article.frontmatter.title,
      description: article.frontmatter.excerpt,
      type: 'article',
      publishedTime: article.frontmatter.date,
      tags: article.frontmatter.tags,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const resolvedParams = await params;
  if (!resolvedParams.slug) notFound();

  const decodedSlug = decodeURIComponent(resolvedParams.slug);
  const article = await getArticleByTitle(decodedSlug, 'en');
  if (!article) notFound();

  const toc = extractTOC(article.html);
  const readingTime = calculateReadingTime(article.content);

  const manifestArticle = await findArticleByTitle(decodedSlug, 'en');
  const category = manifestArticle?.category || 'Uncategorized';

  // Related articles (3 cards, Bento tinted)
  const relatedRaw = manifestArticle
    ? await getRelatedArticles(manifestArticle.slug, 'en', 3)
    : [];
  const related = relatedRaw.map((r) => ({
    slug: getArticleTitleFromSlug(r.slug),
    title: r.title,
    category: r.category,
  }));

  // Series prev/next + episode list (only if part of a series)
  let seriesEpisodes: Awaited<ReturnType<typeof getArticlesBySeries>> = [];
  let prev: { slug: string; title: string } | null = null;
  let next: { slug: string; title: string } | null = null;
  if (manifestArticle?.series) {
    const eps = await getArticlesBySeries(manifestArticle.series, 'en');
    seriesEpisodes = eps;
    const idx = eps.findIndex((e) => e.slug === manifestArticle.slug);
    if (idx > 0) {
      const p = eps[idx - 1];
      prev = { slug: getArticleTitleFromSlug(p.slug), title: p.title };
    }
    if (idx >= 0 && idx < eps.length - 1) {
      const n = eps[idx + 1];
      next = { slug: getArticleTitleFromSlug(n.slug), title: n.title };
    }
  }

  const breadcrumbItems = manifestArticle?.series
    ? [
        { label: 'Home', href: '/en' },
        { label: 'Series', href: '/en/series' },
        {
          label: manifestArticle.series,
          href: `/en/series/${encodeURIComponent(seriesSlug(manifestArticle.series))}`,
        },
      ]
    : [
        { label: 'Home', href: '/en' },
        { label: 'Posts', href: '/en/posts' },
        {
          label: category,
          href: `/en/category/${encodeURIComponent(categorySlug(category))}`,
        },
      ];

  return (
    <main className="min-h-screen bg-bento-bg pb-20">
      <RecordView
        slug={decodedSlug}
        title={article.frontmatter.title}
        category={category}
        date={article.frontmatter.date}
      />

      <Breadcrumb items={breadcrumbItems} />

      <HeroCard
        category={category}
        title={article.frontmatter.title}
        excerpt={article.frontmatter.excerpt}
        date={article.frontmatter.date}
        readingTime={readingTime}
        series={manifestArticle?.series}
        seriesOrder={manifestArticle?.seriesOrder}
        totalEpisodes={seriesEpisodes.length || undefined}
        tags={manifestArticle?.tags}
      />

      {/* Series nav (only when series article) — 본문 위에 배치하여 시리즈 맥락을 먼저 보여줌 */}
      {manifestArticle?.series && seriesEpisodes.length > 1 && (
        <SeriesNavigation
          seriesName={manifestArticle.series}
          articles={seriesEpisodes}
          currentSlug={manifestArticle.slug}
          basePath="/en"
        />
      )}

      {/* Body + sticky TOC (desktop) / collapsible TOC (mobile) */}
      <section className="mx-auto mt-12 max-w-canvas px-6 md:px-10">
        {toc.length > 0 && (
          <div className="mb-6 md:hidden">
            <TableOfContents items={toc} collapsible />
          </div>
        )}

        <div className="md:grid md:grid-cols-[1fr_240px] md:gap-10">
          <article className="prose-bento max-w-prose">
            <MermaidRenderer html={article.html} />
          </article>

          {toc.length > 0 && (
            <aside className="hidden md:block">
              <div className="sticky top-24 flex max-h-[calc(100vh-6rem)] flex-col gap-4 overflow-y-auto">
                <TableOfContents items={toc} />
                <ReadingProgress />
              </div>
            </aside>
          )}
        </div>
      </section>

      {/* Prev/Next (only when series article and has prev or next) */}
      {(prev || next) && (
        <div className="mx-auto max-w-prose px-6 md:px-0">
          <PrevNext prev={prev} next={next} basePath="/en" />
        </div>
      )}

      {/* Related cards (all articles) */}
      <RelatedCards articles={related} basePath="/en" />
    </main>
  );
}
