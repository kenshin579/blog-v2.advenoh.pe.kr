# OpenClaw 완벽 가이드 - 블로그 PRD

## 1. 목표

오픈소스 개인 AI 에이전트 **OpenClaw**를 스터디하고, 아키텍처·설치·스킬 시스템·보안 이슈까지 체계적으로 정리한 실용 가이드 블로그를 작성한다. 직접 설치·운영하면서 얻은 경험을 바탕으로, 읽은 후 바로 자신만의 AI 비서를 구축할 수 있는 글을 목표로 한다.

## 2. 배경

- **OpenClaw**(구 Clawdbot → Moltbot → OpenClaw)는 오스트리아 개발자 Peter Steinberger(PSPDFKit 창립자)가 2025년 11월에 공개한 오픈소스 개인 AI 에이전트이다
- 2026년 1월 말 폭발적으로 성장하여 GitHub Star 180K+ 를 기록하며 역대 가장 빠르게 성장한 오픈소스 프로젝트 중 하나가 되었다
- WhatsApp, Telegram, Slack, Discord, iMessage 등 기존 메시징 앱에서 동작하는 **자율형 AI 비서**로, 셸 명령·브라우저 자동화·이메일·캘린더·파일 작업 등을 대신 수행한다
- Claude Code가 **코딩 전문 에이전트**라면, OpenClaw는 **디지털 생활 전반을 자동화**하는 에이전트로, 상호 보완적으로 사용된다
- 빠른 성장 이면에 보안 이슈(ClawHub 악성 스킬, 프롬프트 인젝션 취약점 등)가 부각되고 있어, 보안 관점의 분석도 함께 다룬다
- 한국어로 OpenClaw의 전체 구조를 체계적으로 정리한 가이드가 부족하다

## 3. 블로그 구성

### 3.1 OpenClaw란 무엇인가?

**다루는 내용:**
- OpenClaw 개요
  - 오픈소스 개인 AI 에이전트 (MIT 라이선스)
  - "Your own personal AI assistant. Any OS. Any Platform. The lobster way. 🦞"
- 탄생 배경과 이름 변천사
  - Clawdbot (2025.11) → Moltbot (2026.01.27, Anthropic 상표 이슈) → OpenClaw (2026.01.30)
  - Peter Steinberger의 개발 동기
- 핵심 철학
  - **프라이버시 퍼스트**: 로컬에서 실행, 민감 데이터가 외부로 나가지 않음
  - **채널 불문**: 이미 사용 중인 메시징 앱에서 동작
  - **자율 에이전트**: 사용자 대신 실제 작업을 수행
- Claude Code, ChatGPT, Cursor 등과의 포지셔닝 비교
  - Claude Code: 터미널 기반 코딩 에이전트
  - OpenClaw: 메시징 기반 생활 자동화 에이전트
  - 두 도구는 경쟁이 아닌 보완 관계

### 3.2 아키텍처 개요

**다루는 내용:**
- Gateway 중심 아키텍처
  ```
  [메시징 앱] ←→ [Gateway (Node.js)] ←→ [AI 모델 (Claude, GPT 등)]
       ↑                ↓
   [사용자]        [도구/스킬/디바이스]
  ```
  - Gateway: 항상 실행되는 메시지 라우터 + 에이전트 런타임
  - 로컬 머신(Mac mini, VPS 등)에서 실행
  - 메시징 앱 → 메시지 수신 → 에이전트 턴(Brain) → 도구 호출 → 응답 전송
- 기술 스택
  - TypeScript (Node ≥ 22)
  - pnpm (빌드), Bun (옵션)
  - 데이터 저장: 로컬 파일시스템 (Markdown + YAML)
- 지원 AI 모델
  - Anthropic Claude (Opus 4.5, Sonnet 4.5, Haiku 4.5)
  - OpenAI, Google Gemini, Groq, Mistral, OpenRouter 등
- 채널(Channel) 시스템
  | 카테고리 | 지원 채널 |
  |---------|----------|
  | **주요 메시징** | WhatsApp, Telegram, Slack, Discord, Signal, iMessage |
  | **협업 도구** | Microsoft Teams, Google Chat |
  | **기타** | Matrix, WebChat, BlueBubbles, Zalo |
  | **음성** | macOS/iOS/Android 음성 입출력 |

### 3.3 설치 및 초기 설정

**다루는 내용:**
- 시스템 요구사항
  - Node.js ≥ 22
  - RAM 2GB+ (권장 4GB)
  - 디스크 10GB+
