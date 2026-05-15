// Sample article data — match prototype's data.jsx
// Replace with real markdown/MDX fetching when wiring real content.

export type Article = {
  slug: string;
  category: Category;
  title: string;
  date: string;       // ISO YYYY-MM-DD
  excerpt: string;
  tags: string[];
  readTime: number;
  series?: string;
  seriesOrder?: number;
};

export type Category =
  | "Cloud" | "Java" | "Go" | "Database" | "AI"
  | "Spring" | "Python" | "Git" | "DevOps" | "Mac";

export const ARTICLES: Article[] = [
  {
    slug: "claude-code-superpowers-가이드",
    category: "AI",
    title: "Claude Code Superpowers 완벽 가이드",
    date: "2026-04-21",
    excerpt: "Claude Code의 superpowers 기능을 활용해 반복 작업을 자동화하고 워크플로우를 한 단계 끌어올리는 실전 가이드.",
    tags: ["claude-code", "ai", "productivity"],
    readTime: 12,
  },
  {
    slug: "terraform-완벽-가이드",
    category: "Cloud",
    title: "Terraform 완벽 가이드 — 기본 개념부터 GitOps 실전까지",
    date: "2026-04-08",
    excerpt: "Infrastructure as Code의 표준이 된 Terraform을 처음부터 운영 환경 GitOps까지 단계별로 정리합니다.",
    tags: ["terraform", "iac", "gitops", "cloud"],
    readTime: 22,
  },
  {
    slug: "golang-concurrency-2-channel",
    category: "Go",
    title: "Golang Concurrency 2: Channel 완전 정복",
    date: "2026-03-28",
    excerpt: "버퍼 채널, 단방향 채널, close 시그널까지. 실무에서 자주 마주치는 채널 패턴을 코드로 분해해봅니다.",
    tags: ["go", "concurrency", "channel"],
    readTime: 14,
    series: "Golang Concurrency",
    seriesOrder: 2,
  },
  {
    slug: "mqtt-v5-가이드-1",
    category: "Database",
    title: "MQTT v5 완벽 가이드 1 — 입문과 기본 아키텍처",
    date: "2026-03-15",
    excerpt: "IoT 메시징의 사실상 표준 MQTT v5의 전체 그림. broker, topic, QoS, session까지 한 번에.",
    tags: ["mqtt", "iot", "messaging"],
    readTime: 9,
    series: "MQTT v5",
    seriesOrder: 1,
  },
  {
    slug: "kubernetes-secret-안전하게",
    category: "Cloud",
    title: "Kubernetes 환경에서 Secret 안전하게 관리하기",
    date: "2026-03-02",
    excerpt: "외부에 노출되면 안 되는 자격증명을 Kubernetes에서 관리하는 4가지 패턴 비교.",
    tags: ["kubernetes", "secret", "security"],
    readTime: 11,
  },
  {
    slug: "git-서브모듈이란",
    category: "Git",
    title: "Git 서브모듈이란 — 실전 예제로 배우는 활용법",
    date: "2026-02-18",
    excerpt: "여러 레포를 하나의 워크스페이스로 묶는 Git Submodule. 흔한 실수와 안전한 워크플로우.",
    tags: ["git", "submodule"],
    readTime: 7,
  },
  {
    slug: "jpa-n1-문제",
    category: "Database",
    title: "JPA N+1 문제 해결방법",
    date: "2026-02-04",
    excerpt: "Lazy 로딩이 N번의 추가 쿼리를 발생시키는 그 문제. fetch join, @EntityGraph, batch size까지 비교.",
    tags: ["jpa", "java", "performance"],
    readTime: 8,
  },
  {
    slug: "pypi-업로드-가이드",
    category: "Python",
    title: "PyPI 업로드 가이드 — 나만의 Python 패키지 배포하기",
    date: "2026-01-22",
    excerpt: "pyproject.toml 작성부터 twine으로 업로드, 버전 관리까지.",
    tags: ["python", "pypi", "packaging"],
    readTime: 10,
  },
  {
    slug: "go-pprof-프로파일링",
    category: "Go",
    title: "Go pprof 프로파일링으로 성능 문제 진단하기",
    date: "2026-01-09",
    excerpt: "CPU와 메모리 병목을 찾는 Go의 표준 도구 pprof. 실제 트래픽에서 핫스팟을 찾아내는 방법.",
    tags: ["go", "performance", "profiling"],
    readTime: 13,
  },
];

export const CATEGORIES: { name: Category; count: number }[] = [
  { name: "Cloud", count: 26 },
  { name: "Java", count: 24 },
  { name: "Go", count: 22 },
  { name: "Database", count: 18 },
  { name: "AI", count: 8 },
  { name: "Spring", count: 13 },
  { name: "Python", count: 10 },
  { name: "Git", count: 6 },
  { name: "DevOps", count: 5 },
  { name: "Mac", count: 6 },
];

export const TOTAL_POSTS = 178;

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export function getArticlesByCategory(name: Category): Article[] {
  return ARTICLES.filter((a) => a.category === name);
}

export function getArticlesBySeries(series: string): Article[] {
  return ARTICLES
    .filter((a) => a.series === series)
    .sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0));
}

export function categorySlug(name: Category): string {
  return name.toLowerCase();
}

export function seriesSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export function getAllTags(): { tag: string; count: number }[] {
  const map = new Map<string, number>();
  ARTICLES.forEach((a) =>
    a.tags.forEach((t) => map.set(t, (map.get(t) || 0) + 1)),
  );
  return Array.from(map.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function getArticlesByTag(tag: string): Article[] {
  return ARTICLES.filter((a) => a.tags.includes(tag));
}
