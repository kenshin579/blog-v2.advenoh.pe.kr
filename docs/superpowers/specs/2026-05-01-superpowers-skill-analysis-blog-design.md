# Superpowers Skill 해부 블로그 — Design Spec

- 작성일: 2026-05-01
- 드래프트 위치: `blog-v2.advenoh.pe.kr/docs/start/claude-code-superpowers-skill-해부/index.md`
- 최종 발행 위치: `blog-v2.advenoh.pe.kr/contents/ai/claude-code-superpowers-skill-해부/index.md`
- 발행 워크플로우: `docs/start/` (드래프트) → PR 머지 → `docs/merge_ready/` → 발행 시 `contents/ai/`로 이동
- 앵글: 구조 해부형 (메타프롬프팅 패턴 분석)
- 분석 대상: Superpowers 4개 skill (brainstorming, writing-plans, executing-plans, verification-before-completion)
- 분석 방식: 4개 skill을 워크플로우 순서로 훑은 뒤, 5가지 핵심 메타프롬프팅 패턴을 추출
- 시리즈 컨텍스트: 같은 날짜(2026-05-01) 발행된 `claude-code-superpowers-완벽-가이드`("어떻게 쓰는가" 사용 가이드)의 심화 후속편. 같은 `series: "Claude Code 완벽 가이드"`로 편입.

---

## 1. 메타 정보

### 제목
**Claude Code Superpowers Skill 해부: 메타프롬프팅이 어떻게 워크플로우가 되는가**

(frontmatter title과 동일 형태 유지 — 콜론 구분자)

### 카테고리/위치
- 카테고리: AI (디렉토리 구조로 결정 — frontmatter에 `category` 키 사용 금지)
- 슬러그: `claude-code-superpowers-skill-해부`
- 드래프트: `docs/start/claude-code-superpowers-skill-해부/index.md`
- 최종 발행: `contents/ai/claude-code-superpowers-skill-해부/index.md`
- 시리즈: `Claude Code 완벽 가이드` (기존 시리즈 편입)
- 시리즈 위치: 같은 날 발행된 `claude-code-superpowers-완벽-가이드`(사용 가이드) → 본 글(내부 구조 해부) 순으로 cross-link

### 타겟 독자
- 이미 Claude Code를 쓰고 있고 skill/subagent 개념은 알고 있는 개발자
- 자기 skill을 만들어보려는 사람
- 프롬프트 엔지니어링이 어떻게 "엔지니어링"이 되는지 궁금한 사람

### 톤/스타일
- 분석적 (소개글 X, 해부글 O)
- 실제 skill 파일 코드 블록을 많이 인용 — "텍스트 증거" 비중을 높여 구조 해부형 앵글 강화
- 길이: 약 5,500자 (한 호흡에 읽히는 분량)

### 핵심 메시지(thesis)
> Superpowers는 LLM에게 "뭘 해라"가 아니라 "어떻게 자기-합리화를 막을지"를 코드 레벨로 명시한 시스템이다. 5가지 반복되는 메타프롬프팅 패턴이 워크플로우를 강제로 결정적으로 만든다.

### Frontmatter (확정)

```yaml
---
title: "Claude Code Superpowers Skill 해부: 메타프롬프팅이 어떻게 워크플로우가 되는가"
description: "Superpowers skill 파일을 직접 열어 5가지 메타프롬프팅 패턴을 추출하고, 각 패턴이 LLM의 어떤 약점을 보완하는지 분석한다."
date: 2026-05-01
update: 2026-05-01
tags:
  - Claude Code
  - Superpowers
  - Skill
  - Plugin
  - 프롬프트엔지니어링
  - 메타프롬프팅
  - AI
  - Anthropic
  - 워크플로우자동화
series: "Claude Code 완벽 가이드"
---
```

`category` 키는 frontmatter에 두지 않는다 — `contents/ai/` 디렉토리로 결정.

---

## 2. 글 구조

