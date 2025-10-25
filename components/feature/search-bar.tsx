"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchBarProps {
  onSearchClick?: () => void;
}

export function SearchBar({ onSearchClick }: SearchBarProps) {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="기술 블로그 글 검색... (⌘K)"
        className="pl-10 w-full transition-shadow duration-200 focus-visible:shadow-md"
        onClick={onSearchClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSearchClick?.();
          }
        }}
        readOnly
        role="button"
        aria-label="검색 모달 열기"
        aria-haspopup="dialog"
      />
    </div>
  );
}
