import fs from 'fs';
import path from 'path';
import { create } from 'xmlbuilder2';
import { blogConfig } from '../config';

interface ArticleMetadata {
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
  articles: ArticleMetadata[];
  categories: string[];
  tags: string[];
  series: string[];
  generatedAt: string;
}

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Sitemap XML 생성
 */
export function generateSitemap(manifestPath: string, outputPath: string): void {
  console.log('📍 Generating sitemap.xml...');

  // Manifest 로드
  if (!fs.existsSync(manifestPath)) {
    console.error(`❌ Manifest not found at ${manifestPath}`);
    return;
  }

  const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const urls: SitemapUrl[] = [];

  // 정적 페이지 추가
  urls.push({
    loc: blogConfig.baseUrl,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'daily',
    priority: 1.0,
  });

  urls.push({
    loc: `${blogConfig.baseUrl}/series`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.9,
  });

  // Article 페이지 추가
  for (const article of manifest.articles) {
    urls.push({
      loc: `${blogConfig.baseUrl}/article/${article.slug}`,
      lastmod: article.date.split('T')[0], // ISO 날짜에서 날짜 부분만 추출
      changefreq: 'monthly',
      priority: 0.8,
    });
  }

  // XML 생성
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('urlset', {
      xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9',
    });

  for (const url of urls) {
    const urlElement = root.ele('url');
    urlElement.ele('loc').txt(url.loc);
    if (url.lastmod) {
      urlElement.ele('lastmod').txt(url.lastmod);
    }
    if (url.changefreq) {
      urlElement.ele('changefreq').txt(url.changefreq);
    }
    if (url.priority !== undefined) {
      urlElement.ele('priority').txt(url.priority.toFixed(1));
    }
  }

  // XML 파일 저장
  const xml = root.end({ prettyPrint: true });
  fs.writeFileSync(outputPath, xml, 'utf-8');

  console.log(`✅ Sitemap generated at ${outputPath}`);
  console.log(`📊 Total URLs: ${urls.length} (${manifest.articles.length} articles + 2 static pages)`);
}
