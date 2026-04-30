---
title: "Claude Code Superpowers 완벽 가이드: brainstorm부터 PR까지"
description: "Claude Code의 superpowers plugin을 사용해 Todo 웹앱을 처음부터 PR까지 만들어본 풀 사이클 가이드. brainstorming, writing-plans, subagent-driven-development, MCP playwright e2e까지 실제 흐름과 후기."
date: 2026-05-01
update: 2026-05-01
tags:
  - Claude Code
  - Superpowers
  - AI
  - Skill
  - Plugin
  - Subagent
  - MCP
  - Playwright
  - AI코딩도구
  - 워크플로우자동화
  - TDD
  - 코드리뷰
  - Anthropic
series: "Claude Code 완벽 가이드"
---

# 1. 개요

Claude Code로 코드를 작성하다 보면 한 가지 답답함이 있다. 처음엔 깔끔하게 시작했는데 어느 순간 컨텍스트가 산만해지고, 어디까지 했는지 헷갈리고, 테스트는 어디서 끊고 다시 시작해야 할지 모호해진다. AI에게 자율성을 주면 즉흥적이 되고, 통제하려 하면 사람이 일일이 끼어들어야 한다.

**Superpowers는 이 흐름을 구조화하는 plugin이다.** brainstorm으로 아이디어를 spec으로 정리하고, writing-plans로 작업 단위 plan으로 분해하고, subagent-driven-development로 phase별 구현 + 자동 리뷰를 거치고, requesting-code-review로 마무리 점검하고, finishing-a-development-branch로 PR/cleanup까지 — 이 5단계가 하나의 완결된 워크플로우로 묶여 있다.

이 글에서는 superpowers 핵심 skill을 한 번에 정리하고, 실제로 Echo + React 기반 Todo 웹앱을 처음부터 PR/머지까지 진행한 사례를 단계별로 따라가본다. 마지막에는 직접 써보고 느낀 솔직한 후기 섹션도 별도로 두어, 도입을 고민하는 동료가 비용 vs 가치를 판단할 수 있게 한다.

> 본 글은 Claude Code 자체와 Skill/Plugin 개념에 어느 정도 익숙한 독자를 가정한다. 처음 듣는 개념이 있다면 [Claude Code 확장 기능 완벽 가이드: Command, Skill, Subagent](/articles/claude-code-확장-기능-완벽-가이드-command-skill-subagent), [Claude Code Plugin Hooks 완벽 가이드](/articles/claude-code-plugin-hooks-완벽-가이드)를 먼저 읽으면 도움이 된다.

# 2. Superpowers란

Superpowers는 [Anthropic이 운영하는 Claude Code plugin marketplace](https://www.anthropic.com/engineering/claude-code-plugins)에 공식 등록된 plugin이다. 단일 기능을 제공하는 보통의 plugin과 달리, **여러 skill의 묶음 + skill끼리 정해진 순서로 호출되는 워크플로우**를 함께 제공한다는 게 특징이다.

## 2.1 Plugin과의 위치 관계

Claude Code의 확장 메커니즘은 크게 세 층으로 나뉜다.

| 층위 | 무엇 | 예시 |
|---|---|---|
| Command | 슬래시로 호출하는 단발 명령 | `/init`, `/fast`, 사용자 정의 `/k:pr-merge` |
| Skill | 특정 상황을 감지해 자동/수동 호출되는 지침 모음 | brainstorming, writing-plans (superpowers 내부의 skill들) |
| Plugin | 위 둘 + 훅 + 자원을 묶은 패키지, marketplace로 배포 | superpowers 자체 |

자세한 차이는 [Claude Code 확장 기능 완벽 가이드](/articles/claude-code-확장-기능-완벽-가이드-command-skill-subagent)에 정리되어 있다.

Superpowers는 이 중 plugin 층에 해당하며, 안에 brainstorming/writing-plans 등 여러 skill이 들어 있다. plugin marketplace를 처음 본다면 [Plugin Hooks 완벽 가이드](/articles/claude-code-plugin-hooks-완벽-가이드)를 참고하자.

## 2.2 다른 Skill 가이드와의 차이

기존 [Skill 가이드](/articles/claude-code-확장-기능-완벽-가이드-command-skill-subagent)가 "각 skill이 무엇이고 언제 호출되는가"를 설명한다면, 본 글은 한 단계 위에서 **여러 skill이 어떤 순서로 엮여 한 사이클을 이루는가**를 다룬다. 즉:

- Skill 가이드: 개별 skill 카탈로그
- Superpowers 가이드 (본 글): 사이클 + 실전 사례 + 후기

## 2.3 왜 이 흐름이 필요한가

AI에게 코드를 시키는 방식은 두 극단 사이에서 흔들린다.

- **자율성 강조**: "todo 앱 만들어줘" → 빠르지만 결과를 통제하기 어렵고, 중간 단계 의사결정이 보이지 않음
- **세부 통제**: 매 단계 사람이 끼어듦 → 안정적이지만 AI를 쓰는 의미가 줄어듦

Superpowers는 그 사이의 균형점을 강제한다. 사람이 결정해야 하는 지점(brainstorm 질문 답변, spec 검토, plan 검토, 머지 승인)은 명시적으로 사람에게 묻고, 그 사이의 기계적 작업(코드 작성, 테스트 실행, 리뷰 디스패치)은 AI가 일관된 패턴으로 처리한다.
