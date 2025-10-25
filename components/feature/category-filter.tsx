"use client";

import { Badge } from "@/components/ui/badge";

export interface CategoryInfo {
  name: string;
  count: number;
}

interface CategoryFilterProps {
  categories: CategoryInfo[];
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onCategorySelect
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start">
      <span className="text-sm text-muted-foreground mr-2">카테고리:</span>

      <Badge
        variant={selectedCategory === null ? "default" : "outline"}
        className="cursor-pointer transition-colors"
        onClick={() => onCategorySelect(null)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onCategorySelect(null);
          }
        }}
        tabIndex={0}
        role="button"
        aria-label="전체 카테고리 보기"
        aria-pressed={selectedCategory === null}
      >
        전체
      </Badge>

      {categories.map((category) => (
        <Badge
          key={category.name}
          variant={selectedCategory === category.name ? "default" : "outline"}
          className="cursor-pointer transition-colors"
          onClick={() => onCategorySelect(category.name)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onCategorySelect(category.name);
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`${category.name} 카테고리 필터 (${category.count}개 글)`}
          aria-pressed={selectedCategory === category.name}
        >
          {category.name}
          <span className="ml-1.5 text-xs opacity-70">
            {category.count}
          </span>
        </Badge>
      ))}
    </div>
  );
}