- 설치 방법 3가지
  1. **npm/pnpm 설치** (권장)
     ```bash
     npm install -g openclaw
     openclaw onboard --install-daemon
     ```
  2. **Docker 설치**
     ```bash
     docker run -d --name openclaw ...
     ```
  3. **소스 빌드**
     ```bash
     git clone https://github.com/openclaw/openclaw.git
     cd openclaw && pnpm install && pnpm build
     ```
- 온보딩 위자드 (Onboarding Wizard)
  - AI Provider 설정 (Anthropic API 키 권장)
  - 기본 설정 구성
  - 메시징 채널 연결 (WhatsApp, Telegram 등)
- 클라우드 배포 옵션
  | 플랫폼 | 특징 |
  |--------|------|
  | **Fly.io** | 자동 HTTPS, 글로벌 리전, 영구 스토리지 |
  | **Coolify** | 셀프호스팅 PaaS, Docker Compose 기반 |
  | **DigitalOcean** | VPS 직접 설치, 완전 제어 |
  | **Hostinger** | 원클릭 설정 가이드 제공 |

### 3.4 핵심 기능 심화

**다루는 내용:**

#### 3.4.1 Memory 시스템 (영속적 기억)

- OpenClaw의 가장 차별화된 기능
- 세션 간 컨텍스트 유지 (Claude Code와의 차이점)
- 데이터 저장 구조
  ```
  ~/.openclaw/
  ├── memory/
  │   └── YYYY-MM-DD.md    # 일별 대화 로그 (append-only)
  ├── MEMORY.md             # 장기 기억 (큐레이션된 정보)
  └── ...
  ```
- 검색 방식: BM25 + 벡터 검색 + 리랭킹 (하이브리드 서치)
- 사용자의 선호도·말투·워크플로우를 학습
- Git으로 백업 가능 (Markdown/YAML 기반)

#### 3.4.2 Heartbeat (프로액티브 에이전트)

- 주기적으로 에이전트가 "깨어나서" 확인할 작업이 있는지 점검
- 기본 주기: 30분 (Anthropic OAuth 사용 시 1시간)
- 사용 사례: 일정 알림, 이메일 요약, 뉴스 브리핑 등
- 스팸 방지를 위한 메인 세션에서만 실행

#### 3.4.3 50+ 통합(Integration)

| 카테고리 | 예시 |
|---------|------|
| **생산성** | Gmail, Google Calendar, Todoist, Notion, Obsidian |
| **개발** | GitHub, 셸 명령, 파일 시스템, Cron Job, Webhook |
| **스마트홈** | Philips Hue, Home Assistant |
| **미디어** | Spotify, Apple Music |
| **건강** | WHOOP |
| **프로젝트 관리** | Trello, Apple Reminders, Things 3 |

#### 3.4.4 Canvas (시각적 인터페이스)

- 모바일(iOS/Android)에서 실시간 Canvas 렌더링
- AI 에이전트와 시각적으로 상호작용

### 3.5 스킬(Skills) 시스템과 ClawHub

**다루는 내용:**

#### 3.5.1 스킬이란?

- OpenClaw에게 특정 작업을 수행하는 방법을 가르치는 확장 단위
- 디렉토리 구조: 프롬프트 텍스트 파일부터 Node.js 모듈까지 다양
- 자기 생성(Self-generation): OpenClaw에게 "~하는 스킬을 만들어줘"라고 요청하면 자동 작성

#### 3.5.2 ClawHub 마켓플레이스

- 공식 스킬 마켓플레이스: 3,000+ 커뮤니티 제작 스킬 (2026년 2월 기준)
- 카테고리: 이메일 관리, 암호화폐, 미디어 제어, 개발 자동화 등
- 스킬 설치 방법
  ```bash
  # 예시
  openclaw skill install <skill-name>
  ```

#### 3.5.3 커스텀 스킬 만들기

- 스킬 디렉토리 구조 및 작성법
- 프롬프트 기반 간단한 스킬 예제
- API 통합이 있는 고급 스킬 예제
- 테스트 및 배포 방법

### 3.6 보안 이슈와 대응

**다루는 내용:**

#### 3.6.1 주요 보안 취약점

- **프롬프트 인젝션 공격**
  - 악성 스킬이 안전 가이드라인 우회 명령을 주입
  - WhatsApp 메시지를 통한 간접 프롬프트 인젝션으로 `.env`, `creds.json` 탈취 가능
- **ClawHub 악성 스킬 사태**
  - 2026년 1월 27일 이후 230+ 악성 스킬이 ClawHub에 업로드됨
  - Snyk 분석: 전체 ~4,000개 스킬 중 283개(7.1%)에서 자격증명 노출 결함 발견
  - "What Would Elon Do?" 스킬: 데이터를 공격자 서버로 전송하는 기능적 멀웨어
