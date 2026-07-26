import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

interface SearchDocument {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  date: string;
}

/**
 * Markdown 파일에서 검색 문서 생성
 */
function createSearchDocument(
  slug: string,
  category: string,
  filePath: string
): SearchDocument | null {
  try {
    const markdown = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(markdown);

    // 마크다운 문법 제거 (간단한 정리)
    const cleanContent = content
      .replace(/```[\s\S]*?```/g, '') // 코드 블록 제거
      .replace(/`[^`]+`/g, '') // 인라인 코드 제거
      .replace(/<!--[\s\S]*?-->/g, '') // HTML 주석 제거 (<!-- slides --> 마커 포함)
      .replace(
        /<\/?(?:a|b|i|u|s|em|strong|small|sup|sub|mark|code|pre|kbd|br|hr|p|div|span|img|figure|figcaption|blockquote|details|summary|iframe|video|audio|source|table|thead|tbody|tfoot|tr|td|th|ul|ol|li|dl|dt|dd|h[1-6])(?:\s[^>]*)?\/?>/gi,
        ''
      ) // HTML 태그 제거 — 태그명 화이트리스트로 판정한다.
        // <[^>]+> 나 <[a-zA-Z]...> 방식은 코드펜스 밖의 List<Comment>, <path> 같은
        // 제네릭·CLI 표기를 태그로 오인해 지운다 (검색 대상 기술 용어가 사라진다).
      .replace(/!\[([^\]]*)]\(([^)]+)\)/g, '') // 이미지 제거
      .replace(/\[([^\]]+)]\(([^)]+)\)/g, '$1') // 링크는 텍스트만
      .replace(/#{1,6}\s+/g, '') // 헤딩 마크 제거
      .replace(/[*_~]/g, '') // 강조 문법 제거
      .replace(/\n{2,}/g, ' ') // 연속 줄바꿈 제거
      .trim();

    return {
      id: slug,
      slug,
      title: data.title || slug,
      excerpt: data.excerpt || '',
      content: cleanContent.slice(0, 5000), // 처음 5000자만
      category,
      tags: data.tags || [],
      date: data.date || new Date().toISOString(),
    };
  } catch (error) {
    console.error(`❌ Error processing ${slug}:`, error);
    return null;
  }
}

/**
 * contents 폴더를 스캔하여 검색 인덱스 생성
 */
function generateSearchIndex(): SearchDocument[] {
  const contentsDir = path.join(process.cwd(), 'contents');
  const documents: SearchDocument[] = [];

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
        continue;
      }

      const slug = `${category}/${articleDir}`;
      const doc = createSearchDocument(slug, category, indexPath);

      if (doc) {
        documents.push(doc);
      }
    }
  }

  return documents;
}

/**
 * 메인 실행
 */
function main() {
  console.log('🔍 Generating search index...');

  const documents = generateSearchIndex();
  console.log(`✅ Processed ${documents.length} documents`);

  // public 디렉토리 확인
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 검색 인덱스 저장
  const outputPath = path.join(publicDir, 'search-index.json');
  fs.writeFileSync(outputPath, JSON.stringify(documents, null, 2), 'utf-8');

  console.log(`✅ Search index saved to ${outputPath}`);
  console.log(`📊 Index size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
}

main();
