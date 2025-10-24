import { Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Article } from "@/lib/markdown";

interface SeriesCardProps {
  seriesName: string;
  articles: Article[];
}

export function SeriesCard({ seriesName, articles }: SeriesCardProps) {
  const sortedArticles = [...articles].sort(
    (a, b) => (a.frontmatter.seriesOrder || 0) - (b.frontmatter.seriesOrder || 0)
  );

  return (
    <Card data-testid={`series-card-${seriesName}`}>
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-2xl font-semibold">{seriesName}</h2>
          <Badge variant="secondary" data-testid={`series-count-${seriesName}`}>
            {articles.length}개의 글
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <ul className="space-y-3">
          {sortedArticles.map((article) => (
            <li key={article.slug}>
              <Link href={`/article/${article.slug}`}>
                <div
                  className="flex items-start justify-between gap-4 py-2 px-3 rounded-md hover-elevate transition-colors group cursor-pointer"
                  data-testid={`series-article-${article.slug}`}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium group-hover:text-primary transition-colors">
                      {article.frontmatter.title}
                    </h3>
                    {article.frontmatter.excerpt && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {article.frontmatter.excerpt}
                      </p>
                    )}
                  </div>
                  <time
                    dateTime={article.frontmatter.date}
                    className="text-sm text-muted-foreground whitespace-nowrap"
                  >
                    {new Date(article.frontmatter.date).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </time>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
