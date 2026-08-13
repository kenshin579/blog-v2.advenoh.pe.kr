import fs from 'fs';
import path from 'path';
import { parse } from 'yaml';
import { parseQuiz, type QuizQuestion } from '../lib/quiz';

const CONTENTS_DIR = path.join(process.cwd(), 'contents');

type Level = 'error' | 'warn';

interface Finding {
  code: string;
  level: Level;
  message: string;
}

interface QuizSet {
  file: string;
  index: number;
  /** YAML 최상위가 배열일 때 그 길이. 파싱 실패거나 배열이 아니면 null */
  rawCount: number | null;
  questions: QuizQuestion[];
}

/** 마크다운에서 ```quiz 코드펜스 안의 YAML 원문만 뽑는다 */
function extractQuizBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  const re = /^```quiz[ \t]*\r?\n([\s\S]*?)^```/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(markdown)) !== null) {
    blocks.push(match[1]);
  }
  return blocks;
}

function loadQuizSets(file: string): QuizSet[] {
  const markdown = fs.readFileSync(file, 'utf8');
  return extractQuizBlocks(markdown).map((source, index) => {
    let rawCount: number | null = null;
    try {
      const raw = parse(source);
      if (Array.isArray(raw)) rawCount = raw.length;
    } catch {
      rawCount = null;
    }
    return { file, index, rawCount, questions: parseQuiz(source) };
  });
}

/** E1: YAML이 깨짐 / E2: 파서가 조용히 버리는 문항 */
function checkParse(set: QuizSet): Finding[] {
  if (set.rawCount === null) {
    return [
      {
        code: 'E1',
        level: 'error',
        message: 'YAML 파싱 실패거나 최상위가 배열이 아니다 — 블록 전체가 코드 블록으로 노출된다',
      },
    ];
  }
  if (set.rawCount !== set.questions.length) {
    const dropped = set.rawCount - set.questions.length;
    return [
      {
        code: 'E2',
        level: 'error',
        message: `형식에 맞지 않아 렌더링에서 빠지는 문항이 ${dropped}개 있다 (원본 ${set.rawCount}, 유효 ${set.questions.length})`,
      },
    ];
  }
  return [];
}

function checkSet(set: QuizSet, label: string): Finding[] {
  const findings = checkParse(set);
  return findings.map((f) => ({ ...f, message: `${label} ${f.message}` }));
}

function findArticleFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findArticleFiles(full));
    else if (entry.name === 'index.md') out.push(full);
  }
  return out;
}

/** 인자는 파일 경로, 글 폴더 경로, 또는 contents 기준 slug를 받는다 */
function resolveTargets(arg?: string): string[] {
  if (!arg) return findArticleFiles(CONTENTS_DIR);
  const candidates = [arg, path.join(arg, 'index.md'), path.join(CONTENTS_DIR, arg, 'index.md')];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return [candidate];
  }
  throw new Error(`대상을 찾을 수 없다: ${arg}`);
}

function labelFor(lang: 'ko' | 'en', set: QuizSet, total: number): string {
  return total > 1 ? `[${lang} 세트 ${set.index + 1}]` : `[${lang}]`;
}

function main() {
  let targets: string[];
  try {
    targets = resolveTargets(process.argv[2]);
  } catch (error) {
    console.error(`❌ ${(error as Error).message}`);
    process.exit(1);
  }

  let errorCount = 0;
  let warnCount = 0;
  let checked = 0;

  for (const koFile of targets) {
    const koSets = loadQuizSets(koFile);
    if (koSets.length === 0) continue;
    checked += 1;

    const enFile = koFile.replace(/index\.md$/, 'index_en.md');
    const enSets = fs.existsSync(enFile) ? loadQuizSets(enFile) : null;

    const findings: Finding[] = [];
    for (const set of koSets) findings.push(...checkSet(set, labelFor('ko', set, koSets.length)));
    if (enSets) {
      for (const set of enSets) findings.push(...checkSet(set, labelFor('en', set, enSets.length)));
    }

    const rel = path.relative(process.cwd(), koFile);
    if (findings.length === 0) {
      console.log(`✅ ${rel}`);
    } else {
      console.log(`\n📄 ${rel}${enSets ? ' (+ index_en.md)' : ''}`);
      for (const finding of findings) {
        const mark = finding.level === 'error' ? '✗' : '⚠';
        console.log(`   ${mark} ${finding.code}  ${finding.message}`);
        if (finding.level === 'error') errorCount += 1;
        else warnCount += 1;
      }
    }
  }

  console.log(`\n검사한 글 ${checked}편 · 에러 ${errorCount} · 경고 ${warnCount}`);
  process.exit(errorCount > 0 ? 1 : 0);
}

main();
