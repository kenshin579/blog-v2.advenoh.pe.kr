import { getAllSeries, getArticlesBySeries } from '@/lib/articles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export const metadata = {
  title: 'Series | Advenoh IT Blog',
  description: '시리즈별로 정리된 기술 블로그 글 모음',
};

export default async function SeriesPage() {
  const seriesList = await getAllSeries();

  // 각 시리즈별 아티클 가져오기
  const seriesWithArticles = await Promise.all(
    seriesList.map(async (series) => {
      const articles = await getArticlesBySeries(series);
      return {
        name: series,
        articles,
        count: articles.length,
      };
    })
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-4">시리즈</h1>
        <p className="text-xl text-muted-foreground">
          주제별로 연재된 기술 블로그 시리즈를 확인하세요
        </p>
      </header>

      {seriesWithArticles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">등록된 시리즈가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {seriesWithArticles.map((series) => (
            <section key={series.name}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{series.name}</h2>
                <Badge variant="secondary">
                  {series.count}개의 글
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {series.articles.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/article/${article.slug}`}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow hover-elevate">
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">
                            {article.seriesOrder || 0}
                          </Badge>
                          <Badge variant="secondary">
                            {article.category}
                          </Badge>
                        </div>
                        <CardTitle className="line-clamp-2">
                          {article.title}
                        </CardTitle>
                        {article.excerpt && (
                          <CardDescription className="line-clamp-2">
                            {article.excerpt}
                          </CardDescription>
                        )}
                      </CardHeader>
                      {article.tags && article.tags.length > 0 && (
                        <CardContent>
                          <div className="flex flex-wrap gap-1">
                            {article.tags.slice(0, 2).map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {article.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{article.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  </Link>
                ))}
              </div>

              <Separator className="mt-12" />
            </section>
          ))}
        </div>
      )}

      <div className="text-center mt-12">
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          ← 홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
