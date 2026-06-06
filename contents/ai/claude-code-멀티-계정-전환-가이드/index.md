---
title: "Claude Code 멀티 계정 전환 가이드: Limit 걸려도 끊김 없이 작업하기"
description: "Claude Code에서 OAuth와 API Key 인증 방식을 활용해 개인/회사 계정을 빠르게 전환하고 rate limit 없이 끊김 없이 작업하는 설정 가이드"
date: 2026-02-28
update: 2026-02-28
tags:
  - Claude Code
  - Claude
  - 멀티 계정
  - API Key
  - OAuth
  - rate limit
  - 계정 전환
series: "Claude Code 실전 가이드"
---

# 1. 개요

Claude Code를 쓰다가 갑자기 rate limit에 걸려서 작업이 멈춘 경험이 있는가? 개인 계정과 회사 계정을 모두 보유하고 있다면, 다른 계정으로 전환해서 바로 이어 작업할 수 있다.

이 글에서는 Claude Code의 두 가지 인증 방식(OAuth / API Key)의 차이를 정리하고, 상황별 계정 전환 설정법을 소개한다.

# 2. OAuth vs API Key: 과금 체계가 다르다

계정 전환을 설정하기 전에 반드시 알아야 할 핵심 개념이 있다. **OAuth 로그인과 API Key는 완전히 별개의 과금 체계**라는 점이다.

