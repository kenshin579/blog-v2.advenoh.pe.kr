# Go Circuit Breaker 패턴 완벽 가이드 - TODO

> 참조: `6_15_go_circuit_breaker_prd.md`, `6_15_go_circuit_breaker_implementation.md`

---

## Phase 1: 샘플 코드 작성 (tutorials-go)

### 프로젝트 셋업
- [x] `tutorials-go/golang/resilience/circuitbreaker/` 디렉토리 생성
- [x] go.mod에 의존성 추가 (sony/gobreaker/v2, failsafe-go, testify)
- [x] `go mod tidy`

### sony/gobreaker 구현
- [x] `gobreaker_example.go` - 기본 사용법
  - [x] NewBreaker 생성자 (Settings 설정)
  - [x] Execute 래퍼 함수
- [x] `gobreaker_example_test.go`
  - [x] 정상 요청 → Closed 상태 유지
  - [x] 연속 실패 → Open 전환 확인
  - [x] Timeout 경과 → Half-Open 전환
  - [x] Half-Open에서 성공 → Closed 복귀
  - [x] Half-Open에서 실패 → Open 재전환
- [x] `gobreaker_http.go` - HTTP 클라이언트 래핑
  - [x] ProtectedHTTPClient 구조체
  - [x] Do(req) 메서드 (5xx = 실패 처리)
- [x] `gobreaker_http_test.go`
  - [x] httptest.NewServer로 정상/5xx 응답 시뮬레이션
  - [x] Circuit Open 시 즉시 거부 확인
  - [x] 서버 복구 후 Half-Open → Closed 확인

### failsafe-go 구현
- [x] `failsafe_example.go` - Circuit Breaker
  - [x] Count-based Circuit Breaker
  - [x] Time-based Circuit Breaker
- [x] `failsafe_example_test.go`
  - [x] Count-based: 실패 횟수 기반 Open 전환
  - [x] Time-based: 실패율 기반 Open 전환
  - [x] 상태 전이 전체 사이클 검증
- [x] `failsafe_composed.go` - 정책 조합
  - [x] Fallback + Retry + Circuit Breaker 조합
  - [x] 정책 순서 설정
- [x] `failsafe_composed_test.go`
  - [x] CB Open 시 Fallback 반환 확인
  - [x] 일시적 실패 → Retry 후 성공
  - [x] Retry 소진 + CB Open → Fallback

### 전체 검증
- [x] `go test ./...` 전체 통과 확인 (14/14 PASS)
- [x] `go vet ./...` 정적 분석 통과
- [x] README.md 업데이트

---

## Phase 2: 블로그 글 작성 (blog-v2)

### 초안 작성
- [x] `docs/start/go-circuit-breaker-패턴-완벽-가이드/index.md` 생성
- [x] frontmatter 작성 (title, description, date, tags, series)
- [x] # 1. Circuit Breaker란?
  - [x] Cascading Failure 설명
  - [x] 전기 회로 차단기 비유
  - [x] Mermaid sequence diagram: 장애 전파 시나리오
- [x] # 2. Circuit Breaker 상태 머신
  - [x] ## 2.1 3가지 상태 - Mermaid state diagram
  - [x] ## 2.2 상태 전이 조건 설명
  - [x] ## 2.3 Count-based vs Time-based 비교표
- [x] # 3. Go 구현 - sony/gobreaker
  - [x] ## 3.1 기본 사용법 - Settings + Execute 코드 스니펫
  - [x] ## 3.2 HTTP 클라이언트 적용 - ProtectedHTTPClient 코드
- [x] # 4. Go 구현 - failsafe-go
  - [x] ## 4.1 failsafe-go 소개
  - [x] ## 4.2 Circuit Breaker - count/time-based 코드 스니펫
  - [x] ## 4.3 정책 조합 패턴 - Mermaid flowchart + 코드
  - [x] ## 4.4 gobreaker vs failsafe-go 비교표
- [x] # 5. 실전 적용
  - [x] ## 5.1 Fallback 전략 4가지
  - [x] ## 5.2 테스트 전략 - 상태 전이/mock/동시성
- [x] # 마무리
- [x] # 참고
- [x] GitHub 샘플 코드 링크 추가
- [x] UTF-8 인코딩 확인 (`file -I`)

### 리뷰 준비
- [ ] PR 생성 (feature 브랜치)
