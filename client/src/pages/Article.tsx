import { useMemo, useEffect, useState } from "react";
import { useRoute } from "wouter";
import { Helmet } from "react-helmet-async";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableOfContents } from "@/components/TableOfContents";
import { extractTOC, calculateReadingTime, Article as ArticleType } from "@/lib/markdown";
import { loadArticles } from "@/lib/articles";
import { Clock } from "lucide-react";
import NotFound from "./not-found";

export default function Article() {
  const [, params] = useRoute("/article/:slug");
  const slug = params?.slug;
  const [article, setArticle] = useState<ArticleType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadArticles()
        .then(articles => {
          const found = articles.find(a => a.slug === slug);
          setArticle(found || null);
          setLoading(false);
        })
        .catch(err => {
          setError('글을 불러오는데 실패했습니다. 페이지를 새로고침해주세요.');
          setLoading(false);
        });
    }
  }, [slug]);

  const toc = useMemo(() => {
    return article ? extractTOC(article.html) : [];
  }, [article]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => window.location.reload()}>
          새로고침
        </Button>
      </div>
    );
  }

  if (!article) {
    return <NotFound />;
  }

  const readingTime = calculateReadingTime(article.content);

  return (
    <>
      <Helmet>
        <title>{article.frontmatter.title} - IT Blog</title>
        <meta name="description" content={article.frontmatter.excerpt || article.frontmatter.title} />
        <meta property="og:title" content={article.frontmatter.title} />
        <meta property="og:description" content={article.frontmatter.excerpt || article.frontmatter.title} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={article.frontmatter.date} />
        {article.frontmatter.tags?.map(tag => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
      </Helmet>

      <div className="min-h-screen">
        <div className="container px-4 md:px-8 py-8 md:py-12 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-12">
            <article className="max-w-3xl">
              <header className="mb-8">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4" data-testid="text-article-title">
                  {article.frontmatter.title}
                </h1>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <time dateTime={article.frontmatter.date} data-testid="text-article-date">
                    {new Date(article.frontmatter.date).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </time>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {readingTime}분
                  </span>
                </div>

                {article.frontmatter.tags && article.frontmatter.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {article.frontmatter.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" data-testid={`article-tag-${tag}`}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </header>

              <div
                className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-semibold prose-a:text-primary prose-code:text-sm prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:border prose-pre:border-border"
                dangerouslySetInnerHTML={{ __html: article.html }}
                data-testid="article-content"
              />
            </article>

            <aside className="hidden lg:block">
              <TableOfContents items={toc} />
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
