# SNS 로그인: JWT vs 세션 — 두 구현 분리 및 블로그 재구성 설계

- 작성일: 2026-06-03
- 대상 저장소
  - `tutorials-go` — 샘플 코드 (`web/sns-login-jwt`, `web/sns-login-session`)
  - `blog-v2.advenoh.pe.kr` — 블로그 글 (`docs/read/go-google-oauth-로그인-구현-가이드/index.md`)

## 1. 배경 / 목표

기존 글 "Go + React로 Google OAuth 2.0 로그인 구현하기"는 OAuth 흐름은 잘 다루지만,
**인증 이후 상태 유지 방식**으로 JWT만 보여주고, 회원가입 구현·일부 보안 메커니즘 코드가 누락되어 있다.
또한 콜백(redirect_uri) 설계가 백엔드/프론트 모델이 섞여 **따라 하면 동작하지 않는 모순**이 있다.

목표:

1. 샘플 코드를 **두 구현으로 분리**한다 — `sns-login-jwt`(무상태 JWT) / `sns-login-session`(서버 세션 + SQLite).
2. 블로그를 **하나의 글**로 재구성해 OAuth 공통 흐름을 한 번 설명하고, "JWT vs 세션" 비교와 두 구현을 함께 다룬다.
3. 리뷰에서 발견한 정확성·보안 결함 중 비용 대비 가치가 높은 항목을 함께 수정한다.

핵심 메시지: **OAuth(신원 위임)와 세션 유지 방식(JWT/세션)은 별개이며, 트레이드오프가 다르다.**

## 2. 디렉토리 구조

```
tutorials-go/web/
├── sns-login-jwt/        # 기존 web/sns-login 을 git mv 로 rename
│   ├── backend/          # Echo + GORM + SQLite, JWT 무상태
│   └── frontend/         # React, code → BE 전달(SPA 토큰 플로우)
└── sns-login-session/    # 신규 (sns-login-jwt 복제 후 세션 방식으로 개조)
    ├── backend/          # Echo + GORM + SQLite, sessions 테이블 + HttpOnly 쿠키
    └── frontend/         # React, 쿠키 기반(토큰 보관 없음)
```

두 폴더는 각각 자체 완결(독립적으로 읽고 실행 가능). 공통부(`provider/google.go`, OAuth 교환 로직)는 동일하고,
**차이는 "인증 이후 상태 유지"에만** 있다.

## 3. 구현 설계

### 3.1 공통 (두 버전 동일)

- Google OAuth Provider (`provider/google.go`): Authorization Code → Access Token → UserInfo
- `OAuthProvider` 인터페이스로 향후 SNS 확장 가능
- User 모델(GORM/SQLite): `findOrCreateUser`로 최초 로그인 시 자동 회원가입
- **state 파라미터 CSRF 방지**: 발급 시 저장 → 콜백에서 검증·삭제 (코드 명시)

### 3.2 JWT 버전 (`sns-login-jwt`)

콜백 흐름 — **SPA 토큰 플로우**:

```
FE: "Google 로그인" → GET /api/auth/google/url → Google redirect
Google → 프론트 라우트(/auth/callback)로 redirect (redirect_uri = 프론트)
FE: URL의 code/state 추출 → GET /api/auth/google/callback?code&state (BE)
BE: code 교환 → findOrCreate → JWT(access/refresh) JSON 반환
FE: localStorage 저장, 이후 Authorization: Bearer 로 API 호출
```

포함할 수정 (리뷰 항목):

- **B-4**: Access/Refresh 토큰에 `token_type` 클레임 추가. `JWTAuth` 미들웨어는 **access 토큰만** 허용
  (refresh 토큰으로 보호 API 호출 차단).
- **B-7**: JWT 시크릿 기본값을 `config.go`/docker-compose에서 통일하고, "프로덕션에서 반드시 교체" 경고.
- **D-10**: `google.go`의 JSON 디코딩 에러를 무시하지 않고 처리(실제 코드와 일치).
- **D-11**: 콜백 핸들러에 `code == ""` 검증 포함.
- **A-3**: `findOrCreateUser`에서 재로그인 시 Name/AvatarURL 갱신(1줄 Update).

### 3.3 세션 버전 (`sns-login-session`)

콜백 흐름 — **클래식 서버 세션 플로우**:

```
FE: "Google 로그인" → GET /api/auth/google/url → Google redirect
Google → 백엔드 /api/auth/google/callback 로 redirect (redirect_uri = 백엔드)
BE: code 교환 → findOrCreate → sessions row 생성 → Set-Cookie(HttpOnly) → 프론트로 302 redirect
FE: 쿠키 자동 전송 → GET /api/user/me 로 사용자 정보 로드
```

