import fs from 'fs';
import path from 'path';

/**
 * 이미지 파일 확장자
 */
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

/**
 * 파일이 이미지인지 확인
 */
function isImageFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

/**
 * 디렉토리 재귀 탐색하여 이미지 파일 찾기
 */
function findImages(dir: string, baseDir: string, images: Map<string, string>) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      findImages(fullPath, baseDir, images);
    } else if (entry.isFile() && isImageFile(entry.name)) {
      // contents/ 이후의 상대 경로 계산
      const relativePath = path.relative(baseDir, fullPath);
      images.set(relativePath, fullPath);
    }
  }
}

/**
 * 슬라이드 데크 파일명 → public 하위 경로 prefix
 * ko: public/{글폴더}/slides/index.html
 * en: public/en/{글폴더}/slides/index.html
 */
const SLIDE_VARIANTS = [
  { file: 'slides.html', prefix: '' },
  { file: 'slides_en.html', prefix: 'en' },
];

/**
 * contents/{category}/{글폴더}/slides*.html 을 찾아
 * [목적지 상대 경로, 원본 절대 경로] 맵으로 반환한다.
 *
 * 목적지에서 category 를 떼는 규칙은 라우트가 쓰는
 * lib/articles.ts 의 getArticleTitleFromSlug() 와 동일하다.
 * (script 는 단독 node 프로세스이므로 의존성 최소화 위해 inline)
 */
function findSlides(contentsDir: string): Map<string, string> {
  const slides = new Map<string, string>();

  const categories = fs
    .readdirSync(contentsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  for (const category of categories) {
    const categoryPath = path.join(contentsDir, category);
    const articleDirs = fs
      .readdirSync(categoryPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    for (const articleDir of articleDirs) {
      for (const { file, prefix } of SLIDE_VARIANTS) {
        const sourcePath = path.join(categoryPath, articleDir, file);
        if (!fs.existsSync(sourcePath)) continue;

        const destPath = path.join(prefix, articleDir, 'slides', 'index.html');
        slides.set(destPath, sourcePath);
      }
    }
  }

  return slides;
}

/**
 * 자산 맵을 목적지 루트로 복사한다.
 * key = 목적지 루트 기준 상대 경로, value = 원본 절대 경로
 */
function copyFiles(files: Map<string, string>, destRoot: string) {
  let copiedCount = 0;
  let skippedCount = 0;

  for (const [relativePath, sourcePath] of files) {
    const destPath = path.join(destRoot, relativePath);
    const destDir = path.dirname(destPath);

    // 대상 디렉토리 생성
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // 파일이 이미 존재하고 내용이 같으면 스킵
    if (fs.existsSync(destPath)) {
      const sourceStats = fs.statSync(sourcePath);
      const destStats = fs.statSync(destPath);

      if (sourceStats.size === destStats.size &&
          sourceStats.mtimeMs === destStats.mtimeMs) {
        skippedCount++;
        continue;
      }
    }

    // 이미지 복사
    try {
      fs.copyFileSync(sourcePath, destPath);
      // 원본 파일의 mtime 보존
      const stats = fs.statSync(sourcePath);
      fs.utimesSync(destPath, stats.atime, stats.mtime);
      copiedCount++;
    } catch (error) {
      console.error(`❌ Failed to copy ${relativePath}:`, error);
    }
  }

  return { copiedCount, skippedCount };
}

/**
 * 메인 실행
 */
function main() {
  const contentsDir = path.join(process.cwd(), 'contents');
  const publicDir = path.join(process.cwd(), 'public');
  const publicImagesDir = path.join(publicDir, 'images');

  console.log('🔍 Scanning for images in contents/...');
  const images = new Map<string, string>();
  findImages(contentsDir, contentsDir, images);

  console.log(`✅ Found ${images.size} images`);

  if (images.size > 0) {
    console.log('📋 Copying images to public/images/...');
    const { copiedCount, skippedCount } = copyFiles(images, publicImagesDir);

    console.log(`✅ Copy complete!
  - Copied: ${copiedCount} files
  - Skipped: ${skippedCount} files (unchanged)
  - Total: ${images.size} files
  `);
  } else {
    console.log('ℹ️  No images to copy from contents/');
  }

  // 슬라이드 데크 복사 (public/{글폴더}/slides/index.html)
  console.log('\n🔍 Scanning for slides in contents/...');
  const slides = findSlides(contentsDir);
  console.log(`✅ Found ${slides.size} slide decks`);

  if (slides.size > 0) {
    const { copiedCount, skippedCount } = copyFiles(slides, publicDir);
    console.log(`✅ Slides copied: ${copiedCount}, skipped: ${skippedCount}`);
  }

  // Copy default image
  console.log('\n🔍 Copying default image...');
  const defaultImageSource = path.join(
    process.cwd(),
    'attached_assets',
    'generated_images',
    'default.png'
  );
  const defaultImageDestDir = path.join(publicImagesDir, 'default');
  const defaultImageDest = path.join(defaultImageDestDir, 'default.png');

  // Check if source file exists
  if (!fs.existsSync(defaultImageSource)) {
    console.error(`❌ Default image not found: ${defaultImageSource}`);
    return;
  }

  // Create destination directory if it doesn't exist
  if (!fs.existsSync(defaultImageDestDir)) {
    fs.mkdirSync(defaultImageDestDir, { recursive: true });
  }

  // Copy default image
  try {
    fs.copyFileSync(defaultImageSource, defaultImageDest);
    console.log(`✅ Default image copied to ${defaultImageDest}`);
  } catch (error) {
    console.error(`❌ Failed to copy default image:`, error);
  }
}

main();