| 구분 | OAuth (`claude auth login`) | API Key (`ANTHROPIC_API_KEY`) |
|------|---------------------------|-------------------------------|
| 과금 방식 | Pro/Team **플랜 구독** (월정액) | **API 크레딧 선불 충전** (사용량 차감) |
| 충전 위치 | claude.ai에서 플랜 구독 | [console.anthropic.com](https://console.anthropic.com) → Billing |
| 특징 | 구독 내 사용량 포함 | 크레딧 미충전 시 에러 발생 |

Pro 플랜을 구독 중이더라도 API 크레딧이 없으면 API Key 방식으로는 아래 에러가 발생한다.

```
Credit balance too low · Add funds: https://platform.claude.com/settings/billing
```

## 2.1 Auth Conflict 주의

OAuth 세션과 API Key가 **동시에 존재하면** 충돌 에러가 발생한다.

```
Auth conflict: Both a token (claude.ai) and an API key (ANTHROPIC_API_KEY) are set.
This may lead to unexpected behavior.
```

**핵심 원칙: 두 인증이 동시에 존재하면 안 된다.** 전환 시 반드시 한쪽을 해제해야 한다.

- API Key로 쓰고 싶다면 → `claude auth logout` (OAuth 세션 제거)
- OAuth로 쓰고 싶다면 → `unset ANTHROPIC_API_KEY` (환경변수 제거)

# 3. 계정 전환 방법 비교

| 방법 | 장점 | 단점 |
|------|------|------|
| OAuth 전환 함수 | 플랜 구독 그대로 사용, 추가 비용 없음 | 브라우저 로그인 필요 (느림) |
| API Key 환경변수 전환 | 즉시 전환, 가장 빠름 | API 크레딧 별도 충전 필요 |
| 하이브리드 (추천) | 평소 OAuth + 비상시 API Key | 초기 설정 필요 |

# 4. 상황별 추천 전략

## 4.1 케이스 A: 두 계정 모두 Pro/Team 플랜 (내 케이스)

**추천: OAuth 전환 함수**

필자의 경우 개인 계정과 회사 계정 모두 Pro 플랜을 구독하고 있어서 이 방식을 사용하고 있다. 추가 과금 없이 플랜 구독 내에서 사용할 수 있고, 전환 시 브라우저 로그인이 필요하지만 쉘 함수로 간소화할 수 있다.

## 4.2 케이스 B: 빠른 전환이 중요한 경우

**추천: 평소 OAuth + 비상시 API Key (하이브리드)**

메인 계정은 OAuth로 사용하고, API 크레딧을 소액($5~10) 충전해둔 뒤 limit 걸릴 때만 API Key로 임시 전환하는 방식이다. 가장 실용적인 조합이다.

# 5. 설정 방법

## 5.1 케이스 A: OAuth 전환 함수

`~/.zshrc`에 다음 함수를 추가한다.

```bash
cs() {
  echo "🔄 계정 전환 중..."
  claude auth logout
  echo "✅ 로그아웃 완료. claude 실행 후 /login으로 재인증하세요."
}
```

**OAuth 재로그인 흐름:**

`claude auth login`은 터미널에서 인증 링크를 출력하지만, 브라우저 승인 후 발급되는 인증 code를 터미널에 입력할 수 없다. 따라서 `claude`를 먼저 실행한 뒤 REPL 내에서 `/login` 명령어를 사용해야 한다.

1. `cs` 실행 → 기존 OAuth 세션 로그아웃
2. `claude` 실행 → Claude Code REPL 진입
3. REPL에서 `/login` 입력
4. 브라우저가 자동으로 열림 → 전환할 계정으로 로그인
5. 발급된 인증 code를 REPL에 paste → 인증 완료

```bash
# limit 걸리면
cs
# → 로그아웃 완료

claude
# → REPL 진입 후
/login
# → 브라우저 열림 → 다른 계정 선택 → 인증 code를 REPL에 paste
```

## 5.2 케이스 B: API Key 전환 (하이브리드)

### 5.2.1 사전 준비: API Key 발급

1. [console.anthropic.com](https://console.anthropic.com) 접속
2. Settings → API Keys → Create Key
3. 키를 안전하게 저장 (한 번만 노출됨)
4. **Settings → Billing에서 크레딧 충전 필수**

### 5.2.2 ~/.zshrc 설정

```bash
# OAuth와 API Key가 동시에 존재하면 Auth conflict 발생
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

### 5.2.3 사용법

```bash
source ~/.zshrc

# 평소: OAuth로 사용 (Pro/Team 플랜)
claude

# limit 걸리면 → API Key로 즉시 전환
claude-work
claude

# 다시 OAuth(플랜)로 복귀
claude-oauth
claude
# → REPL에서 /login → 브라우저 인증 → code paste
```

# 6. FAQ

**Q: Claude Desktop에 영향이 있나요?**

없다. Claude Desktop은 별도의 OAuth 기반이며, Claude Code의 `ANTHROPIC_API_KEY` 환경변수와 완전히 독립적이다.

**Q: Pro 플랜 구독 중인데 API Key로 전환하면 왜 안 되나요?**

Pro/Team 플랜 구독과 API 크레딧은 별개 과금 체계다. 플랜을 구독 중이더라도 API 사용을 위해서는 [console.anthropic.com](https://console.anthropic.com)에서 별도로 크레딧을 충전해야 한다.

**Q: OAuth 로그인 상태에서 환경변수도 설정하면?**

Auth conflict 에러가 발생한다. Claude Code가 두 인증을 동시에 감지하면 API Key를 우선 사용하면서 크레딧 부족 에러로 이어질 수 있다. 반드시 한쪽을 해제하자. (`claude auth logout` 또는 `unset ANTHROPIC_API_KEY`)

# 7. 마무리

정리하면 다음과 같다.

- **OAuth와 API Key는 별개 과금 체계**임을 반드시 인지
- Pro/Team 플랜 유저 → **OAuth 전환 함수(`cs`)** 추천
- 빠른 전환이 필요하면 → **API 크레딧 소액 충전 + 환경변수 전환** 병행
- 두 인증이 동시에 존재하면 안 된다. 전환 시 반드시 한쪽 해제
- Claude Desktop과는 무관

# 8. 참고

- [Anthropic Console - API Key 발급](https://console.anthropic.com)
- [Claude Code 공식 문서](https://docs.anthropic.com/en/docs/claude-code)
