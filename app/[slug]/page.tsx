import { getArticleByTitle, getAllArticles, getRelatedArticles, getArticleTitleFromSlug } from '@/lib/articles';
import { extractTOC, calculateReadingTime } from '@/lib/markdown';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/utils';
import { DEFAULT_ARTICLE_IMAGE } from '@/lib/constants';
import { TableOfContents } from '@/components/article/table-of-contents';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface ArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

// output: 'export' 모드에서는 동적 파라미터 비활성화 필수
export const dynamicParams = false;

// Static generation: 모든 article slug 생성 (category 제거)
export async function generateStaticParams() {
  const articles = await getAllArticles();

  return articles.map((article) => ({
    slug: getArticleTitleFromSlug(article.slug),
  }));
}

// Metadata 생성
export async function generateMetadata({ params }: ArticlePageProps) {
  const resolvedParams = await params;

  if (!resolvedParams.slug) {
    return {
      title: '게시글을 찾을 수 없습니다',
    };
  }

  // URL 디코딩
  const decodedSlug = decodeURIComponent(resolvedParams.slug);
  const article = await getArticleByTitle(decodedSlug);

  if (!article) {
    return {
      title: '게시글을 찾을 수 없습니다',
    };
  }

  return {
    title: `${article.frontmatter.title} | Frank's IT Blog`,
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

  if (!resolvedParams.slug) {
    notFound();
  }

  // URL 디코딩: Next.js가 전달하는 slug는 URL-encoded 상태
  const decodedSlug = decodeURIComponent(resolvedParams.slug);
  const article = await getArticleByTitle(decodedSlug);

  if (!article) {
    notFound();
  }

  const toc = extractTOC(article.html);
  const readingTime = calculateReadingTime(article.content);

  // slug에서 전체 경로를 가져와서 관련 글 검색 및 category 정보 가져오기
  const { findArticleByTitle } = await import('@/lib/articles');
  const manifestArticle = await findArticleByTitle(decodedSlug);
  const relatedArticles = manifestArticle ? await getRelatedArticles(manifestArticle.slug, 3) : [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Article Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Badge>{manifestArticle?.category || 'Uncategorized'}</Badge>
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
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </header>

      <Separator className="mb-8" />

      {/* 2-Column Layout: Article + TOC Sidebar */}
      <div className="flex gap-8 lg:gap-12">
        {/* Main Content Column */}
        <div className="flex-1 min-w-0">
          {/* TOC - 작은 화면에서만 표시 */}
          {toc.length > 0 && (
            <aside className="lg:hidden mb-8 p-4 bg-muted rounded-lg">
              <TableOfContents items={toc} />
            </aside>
          )}

          {/* Article Content */}
          <article
            className="prose prose-neutral dark:prose-invert max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: article.html }}
          />
        </div>

        {/* TOC Sidebar - 큰 화면에서만 표시 */}
        {toc.length > 0 && (
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <TableOfContents items={toc} />
            </div>
          </aside>
        )}
      </div>

      <Separator className="mb-8" />

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">관련 글</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {relatedArticles.map((related) => (
              <Link
                key={related.slug}
                href={`/${getArticleTitleFromSlug(related.slug)}`}
                className="group"
              >
                <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1">
                  {/* 이미지 섹션 */}
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img
                      src={
                        related.firstImage
                          ? `/images/${related.slug}/${related.firstImage}`
                          : DEFAULT_ARTICLE_IMAGE
                      }
                      alt={related.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>

                  {/* 헤더 섹션 */}
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{related.category}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(related.date)}
                      </span>
                    </div>
                    <CardTitle className="text-base line-clamp-2 group-hover:text-primary">
                      {related.title}
                    </CardTitle>
                    {related.excerpt && (
                      <CardDescription className="line-clamp-3">
                        {related.excerpt}
                      </CardDescription>
                    )}
                  </CardHeader>

                  {/* 태그 섹션 */}
                  {related.tags && related.tags.length > 0 && (
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {related.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                        {related.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{related.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  )}
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
