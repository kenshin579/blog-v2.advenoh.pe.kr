# PRD: Claude Code 멀티 계정 전환 가이드 블로그

## 1. 개요

Claude Code를 사용하는 유저 중 개인/회사 등 복수 계정을 보유한 경우, 한 계정에서 사용량 제한(limit)이 걸렸을 때 다른 계정으로 빠르게 전환하여 작업 연속성을 유지하는 방법을 안내하는 블로그 포스트.

## 2. 배경 & 문제 정의

- Claude Code 사용자 중 개인 계정과 회사 계정을 동시에 보유한 경우가 증가
- 한 계정에서 rate limit에 도달하면 작업이 중단되는 불편함 발생
- 계정 전환 방법이 직관적이지 않아 매번 로그아웃/로그인을 반복하는 비효율 존재

## 3. 타겟 독자

- Claude Code를 터미널에서 사용하는 개발자
- 개인 + 회사 등 복수 Anthropic 계정 보유자
- macOS 사용자 (zsh 기반)

## 4. 블로그 구성

### 4.1. 도입부

- 문제 상황 공감: "Claude Code 쓰다가 limit 걸려서 멈춘 경험 있으신가요?"
- 이 글에서 다루는 것: API Key 기반 멀티 계정 전환 설정법

### 4.2. ⚠️ 핵심 주의사항: OAuth vs API Key 과금 차이

블로그에서 반드시 강조해야 할 내용:

