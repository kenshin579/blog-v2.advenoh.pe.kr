import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { getArticleTitleFromSlug } from '@/lib/articles';

interface ManifestArticle {
  slug: string;
  category: string;
  title: string;
  date: string;
  excerpt?: string;
  tags?: string[];
  series?: string;
  seriesOrder?: number;
  firstImage?: string;
}

interface SeriesNavigationProps {
  seriesName: string;
  articles: ManifestArticle[];
  currentSlug: string;
}

/**
 * 시리즈 네비게이션 컴포넌트
 * 같은 시리즈의 모든 아티클을 표시하고 현재 아티클을 강조
 */
export function SeriesNavigation({
  seriesName,
  articles,
  currentSlug
}: SeriesNavigationProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <span>📚</span>
          <span>시리즈: {seriesName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-2">
          {articles.map((article, index) => {
            const isCurrent = article.slug === currentSlug;
            const articleTitle = getArticleTitleFromSlug(article.slug);

            return (
              <li key={article.slug} className="flex items-start gap-2">
                <span className="text-muted-foreground min-w-[1.5rem]">
                  {index + 1}.
                </span>
                {isCurrent ? (
                  <span
                    className="font-bold flex-1 flex items-center justify-between"
                    aria-current="page"
                  >
                    <span>{article.title}</span>
                    <span className="ml-2">←</span>
                  </span>
                ) : (
                  <Link
                    href={`/${articleTitle}`}
                    className="flex-1 hover:text-primary hover:underline"
                  >
                    {article.title}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
