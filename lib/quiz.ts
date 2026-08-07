import { parse } from 'yaml';

/** 객관식. answer는 0부터 세는 정답 인덱스 */
export interface McqQuestion {
  type: 'mcq';
  q: string;
  choices: string[];
  answer: number;
  explain: string;
}

/** OX. answer가 true면 O가 정답 */
export interface OxQuestion {
  type: 'ox';
  q: string;
  answer: boolean;
  explain: string;
}

/** 코드 결과 맞히기. mcq에 코드 블록이 붙은 형태 */
export interface CodeQuestion {
  type: 'code';
  q: string;
  lang: string;
  code: string;
  choices: string[];
  answer: number;
  explain: string;
}

/** 빈칸 채우기. q의 빈칸은 ___(밑줄 3개). answer는 허용 답 배열 */
export interface BlankQuestion {
  type: 'blank';
  q: string;
  answer: string[];
  explain: string;
}

export type QuizQuestion = McqQuestion | OxQuestion | CodeQuestion | BlankQuestion;

/** blank 답 비교용 정규화: 앞뒤 공백 제거 + 소문자화 */
export function normalizeBlankAnswer(value: string): string {
  return value.trim().toLowerCase();
}

/** blank 입력이 허용 답 중 하나와 일치하는가 */
export function isBlankCorrect(input: string, accepted: string[]): boolean {
  const normalized = normalizeBlankAnswer(input);
  return accepted.some((a) => normalizeBlankAnswer(a) === normalized);
}

function isValidQuestion(item: unknown): item is QuizQuestion {
  if (typeof item !== 'object' || item === null) return false;
  const it = item as Record<string, unknown>;
  if (typeof it.q !== 'string' || !it.q) return false;
  if (typeof it.explain !== 'string' || !it.explain) return false;

  switch (it.type) {
    case 'mcq':
      return (
        Array.isArray(it.choices) &&
        it.choices.length >= 2 &&
        it.choices.every((c) => typeof c === 'string') &&
        typeof it.answer === 'number' &&
        Number.isInteger(it.answer) &&
        it.answer >= 0 &&
        it.answer < it.choices.length
      );
    case 'ox':
      return typeof it.answer === 'boolean';
    case 'code':
      return (
        typeof it.lang === 'string' &&
        typeof it.code === 'string' &&
        Array.isArray(it.choices) &&
        it.choices.length >= 2 &&
        it.choices.every((c) => typeof c === 'string') &&
        typeof it.answer === 'number' &&
        Number.isInteger(it.answer) &&
        it.answer >= 0 &&
        it.answer < it.choices.length
      );
    case 'blank':
      return (
        Array.isArray(it.answer) &&
        it.answer.length >= 1 &&
        it.answer.every((a) => typeof a === 'string')
      );
    default:
      return false;
  }
}

/**
 * quiz 코드펜스의 YAML 소스를 문항 배열로 파싱한다.
 * YAML 전체가 깨졌으면 빈 배열을 반환한다(호출부가 원래 코드 블록을 유지).
 * 개별 문항이 깨졌으면 그 문항만 건너뛰고 콘솔 경고를 남긴다.
 */
export function parseQuiz(source: string): QuizQuestion[] {
  let raw: unknown;
  try {
    raw = parse(source);
  } catch (error) {
    console.warn('퀴즈 YAML 파싱 실패:', error);
    return [];
  }
  if (!Array.isArray(raw)) {
    console.warn('퀴즈 YAML이 배열이 아니다:', typeof raw);
    return [];
  }
  const valid: QuizQuestion[] = [];
  raw.forEach((item, index) => {
    if (isValidQuestion(item)) {
      valid.push(item);
    } else {
      console.warn(`퀴즈 ${index + 1}번 문항이 형식에 맞지 않아 건너뛴다:`, item);
    }
  });
  return valid;
}
