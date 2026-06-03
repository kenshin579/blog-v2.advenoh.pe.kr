import path from 'path';
import { generateRSS } from './generators/rss';

/**
 * RSS 피드를 생성하는 메인 스크립트
 */
async function main() {
  const manifestPath = path.join(process.cwd(), 'public', 'content-manifest.json');
  const rssOutput = path.join(process.cwd(), 'public', 'rss.xml');

  console.log('🚀 Starting feed generation...\n');

  // RSS 피드 생성
  await generateRSS(manifestPath, rssOutput);
  console.log('');

  console.log('✅ Feed generation completed!');
}

main();