```
[도입부]                                           ~400자
  - 후크: "/brainstorming을 누르면 무슨 일이 벌어지는가"
  - 글의 약속: 4개 skill을 직접 열어 5가지 패턴을 추출

[1부] Superpowers 워크플로우 한 바퀴             ~1500자
  - Superpowers 한 줄 소개 + skills/ 디렉토리 구조  (~250자)
  - 4개 skill 압축 소개 (각 ~300자)
    1. brainstorming
    2. writing-plans
    3. executing-plans
    4. verification-before-completion
  - "공통점은 무엇인가"로 2부 연결

[2부] 5가지 메타프롬프팅 패턴 해부               ~3000자 (본편)
  - 각 패턴 구성: 정의(2줄) → 코드 인용(짧게) → 해결하는 LLM 약점(2줄) → 응용 한 줄
  - 패턴 1: HARD-GATE                              (~600자)
  - 패턴 2: Graphviz Flowchart                     (~600자)
  - 패턴 3: Red Flags 테이블                       (~600자)
  - 패턴 4: Frontmatter description trigger        (~600자)
  - 패턴 5: Skill hand-off 명시                    (~600자)

[3부] 보조 패턴 표 하나                           ~200자
  - 표: 패턴 이름 | 한 줄 설명 | 어디에 등장
    · Checklist → TaskCreate 강제 매핑
    · IMPORTANT 어조 계층
    · Self-review + User Review 이중 게이트
    · Anti-pattern 명시
  - 표 아래 한 줄: "이들은 본편 5개의 변주다"

[마무리]                                          ~400자
  - 관통 원리: "What이 아니라 How not to fail을 명시한다"
  - "내 skill에 적용한다면" 5줄 체크리스트
```

총 예상 분량: **약 5,500자**

---

## 3. 5가지 패턴 본편 — 핵심 메시지/인용 매핑

각 패턴은 동일한 4-요소 구조로 작성한다: 정의 → 인용 → LLM 약점 → 응용 포인트.

### 패턴 1: HARD-GATE — 명시적 차단 마커
- **정의**: `<HARD-GATE>...</HARD-GATE>` 태그로 LLM이 특정 행동을 절대 하지 못하게 차단하는 구조 마커.
- **인용**: `brainstorming` 첫 줄의 차단 선언.
  > "Do NOT invoke any implementation skill, write any code, scaffold any project, or take any implementation action until you have presented a design and the user has approved it."
- **LLM 약점**: 시스템 프롬프트의 일반 지시사항은 후속 컨텍스트에 의해 희석됨. 강조 마커로 우선순위를 명시해야 함.
- **응용 포인트**: "이 단계에서 절대 하면 안 되는 것"을 분리된 블록으로 명시하라.

### 패턴 2: Graphviz Flowchart — 의사결정의 결정성 확보
- **정의**: `digraph { ... }` 블록으로 분기점과 종착점을 그래프로 명시.
- **인용**: `brainstorming`의 process flow 그래프, `using-superpowers`의 skill_flow 그래프 (둘 다 `[shape=doublecircle]`로 종착점 표시).
- **LLM 약점**: 자연어 if/then 문장은 모호함. 그래프는 "어떤 입력이 어떤 노드로 가는지"가 격자처럼 명시됨.
- **응용 포인트**: 분기 3개 이상이면 표나 graphviz로 옮겨라. 종착점 표시까지 활용.

### 패턴 3: Red Flags 테이블 — 자기-합리화 패턴화
- **정의**: "이런 생각이 들면 STOP" 헤더의 표. 합리화 문장과 그것이 거짓인 이유를 한 줄씩 매핑.
- **인용**: `using-superpowers`의 12행짜리 Red Flags 표.
  > "This is just a simple question" → "Questions are tasks. Check for skills."
  > "I remember this skill" → "Skills evolve. Read current version."
- **LLM 약점**: LLM은 규칙을 우회하는 합리화 문장을 자연스럽게 생성함. 미리 나열하면 합리화 자체가 함정임을 인식.
- **응용 포인트**: 자기 skill에서 "사용자나 LLM이 자주 빠지는 변명"을 미리 표로 만들어라.

### 패턴 4: Frontmatter description — 자동 트리거 설계
- **정의**: skill 파일 frontmatter의 `description` 한 줄이 skill의 자동 호출 조건이 됨.
- **인용**: `brainstorming`의 description.
  > "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior."
- **LLM 약점**: skill을 언제 호출해야 하는지가 모호하면 호출되지 않음. "before X, when Y, after Z" 같은 트리거 동사가 핵심.
- **응용 포인트**: description은 "무엇을 하는가"가 아니라 "언제 자동으로 활성화되어야 하는가"의 문장으로 써라.

### 패턴 5: Skill hand-off 명시 — 결정적 체이닝
- **정의**: skill 끝에 다음으로 호출할 skill을 단일하게 지정. "do NOT invoke any other skill"로 분기 제거.
- **인용**: `brainstorming` 끝 단락.
  > "The terminal state is invoking writing-plans. Do NOT invoke frontend-design, mcp-builder, or any other implementation skill."
