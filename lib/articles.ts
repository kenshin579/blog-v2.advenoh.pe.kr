import fs from 'fs/promises';
import path from 'path';
import { parseMarkdown, type Article, type ArticleFrontmatter } from './markdown';

interface ManifestArticle {
  slug: string;
  category: string;
  lang: 'ko' | 'en';
  title: string;
  date: string;
  excerpt?: string;
  tags?: string[];
  series?: string;
  seriesOrder?: number;
  firstImage?: string;
  readTime?: number;
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

const BIWEEKLY_SERIES_PREFIX = "Frank's IT News";

export function isBiweeklySeries(series?: string | null): boolean {
  return !!series && series.startsWith(BIWEEKLY_SERIES_PREFIX);
}

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
export async function getAllArticles(lang: 'ko' | 'en' = 'ko'): Promise<ManifestArticle[]> {
  const manifest = await loadManifest();
  return manifest.articles.filter(article => article.lang === lang);
}

/**
 * 카테고리별 아티클 가져오기
 */
export async function getArticlesByCategory(category: string, lang: 'ko' | 'en' = 'ko'): Promise<ManifestArticle[]> {
  const manifest = await loadManifest();
  return manifest.articles.filter(a => a.category === category && a.lang === lang);
}

/**
 * 태그별 아티클 가져오기
 */
export async function getArticlesByTag(tag: string, lang: 'ko' | 'en' = 'ko'): Promise<ManifestArticle[]> {
  const manifest = await loadManifest();
  return manifest.articles.filter(a => a.tags?.includes(tag) && a.lang === lang);
}

/**
 * 시리즈별 아티클 가져오기 (시리즈 순서대로 정렬)
 */
export async function getArticlesBySeries(series: string, lang: 'ko' | 'en' = 'ko'): Promise<ManifestArticle[]> {
  const manifest = await loadManifest();
  return manifest.articles
    .filter(a => a.series === series && a.lang === lang)
    .sort((x, y) => (x.seriesOrder || 0) - (y.seriesOrder || 0));
}

/**
 * 특정 아티클 가져오기 (전체 콘텐츠 포함)
 */
export async function getArticle(slug: string, lang: 'ko' | 'en' = 'ko'): Promise<Article | null> {
  const cacheKey = `${lang}:${slug}`;
  if (articleCache.has(cacheKey)) return articleCache.get(cacheKey)!;
  try {
    const fileName = lang === 'en' ? 'index_en.md' : 'index.md';
    const filePath = path.join(process.cwd(), 'contents', slug, fileName);
    const markdown = await fs.readFile(filePath, 'utf-8');
    const article = await parseMarkdown(markdown, slug, lang);
    articleCache.set(cacheKey, article);
    return article;
  } catch (error) {
    console.error(`Failed to load article: ${slug} (${lang})`, error);
    return null;
  }
}

/**
 * 모든 카테고리 가져오기
 */
export async function getAllCategories(lang: 'ko' | 'en' = 'ko'): Promise<string[]> {
  const manifest = await loadManifest();
  return [...new Set(manifest.articles.filter(a => a.lang === lang).map(a => a.category))].sort();
}

/**
 * 모든 태그 가져오기
 */
export async function getAllTags(lang: 'ko' | 'en' = 'ko'): Promise<string[]> {
  const manifest = await loadManifest();
  return [...new Set(manifest.articles.filter(a => a.lang === lang).flatMap(a => a.tags || []))].sort();
}

/**
 * 모든 시리즈 가져오기
 */
export async function getAllSeries(lang: 'ko' | 'en' = 'ko'): Promise<string[]> {
  const manifest = await loadManifest();
  return [...new Set(manifest.articles.filter(a => a.lang === lang && a.series).map(a => a.series!))].sort();
}

/**
 * 관련 아티클 가져오기 (같은 카테고리 or 같은 태그)
 */
export async function getRelatedArticles(slug: string, lang: 'ko' | 'en' = 'ko', limit = 5): Promise<ManifestArticle[]> {
  const manifest = await loadManifest();
  const current = manifest.articles.find(a => a.slug === slug && a.lang === lang);
  if (!current) return [];
  return manifest.articles
    .filter(a => {
      if (a.lang !== lang) return false;
      if (a.slug === slug) return false;
      if (a.category === current.category) return true;
      const common = a.tags?.filter(t => current.tags?.includes(t));
      return common && common.length > 0;
    })
    .slice(0, limit);
}

/**
 * 이전/다음 아티클 가져오기
 */
export async function getAdjacentArticles(slug: string, lang: 'ko' | 'en' = 'ko'): Promise<{ prev: ManifestArticle | null; next: ManifestArticle | null; }> {
  const manifest = await loadManifest();
  const list = manifest.articles.filter(a => a.lang === lang);
  const idx = list.findIndex(a => a.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  return { prev: idx > 0 ? list[idx - 1] : null, next: idx < list.length - 1 ? list[idx + 1] : null };
}

/**
 * Category를 제외한 article title만 추출
 */
export function getArticleTitleFromSlug(fullSlug: string): string {
  const parts = fullSlug.split('/');
  return parts[parts.length - 1];
}

/**
 * Article title로 manifest에서 article 찾기
 */
export async function findArticleByTitle(title: string, lang: 'ko' | 'en' = 'ko'): Promise<ManifestArticle | null> {
  const manifest = await loadManifest();
  const found = manifest.articles.find(a => a.lang === lang && getArticleTitleFromSlug(a.slug) === title);
  return found || null;
}

/**
 * 특정 slug의 article이 해당 언어로 존재하는지 확인
 */
export async function hasArticleVariant(slug: string, lang: 'ko' | 'en'): Promise<boolean> {
  const manifest = await loadManifest();
  return manifest.articles.some(a => a.slug === slug && a.lang === lang);
}

/**
 * Article title로 전체 article 가져오기 (콘텐츠 포함)
 */
export async function getArticleByTitle(title: string, lang: 'ko' | 'en' = 'ko'): Promise<Article | null> {
  const manifestArticle = await findArticleByTitle(title, lang);
  if (!manifestArticle) return null;
  return getArticle(manifestArticle.slug, lang);
}

/**
 * 캐시 클리어
 */
export function clearCache() {
  manifestCache = null;
  articleCache.clear();
}
