"use client";

import { SearchBar } from "./search-bar";
import { CategoryFilter, CategoryInfo } from "./category-filter";

interface FeatureSectionProps {
  onCategorySelect: (category: string | null) => void;
  selectedCategory: string | null;
  categories: CategoryInfo[];
  onSearchClick?: () => void;
}

export function FeatureSection({
  categories,
  selectedCategory,
  onCategorySelect,
  onSearchClick
}: FeatureSectionProps) {
  return (
    <section className="bg-muted/50 border-y border-border py-8 md:py-10 mb-6 md:mb-8">
      <div className="container max-w-4xl mx-auto px-4 space-y-6">
        <p className="text-center text-base md:text-lg text-muted-foreground">
          개발, 클라우드, 데이터베이스 관련 기술 블로그
        </p>
        <SearchBar onSearchClick={onSearchClick} />
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={onCategorySelect}
        />
      </div>
    </section>
  );
}