- **OAuth 로그인** (`claude auth login`) → Pro/Team **플랜 구독** 기반, 월정액으로 사용
- **API Key** (`ANTHROPIC_API_KEY`) → **API 크레딧 선불 충전** 기반, 사용량만큼 차감
- 둘은 **완전히 별개 과금 체계**. Pro 플랜 구독 중이어도 API 크레딧이 없으면 API Key로는 "Credit balance too low" 에러 발생
- API 크레딧은 [console.anthropic.com](https://console.anthropic.com) → Settings → Billing에서 충전

> 실제 테스트 시 발생한 에러 스크린샷 첨부 권장:
> `Credit balance too low · Add funds: https://platform.claude.com/settings/billing`

### 4.2.1. 🚨 Auth Conflict 주의

OAuth 세션과 API Key가 동시에 존재하면 다음 에러가 발생한다:

```
Auth conflict: Both a token (claude.ai) and an API key (ANTHROPIC_API_KEY) are set.
This may lead to unexpected behavior.
```

**원인:** `claude auth login`으로 OAuth 세션이 남아있는 상태에서 `ANTHROPIC_API_KEY` 환경변수까지 설정된 경우. Claude Code가 API Key를 우선 사용하면서 크레딧 부족 에러로 이어짐.

**핵심 원칙: 두 인증이 동시에 존재하면 안 된다. 전환 시 반드시 한쪽을 해제할 것.**

- API Key로 쓰고 싶다면 → `claude auth logout` (OAuth 세션 제거)
- OAuth로 쓰고 싶다면 → `unset ANTHROPIC_API_KEY` (환경변수 제거)

### 4.3. 계정 전환 방법 비교

3가지 방법을 비교하고, 상황별 추천안을 제시:

| 방법 | 설명 | 장점 | 단점 |
|------|------|------|------|
| `claude auth logout` → `login` | OAuth 로그아웃 후 재로그인 | 별도 설정 불필요, 플랜 구독 그대로 사용 | 매번 번거로움 |
| 환경변수 alias | `ANTHROPIC_API_KEY`를 export하는 쉘 함수 | 즉시 전환, 가장 빠름 | API 크레딧 별도 충전 필요 (선불 과금) |
| OAuth 전환 함수 | 로그아웃→로그인을 쉘 함수로 묶기 | Pro/Team 플랜 유지, 추가 비용 없음 | 로그인 과정 필요 (브라우저 열림) |

### 4.4. 상황별 추천 전략

**케이스 A: 두 계정 모두 Pro/Team 플랜 (가장 일반적)**

- **추천: OAuth 전환 함수 방식**
- 추가 과금 없이 플랜 구독 내에서 사용
- 전환 시 브라우저 로그인 필요하지만, 쉘 함수로 간소화 가능

**케이스 B: 빠른 전환이 중요한 경우 (하이브리드)**

- **추천: 평소 OAuth + 비상시 API Key**
- 메인 계정은 OAuth로 사용
- API 크레딧 소액 충전(예: $5~10)해두고, limit 걸릴 때만 API Key로 임시 전환
- 가장 실용적인 조합

### 4.5. 사전 준비: API Key 발급 (케이스 B 해당 시)

- [console.anthropic.com](https://console.anthropic.com) 접속
- Settings → API Keys → Create Key
- 개인 계정, 회사 계정 각각 발급
- 키 안전하게 저장 (한 번만 노출됨)
- **Settings → Billing에서 크레딧 충전 필수** (미충전 시 "Credit balance too low" 에러)

### 4.6. 설정 방법 (핵심 섹션)

#### 케이스 A: OAuth 전환 함수 (Pro/Team 플랜 유저 추천)

```bash
# ~/.zshrc에 추가
cs() {
  echo "🔄 계정 전환 중..."
  claude auth logout
  echo "✅ 로그아웃 완료. claude 실행 후 /login으로 재인증하세요."
}
```

**OAuth 재로그인 흐름:**

> 🚨 **주의:** `claude auth login`은 터미널에서 인증 링크를 출력하지만, 브라우저 승인 후 발급되는 **인증 code를 터미널에 입력할 수 없다.** 따라서 `claude`를 먼저 실행한 뒤 REPL 내에서 `/login` 명령어를 사용해야 한다.

1. 터미널에서 `cs` 실행 → 기존 OAuth 세션 로그아웃
2. `claude` 실행 → Claude Code REPL 진입
3. REPL에서 `/login` 입력
4. **브라우저가 자동으로 열림** → Anthropic 로그인 페이지로 이동
5. 브라우저에서 전환할 계정으로 로그인 → 인증 code 발급
6. 발급된 **code를 REPL에 paste** → 인증 완료
7. 해당 계정으로 Claude Code 사용 시작

> 💡 **팁:** 브라우저에서 개인/회사 계정을 각각 다른 프로필(Chrome 프로필 등)로 관리하면 전환이 더 수월합니다.
>
> ⚠️ **주의:** 매번 브라우저를 거쳐야 하므로 API Key 방식 대비 전환 속도가 느림. 이것이 OAuth 전환의 가장 큰 단점.

사용법:

```bash
# limit 걸리면
cs
# → 로그아웃 완료
claude
# → REPL 진입 후
/login
# → 브라우저 열림 → 다른 계정 선택 → 인증 code를 REPL에 paste
```

#### 케이스 B: API Key 전환 (하이브리드 - 빠른 전환 필요 시)

**Step 1: OAuth 로그아웃 (최초 1회)**

```bash
claude auth logout
```

> ⚠️ Claude Desktop과는 별개이므로 Desktop 앱에는 영향 없음

**Step 2: `~/.zshrc`에 전환 함수 추가**

```bash
# ⚠️ 핵심: OAuth와 API Key가 동시에 존재하면 Auth conflict 발생
# 전환 시 반드시 한쪽을 해제해야 함

claude-work() {
  claude auth logout 2>/dev/null
  export ANTHROPIC_API_KEY="sk-ant-회사키"
  echo "✅ 회사 계정(API Key)으로 전환됨"
}

claude-personal() {
  claude auth logout 2>/dev/null
  export ANTHROPIC_API_KEY="sk-ant-개인키"
  echo "✅ 개인 계정(API Key)으로 전환됨"
}

claude-oauth() {
  unset ANTHROPIC_API_KEY
  echo "✅ API Key 해제됨. claude 실행 후 /login으로 OAuth 재인증하세요."
}
```

**Step 3: 적용 & 사용**

```bash
source ~/.zshrc

# 평소: OAuth로 사용 (Pro/Team 플랜)
claude

# limit 걸리면 → API Key로 임시 전환
claude-work
claude

# 다시 OAuth(플랜)로 복귀
claude-oauth
claude
# → REPL에서 /login → 브라우저 인증 → code paste
```

### 4.7. FAQ

- **Q: Claude Desktop에 영향이 있나요?**
  - A: 없습니다. Claude Desktop은 OAuth 기반, Claude Code의 `ANTHROPIC_API_KEY`와 완전히 독립적입니다.

- **Q: API Key 방식은 과금이 다른가요?**
  - A: 네. Pro/Team 플랜의 월정액과 **완전히 별개**입니다. API Key는 사용량 기반 선불 과금이며, 크레딧 미충전 시 "Credit balance too low" 에러가 발생합니다. 비상용으로 소액($5~10) 충전해두는 것을 권장합니다.

- **Q: Pro 플랜 구독 중인데 API Key로 전환하면 왜 안 되나요?**
  - A: Pro/Team 플랜 구독과 API 크레딧은 별개 과금 체계입니다. 플랜을 구독 중이더라도 API 사용을 위해서는 console.anthropic.com에서 별도로 크레딧을 충전해야 합니다.

- **Q: OAuth 로그인 상태에서 환경변수도 설정하면?**
  - A: **Auth conflict 에러가 발생합니다.** Claude Code가 두 인증을 동시에 감지하면 `Auth conflict: Both a token (claude.ai) and an API key (ANTHROPIC_API_KEY) are set` 경고가 뜨고, API Key를 우선 사용하면서 크레딧 부족 에러로 이어질 수 있습니다. 반드시 한쪽을 해제하세요. (`claude auth logout` 또는 `unset ANTHROPIC_API_KEY`)

### 4.8. 마무리

- 핵심 요약: OAuth와 API Key는 별개 과금 체계임을 반드시 인지
- Pro/Team 플랜 유저 → OAuth 전환 함수(`cs`) 추천
- 빠른 전환이 필요하면 → API 크레딧 소액 충전 + 환경변수 전환 병행
- Claude Desktop과는 무관

## 5. 톤 & 스타일

- 개발자 대상, 친근하고 실용적인 톤
- 코드 블록 중심, 불필요한 설명 최소화
- 한국어 작성 (기술 용어는 영문 유지)

## 6. 예상 분량

- 본문 약 800~1,200자
- 코드 블록 3~4개
- 비교 표 1개
- FAQ 3개

## 7. 참고사항

- Claude Code 인증 체계: OAuth와 API Key 두 가지 방식 지원
- `ANTHROPIC_API_KEY` 환경변수가 설정되면 OAuth보다 우선 사용됨 (단, OAuth 세션이 활성 상태일 경우 충돌 가능)
- macOS 기본 쉘: zsh (`~/.zshrc`)
