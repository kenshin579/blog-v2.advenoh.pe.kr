---
title: "OpenClaw Telegram 멀티 에이전트 구성하기: 하나의 Gateway에서 여러 AI 봇 운영"
description: "OpenClaw의 멀티 에이전트 아키텍처를 활용하여 Telegram 봇 여러 개를 독립적으로 운영하는 방법을 단계별로 정리합니다."
date: 2026-03-09
update: 2026-03-09
tags:
  - OpenClaw
  - Telegram
  - AI에이전트
  - 멀티에이전트
  - 셀프호스팅
  - 챗봇
series: "OpenClaw 활용 가이드"
---

# 1. 개요

OpenClaw는 WhatsApp, Telegram, Discord 등 메시징 앱을 AI 에이전트와 연결하는 **자체 호스팅 게이트웨이**다. 기본적으로 하나의 에이전트가 모든 메시지를 처리하지만, 실제 운영에서는 용도별로 봇을 분리하고 싶은 경우가 많다.

예를 들어:

- **알림봇**: 서버 장애나 배포 알림만 전달
- **모니터링봇**: 시스템 메트릭 분석 및 리포트
- **어시스턴트봇**: 일상적인 질문과 작업 처리

OpenClaw의 **멀티 에이전트** 기능을 사용하면 이런 구성이 가능하다. 각 에이전트는 완전히 격리된 독립적인 "뇌(brain)"로 동작하며, 하나의 Gateway에서 관리할 수 있다.

이 글에서는 Telegram 봇 여러 개를 OpenClaw 멀티 에이전트로 구성하는 방법을 단계별로 정리한다. 전체 과정은 다음 4단계로 진행된다.

1. **Telegram 봇 생성** - BotFather에서 에이전트 수만큼 봇 생성
2. **에이전트 추가** - OpenClaw CLI로 에이전트 등록
3. **봇 토큰 전달** - OpenClaw에게 토큰을 전달하여 바인딩 자동 구성
4. **검증 및 실행** - 에이전트 목록과 채널 상태 확인

> OpenClaw 기본 개념과 설치는 [OpenClaw 완벽 가이드](/openclaw-완벽-가이드) 글을 참고하자.

# 2. 멀티 에이전트 아키텍처

## 2.1 전체 구조

멀티 에이전트 시스템의 핵심은 **하나의 Gateway가 여러 에이전트를 관리하고, 바인딩 규칙에 따라 메시지를 라우팅**하는 것이다.

```mermaid
flowchart LR
    subgraph Telegram
        B1["🤖 alerts_bot"]
        B2["🤖 monitoring_bot"]
        B3["🤖 assistant_bot"]
    end

    subgraph Gateway
        R["라우팅 엔진\n(Bindings)"]
    end

    subgraph Agents
        A1["Agent: alerts\n(Claude Opus)"]
        A2["Agent: monitoring\n(Claude Sonnet)"]
        A3["Agent: assistant\n(Claude Haiku)"]
    end

    B1 --> R
    B2 --> R
    B3 --> R
    R --> A1
    R --> A2
    R --> A3
```

각 Telegram 봇은 독립된 계정(accountId)을 가지고, 바인딩 규칙을 통해 특정 에이전트로 연결된다.

## 2.2 에이전트의 구성요소

각 에이전트는 완전히 격리된 구성요소를 가진다.

| 구성요소 | 경로 | 역할 |
|----------|------|------|
| **Workspace** | `~/.openclaw/workspace-<agentId>/` | AGENTS.md, SOUL.md, USER.md, 로컬 파일 |
| **상태 디렉토리(agentDir)** | `~/.openclaw/agents/<agentId>/agent/` | 인증 프로필, 모델 레지스트리, 에이전트 설정 |
| **세션 저장소** | `~/.openclaw/agents/<agentId>/sessions/` | 대화 기록 |

> **주의**: `agentDir`을 에이전트 간에 절대 공유하지 않는다. 공유하면 인증 충돌이 발생한다.

## 2.3 디렉토리 구조

실제 파일시스템에서의 멀티 에이전트 구조는 다음과 같다.

```mermaid
graph TD
    ROOT["~/.openclaw/"] --> CONFIG["openclaw.json"]
    ROOT --> WS1["workspace-alerts/"]
    ROOT --> WS2["workspace-monitoring/"]
    ROOT --> AGENTS["agents/"]

    WS1 --> WS1_A["AGENTS.md"]
    WS1 --> WS1_S["SOUL.md"]
    WS1 --> WS1_U["USER.md"]

    WS2 --> WS2_A["AGENTS.md"]
    WS2 --> WS2_S["SOUL.md"]
    WS2 --> WS2_U["USER.md"]

    AGENTS --> AG1["alerts/"]
    AGENTS --> AG2["monitoring/"]

    AG1 --> AG1_D["agent/"]
    AG1 --> AG1_S["sessions/"]
    AG1_D --> AG1_AUTH["auth-profiles.json"]

    AG2 --> AG2_D["agent/"]
    AG2 --> AG2_S["sessions/"]
    AG2_D --> AG2_AUTH["auth-profiles.json"]
```

