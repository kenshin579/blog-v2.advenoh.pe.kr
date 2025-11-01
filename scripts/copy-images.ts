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
 * 이미지를 public/images로 복사
 */
function copyImages(images: Map<string, string>, publicDir: string) {
  let copiedCount = 0;
  let skippedCount = 0;

  for (const [relativePath, sourcePath] of images) {
    const destPath = path.join(publicDir, relativePath);
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
  const publicImagesDir = path.join(process.cwd(), 'public', 'images');

  console.log('🔍 Scanning for images in contents/...');
  const images = new Map<string, string>();
  findImages(contentsDir, contentsDir, images);

  console.log(`✅ Found ${images.size} images`);

  if (images.size > 0) {
    console.log('📋 Copying images to public/images/...');
    const { copiedCount, skippedCount } = copyImages(images, publicImagesDir);

    console.log(`✅ Copy complete!
  - Copied: ${copiedCount} files
  - Skipped: ${skippedCount} files (unchanged)
  - Total: ${images.size} files
  `);
  } else {
    console.log('ℹ️  No images to copy from contents/');
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
