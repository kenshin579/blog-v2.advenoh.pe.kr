import fs from 'fs';
import path from 'path';
import { parse, stringify } from 'yaml';
import { parseQuiz, normalizeBlankAnswer, type QuizQuestion } from '../lib/quiz';

const CONTENTS_DIR = path.join(process.cwd(), 'contents');

type Level = 'error' | 'warn';

interface Finding {
  code: string;
  level: Level;
  /** 출력 시 message 앞에 붙는 위치 라벨. 예: '[ko]', '[en 세트 2]', '[ko↔en]' */
  where: string;
  message: string;
}

interface QuizSet {
  /** 파일 안에서 몇 번째 quiz 블록인지 (0부터) */
  index: number;
  /** YAML 최상위 배열. 파싱에 실패했거나 배열이 아니면 null */
  rawItems: unknown[] | null;
  /** 파싱은 됐는데 최상위가 배열이 아니었다 */
  notArray: boolean;
  questions: QuizQuestion[];
}

interface ArticleFile {
  lang: 'ko' | 'en';
  file: string;
  sets: QuizSet[];
  /** 여는 ```quiz 펜스 수. sets.length와 다르면 닫는 펜스가 빠진 것이다 */
  fenceOpenings: number;
}

/** 마크다운에서 ```quiz 코드펜스 안의 YAML 원문만 뽑는다 */
function extractQuizBlocks(markdown: string): string[] {
  const re = /^```quiz[ \t]*\r?\n([\s\S]*?)^```/gm;
  const blocks: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(markdown)) !== null) {
    blocks.push(match[1]);
  }
  return blocks;
}

