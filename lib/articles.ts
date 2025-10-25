import fs from 'fs/promises';
import path from 'path';
import { parseMarkdown, type Article, type ArticleFrontmatter } from './markdown';

interface ManifestArticle {
  slug: string;
  category: string;
  title: string;
  date: string;
  excerpt?: string;
  tags?: string[];
  series?: string;
  seriesOrder?: number;
  firstImage?: string;
}

interface Manifest {
  articles: ManifestArticle[];
  categories: string[];
  tags: string[];
  series: string[];
  generatedAt: string;
}

let manifestCache: Manifest | null = null;
const articleCache = new Map<string, Article>();

/**
 * Manifest 로드 (캐싱)
 */
async function loadManifest(): Promise<Manifest> {
  if (manifestCache) {
    return manifestCache;
  }

  const manifestPath = path.join(process.cwd(), 'public', 'content-manifest.json');
  const content = await fs.readFile(manifestPath, 'utf-8');
  manifestCache = JSON.parse(content);
  return manifestCache!;
}

/**
 * 모든 아티클 메타데이터 가져오기
 */
export async function getAllArticles(): Promise<ManifestArticle[]> {
  const manifest = await loadManifest();
  return manifest.articles;
}

/**
 * 카테고리별 아티클 가져오기
 */
export async function getArticlesByCategory(category: string): Promise<ManifestArticle[]> {
  const manifest = await loadManifest();
  return manifest.articles.filter(article => article.category === category);
}

/**
 * 태그별 아티클 가져오기
 */
export async function getArticlesByTag(tag: string): Promise<ManifestArticle[]> {
  const manifest = await loadManifest();
  return manifest.articles.filter(article => article.tags?.includes(tag));
}

/**
 * 시리즈별 아티클 가져오기 (시리즈 순서대로 정렬)
 */
export async function getArticlesBySeries(series: string): Promise<ManifestArticle[]> {
  const manifest = await loadManifest();
  return manifest.articles
    .filter(article => article.series === series)
    .sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0));
}

/**
 * 특정 아티클 가져오기 (전체 콘텐츠 포함)
 */
export async function getArticle(slug: string): Promise<Article | null> {
  // 캐시 확인
  if (articleCache.has(slug)) {
    return articleCache.get(slug)!;
  }

  try {
    // contents/{category}/{article-dir}/index.md 경로
    const filePath = path.join(process.cwd(), 'contents', slug, 'index.md');
    const markdown = await fs.readFile(filePath, 'utf-8');

    // Markdown 파싱
    const article = await parseMarkdown(markdown, slug);

    // 캐시 저장
    articleCache.set(slug, article);

    return article;
  } catch (error) {
    console.error(`Failed to load article: ${slug}`, error);
    return null;
  }
}

/**
 * 모든 카테고리 가져오기
 */
export async function getAllCategories(): Promise<string[]> {
  const manifest = await loadManifest();
  return manifest.categories;
}

/**
 * 모든 태그 가져오기
 */
export async function getAllTags(): Promise<string[]> {
  const manifest = await loadManifest();
  return manifest.tags;
}

/**
 * 모든 시리즈 가져오기
 */
export async function getAllSeries(): Promise<string[]> {
  const manifest = await loadManifest();
  return manifest.series;
}

/**
 * 관련 아티클 가져오기 (같은 카테고리 or 같은 태그)
 */
export async function getRelatedArticles(
  slug: string,
  limit: number = 5
): Promise<ManifestArticle[]> {
  const manifest = await loadManifest();
  const currentArticle = manifest.articles.find(a => a.slug === slug);

  if (!currentArticle) {
    return [];
  }

  // 같은 카테고리 또는 태그가 겹치는 아티클
  const related = manifest.articles
    .filter(article => {
      if (article.slug === slug) return false;

      // 같은 카테고리
      if (article.category === currentArticle.category) return true;

      // 태그 겹침
      const commonTags = article.tags?.filter(tag =>
        currentArticle.tags?.includes(tag)
      );
      return commonTags && commonTags.length > 0;
    })
    .slice(0, limit);

  return related;
}

/**
 * 이전/다음 아티클 가져오기
 */
export async function getAdjacentArticles(slug: string): Promise<{
  prev: ManifestArticle | null;
  next: ManifestArticle | null;
}> {
  const manifest = await loadManifest();
  const currentIndex = manifest.articles.findIndex(a => a.slug === slug);

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: currentIndex > 0 ? manifest.articles[currentIndex - 1] : null,
    next: currentIndex < manifest.articles.length - 1 ? manifest.articles[currentIndex + 1] : null,
  };
}

/**
 * 캐시 클리어
 */
export function clearCache() {
  manifestCache = null;
  articleCache.clear();
}
