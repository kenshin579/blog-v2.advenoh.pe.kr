# Go Circuit Breaker 패턴 완벽 가이드 - TODO

> 참조: `6_15_go_circuit_breaker_prd.md`, `6_15_go_circuit_breaker_implementation.md`

---

## Phase 1: 샘플 코드 작성 (tutorials-go)

### 프로젝트 셋업
- [ ] `tutorials-go/golang/resilience/circuitbreaker/` 디렉토리 생성
- [ ] go.mod에 의존성 추가 (sony/gobreaker/v2, failsafe-go, testify)
- [ ] `go mod tidy`

### sony/gobreaker 구현
- [ ] `gobreaker_example.go` - 기본 사용법
  - [ ] NewBreaker 생성자 (Settings 설정)
  - [ ] Execute 래퍼 함수
- [ ] `gobreaker_example_test.go`
  - [ ] 정상 요청 → Closed 상태 유지
  - [ ] 연속 실패 → Open 전환 확인
  - [ ] Timeout 경과 → Half-Open 전환
  - [ ] Half-Open에서 성공 → Closed 복귀
  - [ ] Half-Open에서 실패 → Open 재전환
- [ ] `gobreaker_http.go` - HTTP 클라이언트 래핑
  - [ ] ProtectedHTTPClient 구조체
  - [ ] Do(req) 메서드 (5xx = 실패 처리)
- [ ] `gobreaker_http_test.go`
  - [ ] httptest.NewServer로 정상/5xx 응답 시뮬레이션
  - [ ] Circuit Open 시 즉시 거부 확인
  - [ ] 서버 복구 후 Half-Open → Closed 확인

### failsafe-go 구현
- [ ] `failsafe_example.go` - Circuit Breaker
  - [ ] Count-based Circuit Breaker
  - [ ] Time-based Circuit Breaker
- [ ] `failsafe_example_test.go`
  - [ ] Count-based: 실패 횟수 기반 Open 전환
  - [ ] Time-based: 실패율 기반 Open 전환
  - [ ] 상태 전이 전체 사이클 검증
- [ ] `failsafe_composed.go` - 정책 조합
  - [ ] Fallback + Retry + Circuit Breaker 조합
  - [ ] 정책 순서 설정
- [ ] `failsafe_composed_test.go`
  - [ ] CB Open 시 Fallback 반환 확인
  - [ ] 일시적 실패 → Retry 후 성공
  - [ ] Retry 소진 + CB Open → Fallback

### 전체 검증
- [ ] `go test ./...` 전체 통과 확인
- [ ] `go vet ./...` 정적 분석 통과
- [ ] README.md 업데이트

---

## Phase 2: 블로그 글 작성 (blog-v2)

### 초안 작성
- [ ] `docs/start/go-circuit-breaker-패턴-완벽-가이드/index.md` 생성
- [ ] frontmatter 작성 (title, description, date, tags, series)
- [ ] # 1. Circuit Breaker란?
  - [ ] Cascading Failure 설명
  - [ ] 전기 회로 차단기 비유
  - [ ] Mermaid sequence diagram: 장애 전파 시나리오
- [ ] # 2. Circuit Breaker 상태 머신
  - [ ] ## 2.1 3가지 상태 - Mermaid state diagram
  - [ ] ## 2.2 상태 전이 조건 설명
  - [ ] ## 2.3 Count-based vs Time-based 비교표
- [ ] # 3. Go 구현 - sony/gobreaker
  - [ ] ## 3.1 기본 사용법 - Settings + Execute 코드 스니펫
  - [ ] ## 3.2 HTTP 클라이언트 적용 - ProtectedHTTPClient 코드
- [ ] # 4. Go 구현 - failsafe-go
  - [ ] ## 4.1 failsafe-go 소개
  - [ ] ## 4.2 Circuit Breaker - count/time-based 코드 스니펫
  - [ ] ## 4.3 정책 조합 패턴 - Mermaid flowchart + 코드
  - [ ] ## 4.4 gobreaker vs failsafe-go 비교표
- [ ] # 5. 실전 적용
  - [ ] ## 5.1 Fallback 전략 4가지
  - [ ] ## 5.2 테스트 전략 - 상태 전이/mock/동시성
- [ ] # 마무리
- [ ] # 참고
- [ ] GitHub 샘플 코드 링크 추가
- [ ] UTF-8 인코딩 확인 (`file -I`)

### 리뷰 준비
- [ ] PR 생성 (feature 브랜치)