/** 여는 펜스만 센다. 뽑힌 블록 수와 다르면 닫히지 않은 펜스가 있다 */
function countQuizFenceOpenings(markdown: string): number {
  return markdown.match(/^```quiz[ \t]*\r?$/gm)?.length ?? 0;
}

/**
 * 원본 배열 원소를 하나씩 parseQuiz에 통과시켜, 렌더링에서 빠지는 문항 번호(1부터)를 찾는다.
 * lib/quiz.ts의 isValidQuestion이 export되어 있지 않아 이 방식으로 특정한다.
 * parseQuiz가 문항마다 console.warn을 찍으므로 그동안만 막는다.
 */
function droppedQuestionNumbers(rawItems: unknown[]): number[] {
  const dropped: number[] = [];
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    rawItems.forEach((item, i) => {
      if (parseQuiz(stringify([item])).length === 0) dropped.push(i + 1);
    });
  } finally {
    console.warn = originalWarn;
  }
  return dropped;
}

function loadArticleFile(lang: 'ko' | 'en', file: string): ArticleFile {
  const markdown = fs.readFileSync(file, 'utf8');
  const sets = extractQuizBlocks(markdown).map((source, index) => {
    let rawItems: unknown[] | null = null;
    let notArray = false;
    try {
      const raw = parse(source);
      if (Array.isArray(raw)) rawItems = raw;
      else notArray = true;
    } catch {
      // 파싱 실패. rawItems는 null로 둔다
    }
    return { index, rawItems, notArray, questions: parseQuiz(source) };
  });
  return { lang, file, sets, fenceOpenings: countQuizFenceOpenings(markdown) };
}

/** 대상 하나에 대해 검사할 파일 목록을 만든다. index_en.md를 직접 지목하면 영문만 본다 */
function loadArticle(target: string): ArticleFile[] {
  const dir = path.dirname(target);
  const wanted: { lang: 'ko' | 'en'; file: string }[] =
    path.basename(target) === 'index_en.md'
      ? [{ lang: 'en', file: target }]
      : [
          { lang: 'ko', file: target },
          { lang: 'en', file: path.join(dir, 'index_en.md') },
        ];
  return wanted
    .filter(({ file }) => fs.existsSync(file))
    .map(({ lang, file }) => loadArticleFile(lang, file));
}

/** E1: YAML이 깨짐 / E2: 파서가 조용히 버리는 문항 */
function checkParse(set: QuizSet): Finding[] {
  if (set.notArray) {
    return [
      {
        code: 'E1',
        level: 'error',
        where: '',
        message: 'YAML 최상위가 배열이 아니다 — 블록 전체가 코드 블록으로 노출된다',
      },
    ];
  }
  if (set.rawItems === null) {
    return [
      {
        code: 'E1',
        level: 'error',
        where: '',
        message: 'YAML 파싱에 실패했다 — 블록 전체가 코드 블록으로 노출된다',
      },
    ];
  }
  if (set.rawItems.length !== set.questions.length) {
    const numbers = droppedQuestionNumbers(set.rawItems);
    return [
      {
        code: 'E2',
        level: 'error',
        where: '',
        message: `형식에 맞지 않아 렌더링에서 빠지는 문항이 있다: ${numbers.join(', ')}번 (원본 ${set.rawItems.length}, 유효 ${set.questions.length})`,
      },
    ];
  }
  return [];
}

/** 한 문항에서 독자가 문제를 풀기 전에 보게 되는 텍스트를 모은다 */
function questionHaystack(question: QuizQuestion): string {
  const parts: string[] = [question.q];
  if ('choices' in question) parts.push(...question.choices);
  if ('code' in question) parts.push(question.code);
  return normalizeBlankAnswer(parts.join('\n'));
}

/** E3: 빈칸 없음 / E4: 다른 문항에 정답 노출 / E5: 자기 지문에 정답 노출 / E9: 빈 정답 */
function checkBlanks(set: QuizSet): Finding[] {
  const findings: Finding[] = [];
  // 문항마다 haystack을 한 번만 만든다. 자기 것과 비교하면 E5, 남의 것과 비교하면 E4다
  const haystacks = set.questions.map(questionHaystack);

  set.questions.forEach((question, i) => {
    if (question.type !== 'blank') return;
    const num = i + 1;

    if (!question.q.includes('___')) {
      findings.push({
        code: 'E3',
        level: 'error',
        where: '',
        message: `${num}번 blank 문항의 q에 빈칸(___)이 없다`,
      });
    }

    question.answer.forEach((answer) => {
      const needle = normalizeBlankAnswer(answer);
      if (!needle) {
        findings.push({
          code: 'E9',
          level: 'error',
          where: '',
          message: `${num}번 blank 정답이 비어 있다 — 어떤 입력으로도 맞힐 수 없는 문항이다`,
        });
        return;
      }

      if (haystacks[i].includes(needle)) {
        findings.push({
          code: 'E5',
          level: 'error',
          where: '',
          message: `${num}번 blank 정답 "${answer}"이 자기 문항 지문에 그대로 있다`,
        });
      }

      haystacks.forEach((haystack, j) => {
        if (i === j) return;
        if (haystack.includes(needle)) {
          findings.push({
            code: 'E4',
            level: 'error',
            where: '',
            message: `${num}번 blank 정답 "${answer}"이 ${j + 1}번 문항 지문에 노출된다`,
          });
        }
      });
    });
  });

  return findings;
}

/** 세트 하나에 대한 검사를 모은다. 후속 태스크에서 여기에 검사가 더 붙는다 */
function checkSet(set: QuizSet): Finding[] {
  const parseFindings = checkParse(set);
  // 파싱 단계에서 걸린 게 있으면 set.questions의 인덱스가 원본 문항 번호와 어긋난다.
  // 그 상태에서 문항 번호를 찍으면 저자가 없는 위치를 찾게 되므로 여기서 멈춘다
  if (parseFindings.length > 0) return parseFindings;
  return checkBlanks(set);
}

function whereLabel(lang: 'ko' | 'en', setIndex: number, totalSets: number): string {
  return totalSets > 1 ? `[${lang} 세트 ${setIndex + 1}]` : `[${lang}]`;
}

function checkArticleFile(article: ArticleFile): Finding[] {
  const findings: Finding[] = [];

  if (article.fenceOpenings !== article.sets.length) {
    findings.push({
      code: 'E7',
      level: 'error',
      where: `[${article.lang}]`,
      message: `여는 quiz 펜스가 ${article.fenceOpenings}개인데 닫힌 블록은 ${article.sets.length}개다 — 닫는 펜스가 빠졌다`,
    });
  }

  for (const set of article.sets) {
    const where = whereLabel(article.lang, set.index, article.sets.length);
    findings.push(...checkSet(set).map((f) => ({ ...f, where })));
  }

  return findings;
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

function main() {
  const arg = process.argv[2];
  let targets: string[];
  try {
    targets = resolveTargets(arg);
  } catch (error) {
    console.error(`❌ ${(error as Error).message}`);
    process.exit(1);
  }

  let errorCount = 0;
  let warnCount = 0;
  let checked = 0;

  for (const target of targets) {
    const articles = loadArticle(target);
    const hasQuiz = articles.some((a) => a.sets.length > 0 || a.fenceOpenings > 0);
    if (!hasQuiz) continue;
    checked += 1;

    const findings = articles.flatMap(checkArticleFile);
    errorCount += findings.filter((f) => f.level === 'error').length;
    warnCount += findings.filter((f) => f.level === 'warn').length;

    const rel = path.relative(process.cwd(), target);
    const langs = articles.map((a) => a.lang).join('+');
    if (findings.length === 0) {
      console.log(`✅ ${rel} (${langs})`);
    } else {
      console.log(`\n📄 ${rel} (${langs})`);
      for (const finding of findings) {
        const mark = finding.level === 'error' ? '✗' : '⚠';
        console.log(`   ${mark} ${finding.code}  ${finding.where} ${finding.message}`);
      }
    }
  }

  if (arg && checked === 0) {
    console.error(`❌ E8  지정한 대상에 quiz 블록이 없다: ${arg}`);
    process.exit(1);
  }

  console.log(`\n검사한 글 ${checked}편 · 에러 ${errorCount} · 경고 ${warnCount}`);
  process.exit(errorCount > 0 ? 1 : 0);
}

main();
