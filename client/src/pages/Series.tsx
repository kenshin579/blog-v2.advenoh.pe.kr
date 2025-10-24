import { useState, useMemo, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { SeriesCard } from "@/components/SeriesCard";
import { Pagination } from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { loadArticles } from "@/lib/articles";
import { Article } from "@/lib/markdown";

const ITEMS_PER_PAGE = 10;

export default function Series() {
  const [currentPage, setCurrentPage] = useState(1);
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
        setError('시리즈를 불러오는데 실패했습니다. 페이지를 새로고침해주세요.');
        setLoading(false);
      });
  }, []);

  const seriesMap = useMemo(() => {
    const map = new Map<string, Article[]>();
    articles.forEach(article => {
      if (article.frontmatter.series) {
        const seriesName = article.frontmatter.series;
        if (!map.has(seriesName)) {
          map.set(seriesName, []);
        }
        map.get(seriesName)!.push(article);
      }
    });
    return map;
  }, [articles]);

  const seriesArray = Array.from(seriesMap.entries());
  const totalPages = Math.ceil(seriesArray.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const visibleSeries = seriesArray.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <>
      <Helmet>
        <title>Series - IT Blog</title>
        <meta name="description" content="시리즈별로 정리된 IT 기술 블로그 글 모음" />
        <meta property="og:title" content="Series - IT Blog" />
        <meta property="og:description" content="시리즈별로 정리된 IT 기술 블로그 글 모음" />
      </Helmet>

      <div className="min-h-screen py-12 md:py-16">
        <div className="container px-4 md:px-8 max-w-4xl">
          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-page-title">
              Series
            </h1>
            <p className="text-lg text-muted-foreground" data-testid="text-page-description">
              시리즈별로 정리된 글 모음입니다
            </p>
          </header>

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
              <div className="space-y-8">
                {visibleSeries.map(([seriesName, articles]) => (
                  <SeriesCard
                    key={seriesName}
                    seriesName={seriesName}
                    articles={articles}
                  />
                ))}
              </div>

              {seriesArray.length === 0 && (
                <p className="text-center text-muted-foreground py-12" data-testid="text-no-series">
                  아직 시리즈가 없습니다
                </p>
              )}

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
