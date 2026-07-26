import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

interface ArticleMetadata {
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
  /** slides.html(en: slides_en.html) 파일이 존재하는가. 본문 마커와 무관하다 */
  hasSlides?: boolean;
  /** 데크의 슬라이드 장 수. 0이면 필드를 생략한다 */
  slideCount?: number;
}

/**
 * 읽기 시간 계산 (분). lib/markdown.ts 의 calculateReadingTime 와 동일 로직.
 * Script 는 단독 node 프로세스이므로 의존성 최소화 위해 inline.
 */
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * 데크 HTML에서 슬라이드 장 수를 센다.
 * 슬라이드 한 장은 <div class="holder" data-n="NN"> 하나에 대응한다.
 */
function countSlides(slidesPath: string): number {
  try {
    const html = fs.readFileSync(slidesPath, 'utf-8');
    return (html.match(/data-n="\d+"/g) ?? []).length;
  } catch (error) {
    console.warn(`⚠️  ${slidesPath} 를 읽는 중 오류가 발생해 슬라이드 수를 셀 수 없습니다:`, error);
    return 0;
  }
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
      const dirPath = path.join(categoryPath, articleDir);
      const variants: Array<{ lang: 'ko' | 'en'; file: string }> = [
        { lang: 'ko', file: 'index.md' },
        { lang: 'en', file: 'index_en.md' },
      ];

      const koExists = fs.existsSync(path.join(dirPath, 'index.md'));
      if (!koExists) {
        console.warn(`⚠️  No index.md found in ${category}/${articleDir}`);
      }

      for (const { lang, file } of variants) {
        const indexPath = path.join(dirPath, file);
        if (!fs.existsSync(indexPath)) continue;

        try {
          const raw = fs.readFileSync(indexPath, 'utf-8');
          const { data, content } = matter(raw);

          // 슬라이드 데크와 본문 마커의 짝이 맞는지 검사한다 (경고만, 빌드는 계속)
          const slidesFile = lang === 'en' ? 'slides_en.html' : 'slides.html';
          const hasSlidesFile = fs.existsSync(path.join(dirPath, slidesFile));
          // 코드펜스 안의 마커 예시를 실제 마커로 오탐하지 않도록 코드부터 제거한다.
          // (제거 순서는 scripts/generate-search-index.ts 와 동일)
          const contentWithoutCode = content
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`[^`]+`/g, '');
          const hasSlidesMarker = /<!--\s*slides\s*-->/.test(contentWithoutCode);
          const slideCount = hasSlidesFile
            ? countSlides(path.join(dirPath, slidesFile))
            : 0;

          if (hasSlidesFile && !hasSlidesMarker) {
            console.warn(
              `⚠️  ${category}/${articleDir} (${lang}): ${slidesFile} 는 있는데 본문에 <!-- slides --> 마커가 없습니다`
            );
          }
          if (hasSlidesMarker && !hasSlidesFile) {
            console.warn(
              `⚠️  ${category}/${articleDir} (${lang}): <!-- slides --> 마커는 있는데 ${slidesFile} 가 없습니다`
            );
          }

          const mdImageMatch = raw.match(/!\[([^\]]*)]\(([^)]+)\)/);
          const htmlImageMatch = raw.match(/<img\s[^>]*src=["']([^"']+)["']/);
          const firstImage = mdImageMatch ? mdImageMatch[2] : htmlImageMatch ? htmlImageMatch[1] : undefined;

          articles.push({
            slug: `${category}/${articleDir}`,
            category,
            lang,
            title: data.title || articleDir,
            date: data.date || new Date().toISOString(),
            excerpt: data.description ?? data.excerpt,
            tags: data.tags || [],
            series: data.series,
            seriesOrder: data.seriesOrder,
            firstImage,
            readTime: calculateReadingTime(content),
            hasSlides: hasSlidesFile || undefined,
            slideCount: slideCount || undefined,
          });
        } catch (error) {
          console.error(`❌ Error processing ${category}/${articleDir} (${file}):`, error);
        }
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
