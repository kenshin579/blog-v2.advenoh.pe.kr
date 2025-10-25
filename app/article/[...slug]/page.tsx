import { getArticle, getAllArticles, getRelatedArticles } from '@/lib/articles';
import { extractTOC, calculateReadingTime } from '@/lib/markdown';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface ArticlePageProps {
  params: Promise<{
    slug: string[];
  }>;
}

// Static generation: 모든 article slug 생성
export async function generateStaticParams() {
  const articles = await getAllArticles();

  return articles.map((article) => ({
    slug: article.slug.split('/'),
  }));
}

// Metadata 생성
export async function generateMetadata({ params }: ArticlePageProps) {
  const resolvedParams = await params;

  if (!resolvedParams.slug || !Array.isArray(resolvedParams.slug)) {
    return {
      title: '게시글을 찾을 수 없습니다',
    };
  }

  const slug = resolvedParams.slug.join('/');
  const article = await getArticle(slug);

  if (!article) {
    return {
      title: '게시글을 찾을 수 없습니다',
    };
  }

  return {
    title: `${article.frontmatter.title} | Advenoh IT Blog`,
    description: article.frontmatter.excerpt || article.frontmatter.title,
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

  if (!resolvedParams.slug || !Array.isArray(resolvedParams.slug)) {
    notFound();
  }

  const slug = resolvedParams.slug.join('/');
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const toc = extractTOC(article.html);
  const readingTime = calculateReadingTime(article.content);
  const relatedArticles = await getRelatedArticles(slug, 3);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Article Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Badge>{slug.split('/')[0]}</Badge>
          <span className="text-sm text-muted-foreground">
            {formatDate(article.frontmatter.date)}
          </span>
          <span className="text-sm text-muted-foreground">
            · {readingTime}분 읽기
          </span>
        </div>

        <h1 className="text-4xl font-bold mb-4">{article.frontmatter.title}</h1>

        {article.frontmatter.excerpt && (
          <p className="text-xl text-muted-foreground mb-4">
            {article.frontmatter.excerpt}
          </p>
        )}

        {article.frontmatter.tags && article.frontmatter.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {article.frontmatter.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </header>

      <Separator className="mb-8" />

      {/* Table of Contents */}
      {toc.length > 0 && (
        <aside className="mb-8 p-4 bg-muted rounded-lg">
          <h2 className="text-lg font-semibold mb-3">목차</h2>
          <nav>
            <ul className="space-y-2">
              {toc.map((item) => (
                <li
                  key={item.id}
                  className={item.level === 3 ? 'ml-4' : ''}
                >
                  <a
                    href={`#${item.id}`}
                    className="text-sm hover:text-primary transition-colors"
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      )}

      {/* Article Content */}
      <article
        className="prose prose-neutral dark:prose-invert max-w-none mb-12"
        dangerouslySetInnerHTML={{ __html: article.html }}
      />

      <Separator className="mb-8" />

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">관련 글</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {relatedArticles.map((related) => (
              <Link key={related.slug} href={`/article/${related.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Badge variant="secondary" className="w-fit mb-2">
                      {related.category}
                    </Badge>
                    <CardTitle className="text-base line-clamp-2">
                      {related.title}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Back to Home */}
      <div className="text-center">
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          ← 목록으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