- **원격 코드 실행(RCE) 취약점**
  - CVE-2026-25253: 악성 링크 클릭만으로 원격 코드 실행 가능
- **데이터 유출 위험**
  - curl 명령을 통한 무인 데이터 외부 전송
  - 네트워크 호출이 사용자 인지 없이 실행

#### 3.6.2 보안 대응 현황

- VirusTotal 스캔 통합 (완벽하지 않음을 공식 인정)
- Cisco AI Skill Scanner 도구 공개
- ClawHub 악성 스킬 신고 기능 추가
- 커뮤니티 보안 감사 진행 중

#### 3.6.3 안전하게 사용하기 위한 권장사항

- 신뢰할 수 있는 스킬만 설치 (Star 수, 작성자 확인)
- API 키/인증 정보를 환경 변수로 격리
- 샌드박스 환경에서 실행
- 네트워크 모니터링 활성화
- 정기적 보안 업데이트 적용
- `.env`, `creds.json` 등 민감 파일 접근 제한

### 3.7 실전 활용 사례

**다루는 내용:**
- **개발자 워크플로우**: GitHub 이슈 관리, CI/CD 모니터링, 코드 리뷰 알림
- **일상 자동화**: 일정 관리, 이메일 요약, 뉴스 브리핑, 쇼핑 리스트
- **스마트홈**: 조명 제어, 기기 상태 확인, 자동화 룰 설정
- **Claude Code + OpenClaw 조합**: 코딩은 Claude Code, 나머지 생활은 OpenClaw

### 3.8 다른 AI 에이전트와 비교

**다루는 내용:**

| 항목 | OpenClaw | Claude Code | ChatGPT | Cursor |
|------|----------|-------------|---------|--------|
| **유형** | 생활 자동화 에이전트 | 코딩 에이전트 | 대화형 AI | IDE 코파일럿 |
| **실행 환경** | 메시징 앱 | 터미널/IDE | 웹/앱 | IDE |
| **자율 실행** | O (Heartbeat) | △ (사용자 확인) | X | X |
| **영속 메모리** | O | X (세션 한정) | △ | X |
| **로컬 실행** | O (셀프호스팅) | O | X (클라우드) | X (클라우드) |
| **채널 통합** | 50+ | 터미널/IDE | API | IDE |
| **오픈소스** | O (MIT) | X | X | X |

---

## 4. 작업 계획

### 4.1 사전 조사

