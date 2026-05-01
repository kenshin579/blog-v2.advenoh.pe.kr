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

# 1. 들어가며

`/brainstorming`. 한 줄을 입력했을 뿐인데 Claude가 갑자기 다른 사람이 된다. 질문을 한 번에 하나씩만 던지고, 디자인을 섹션별로 나눠 보여주고, "승인하기 전엔 코드 한 줄도 못 쓴다"고 단호하게 말한다. 이건 model의 능력이 아니라 skill 파일 한 장의 작업이다.

skill의 정체는 markdown 한 장. 그렇다면 그 안에는 무엇이 쓰여 있는가? 이 글은 Superpowers의 4개 skill(`brainstorming`, `writing-plans`, `executing-plans`, `verification-before-completion`)을 직접 열어, LLM이 자기-합리화로 워크플로우를 무너뜨리지 못하게 만드는 5가지 메타프롬프팅 패턴을 추출한다.

> 본 글은 [Claude Code Superpowers 완벽 가이드: brainstorm부터 PR까지](/articles/claude-code-superpowers-완벽-가이드)의 심화 후속편이다. 사용법과 풀 사이클 사례는 사촌 글에서 다루고, 여기서는 skill 파일이 *어떻게 쓰여 있는가*에 집중한다.

# 2. Superpowers 워크플로우 한 바퀴

