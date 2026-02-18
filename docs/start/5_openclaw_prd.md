# OpenClaw - Telegram 멀티 에이전트 구성 블로그 PRD

## 1. 블로그 개요

| 항목 | 내용 |
|------|------|
| **제목(안)** | OpenClaw로 Telegram 멀티 에이전트 구성하기 - 하나의 Gateway에서 여러 AI 봇 운영 |
| **대상 독자** | AI 에이전트/챗봇에 관심 있는 개발자, DevOps 엔지니어 |
| **카테고리** | AI / ChatOps / Self-hosted |
| **태그** | `openclaw`, `telegram`, `multi-agent`, `ai-agent`, `self-hosted`, `chatbot` |
| **참고 문서** | https://docs.openclaw.ai/concepts/multi-agent |

---

## 2. OpenClaw 소개

### OpenClaw란?
- **자체 호스팅(Self-hosted) AI 게이트웨이**
- WhatsApp, Telegram, Discord, iMessage 등 메시징 앱을 AI 코딩 에이전트와 연결
- MIT 라이선스 오픈소스 프로젝트
- 사용자의 기기에서 실행되며, 사용자가 모든 규칙을 통제

### 핵심 특징
- 단일 Gateway로 여러 채널(Telegram, WhatsApp, Discord 등) 동시 지원
- **멀티 에이전트 라우팅** - 여러 AI "뇌"를 독립적으로 운영
- 미디어 지원 (이미지, 오디오, 문서)
- 웹 제어 대시보드
- iOS/Android 모바일 노드

---

## 3. 블로그 핵심 주제: 멀티 에이전트 아키텍처

### 3.1 "하나의 에이전트"란?

각 에이전트는 완전히 격리된 독립적인 AI 뇌(brain)로, 다음 구성요소를 가짐:

| 구성요소 | 경로 | 설명 |
|----------|------|------|
| **Workspace** | `~/.openclaw/workspace-<agentId>` | 파일, AGENTS.md, SOUL.md, USER.md, 퍼소나 규칙 |
| **상태 디렉토리(agentDir)** | `~/.openclaw/agents/<agentId>/agent` | 인증 프로필, 모델 레지스트리, 에이전트별 설정 |
| **세션 저장소** | `~/.openclaw/agents/<agentId>/sessions` | 채팅 기록 |

> **핵심 원칙**: `agentDir`을 에이전트 간에 절대 재사용하지 말 것 → 인증 충돌 발생

### 3.2 경로 구조 맵

```
~/.openclaw/
├── openclaw.json                          # 메인 설정 파일
├── workspace-alerts/                      # alerts 에이전트 워크스페이스
│   ├── AGENTS.md
│   ├── SOUL.md
│   └── USER.md
├── workspace-monitoring/                  # monitoring 에이전트 워크스페이스
│   ├── AGENTS.md
│   ├── SOUL.md
│   └── USER.md
└── agents/
    ├── alerts/
    │   ├── agent/                         # agentDir (인증, 모델 설정)
    │   │   └── auth-profiles.json
    │   └── sessions/                      # 채팅 기록
    └── monitoring/
        ├── agent/
        │   └── auth-profiles.json
        └── sessions/
```

---

## 4. 블로그 구성 (목차)

### 4.1 도입부
- OpenClaw 소개 및 왜 멀티 에이전트가 필요한지
- 사용 시나리오 예시 (알림봇 + 모니터링봇 + 일반 대화봇)

### 4.2 사전 준비
- Node 22+ 설치
- OpenClaw 설치 (`curl -fsSL https://openclaw.ai/install.sh | bash`)
- 온보딩 마법사 실행 (`openclaw onboard --install-daemon`)
- AI 프로바이더 API 키 (Anthropic/OpenAI 등)

### 4.3 Telegram 봇 생성 (BotFather)
- BotFather를 통한 봇 생성 과정 (스크린샷 포함)
- 에이전트 수만큼 별도의 봇 토큰 발급
- 봇 이름/설명 설정 팁

### 4.4 멀티 에이전트 설정 단계별 가이드

#### Step 1: 에이전트 추가
```bash
openclaw agents add alerts
openclaw agents add monitoring
```

#### Step 2: OpenClaw에게 봇 토큰 전달 (자동 설정)

> **openclaw.json을 직접 편집할 필요 없음!**
> OpenClaw 대화창에서 "새로운 Telegram 봇을 추가했어. 토큰은 XXX야"라고 알려주면,
> OpenClaw가 알아서 `openclaw.json`에 에이전트/채널/바인딩 설정을 추가하고 Gateway를 재시작한다.

**실제 워크플로우:**
1. BotFather에서 봇 생성 → 토큰 복사
2. OpenClaw 대화창(Dashboard 또는 Telegram)에서 토큰 전달
3. OpenClaw가 자동으로:
   - `openclaw.json`에 새 에이전트 및 Telegram 계정 추가
   - 바인딩 규칙 생성
   - Gateway 재시작

**openclaw.json 구조 이해하기:**

OpenClaw가 자동으로 설정을 생성하지만, 내부적으로 어떤 구조로 저장되는지 이해하면 커스터마이징이나 트러블슈팅에 도움이 된다. `openclaw.json`은 크게 3개 섹션으로 구성된다:

**1) agents 섹션** - 각 에이전트(AI 뇌)를 정의:
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
    ],
  },
}
```

**2) channels 섹션** - Telegram 봇 토큰과 접근 정책:
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
      },
    },
  },
}
```

