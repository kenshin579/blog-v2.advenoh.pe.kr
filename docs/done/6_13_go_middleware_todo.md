# Go에서 미들웨어 패턴 구현하기 - TODO

> 참조: `6_13_go_middleware_prd.md`, `6_13_go_middleware_implementation.md`

---

## Phase 1: 샘플 코드 작성 (tutorials-go)

### 프로젝트 초기화
- [x] `tutorials-go/golang/middleware/` 디렉토리 생성
- [x] `go.mod` 초기화 (echo/v4, golang-jwt/v5, zap, testify)
- [x] 의존성 설치 및 `go mod tidy`

### 빌트인 미들웨어 예제
- [x] `builtin/main.go` - Echo 빌트인 미들웨어 설정 예제
  - [x] 로깅/추적: RequestLoggerWithConfig (zap 연동), RequestID
  - [x] 보안: CORS, Secure
  - [x] 안정성/성능: Recover, RateLimiter, BodyLimit, Gzip, Timeout

### 커스텀 미들웨어 구현
- [x] `custom/logging.go` - 구조화된 로깅 미들웨어 (zap 연동)
  - [x] ZapLoggerConfig 구조체 (Skipper 포함)
  - [x] ZapLogger / ZapLoggerWithConfig 함수
- [x] `custom/jwt_auth.go` - JWT 인증 미들웨어
  - [x] JWTConfig 구조체 (SigningKey, Skipper, ContextKey)
  - [x] Bearer 토큰 추출 및 검증
  - [x] Skipper 패턴 (공개 API 경로 제외)
  - [x] Context에 클레임 저장

### 테스트
- [x] `custom/logging_test.go` - 로깅 미들웨어 테스트 (3개)
- [x] `custom/jwt_auth_test.go` - JWT 인증 미들웨어 테스트 (7개)
  - [x] 유효한 토큰 → 200 + 클레임 저장 확인
  - [x] 만료된 토큰 → 401
  - [x] 토큰 누락 → 401
  - [x] Skipper 경로 → 인증 건너뛰기
  - [x] 커스텀 ContextKey
  - [x] 잘못된 형식
  - [x] 다른 서명 키
- [x] `go test ./...` 전체 통과 확인 (10/10 PASS)

### 통합 예제 서버
- [x] `main.go` - 빌트인 + 커스텀 미들웨어 조합 서버
  - [x] 글로벌 미들웨어 체인 (Recover → RequestID → Logger → CORS)
  - [x] 공개 엔드포인트 (/health, /login)
  - [x] 인증 그룹 (/api/* - JWT 미들웨어 적용)

---

## Phase 2: 블로그 글 작성 (blog-v2)

### 초안 작성
- [ ] `docs/start/6_13_go_middleware/index.md` 생성
- [ ] frontmatter 작성 (title, description, date, tags, series)
- [ ] 2.1 미들웨어 개념
  - [ ] 미들웨어 정의 및 횡단 관심사 설명
  - [ ] 양파 모델 Mermaid 다이어그램
  - [ ] Echo 미들웨어 시그니처 설명
  - [ ] 미들웨어 등록 방법 (글로벌/그룹/라우트)
- [ ] 2.2 Echo 빌트인 미들웨어
  - [ ] 로깅/추적 그룹: Logger, RequestID
  - [ ] 보안 그룹: CORS, Secure
  - [ ] 안정성/성능 그룹: Recover, RateLimiter, BodyLimit, Gzip, Timeout
  - [ ] 각 미들웨어 코드 예제 + Config 옵션
- [ ] 2.3 커스텀 미들웨어 구현
  - [ ] 구조화된 로깅 미들웨어 (zap 연동) 코드 + 설명
  - [ ] JWT 인증 미들웨어 코드 + 상세 설명
  - [ ] 기존 블로그 참조 링크 (JWKS, Keycloak)
- [ ] 2.4 실전 활용
  - [ ] 미들웨어 순서 중요성 설명 + 다이어그램
  - [ ] Skipper 패턴
  - [ ] 미들웨어 팩토리 패턴
  - [ ] 테스트 작성법 (httptest 활용)
- [ ] GitHub 샘플 코드 링크 추가
- [ ] UTF-8 인코딩 확인 (`file -I`)

### 리뷰 준비
- [ ] PR 생성 (feature 브랜치)
