import fs from 'fs';
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

/**
 * RSS 2.0 피드 생성
 */
export function generateRSS(manifestPath: string, outputPath: string): void {
  console.log('📡 Generating RSS feed...');

  // Manifest 로드
  if (!fs.existsSync(manifestPath)) {
    console.error(`❌ Manifest not found at ${manifestPath}`);
    return;
  }

  const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  // 최신 article 20개 (이미 날짜순 정렬되어 있음)
  const recentArticles = manifest.articles.slice(0, 20);

  // RSS XML 생성
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('rss', {
      version: '2.0',
      'xmlns:atom': 'http://www.w3.org/2005/Atom',
    });

  const channel = root.ele('channel');

  // 채널 정보
  channel.ele('title').txt(blogConfig.title);
  channel.ele('link').txt(blogConfig.baseUrl);
  channel.ele('description').txt(blogConfig.description);
  channel.ele('language').txt(blogConfig.language);
  channel.ele('lastBuildDate').txt(new Date().toUTCString());
  channel.ele('atom:link', {
    href: `${blogConfig.baseUrl}/rss.xml`,
    rel: 'self',
    type: 'application/rss+xml',
  });

  // Article 아이템 추가
  for (const article of recentArticles) {
    const item = channel.ele('item');

    item.ele('title').txt(article.title);
    item.ele('link').txt(`${blogConfig.baseUrl}/${article.slug.split('/').pop()}`);
    item.ele('guid', { isPermaLink: 'true' }).txt(`${blogConfig.baseUrl}/${article.slug.split('/').pop()}`);
    item.ele('pubDate').txt(new Date(article.date).toUTCString());

    // Excerpt를 description으로 사용 (HTML escape 처리)
    if (article.excerpt) {
      item.ele('description').txt(escapeHtml(article.excerpt));
    }

    // 카테고리 (category 태그)
    if (article.category) {
      item.ele('category').txt(article.category);
    }

    // 태그 (category 태그로 추가)
    if (article.tags && article.tags.length > 0) {
      for (const tag of article.tags) {
        item.ele('category').txt(tag);
      }
    }

    // 시리즈 정보 (category 태그로 추가)
    if (article.series) {
      item.ele('category').txt(`Series: ${article.series}`);
    }

    // 작성자 정보
    if (blogConfig.email) {
      item.ele('author').txt(`${blogConfig.email} (${blogConfig.author})`);
    }
  }

  // XML 파일 저장
  const xml = root.end({ prettyPrint: true });
  fs.writeFileSync(outputPath, xml, 'utf-8');

  console.log(`✅ RSS feed generated at ${outputPath}`);
  console.log(`📊 Total items: ${recentArticles.length} (latest 20 articles)`);
}

/**
 * HTML 특수 문자 이스케이프
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
