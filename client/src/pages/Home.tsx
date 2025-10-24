import { useState, useMemo, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { ArticleCard } from "@/components/ArticleCard";
import { Button } from "@/components/ui/button";
import { calculateReadingTime } from "@/lib/markdown";
import { loadArticles } from "@/lib/articles";
import { Article } from "@/lib/markdown";

const ITEMS_PER_PAGE = 10;

export default function Home() {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadArticles()
      .then(data => {
        setArticles(data);
        setLoading(false);
      })
      .catch(err => {
        setError('글을 불러오는데 실패했습니다. 페이지를 새로고침해주세요.');
        setLoading(false);
      });
  }, []);

  const sortedArticles = useMemo(() => {
    return [...articles].sort((a, b) => 
      new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime()
    );
  }, [articles]);

  const visibleArticles = sortedArticles.slice(0, visibleCount);
  const hasMore = visibleCount < sortedArticles.length;

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + ITEMS_PER_PAGE, sortedArticles.length));
  };

  return (
    <>
      <Helmet>
        <title>IT Blog - 최신 기술 블로그</title>
        <meta name="description" content="IT 기술 블로그 - 최신 개발 트렌드와 기술 인사이트를 공유합니다" />
        <meta property="og:title" content="IT Blog - 최신 기술 블로그" />
        <meta property="og:description" content="IT 기술 블로그 - 최신 개발 트렌드와 기술 인사이트를 공유합니다" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen">
        <section className="py-16 md:py-24 text-center">
          <div className="container px-4 md:px-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-4" data-testid="text-site-title">
              IT Blog
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground" data-testid="text-site-tagline">
              최신 개발 트렌드와 기술 인사이트를 공유합니다
            </p>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container px-4 md:px-8">
            {loading ? (
              <p className="text-center text-muted-foreground">로딩 중...</p>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>
                  새로고침
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {visibleArticles.map((article) => (
                    <ArticleCard
                      key={article.slug}
                      slug={article.slug}
                      frontmatter={article.frontmatter}
                      readingTime={calculateReadingTime(article.content)}
                      firstImage={article.firstImage}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div className="flex justify-center mt-12">
                    <Button
                      onClick={loadMore}
                      size="lg"
                      className="px-8"
                      data-testid="button-load-more"
                    >
                      더 보기
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
