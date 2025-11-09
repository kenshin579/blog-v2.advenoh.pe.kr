"use client";

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, FileText } from 'lucide-react';
import { useSearch } from '@/hooks/use-search';

export function InlineSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const { search, results, isLoading, loadSearchIndex, clearResults } = useSearch();

  // 검색 인덱스 로딩 (포커스 시)
  useEffect(() => {
    if (open) {
      loadSearchIndex();
    }
  }, [open, loadSearchIndex]);

  // Debounced 검색
  const debouncedSearch = useDebouncedCallback(
    (value: string) => {
      search(value);
    },
    300
  );

  // Input 변경 핸들러
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  // 결과 선택 핸들러
  const handleSelect = useCallback((slug: string) => {
    const parts = slug.split('/');
    const title = parts[parts.length - 1];
    router.push(`/${title}`);
    setOpen(false);
    setQuery('');
    clearResults();
  }, [router, clearResults]);

  // ESC 키 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="기술 블로그 글 검색..."
            value={query}
            onChange={handleChange}
            onFocus={() => setOpen(true)}
            className="pl-10 w-full transition-shadow duration-200 focus-visible:shadow-md"
          />
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 max-h-[500px] overflow-hidden"
        align="start"
      >
        <div className="overflow-y-auto max-h-[500px]">
          {isLoading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              검색 인덱스 로딩 중...
            </div>
          ) : query && results.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              검색 결과가 없습니다.
            </div>
          ) : results.length > 0 ? (
            <div className="p-2 space-y-1">
              {results.map((result) => (
                <button
                  key={result.slug}
                  onClick={() => handleSelect(result.slug)}
                  className="w-full text-left p-3 rounded-md hover:bg-muted transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {result.category}
                        </Badge>
                      </div>
                      <h3 className="font-semibold mb-1 line-clamp-1 text-sm">
                        {result.title}
                      </h3>
                      {result.excerpt && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
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
            <div className="text-center py-8 text-sm text-muted-foreground">
              검색어를 입력하여 글을 찾아보세요
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
