import { MetadataRoute } from 'next';
import { getAllArticles, getAllSeries, getAllCategories, getArticleTitleFromSlug } from '@/lib/articles';
import { seriesSlug } from '@/lib/url';

export const dynamic = 'force-static';

const SITE_URL = 'https://blog.advenoh.pe.kr';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getAllArticles();
  const seriesNames = await getAllSeries();

  const now = new Date();

  const articleUrls: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${SITE_URL}/${getArticleTitleFromSlug(article.slug)}`,
    lastModified: new Date(article.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const categorySet = new Set<string>();
  for (const a of articles) categorySet.add(a.category.toLowerCase());
  const categoryUrls: MetadataRoute.Sitemap = Array.from(categorySet).map((name) => ({
    url: `${SITE_URL}/category/${encodeURIComponent(name)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const seriesUrls: MetadataRoute.Sitemap = seriesNames.map((name) => ({
    url: `${SITE_URL}/series/${encodeURIComponent(seriesSlug(name))}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const tagSet = new Set<string>();
  for (const a of articles) {
    if (!a.tags) continue;
    for (const t of a.tags) tagSet.add(t);
  }
  const tagUrls: MetadataRoute.Sitemap = Array.from(tagSet).map((tag) => ({
    url: `${SITE_URL}/tags/${encodeURIComponent(tag)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/posts`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/series`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/tags`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // English URLs
  const enArticles = await getAllArticles('en');
  const enCategories = await getAllCategories('en');
  const enSeriesNames = await getAllSeries('en');

  const enArticleUrls: MetadataRoute.Sitemap = enArticles.map((article) => ({
    url: `${SITE_URL}/en/${getArticleTitleFromSlug(article.slug)}`,
    lastModified: new Date(article.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const enCategoryUrls: MetadataRoute.Sitemap = enCategories.map((name) => ({
    url: `${SITE_URL}/en/category/${encodeURIComponent(name.toLowerCase())}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const enSeriesUrls: MetadataRoute.Sitemap = enSeriesNames.map((name) => ({
    url: `${SITE_URL}/en/series/${encodeURIComponent(seriesSlug(name))}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const enTagSet = new Set<string>();
  for (const a of enArticles) {
    if (!a.tags) continue;
    for (const t of a.tags) enTagSet.add(t);
  }
  const enTagUrls: MetadataRoute.Sitemap = Array.from(enTagSet).map((tag) => ({
    url: `${SITE_URL}/en/tags/${encodeURIComponent(tag)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  const enStaticPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/en`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/en/posts`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/en/series`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/en/tags`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  return [
    ...staticPages,
    ...articleUrls,
    ...categoryUrls,
    ...seriesUrls,
    ...tagUrls,
    ...enStaticPages,
    ...enArticleUrls,
    ...enCategoryUrls,
    ...enSeriesUrls,
    ...enTagUrls,
  ];
}
