import { MetadataRoute } from 'next';
import { getAllArticles } from '@/lib/articles';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = 'https://advenoh.pe.kr';
  const articles = await getAllArticles();

  // Article URLs
  const articleUrls = articles.map((article) => ({
    url: `${siteUrl}/article/${article.slug}`,
    lastModified: new Date(article.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Static pages
  const staticPages = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${siteUrl}/series`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ];

  return [...staticPages, ...articleUrls];
}
