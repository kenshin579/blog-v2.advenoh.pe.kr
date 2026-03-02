# Go에서 미들웨어 패턴 구현하기 PRD

> 시리즈: Golang 블로그 주제 Phase 5 - 신규 주제 (2/3)
> 참조: `6_golang_topic_prd.md` P3-2

---

## 1. 개요

HTTP 미들웨어 패턴을 Go에서 구현하는 방법. 표준 라이브러리 `net/http`의 미들웨어 체인과 Echo 프레임워크의 미들웨어를 비교하며, 로깅, 인증, CORS, 에러 복구 등 실무에서 필수적인 미들웨어를 직접 만든다.

**대상 독자**: Go 웹 개발 경험이 있는 개발자
**난이도**: 중급
**예제 코드**: 신규 작성 필요 (일부 참고: `project-layout/`, `keycloak/backend/`)

---

## 2. 블로그 구조

### 2.1 미들웨어란?
- 요청/응답 처리 파이프라인의 중간 레이어
- 횡단 관심사(Cross-cutting Concerns) 분리
- 미들웨어 체인 실행 순서 (양파 모델)

### 2.2 net/http 표준 미들웨어
- `http.Handler` 인터페이스와 `http.HandlerFunc`
- 미들웨어 시그니처: `func(next http.Handler) http.Handler`
- 체인 구성: 함수 합성으로 미들웨어 스택 구성
- 직접 구현: 로깅 미들웨어 예제

### 2.3 Echo 프레임워크 미들웨어
- Echo 미들웨어 시그니처: `echo.MiddlewareFunc`
- `e.Use()` - 글로벌 미들웨어 등록
- 그룹/라우트별 미들웨어 적용
- 참고 코드: `go-clean-arch-v2/pkg/middleware/middleware.go` (CORS)

### 2.4 필수 미들웨어 구현

#### 로깅 미들웨어
- 요청/응답 로깅 (메서드, 경로, 상태코드, 소요시간)
- 구조화된 로깅 (logrus/zap 연동)

#### 인증 미들웨어
- JWT 토큰 검증
- 인증 건너뛰기 (Skip) 패턴: 공개 API 경로 제외
- Context에 사용자 정보 저장

#### CORS 미들웨어
- Origin, Methods, Headers 설정
- Preflight 요청 처리
- 참고 코드: `go-clean-arch-v2/pkg/middleware/`

#### Recover 미들웨어
- 패닉 복구로 서버 크래시 방지
- 에러 로깅 + 500 응답 반환

#### 요청 ID 미들웨어
- UUID 기반 요청 추적 ID 생성
- 헤더/Context에 전파

### 2.5 미들웨어 조합 패턴
- 미들웨어 순서의 중요성 (Recover → Logger → Auth → Handler)
- 조건부 미들웨어: 특정 경로만 적용
- 미들웨어 팩토리: 설정값을 받아 미들웨어 생성

### 2.6 테스트 작성
- `httptest.NewRecorder()` 활용
- 미들웨어 개별 테스트
- 체인 통합 테스트

---

## 3. 샘플 코드 계획

신규 작성 필요. 예상 구조:

```
tutorials-go/golang/middleware/
├── standard/
│   ├── middleware.go           # net/http 기반 미들웨어
│   └── middleware_test.go
├── echo/
│   ├── middleware.go           # Echo 기반 미들웨어
│   └── middleware_test.go
├── main.go                     # 통합 예제 서버
└── README.md
```

기존 참고 코드:
- `project-layout/go-clean-arch-v2/pkg/middleware/` (CORS)
- `keycloak/backend/` (JWT 인증)

---

## 4. 논의 사항

- [ ] net/http 표준 미들웨어와 Echo 미들웨어를 모두 다룰지, 하나만 다룰지
- [ ] chi, gin 등 다른 프레임워크 미들웨어 비교 포함 여부
- [ ] 인증 미들웨어: JWT 검증 구현을 상세히 할지 (JWKS 블로그 글 참조 링크)
- [ ] Echo 빌트인 미들웨어(Logger, Recover, CORS) 소개도 포함할지
- [ ] 코드 신규 작성이 필요하므로 작업량 확인