**3) bindings 섹션** - 어떤 봇 메시지가 어떤 에이전트로 가는지 라우팅 규칙:
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
  ],
}
```

> dmPolicy, 모델 변경, 바인딩 세분화 등 고급 설정이 필요할 때는 이 파일을 직접 편집할 수 있다.

#### Step 3: 검증 및 실행
```bash
openclaw agents list --bindings    # 에이전트 및 바인딩 확인
openclaw channels status --probe   # 채널 상태 점검
openclaw gateway restart           # Gateway 재시작
```

### 4.5 라우팅 규칙 심화

라우팅 우선순위 (가장 구체적인 매칭이 우선):

| 우선순위 | 매칭 기준 | 설명 |
|----------|-----------|------|
| 1 | `peer` | 정확한 DM/그룹/채널 ID |
| 2 | `parentPeer` | 스레드 상속 |
| 3 | `guildId + roles` | Discord 역할 라우팅 |
| 4 | `guildId` | Discord 서버 |
| 5 | `teamId` | Slack 팀 |
| 6 | `accountId` | 채널별 계정 |
| 7 | `channel` (`accountId: "*"`) | 채널 수준 |
| 8 | 기본 에이전트 | 폴백 |

### 4.6 실전 활용 시나리오

#### 시나리오 1: 용도별 봇 분리
- **alerts_bot**: 서버 알림 전용 (claude-opus 모델, 빠른 응답)
- **monitoring_bot**: 시스템 모니터링 분석 (claude-sonnet 모델, 비용 절감)
- **assistant_bot**: 일반 대화/질의응답

#### 시나리오 2: 같은 봇에서 사용자별 에이전트 분리
```json5
{
  bindings: [
    // VIP 사용자는 고성능 에이전트로
    {
      agentId: "vip",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "direct", id: "tg:123456789" },
      },
    },
    // 나머지는 일반 에이전트로
    {
      agentId: "general",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
}
```

#### 시나리오 3: 채널별 에이전트 분리
- WhatsApp → 일상 대화 에이전트 (경량 모델)
- Telegram → 심화 작업 에이전트 (고성능 모델)

### 4.7 Telegram 채널 상세 옵션

| 옵션 | 기본값 | 설명 |
|------|--------|------|
| `botToken` | - | BotFather 토큰 (필수) |
| `tokenFile` | - | 파일에서 토큰 읽기 |
| `dmPolicy` | `pairing` | DM 접근 제어: `pairing`, `allowlist`, `open`, `disabled` |
| `allowFrom` | `[]` | 허용 사용자 ID 목록 (예: `tg:123456789`) |
| `groupPolicy` | `allowlist` | 그룹 접근: `open`, `allowlist`, `disabled` |
| `requireMention` | - | 그룹에서 봇 멘션 필수 여부 |
| `streamMode` | `off` | 실시간 미리보기: `off`, `partial`, `block` |
| `textChunkLimit` | `4000` | 아웃바운드 메시지 청크 크기 |
| `webhookUrl` | - | 웹훅 모드 URL |
| `replyToMode` | `off` | 답장 모드: `off`, `first`, `all` |

### 4.8 주의사항 및 트러블슈팅
- `agentDir` 재사용 금지 (인증 충돌)
- 각 에이전트의 완전한 격리 (인증, 세션, 워크스페이스)
- dmPolicy는 채널(account) 레벨 설정 (에이전트별 개별 불가)
- 바인딩 순서가 중요 (더 구체적인 규칙을 먼저 작성)
- 토큰 보안: 환경변수 또는 `tokenFile` 사용 권장

---

## 5. 블로그 작성 시 포함할 시각 자료

- [ ] OpenClaw 멀티 에이전트 아키텍처 다이어그램 (Gateway → Agent 1, Agent 2, ...)
- [ ] BotFather 봇 생성 스크린샷
- [ ] Telegram에서 각 봇과 대화하는 스크린샷
- [ ] 라우팅 흐름도 (메시지 → binding 매칭 → 에이전트 선택)
- [ ] openclaw dashboard 웹 UI 스크린샷

---

## 6. 핵심 용어 정리

| 용어 | 설명 |
|------|------|
| **Gateway** | 모든 채널과 에이전트를 연결하는 중앙 라우터 |
| **Agent (에이전트)** | 독립적인 AI 뇌 - workspace, 상태, 세션을 가짐 |
| **agentId** | 에이전트 고유 식별자 |
| **accountId** | 채널 계정 인스턴스 (예: Telegram 봇 1 vs 봇 2) |
| **Binding** | 인바운드 메시지를 특정 agentId로 라우팅하는 규칙 |
| **Workspace** | 에이전트의 작업 공간 (AGENTS.md, SOUL.md 등) |
| **agentDir** | 에이전트 상태 디렉토리 (인증, 모델 설정) |
| **dmPolicy** | DM 접근 제어 정책 (pairing/allowlist/open/disabled) |
| **Peer** | 대화 상대 (DM 사용자, 그룹, 채널) |

---

## 7. 작성 일정

| 단계 | 작업 | 상태 |
|------|------|------|
| 1 | PRD 작성 및 구조 확정 | ✅ 완료 |
| 2 | OpenClaw 설치 및 실습 | ⬜ 대기 |
| 3 | Telegram 봇 2~3개 생성 및 테스트 | ⬜ 대기 |
| 4 | 블로그 초안 작성 | ⬜ 대기 |
| 5 | 스크린샷/다이어그램 제작 | ⬜ 대기 |
| 6 | 리뷰 및 발행 | ⬜ 대기 |

---

## 8. 참고 링크

- [OpenClaw 공식 문서](https://docs.openclaw.ai)
- [Multi-Agent 개념](https://docs.openclaw.ai/concepts/multi-agent)
- [Telegram 채널 설정](https://docs.openclaw.ai/channels/telegram)
- [시작하기 가이드](https://docs.openclaw.ai/start/getting-started)
- [OpenClaw GitHub](https://github.com/nichochar/openclaw)