각 에이전트의 Workspace에는 에이전트의 성격과 역할을 정의하는 파일이 있다.

- **AGENTS.md**: 에이전트의 지시사항과 도구 설정
- **SOUL.md**: 에이전트의 페르소나와 성격
- **USER.md**: 사용자 정보와 선호도

# 3. 멀티 에이전트 설정

## 3.1 Step 1 - Telegram 봇 생성 (BotFather)

Telegram에서 [@BotFather](https://t.me/BotFather)와 대화하여 에이전트 수만큼 봇을 생성한다.

1. BotFather에게 `/newbot` 명령 전송
2. 봇 이름 입력 (예: `My Alert Bot`)
3. 봇 사용자명 입력 (예: `my_alert_bot`)
4. 발급된 **봇 토큰**을 안전하게 보관

이 과정을 봇 개수만큼 반복한다. 예를 들어 3개의 에이전트를 운영할 예정이라면 3개의 봇을 생성한다.

```
# BotFather에서 받은 토큰 예시
alerts_bot:     123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
monitoring_bot: 987654:XYZ-UVW9876tgHjk-abc34V3w9z456ty22
assistant_bot:  111222:GHI-JKL5678mnOpq-rst12X4y6z789ab33
```

## 3.2 Step 2 - 에이전트 추가

OpenClaw CLI로 각 에이전트를 추가한다.

```bash
openclaw agents add alerts
openclaw agents add monitoring
openclaw agents add assistant
```

각 명령은 자동으로 다음을 생성한다.
- Workspace 디렉토리 (`~/.openclaw/workspace-<agentId>/`)
- 상태 디렉토리 (`~/.openclaw/agents/<agentId>/agent/`)
- 세션 저장소 (`~/.openclaw/agents/<agentId>/sessions/`)

실제 `openclaw agents add` 실행 시 대화형 마법사가 진행된다.

```
$ openclaw agents add proj-photo

🦞 OpenClaw 2026.2.17 (4134875) — The UNIX philosophy meets your DMs.

┌  Add OpenClaw agent
│
◇  Workspace directory
│  /Users/user/.openclaw/workspace-proj-photo
│
◇  Copy auth profiles from "main"?
│  Yes
│
◇  Auth profiles ─────────────────────╮
│                                     │
│  Copied auth profiles from "main".  │
│                                     │
├─────────────────────────────────────╯
│
◇  Configure model/auth for this agent now?
│  Yes
│
◇  Model/auth provider
│  Anthropic
│
◇  Anthropic auth method
│  Anthropic token (paste setup-token)
│
◇  Paste Anthropic setup-token
│  sk-ant-oat01-****
│
◇  Token name (blank = default)
│  proj-photo
│
◇  Configure chat channels now?
│  Yes
│
◇  Select a channel
│  Finished
│
└  Agent "proj-photo" ready.
```

Workspace, 인증 프로필, 모델 설정이 한 번에 완료된다.

## 3.3 Step 3 - OpenClaw에게 봇 토큰 전달

`openclaw.json`을 직접 편집할 필요가 없다. OpenClaw 대화창(Dashboard 또는 Telegram)에서 새로운 봇을 추가했다고 알려주고 토큰을 전달하면, OpenClaw가 알아서 설정을 추가하고 Gateway를 재시작한다.

```
사용자: "새로운 Telegram 봇을 추가했어. 이름은 alerts_bot이고 토큰은 123456:ABC-DEF1234... 야"
OpenClaw: 설정 추가 완료 → Gateway 자동 재시작
```

**실제 워크플로우:**

1. BotFather에서 봇 생성 → 토큰 복사
2. OpenClaw 대화창에서 토큰 전달
3. OpenClaw가 자동으로 처리:
   - `openclaw.json`에 에이전트 및 Telegram 계정 추가
   - 바인딩 규칙 생성
   - Gateway 재시작

아래는 실제로 OpenClaw Telegram 대화창에서 봇 토큰을 전달하는 모습이다. 토큰을 전달하면 OpenClaw가 자동으로 설정을 추가하고 봇 현황을 보여준다.

![OpenClaw에게 Telegram 봇 토큰을 전달하는 화면](./openclaw-token-transfer.jpg)

## 3.4 openclaw.json 구조 이해

OpenClaw가 자동으로 설정을 생성하지만, 내부 구조를 이해하면 커스터마이징이나 트러블슈팅에 도움이 된다. `openclaw.json`은 크게 3개 섹션으로 구성된다.

### 3.4.1 agents 섹션

각 에이전트(AI 뇌)를 정의한다. 에이전트마다 독립된 workspace와 모델을 지정할 수 있다.

```json5
{
  agents: {
    list: [
      {
        id: "alerts",
        name: "Alert Agent",
        workspace: "~/.openclaw/workspace-alerts",
        agentDir: "~/.openclaw/agents/alerts/agent",
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "monitoring",
        name: "Monitoring Agent",
        workspace: "~/.openclaw/workspace-monitoring",
        agentDir: "~/.openclaw/agents/monitoring/agent",
        model: "anthropic/claude-sonnet-4-5",
      },
      {
        id: "assistant",
        name: "Assistant Agent",
        workspace: "~/.openclaw/workspace-assistant",
        agentDir: "~/.openclaw/agents/assistant/agent",
        model: "anthropic/claude-haiku-4-5",
      },
    ],
  },
}
```

에이전트별로 다른 모델을 사용할 수 있어, 용도에 맞게 성능과 비용을 조절할 수 있다.

### 3.4.2 channels 섹션

Telegram 봇 토큰과 접근 정책을 설정한다.

```json5
{
  channels: {
    telegram: {
      accounts: {
        alerts_bot: {
          botToken: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
          dmPolicy: "pairing",
        },
        monitoring_bot: {
          botToken: "987654:XYZ-UVW9876tgHjk-abc34V3w9z456ty22",
          dmPolicy: "allowlist",
          allowFrom: ["tg:123456789"],
        },
        assistant_bot: {
          botToken: "111222:GHI-JKL5678mnOpq-rst12X4y6z789ab33",
          dmPolicy: "open",
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

`dmPolicy`는 봇에게 DM을 보낼 수 있는 사람을 제어한다.

| dmPolicy | 설명 |
|----------|------|
| `pairing` | 페어링 코드를 입력한 사용자만 대화 가능 (기본값) |
| `allowlist` | `allowFrom`에 등록된 사용자만 대화 가능 |
| `open` | 누구나 대화 가능 (`allowFrom: ["*"]` 필요) |
| `disabled` | DM 비활성화 |

### 3.4.3 bindings 섹션

어떤 봇의 메시지가 어떤 에이전트로 전달되는지 라우팅 규칙을 정의한다.

```json5
{
  bindings: [
    {
      agentId: "alerts",
      match: { channel: "telegram", accountId: "alerts_bot" },
    },
    {
      agentId: "monitoring",
      match: { channel: "telegram", accountId: "monitoring_bot" },
    },
    {
      agentId: "assistant",
      match: { channel: "telegram", accountId: "assistant_bot" },
    },
  ],
}
```

> dmPolicy 변경, 모델 교체, 바인딩 세분화 등 고급 설정이 필요할 때는 이 파일을 직접 편집할 수 있다.

## 3.5 Step 4 - 검증 및 실행

설정이 완료되면 다음 명령어로 확인한다.

```bash
# 에이전트 목록 및 바인딩 확인
openclaw agents list --bindings

# 채널 상태 점검 (봇 토큰 유효성 확인)
openclaw channels status --probe

# Gateway 재시작 (수동 설정 변경 시)
openclaw gateway restart
```

정상적으로 설정되었다면 각 Telegram 봇에 메시지를 보내면 해당 에이전트가 응답한다. 아래는 새로 추가한 봇과 실제 대화하는 모습이다.

![새로 추가한 Telegram 봇과의 대화 화면](./openclaw-bot-conversation.png)

# 4. 마무리

OpenClaw의 멀티 에이전트 기능을 사용하면 하나의 Gateway에서 여러 Telegram 봇을 독립적으로 운영할 수 있다. 핵심 포인트를 정리하면:

- 각 에이전트는 Workspace, agentDir, 세션이 완전히 격리되어 서로 영향을 주지 않는다
- BotFather에서 봇을 생성하고 **OpenClaw에게 토큰만 전달**하면 자동으로 설정
- **바인딩 규칙**으로 메시지를 에이전트에 라우팅하며, 봇 단위/사용자 단위/그룹 단위 분기 가능
- 에이전트별로 **다른 AI 모델**을 사용하여 성능과 비용 최적화

멀티 에이전트의 핵심은 봇 개수가 아니라 각 봇에 전문화된 역할과 맥락을 부여하는 데 있다. 역할을 나눠 두면 봇마다 맡은 일에만 집중하므로 엉뚱한 답이 줄고, 작업 성격에 맞는 모델을 골라 쓸 수 있다.

# 5. 참고

- [OpenClaw 공식 문서](https://docs.openclaw.ai)
- [Multi-Agent 개념](https://docs.openclaw.ai/concepts/multi-agent)
- [Telegram 채널 설정](https://docs.openclaw.ai/channels/telegram)
- [시작하기 가이드](https://docs.openclaw.ai/start/getting-started)
