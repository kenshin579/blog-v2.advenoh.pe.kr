'use client';

import { useState } from 'react';
import { TagBubbleChart } from '@/components/tag-bubble-chart';
import Link from 'next/link';
import { X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Client-safe utility function
function getArticleTitleFromSlug(fullSlug: string): string {
  const parts = fullSlug.split('/');
  return parts[parts.length - 1];
}

interface TagData {
  name: string;
  count: number;
  articles: any[];
}

interface TagsPageClientProps {
  tags: TagData[];
}

export function TagsPageClient({ tags }: TagsPageClientProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const handleTagSelect = (tagName: string) => {
    setSelectedTag(tagName);
    // 아티클 목록으로 스크롤
    setTimeout(() => {
      const articleList = document.getElementById('article-list');
      if (articleList) {
        articleList.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const clearFilter = () => {
    setSelectedTag(null);
  };

  const selectedTagData = tags.find((tag) => tag.name === selectedTag);
  const articles = selectedTagData?.articles || [];

  return (
    <>
      <TagBubbleChart tags={tags} onTagSelect={handleTagSelect} selectedTag={selectedTag} />

      {selectedTag && selectedTagData && (
        <div id="article-list" className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-primary">{selectedTag}</span>
              <span className="text-muted-foreground">({articles.length}개 아티클)</span>
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilter}
              data-filter-clear
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              필터 해제
            </Button>
          </div>

          {articles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">아티클이 없습니다.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article: any) => (
                <Link
                  key={article.slug}
                  href={`/${getArticleTitleFromSlug(article.slug)}`}
                  className="article-card"
                >
                  <Card className="h-full hover:shadow-lg transition-shadow hover-elevate">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">{article.category}</Badge>
                        <time className="text-sm text-muted-foreground">
                          {new Date(article.date).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </time>
                      </div>
                      <CardTitle className="line-clamp-2">{article.title}</CardTitle>
                      {article.excerpt && (
                        <CardDescription className="line-clamp-2">
                          {article.excerpt}
                        </CardDescription>
                      )}
                    </CardHeader>
                    {article.tags && article.tags.length > 0 && (
                      <CardContent>
                        <div className="flex flex-wrap gap-1">
                          {article.tags.slice(0, 3).map((tag: string) => (
                            <Badge
                              key={tag}
                              variant={tag.toLowerCase() === selectedTag ? 'default' : 'outline'}
                              className="text-xs"
                            >
                              #{tag}
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
          )}
        </div>
      )}
    </>
  );
}