Superpowers는 [Anthropic Claude Code plugin marketplace](https://www.anthropic.com/engineering/claude-code-plugins)에 등록된 plugin으로, 단일 기능이 아니라 **여러 skill의 묶음 + skill끼리 정해진 순서로 호출되는 워크플로우**를 제공한다. 설치하면 `~/.claude/plugins/cache/superpowers-marketplace/superpowers/<version>/skills/`에 다음과 같은 skill 디렉토리가 생긴다.

```
skills/
├── brainstorming/                    # 아이디어 → spec
├── writing-plans/                    # spec → 실행 plan
├── executing-plans/                  # plan → 코드
├── verification-before-completion/   # "다 됐다"고 말하기 전 게이트
├── using-superpowers/                # 메타-skill (모든 skill의 진입점)
├── test-driven-development/
├── systematic-debugging/
└── ... (총 15개)
```

각 skill은 `SKILL.md` 파일 한 장이 본체다. 본 글에서는 이 중 워크플로우 본축을 이루는 4개 skill을 따라가며, 같은 패턴이 어떻게 반복적으로 나타나는지 본다.

## 2.1 brainstorming — 아이디어를 spec으로

frontmatter 한 줄이 이 skill의 정체다.

> "You MUST use this before any creative work — creating features, building components, adding functionality, or modifying behavior."
> — `skills/brainstorming/SKILL.md`

호출되면 한 번에 한 질문씩 사용자에게 던지면서 의사결정 트리를 따라간다. 끝에는 검증된 spec을 `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`로 저장하고 commit한다. 핵심은 한 마디로 "승인 없이는 코드 한 줄도 못 쓴다"는 강제다.

## 2.2 writing-plans — spec을 실행 가능한 plan으로

spec이 *무엇을 만들지*를 정의한다면, plan은 *어떻게 만들지*를 step 단위로 분해한다. skill의 표현을 그대로 옮기면:

> "Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste."
> — `skills/writing-plans/SKILL.md`

각 task는 2~5분짜리 step으로 쪼개지고, 모든 step에는 정확한 파일 경로/명령어/예상 결과가 들어간다. plan을 읽는 주체가 LLM이든 신입 개발자든 동일하게 따라갈 수 있도록 placeholder를 금지한다.

## 2.3 executing-plans — plan을 코드로

plan을 받아 task 단위로 실행한다. 시작 선언이 명시되어 있다.

> "Announce at start: 'I'm using the executing-plans skill to implement this plan.'"
> — `skills/executing-plans/SKILL.md`

이 한 줄이 의외로 중요하다. LLM이 "지금 어떤 모드로 일하는가"를 출력 첫 줄에 박아두면, 후속 컨텍스트에서 모드 이탈이 줄어든다. subagent 환경이 가능하면 `subagent-driven-development`를 권장하지만, 인라인 실행도 가능한 fallback이다.

## 2.4 verification-before-completion — "다 됐다"고 말하기 전

마지막 게이트다. skill의 시작 선언이 분명하다.

> "Claiming work is complete without verification is dishonesty, not efficiency. **Core principle:** Evidence before claims, always."
> — `skills/verification-before-completion/SKILL.md`

LLM은 "다 됐습니다"라고 자신 있게 말하고서 실제로는 빌드를 안 돌려본 경우가 흔하다. 이 skill은 "이번 메시지에서 검증 명령을 실행하지 않았다면 통과 주장을 할 수 없다"는 Iron Law로 그 함정을 닫는다.

## 2.5 공통점은 무엇인가

4개 skill을 나란히 놓고 보면 공통점이 보인다. 모두 *무엇을 해라*보다 *무엇을 하지 마라*가 더 큰 비중을 차지한다. brainstorming은 "승인 전 코드 작성 금지", writing-plans는 "placeholder 금지", verification은 "검증 없이 완료 주장 금지". skill은 LLM의 *능력 부여*가 아니라 *합리화 차단*에 무게를 둔다.

이걸 가능하게 하는 메타프롬프팅 패턴 5가지를 다음 장에서 하나씩 해부한다.

# 3. 5가지 메타프롬프팅 패턴 해부

여기서부터가 본편이다. 각 패턴은 동일한 4-요소 구조로 본다 — **정의 → 코드 인용 → 해결하는 LLM 약점 → 응용 포인트**.

## 3.1 패턴 1: HARD-GATE — 명시적 차단 마커

`<HARD-GATE>...</HARD-GATE>` 태그로 LLM이 특정 행동을 절대 하지 못하게 차단하는 구조 마커다. `brainstorming` 첫머리에 등장한다.

```text
<HARD-GATE>
Do NOT invoke any implementation skill, write any code, scaffold any project,
or take any implementation action until you have presented a design and the
user has approved it. This applies to EVERY project regardless of perceived
simplicity.
</HARD-GATE>
```
출처: `skills/brainstorming/SKILL.md`

이 마커가 해결하는 LLM 약점은 명료하다. 시스템 프롬프트의 일반 지시사항은 후속 컨텍스트에 의해 점차 희석된다. "심플한 작업이니 그냥 코드 짜자"라는 자기-합리화가 끼어들 여지가 생긴다. HARD-GATE는 그 합리화의 통로 자체를 닫아버린다 — "EVERY project regardless of perceived simplicity"라는 조건절이 결정적이다. 예외 조건을 사전 차단했기 때문에 "이번엔 예외" 논리가 작동하지 않는다.

**응용 포인트**: 자기 skill을 만들 때 "이 단계에서 절대 하면 안 되는 행동" 1개를 고르고, 그것을 본문에 흩어놓지 말고 분리된 블록으로 명시하라. 한 skill에 HARD-GATE는 1~2개로 충분하다 (남발하면 효력이 떨어진다).

## 3.2 패턴 2: Graphviz Flowchart — 의사결정의 결정성 확보

`brainstorming`과 `using-superpowers`는 자연어로 워크플로우를 설명하지 않는다. graphviz `digraph` 블록을 직접 박아넣는다.

```dot
digraph brainstorming {
    "Explore project context" [shape=box];
    "Ask clarifying questions" [shape=box];
    "Propose 2-3 approaches" [shape=box];
    "Present design sections" [shape=box];
    "User approves design?" [shape=diamond];
    "Write design doc" [shape=box];
    "Invoke writing-plans skill" [shape=doublecircle];

    "Explore project context" -> "Ask clarifying questions";
    "Ask clarifying questions" -> "Propose 2-3 approaches";
    "Propose 2-3 approaches" -> "Present design sections";
    "Present design sections" -> "User approves design?";
    "User approves design?" -> "Present design sections" [label="no, revise"];
    "User approves design?" -> "Write design doc" [label="yes"];
    "Write design doc" -> "Invoke writing-plans skill";
}
```
출처: `skills/brainstorming/SKILL.md` (단순화 인용)

해결하는 LLM 약점: 자연어 if/then 문장은 모호하다. "사용자가 동의하지 않으면 다시 물어봐"라는 문장은 "어디로 돌아가야 하는지"가 불명확하다. 그래프는 "어떤 노드에서 어떤 노드로 이동하는가"가 격자처럼 명시된다. 특히 `[shape=doublecircle]`로 표시된 종착점이 강력하다 — "이 노드에 도달하면 끝"이라는 신호가 시각적/구조적으로 동시에 박힌다.

**응용 포인트**: 분기 3개 이상의 흐름이라면 자연어 대신 graphviz나 표로 옮겨라. 종착점은 반드시 별도 모양으로 표시. LLM이 그래프를 "읽는다"기보다 "구조를 따라간다"는 점이 핵심이다.

## 3.3 패턴 3: Red Flags 테이블 — 자기-합리화 패턴화

`using-superpowers`에는 "이런 생각이 들면 STOP" 헤더의 표가 있다. LLM이 skill 호출을 건너뛰려 할 때 만들어낼 *합리화 문장 그 자체*를 미리 나열한다.

| Thought | Reality |
|---|---|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check comes BEFORE clarifying questions. |
| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
| "I remember this skill" | Skills evolve. Read current version. |
| "The skill is overkill" | Simple things become complex. Use it. |
| "I'll just do this one thing first" | Check BEFORE doing anything. |
| "I know what that means" | Knowing the concept ≠ using the skill. Invoke it. |

출처: `skills/using-superpowers/SKILL.md` (12행 중 7행 발췌)

해결하는 LLM 약점: LLM은 규칙을 우회하기 위한 자연스러운 합리화 문장을 잘 생성한다. "이건 간단해서 굳이…", "내가 이미 알고 있어서…" 같은 변명은 사람의 변명과 거의 동일하다. 이 패턴은 그 변명들을 *미리 카탈로그화*해서 보여준다 — 합리화 문장이 입력으로 인지되는 순간, 그것이 함정임이 매칭된다. 사람으로 치면 "이런 생각이 들면 도파민 욕구이지 진짜 욕구가 아니다"라는 자기 인지 트레이닝과 비슷하다.

**응용 포인트**: 자기 skill에서 "사용자나 LLM이 이 skill을 우회할 때 자주 만들어내는 변명 3가지"를 미리 표로 만들어 본문에 박아라. 실제로 그 문장이 입력에 등장할 때 차단 효과가 강하다.

## 3.4 패턴 4: Frontmatter description — 자동 트리거의 설계

skill 파일은 모두 다음과 같은 frontmatter로 시작한다.

```yaml
---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation."
---
```
출처: `skills/brainstorming/SKILL.md`

여기서 `description` 한 줄이 사실상 skill의 *자동 호출 조건문*이다. Claude Code는 사용자 입력을 받을 때 이 description들을 매칭하여 어떤 skill을 활성화할지 결정한다. 그래서 description의 문법이 일반 영어가 아니다 — "Use when X, before Y, after Z" 같은 *트리거 동사*가 핵심이다.

해결하는 LLM 약점: skill을 언제 호출해야 하는지가 모호하면 호출되지 않는다. "이 skill은 디자인을 도와줍니다"라고 쓰면 너무 추상적이라 트리거되지 않는다. 반면 "creating features, building components, adding functionality, or modifying behavior"처럼 *동사 시리즈*로 명시하면 사용자 입력의 동사와 직접 매칭된다. `verification-before-completion`의 description도 같은 패턴이다 — "Use when about to claim work is complete, fixed, or passing".

**응용 포인트**: skill 작성 시 description은 "무엇을 하는가(WHAT)"가 아니라 "언제 자동으로 켜져야 하는가(WHEN)"의 문장으로 써라. 트리거 동사를 3~5개 나열하는 것이 가장 안정적이다.
