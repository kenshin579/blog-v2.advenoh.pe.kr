import path from 'path';
import { generateSitemap } from './generators/sitemap';
import { generateRSS } from './generators/rss';

/**
 * Sitemap과 RSS 피드를 생성하는 메인 스크립트
 */
async function main() {
  const manifestPath = path.join(process.cwd(), 'public', 'content-manifest.json');
  const sitemapOutput = path.join(process.cwd(), 'public', 'sitemap.xml');
  const rssOutput = path.join(process.cwd(), 'public', 'rss.xml');

  console.log('🚀 Starting feed generation...\n');

  // Sitemap 생성
  generateSitemap(manifestPath, sitemapOutput);
  console.log('');

  // RSS 피드 생성
  await generateRSS(manifestPath, rssOutput);
  console.log('');

  console.log('✅ Feed generation completed!');
}

main();
