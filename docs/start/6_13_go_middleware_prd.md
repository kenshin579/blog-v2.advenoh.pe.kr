# Go에서 미들웨어 패턴 구현하기 PRD

> 시리즈: Golang 블로그 주제 Phase 5 - 신규 주제 (2/3)
> 참조: `6_golang_topic_prd.md` P3-2

---

## 1. 개요

Echo 프레임워크의 미들웨어 패턴을 다룬다. 빌트인 미들웨어 활용법과 로깅, JWT 인증 등 커스텀 미들웨어를 직접 구현하며, 실무에서의 조합 패턴과 테스트 방법까지 다룬다.

**대상 독자**: Go 웹 개발 경험이 있는 개발자
**난이도**: 중급
**예제 코드**: 신규 작성 필요 (일부 참고: `project-layout/`, `keycloak/backend/`)

---

## 2. 블로그 구조

> **범위**: Echo 프레임워크 미들웨어만 다룬다. net/http 표준 미들웨어, chi/gin 등 다른 프레임워크는 제외한다.

### 2.1 미들웨어 개념
- 요청/응답 처리 파이프라인의 중간 레이어
- 횡단 관심사(Cross-cutting Concerns) 분리
- 미들웨어 체인 실행 순서 (양파 모델) - Mermaid 다이어그램
- Echo 미들웨어 시그니처: `echo.MiddlewareFunc`
- 미들웨어 등록 방법
  - `e.Use()` - 글로벌 미들웨어
  - `e.Group("/api", middleware...)` - 그룹별 미들웨어
  - `e.GET("/path", handler, middleware...)` - 라우트별 미들웨어

### 2.2 Echo 빌트인 미들웨어

#### 로깅/추적
- `middleware.Logger()` - 요청/응답 로깅 (커스텀 포맷 설정)
- `middleware.RequestID()` - UUID 요청 추적 ID 생성

#### 보안
- `middleware.CORSWithConfig()` - CORS 설정 (Origin, Methods, Headers)
- `middleware.Secure()` - 보안 헤더 (XSS, HSTS 등)

#### 안정성/성능
- `middleware.Recover()` - 패닉 복구로 서버 크래시 방지
- `middleware.RateLimiter()` - 요청 속도 제한
- `middleware.BodyLimit()` - 요청 본문 크기 제한
- `middleware.Gzip()` - 응답 압축
- `middleware.TimeoutWithConfig()` - 요청 타임아웃

### 2.3 커스텀 미들웨어 구현

#### 구조화된 로깅 미들웨어
- 요청/응답 로깅 (메서드, 경로, 상태코드, 소요시간)
- zap 연동

#### JWT 인증 미들웨어
- JWT 토큰 검증 미들웨어 구현 (토큰 파싱, 클레임 검증)
- Skipper 패턴: 공개 API 경로 제외
- Context에 사용자 정보 저장 및 핸들러에서 활용
- JWT/JWKS 개념은 기존 블로그 글 참조 링크로 대체:
  - [JWKS(JSON Web Key Set)이란?](/article/jwks-json-web-key-set이란)
  - [Keycloak으로 자체 인증 서버 구축](/article/Keycloak으로-자체-인증-서버-구축)

### 2.4 실전 활용
- 미들웨어 순서의 중요성 (Recover → Logger → Auth → Handler)
- 조건부 미들웨어: Skipper 함수로 특정 경로만 적용/제외
- 미들웨어 팩토리: 설정값을 받아 미들웨어 생성
- 테스트: Echo 테스트 유틸리티 (`echo.New()`, `httptest`)
  - 미들웨어 개별 단위 테스트
  - 미들웨어 체인 통합 테스트

---

## 3. 샘플 코드 계획

신규 작성 필요. 예상 구조:

```
tutorials-go/golang/middleware/
├── builtin/
│   └── main.go                 # Echo 빌트인 미들웨어 설정 예제
├── custom/
│   ├── middleware.go           # 커스텀 미들웨어 (로깅, JWT 인증)
│   └── middleware_test.go      # 미들웨어 테스트
├── main.go                     # 통합 예제 서버
└── go.mod
```

기존 참고 코드:
- `project-layout/go-clean-arch-v2/pkg/middleware/` (CORS)
- `keycloak/backend/` (JWT 인증)

---

## 4. 논의 사항 (결정 완료)

- [x] Echo 미들웨어만 다룬다 (net/http 표준 미들웨어 제외)
- [x] chi, gin 등 다른 프레임워크 미들웨어 비교 제외
- [x] JWT 검증 구현을 상세히 다루되, JWT/JWKS 개념은 기존 블로그 글 링크로 대체
  - 참조: `contents/go/jwks-json-web-key-set이란/index.md`
  - 참조: `contents/java/Keycloak으로-자체-인증-서버-구축/index.md`
- [x] Echo 빌트인 미들웨어 소개 섹션 추가 (Logger, Recover, CORS, RequestID, RateLimiter, BodyLimit, Gzip, Secure, Timeout)
- [x] 작업량: 대형 작업 (코드 전량 신규 작성 필요, JWT 상세 구현 포함)
