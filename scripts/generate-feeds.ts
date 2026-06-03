import fs from 'fs';
import path from 'path';
import { generateRSS } from './generators/rss';

/**
 * RSS 피드를 생성하는 메인 스크립트
 */
async function main() {
  const manifestPath = path.join(process.cwd(), 'public', 'content-manifest.json');

  console.log('🚀 Starting feed generation...\n');

  // 언어별 RSS 피드 생성
  const rssKoOutput = path.join(process.cwd(), 'public', 'rss.xml');
  const rssEnDir = path.join(process.cwd(), 'public', 'en');
  const rssEnOutput = path.join(rssEnDir, 'rss.xml');
  if (!fs.existsSync(rssEnDir)) fs.mkdirSync(rssEnDir, { recursive: true });
  await generateRSS(manifestPath, rssKoOutput, 'ko');
  await generateRSS(manifestPath, rssEnOutput, 'en');
  console.log('');

  console.log('✅ Feed generation completed!');
}

main();
