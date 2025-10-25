"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { DEFAULT_ARTICLE_IMAGE } from '@/lib/constants';
import { FeatureSection, CategoryInfo } from './feature';
import { SearchDialog } from './search-dialog';

// Category를 제외한 article title만 추출 (클라이언트 안전 버전)
function getArticleTitleFromSlug(fullSlug: string): string {
  const parts = fullSlug.split('/');
  return parts[parts.length - 1];
}

interface Article {
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

interface HomeContentProps {
  articles: Article[];
}

export function HomeContent({ articles }: HomeContentProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // 카테고리 데이터 집계 (contents 폴더의 카테고리 사용)
  const categories = useMemo<CategoryInfo[]>(() => {
    const categoryCounts = new Map<string, number>();

    articles.forEach(article => {
      const category = article.category;
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    });

    return Array.from(categoryCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count); // 개수 내림차순
  }, [articles]);

  // 필터링된 articles (category 기반)
  const filteredArticles = useMemo(() => {
    if (!selectedCategory) return articles;

    return articles.filter(article =>
      article.category === selectedCategory
    );
  }, [articles, selectedCategory]);

  return (
    <>
      <FeatureSection
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        onSearchClick={() => setIsSearchOpen(true)}
      />

      <div className="container mx-auto px-4 py-8">
        {selectedCategory && (
          <div className="mb-6 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              필터: <strong>{selectedCategory}</strong>
            </span>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-xs text-primary hover:underline"
            >
              초기화
            </button>
          </div>
        )}

        {filteredArticles.length === 0 && selectedCategory && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              "{selectedCategory}" 카테고리에 해당하는 글이 없습니다.
            </p>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-primary hover:underline"
            >
              전체 글 보기
            </button>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article) => (
            <Link
              key={article.slug}
              href={`/${getArticleTitleFromSlug(article.slug)}`}
              className="group"
            >
              <Card className="h-full transition-all hover:shadow-lg hover-elevate">
                <div className="aspect-video overflow-hidden rounded-t-lg">
                  <img
                    src={
                      article.firstImage
                        ? `/images/${article.slug}/${article.firstImage}`
                        : DEFAULT_ARTICLE_IMAGE
                    }
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
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

      {/* Search Dialog */}
      <SearchDialog
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
      />
    </>
  );
}
