import { getAllArticles, getArticleTitleFromSlug } from '@/lib/articles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export const metadata = {
  title: "Frank's IT Blog",
  description: 'IT 기술 블로그 - 개발, 클라우드, 데이터베이스',
};

export default async function HomePage() {
  const articles = await getAllArticles();

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">Frank's IT Blog</h1>
        <p className="text-xl text-muted-foreground">
          개발, 클라우드, 데이터베이스 관련 기술 블로그
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/${getArticleTitleFromSlug(article.slug)}`}
            className="group"
          >
            <Card className="h-full transition-all hover:shadow-lg hover-elevate">
              {article.firstImage && (
                <div className="aspect-video overflow-hidden rounded-t-lg">
                  <img
                    src={`/images/${article.slug}/${article.firstImage}`}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{article.category}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(article.date)}
                  </span>
                </div>
                <CardTitle className="line-clamp-2 group-hover:text-primary">
                  {article.title}
                </CardTitle>
                {article.excerpt && (
                  <CardDescription className="line-clamp-3">
                    {article.excerpt}
                  </CardDescription>
                )}
              </CardHeader>
              {article.tags && article.tags.length > 0 && (
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {article.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{article.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          </Link>
        ))}
      </div>

      {articles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">아직 게시된 글이 없습니다.</p>
        </div>
      )}
    </div>
  );
}
