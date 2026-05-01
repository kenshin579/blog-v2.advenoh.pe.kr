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
