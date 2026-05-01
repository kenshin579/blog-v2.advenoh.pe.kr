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
