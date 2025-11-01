'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import MiniSearch from 'minisearch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText } from 'lucide-react';

interface SearchDocument {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  date: string;
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchDocument[]>([]);
  const [miniSearch, setMiniSearch] = useState<MiniSearch<SearchDocument> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // MiniSearch 초기화
  useEffect(() => {
    if (!open) return;

    const loadSearchIndex = async () => {
      try {
        const response = await fetch('/search-index.json');
        const documents: SearchDocument[] = await response.json();

        const search = new MiniSearch<SearchDocument>({
          fields: ['title', 'excerpt', 'content', 'tags'],
          storeFields: ['slug', 'title', 'excerpt', 'category', 'tags', 'date'],
          searchOptions: {
            boost: { title: 2, excerpt: 1.5, tags: 1.2 },
            fuzzy: 0.2,
            prefix: true,
          },
        });

        search.addAll(documents);
        setMiniSearch(search);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load search index:', error);
        setIsLoading(false);
      }
    };

    loadSearchIndex();
  }, [open]);

  // 검색 실행
  const handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);

    if (!miniSearch || !searchQuery.trim()) {
      setResults([]);
      return;
    }

    try {
      const searchResults = miniSearch.search(searchQuery);
      setResults(searchResults.slice(0, 10) as unknown as SearchDocument[]);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    }
  }, [miniSearch]);

  // 결과 선택
  const handleSelect = (slug: string) => {
    // Category를 제외한 article title만 추출
    const parts = slug.split('/');
    const title = parts[parts.length - 1];
    router.push(`/${title}`);
    onOpenChange(false);
    setQuery('');
    setResults([]);
  };

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>검색</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="검색어를 입력하세요... (⌘K)"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              검색 인덱스를 로딩 중...
            </div>
          ) : query && results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              검색 결과가 없습니다.
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2 mt-4">
              {results.map((result) => (
                <button
                  key={result.slug}
                  onClick={() => handleSelect(result.slug)}
                  className="w-full text-left p-4 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {result.category}
                        </Badge>
                      </div>
                      <h3 className="font-semibold mb-1 line-clamp-1">
                        {result.title}
                      </h3>
                      {result.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {result.excerpt}
                        </p>
                      )}
                      {result.tags && result.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {result.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              검색어를 입력하여 글을 찾아보세요
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          <kbd className="px-2 py-1 bg-muted rounded">⌘K</kbd> 또는{' '}
          <kbd className="px-2 py-1 bg-muted rounded">Ctrl+K</kbd>로 검색창 열기
        </div>
      </DialogContent>
    </Dialog>
  );
}
