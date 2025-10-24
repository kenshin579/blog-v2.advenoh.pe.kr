import { ArticleCard } from '../ArticleCard';

export default function ArticleCardExample() {
  return (
    <div className="p-8 max-w-sm">
      <ArticleCard
        slug="example-article"
        frontmatter={{
          title: "TypeScript 고급 타입 시스템 완벽 가이드",
          date: "2024-10-20",
          excerpt: "TypeScript의 고급 타입 시스템을 활용하여 더 안전하고 표현력 있는 코드를 작성하는 방법을 알아봅니다.",
          tags: ["TypeScript", "타입시스템", "프로그래밍"],
        }}
        readingTime={5}
      />
    </div>
  );
}