세션 저장 설계:

- `sessions` 테이블(GORM/SQLite): `id`(랜덤 토큰, PK), `user_id`, `expires_at`, `created_at`
- 로그인 성공 시 세션 row 생성, 세션 ID를 **HttpOnly + SameSite + (프로덕션)Secure 쿠키**에 저장
- 세션 미들웨어: 쿠키의 세션 ID로 DB 조회 → 만료/유효성 확인 → `user_id`를 컨텍스트에 주입
- **로그아웃 = 세션 row 삭제**(서버측 즉시 무효화) — JWT 대비 핵심 차별점
- 구현은 라이브러리 없이 직접(Echo `c.SetCookie`/`c.Cookie`). `echo-contrib/session`은 SQLite 백엔드에
  커스텀 스토어가 필요해 더 복잡하므로 채택하지 않음.

### 3.4 보류 항목

- **A-2** (같은 이메일을 다른 provider로 가입 시 `Email` uniqueIndex 충돌 / 계정 연결):
  별도 주제로 범위가 큼. **구현 보류**, 블로그에 "한계" 각주 한 줄만 추가.

## 4. 블로그 재구성 (`index.md`)

하나의 글로 통합. 제안 목차:

1. 들어가며 — SNS 로그인의 이점, "OAuth와 세션 유지는 별개"
2. OAuth 2.0 핵심 개념 (기존 유지)
3. Google Cloud Console 설정 — redirect URI **두 개** 등록(프론트용/백엔드용)과 각 용도 설명
4. 공통 구현 — Provider, code 교환, findOrCreate(회원가입), state/CSRF (코드 수록)
5. **상태 유지 방식 ①: JWT (무상태)** — `sns-login-jwt` 흐름·코드, 토큰 타입 구분
6. **상태 유지 방식 ②: 세션 (서버 상태 + SQLite)** — `sns-login-session` 흐름·코드, 서버측 로그아웃
7. **JWT vs 세션 비교** — 표 + 선택 가이드
8. 마무리 — 프로덕션 고려사항(PKCE, Rotation, Secure Cookie, A-2 한계 각주)
9. 참고

JWT vs 세션 비교표(초안):

| 기준 | JWT (무상태) | 세션 (서버 상태) |
|------|-------------|-----------------|
| 상태 저장 | 클라이언트 보관, 서버 무상태 | 서버(SQLite 등)에 세션 저장 |
| 서버측 로그아웃/강제 차단 | 어려움(만료 전까지 유효) | 쉬움(row 삭제로 즉시 무효화) |
| 수평 확장 | 용이(공유 상태 불필요) | 세션 스토어 공유 필요 |
| 탈취 시 영향 | 만료까지 유효, 회수 어려움 | 즉시 회수 가능 |
| 저장 위치 보안 | localStorage(XSS) vs 쿠키 | HttpOnly 쿠키 |
| 적합 | FE/BE 분리, MSA, 무상태 API | 단일/소규모, 즉시 무효화 중요 |

GitHub 링크: 두 폴더(`web/sns-login-jwt`, `web/sns-login-session`) 모두 연결.
기존 `web/sns-login` 링크는 rename에 맞춰 갱신.

## 5. 작업 순서 (코드 먼저 → 블로그)

1. `tutorials-go`: `web/sns-login` → `web/sns-login-jwt` rename, JWT 버전 리뷰 수정(B-4/B-7/D-10/D-11/A-3) 적용, 빌드/테스트 통과
2. `tutorials-go`: `web/sns-login-session` 신규 구현(세션 테이블·쿠키·미들웨어·서버 로그아웃), 빌드/실행 확인
3. `blog-v2`: `index.md` 재구성(통합 글 + 비교표 + 두 링크 + A-2 각주)
4. 각 단계 feature 브랜치 → PR → 머지

## 6. 완료 기준

- 두 폴더가 각각 `docker compose up` 또는 로컬 실행으로 로그인→보호 API→로그아웃이 동작
- JWT 버전: refresh 토큰으로 보호 API 호출이 차단됨(B-4 검증)
- 세션 버전: 로그아웃 후 동일 쿠키로 보호 API 호출이 거부됨(서버측 무효화 검증)
- 블로그의 모든 코드 스니펫이 실제 샘플 코드와 일치
- 블로그에서 redirect_uri 설명이 각 버전의 실제 흐름과 일치(C-9 해소)
