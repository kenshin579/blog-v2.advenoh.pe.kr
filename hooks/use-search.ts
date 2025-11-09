import { useState, useCallback } from 'react';
import MiniSearch from 'minisearch';

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

export function useSearch() {
  const [miniSearch, setMiniSearch] = useState<MiniSearch<SearchDocument> | null>(null);
  const [results, setResults] = useState<SearchDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 검색 인덱스 로딩
  const loadSearchIndex = useCallback(async () => {
    if (miniSearch) return; // 이미 로딩됨

    setIsLoading(true);
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
    } catch (error) {
      console.error('Failed to load search index:', error);
    } finally {
      setIsLoading(false);
    }
  }, [miniSearch]);

  // 검색 실행
  const search = useCallback((query: string) => {
    if (!miniSearch || !query.trim()) {
      setResults([]);
      return;
    }

    try {
      const searchResults = miniSearch.search(query);
      setResults(searchResults.slice(0, 10) as unknown as SearchDocument[]);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    }
  }, [miniSearch]);

  // 검색 결과 초기화
  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return {
    search,
    results,
    isLoading,
    loadSearchIndex,
    clearResults,
  };
}