- [ ] OpenClaw 공식 문서 정독 (https://docs.openclaw.ai)
- [ ] GitHub 레포지토리 분석 (https://github.com/openclaw/openclaw)
- [ ] 로컬 환경에 직접 설치 및 온보딩 테스트
- [ ] WhatsApp 또는 Telegram 채널 연결 테스트
- [ ] ClawHub에서 스킬 설치 및 동작 확인
- [ ] 커스텀 스킬 직접 작성 테스트
- [ ] Heartbeat, Memory 기능 체험
- [ ] 보안 관련 아티클 정독 (Cisco, Snyk, The Register 등)
- [ ] 스크린샷 촬영 (설치 과정, 채널 연결, 스킬 동작, 대시보드)

### 4.2 블로그 콘텐츠 작성

- [ ] 블로그 디렉토리 생성: `contents/ai/openclaw-완벽-가이드/`
- [ ] `index.md` 작성
  - [ ] 3.1 OpenClaw란 무엇인가?
  - [ ] 3.2 아키텍처 개요
  - [ ] 3.3 설치 및 초기 설정
  - [ ] 3.4 핵심 기능 심화
  - [ ] 3.5 스킬 시스템과 ClawHub
  - [ ] 3.6 보안 이슈와 대응
  - [ ] 3.7 실전 활용 사례
  - [ ] 3.8 다른 AI 에이전트와 비교
- [ ] frontmatter 작성 (title, date, excerpt, tags, category)
- [ ] 썸네일 이미지 생성 (NanoBanana MCP 활용)
- [ ] manifest.json에 파일 추가

### 4.3 리뷰 및 배포

- [ ] 콘텐츠 인코딩 확인 (UTF-8)
- [ ] 로컬 개발 서버에서 렌더링 확인
- [ ] feature 브랜치 생성 및 PR 작성

---

## 5. 예상 콘텐츠 분량

| 섹션 | 예상 분량 |
|------|----------|
| 3.1 OpenClaw란 무엇인가? | 800자 |
| 3.2 아키텍처 개요 | 1,000자 + 다이어그램 |
| 3.3 설치 및 초기 설정 | 1,200자 + 코드 |
| 3.4 핵심 기능 심화 | 1,500자 + 표 |
| 3.5 스킬 시스템과 ClawHub | 1,200자 + 코드 |
| 3.6 보안 이슈와 대응 | 1,500자 |
| 3.7 실전 활용 사례 | 800자 |
| 3.8 다른 AI 에이전트와 비교 | 600자 + 표 |
| **총합** | **약 8,600자 + 코드/표/다이어그램** |

> **Note:** 분량에 따라 시리즈 분할 고려
> - (1) OpenClaw 소개 & 아키텍처 & 설치
> - (2) 핵심 기능 & 스킬 시스템 & 활용 사례
> - (3) 보안 이슈 심화 분석

---

## 6. 태그 & 카테고리

- **태그:** `openclaw`, `ai-agent`, `open-source`, `self-hosted`, `personal-ai`, `automation`, `chatbot`, `security`
- **카테고리:** `AI`

## 7. 참고 자료

### 공식 자료
- [OpenClaw 공식 사이트](https://openclaw.ai/)
- [OpenClaw GitHub](https://github.com/openclaw/openclaw)
- [OpenClaw 공식 문서](https://docs.openclaw.ai)
- [ClawHub 스킬 마켓플레이스](https://github.com/openclaw/clawhub)
- [OpenClaw Wikipedia](https://en.wikipedia.org/wiki/OpenClaw)

### 가이드 & 튜토리얼
- [OpenClaw Tutorial: Installation to First Chat Setup - Codecademy](https://www.codecademy.com/article/open-claw-tutorial-installation-to-first-chat-setup)
- [OpenClaw AI: Complete Setup and Automation Guide 2026 - DigitalApplied](https://www.digitalapplied.com/blog/openclaw-ai-complete-guide-setup-skills-automation)
- [What is OpenClaw? - DigitalOcean](https://www.digitalocean.com/resources/articles/what-is-openclaw)
- [OpenClaw Mega Cheatsheet 2026 - Molt Founders](https://moltfounders.com/openclaw-mega-cheatsheet)
- [OpenClaw Beginner's Guide - Apiyi](https://help.apiyi.com/en/openclaw-beginner-guide-en.html)

### 배포 가이드
- [Docker 설치 가이드 - OpenClaw Docs](https://docs.openclaw.ai/install/docker)
- [Deploy OpenClaw on Fly.io - TechEduByte](https://www.techedubyte.com/deploy-openclaw-on-fly-io/)
- [OpenClaw on Coolify - Coolify Docs](https://coolify.io/docs/services/openclaw)

### 보안 분석
- [Personal AI Agents like OpenClaw Are a Security Nightmare - Cisco Blog](https://blogs.cisco.com/ai/personal-ai-agents-like-openclaw-are-a-security-nightmare)
- [ToxicSkills: Malicious AI Agent Skills - Snyk](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/)
- [OpenClaw Bug Enables One-Click RCE - The Hacker News](https://thehackernews.com/2026/02/openclaw-bug-enables-one-click-remote.html)
- [It's easy to backdoor OpenClaw - The Register](https://www.theregister.com/2026/02/05/openclaw_skills_marketplace_leaky_security/)
- [OpenClaw security vulnerabilities - Giskard](https://www.giskard.ai/knowledge/openclaw-security-vulnerabilities-include-data-leakage-and-prompt-injection-risks)
- [OpenClaw Security 101 - Adversa AI](https://adversa.ai/blog/openclaw-security-101-vulnerabilities-hardening-2026/)

### 비교 & 분석
- [OpenClaw vs Claude Code - AI Tool Discovery](https://www.aitooldiscovery.com/guides/openclaw-vs-claude-code)
- [OpenClaw vs ChatGPT vs Claude - Skywork](https://skywork.ai/blog/ai-agent/openclaw-vs-chatgpt-claude-cline-roo-code-comparison/)
- [What Is OpenClaw? Complete Guide - Milvus Blog](https://milvus.io/blog/openclaw-formerly-clawdbot-moltbot-explained-a-complete-guide-to-the-autonomous-ai-agent.md)
- [OpenClaw Is Changing My Life - Reorx](https://reorx.com/blog/openclaw-is-changing-my-life/)
- [awesome-openclaw](https://github.com/rohitg00/awesome-openclaw)

### 커뮤니티
- [ClawHub Skills Marketplace Developer Guide 2026 - DigitalApplied](https://www.digitalapplied.com/blog/clawhub-skills-marketplace-developer-guide-2026)
- [OpenClaw Advanced Config (Multi-Agent) - TheSethRose](https://github.com/TheSethRose/OpenClaw-Advanced-Config)
- [explain-openclaw (Architecture Docs) - centminmod](https://github.com/centminmod/explain-openclaw)