- **LLM 약점**: skill이 끝나면 LLM이 다음 행동을 추론하는데, 추론은 비결정적. 명시적 hand-off는 워크플로우를 결정적 체인으로 만듦.
- **응용 포인트**: skill 끝마다 "다음 skill" 또는 "끝났음" 둘 중 하나를 명시하라.

---

## 4. 도입부와 마무리 — 구체 문장

### 도입부 후크 (~400자)
```
/brainstorming. 한 줄을 입력했을 뿐인데 Claude가 갑자기 다른 사람이 된다.
질문을 한 번에 하나씩만 던지고, 디자인을 섹션별로 나눠 보여주고,
"승인하기 전엔 코드 한 줄도 못 쓴다"고 단호하게 말한다.
이건 model의 능력이 아니라 skill 파일 한 장의 작업이다.

skill의 정체는 markdown 한 장. 그렇다면 그 안에는 무엇이 쓰여 있는가?
이 글은 Superpowers의 4개 skill을 직접 열어, LLM이 자기-합리화로
워크플로우를 무너뜨리지 못하게 만드는 5가지 메타프롬프팅 패턴을 추출한다.
```

### 마무리 메시지 (~400자)

**관통 원리**:
> 5개 패턴은 모두 같은 방향을 가리킨다 — LLM에게 "What"이 아니라 "How not to fail"을 명시하는 것. 일반 프롬프트가 "이렇게 해"라면 skill은 "이런 식으로 우회하지 마"의 모음이다.

**내 skill에 적용한다면 — 5줄 체크리스트**:
1. 절대 하면 안 되는 행동 1개 → HARD-GATE 블록
2. 분기 3개 이상의 흐름 → graphviz 또는 표
3. 사용자/LLM이 빠질 합리화 3가지 → Red Flags 표 한 행씩
4. description은 "언제 자동으로 켜져야 하는가" 문장으로
5. skill 끝마다 다음 skill을 단일하게 지정하거나 "끝"을 명시

---

## 5. 코드 인용 / 이미지 정책

### 코드 인용 형식
- 실제 skill 파일 경로 표시: ``skills/brainstorming/SKILL.md`` (path-only, 줄번호 생략 — 버전 차이로 깨질 수 있음)
- 인용은 4~10줄 내외로 짧게, 핵심 마커가 보이도록
- 설명은 한국어, 인용은 영어 원문 유지 (번역 시 의미 손실)

### 이미지/다이어그램
- 직접 만든 다이어그램 1개: "5가지 패턴이 4개 skill에 어떻게 분포되는지" 매트릭스 표 (markdown table로 충분)
- 자체 다이어그램이 필요한 경우 **Mermaid 형식 강제** (blog-v2 CLAUDE.md 규칙). ASCII art 다이어그램 금지. Mermaid 노드 텍스트에 `<br/>` 등 HTML 태그 사용 금지.
- skill 자체의 graphviz 그래프는 인용 시 그대로 코드 블록으로 보여주는 것이 효과적 — 이는 "원본 패턴의 인용"이지 우리가 그리는 다이어그램이 아니므로 Mermaid 변환 불필요. 단 인용임을 명시.

---

## 6. Out of Scope (명시적으로 다루지 않는 것)

- Superpowers 설치/사용법/실제 풀 사이클 사례 (sister 글 `claude-code-superpowers-완벽-가이드`에서 다룸 → cross-link)
- subagent / hooks / MCP 일반 설명 (기존 `claude-code-확장-기능-완벽-가이드-command-skill-subagent`에서 다룸)
- 다른 skill 시스템(ChatGPT Custom Instructions, Cursor Rules 등)과의 비교 분석
- "왜 이런 설계 철학을 선택했는가"의 평가/비평 (앵글을 구조 해부에 한정했으므로)
- 샘플 코드 작성 (이 글은 분석글이라 외부 저장소 샘플 코드 불필요. 인용은 superpowers 원본 skill 파일에서만)

---

## 7. 다음 단계

이 spec이 사용자 review를 통과하면 `superpowers:writing-plans` skill로 implementation plan을 작성한다. plan은 글 작성 작업을 단계별 chunk로 분할하여, 각 단계에서 어떤 skill 파일을 읽고 어떤 인용을 추출할지를 구체화한다.
