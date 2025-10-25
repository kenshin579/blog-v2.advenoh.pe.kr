import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

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
 * contents 폴더를 스캔하여 모든 article 메타데이터 추출
 */
function scanContents(contentsDir: string): ArticleMetadata[] {
  const articles: ArticleMetadata[] = [];
  const categories = fs.readdirSync(contentsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const category of categories) {
    const categoryPath = path.join(contentsDir, category);
    const articleDirs = fs.readdirSync(categoryPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const articleDir of articleDirs) {
      const indexPath = path.join(categoryPath, articleDir, 'index.md');

      if (!fs.existsSync(indexPath)) {
        console.warn(`⚠️  No index.md found in ${category}/${articleDir}`);
        continue;
      }

      try {
        const content = fs.readFileSync(indexPath, 'utf-8');
        const { data } = matter(content);

        // 첫 번째 이미지 추출
        const imageMatch = content.match(/!\[([^\]]*)]\(([^)]+)\)/);
        const firstImage = imageMatch ? imageMatch[2] : undefined;

        const article: ArticleMetadata = {
          slug: `${category}/${articleDir}`,
          category,
          title: data.title || articleDir,
          date: data.date || new Date().toISOString(),
          excerpt: data.excerpt,
          tags: data.tags || [],
          series: data.series,
          seriesOrder: data.seriesOrder,
          firstImage,
        };

        articles.push(article);
      } catch (error) {
        console.error(`❌ Error processing ${category}/${articleDir}:`, error);
      }
    }
  }

  return articles;
}

/**
 * Manifest 생성
 */
function generateManifest(articles: ArticleMetadata[]): Manifest {
  // 날짜순 정렬 (최신순)
  articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 고유 카테고리, 태그, 시리즈 추출
  const categories = [...new Set(articles.map(a => a.category))].sort();
  const tags = [...new Set(articles.flatMap(a => a.tags || []))].sort();
  const series = [...new Set(articles.filter(a => a.series).map(a => a.series!))].sort();

  return {
    articles,
    categories,
    tags,
    series,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * 메인 실행
 */
function main() {
  const contentsDir = path.join(process.cwd(), 'contents');
  const outputPath = path.join(process.cwd(), 'public', 'content-manifest.json');

  console.log('📁 Scanning contents directory...');
  const articles = scanContents(contentsDir);
  console.log(`✅ Found ${articles.length} articles`);

  console.log('📝 Generating manifest...');
  const manifest = generateManifest(articles);

  // public 디렉토리가 없으면 생성
  const publicDir = path.dirname(outputPath);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Manifest 파일 저장
  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`✅ Manifest generated at ${outputPath}`);
  console.log(`📊 Stats:
  - Articles: ${manifest.articles.length}
  - Categories: ${manifest.categories.length}
  - Tags: ${manifest.tags.length}
  - Series: ${manifest.series.length}
  `);
}

main();
