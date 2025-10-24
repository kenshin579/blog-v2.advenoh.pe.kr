import { useEffect, useState, useMemo } from "react";
import { X, Search as SearchIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Article } from "@/lib/markdown";
import { Link } from "wouter";
import MiniSearch from "minisearch";

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articles: Article[];
}

export function SearchModal({ open, onOpenChange, articles }: SearchModalProps) {
  const [query, setQuery] = useState("");

  const miniSearch = useMemo(() => {
    const ms = new MiniSearch({
      fields: ['title', 'excerpt', 'tags', 'content'],
      storeFields: ['slug', 'title', 'excerpt', 'date'],
      searchOptions: {
        boost: { title: 3, excerpt: 2 },
        fuzzy: 0.2,
      }
    });

    const docs = articles.map(article => ({
      id: article.slug,
      slug: article.slug,
      title: article.frontmatter.title,
      excerpt: article.frontmatter.excerpt || '',
      tags: article.frontmatter.tags?.join(' ') || '',
      content: article.content,
      date: article.frontmatter.date,
    }));

    ms.addAll(docs);
    return ms;
  }, [articles]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return miniSearch.search(query).slice(0, 10);
  }, [query, miniSearch]);

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0" data-testid="modal-search" aria-describedby="search-description">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="sr-only">Search Articles</DialogTitle>
          <p id="search-description" className="sr-only">검색어를 입력하여 블로그 글을 찾아보세요</p>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="검색어를 입력하세요..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-12 text-base"
              autoFocus
              data-testid="input-search"
            />
          </div>
        </DialogHeader>

        <div className="max-h-96 overflow-auto px-2 pb-4">
          {query && results.length === 0 && (
            <p className="text-center text-muted-foreground py-8" data-testid="text-no-results">
              검색 결과가 없습니다
            </p>
          )}

          {results.map((result: any) => (
            <Link key={result.id} href={`/article/${result.slug}`}>
              <div
                className="block px-4 py-3 hover-elevate rounded-md cursor-pointer"
                onClick={() => onOpenChange(false)}
                data-testid={`search-result-${result.slug}`}
              >
                <h3 className="font-semibold mb-1">{result.title}</h3>
                {result.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {result.excerpt}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(result.date).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
