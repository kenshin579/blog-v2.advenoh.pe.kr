# Go Circuit Breaker 패턴 완벽 가이드 PRD

> 시리즈: Golang 블로그 주제 Phase 5 - 신규 주제 (3/3-b)
> 참조: `6_golang_topic_prd.md` P3-3
> 관련: `6_14_go_rate_limiting_prd.md` (Rate Limiting 별도 PRD)

---

## 1. 개요

외부 서비스 장애가 내부로 전파되는 Cascading Failure를 방지하기 위한 Circuit Breaker 패턴을 다룬다. 상태 머신 이론을 중심으로 설명하고, Go에서 가장 널리 쓰이는 `sony/gobreaker`와 최신 통합 라이브러리 `failsafe-go`를 활용한 구현법을 보여준다. Fallback 전략과 실전 적용 패턴도 포함한다.

**대상 독자**: 백엔드 서비스 안정성에 관심 있는 중급 이상 개발자
**난이도**: 중급
**예제 코드**: 신규 작성 필요

---

## 2. 블로그 목차

> 블로그 글의 heading 구조 (`# 1.` → `## 1.1` → `### 1.1.1`)

```
# 1. Circuit Breaker란?
  - 외부 서비스 장애 → 내부 서비스 연쇄 장애 (Cascading Failure)
  - 타임아웃 누적으로 스레드/고루틴 고갈
  - 전기 회로의 차단기(circuit breaker) 비유
  - Mermaid sequence diagram: 장애 전파 시나리오 시각화

# 2. Circuit Breaker 상태 머신
  ## 2.1 3가지 상태 (Mermaid state diagram)
    - Closed (정상): 요청 통과, 실패 횟수 카운트
    - Open (차단): 요청 즉시 거부 (fail-fast), 타임아웃 대기
    - Half-Open (시험): 제한된 요청 허용, 결과에 따라 상태 전이
  ## 2.2 상태 전이 조건
    - Closed → Open: 실패율이 임계값 초과 (count-based 또는 time-based)
    - Open → Half-Open: 대기 시간(timeout) 경과
    - Half-Open → Closed: 시험 요청 성공
    - Half-Open → Open: 시험 요청 실패
  ## 2.3 Count-based vs Time-based Thresholding
    - Count-based: 연속 N회 실패 시 Open (간단)
    - Time-based: 시간 윈도우 내 실패율 기준 (정밀)
    - 각 방식의 장단점 비교표

# 3. Go 구현 - sony/gobreaker
  ## 3.1 기본 사용법
    - gobreaker.NewCircuitBreaker(settings) 생성
    - cb.Execute(func() (interface{}, error)) 실행
    - Settings: MaxRequests, Interval, Timeout, ReadyToTrip, OnStateChange
    - 핵심 코드 스니펫
  ## 3.2 HTTP 클라이언트에 적용
    - 외부 API 호출을 Circuit Breaker로 래핑
    - http.Client와 조합하는 패턴
    - 코드 스니펫

# 4. Go 구현 - failsafe-go
  ## 4.1 failsafe-go 소개
    - 2.2k stars, 2026년 2월 최신 업데이트
    - Circuit Breaker + Retry + Fallback + Timeout + Hedge 등 통합
    - Composable 아키텍처: 정책을 자유롭게 조합
  ## 4.2 Circuit Breaker
    - Count-based + Time-based 모두 지원 (gobreaker 대비 장점)
    - circuitbreaker.WithDefaults[T]() 간편 생성
    - circuitbreaker.Builder[T]() 상세 설정
    - 핵심 코드 스니펫
  ## 4.3 정책 조합 패턴
    - Fallback + Retry + Circuit Breaker 조합
    - 정책 순서가 동작에 미치는 영향
    - Mermaid flowchart로 조합 흐름 시각화
  ## 4.4 sony/gobreaker vs failsafe-go 비교
    | 기능 | sony/gobreaker | failsafe-go |
    | Stars | 3.5k | 2.2k |
    | Thresholding | Count-based only | Count + Time-based |
    | 정책 조합 | 불가 | 가능 |
    | 추천 시나리오 | 단순 CB | 복합 resilience |

# 5. 실전 적용
  ## 5.1 Fallback 전략
    - 캐시 데이터 반환
    - 기본값(default value) 사용
    - 대체 서비스(secondary service) 호출
    - 우아한 성능 저하(graceful degradation)
  ## 5.2 테스트 전략
    - 상태 전이 검증: Closed → Open → Half-Open → Closed
    - Mock 서버로 실패/성공 시나리오 시뮬레이션
    - 동시성 테스트: goroutine으로 동시 요청

# 마무리

# 참고
```

---

## 3. 샘플 코드 계획

```
tutorials-go/golang/resilience/
├── circuitbreaker/
│   ├── gobreaker_example.go       # sony/gobreaker 기본 사용법
│   ├── gobreaker_example_test.go
│   ├── gobreaker_http.go          # HTTP 클라이언트 래핑
│   ├── gobreaker_http_test.go
│   ├── failsafe_example.go        # failsafe-go Circuit Breaker
│   ├── failsafe_example_test.go
│   ├── failsafe_composed.go       # Fallback + Retry + CB 조합
│   └── failsafe_composed_test.go
└── README.md
```

---

## 4. 사용 라이브러리

| 라이브러리 | 버전 | 용도 | Stars |
|-----------|------|------|-------|
| `github.com/sony/gobreaker/v2` | v2 | Circuit Breaker (경량) | 3.5k |
| `github.com/failsafe-go/failsafe-go` | v0.9.6 | 통합 Resilience (CB + Retry + Fallback) | 2.2k |
| `github.com/stretchr/testify` | latest | 테스트 assertion | 23k+ |

---

## 5. 작업량 추정

### 블로그 글 작성
- 상태 머신 이론 + Mermaid 다이어그램 3~4개: **2~3시간**
- gobreaker 코드 스니펫 + 설명: **1~2시간**
- failsafe-go 코드 스니펫 + 비교: **2시간**
- Fallback 전략: **1시간**
- **소계: 6~8시간**

### 샘플 코드 작성
- gobreaker 예제 + 테스트: **2시간**
- failsafe-go 예제 + 조합 패턴 + 테스트: **2~3시간**
- **소계: 4~5시간**

### 전체 예상: **10~13시간** (2일)

---

## 6. 논의 사항 (결정 완료)

- [x] Rate Limiting과 분리 → **별도 PRD** (`6_14_go_rate_limiting_prd.md`)
- [x] 알고리즘 설명 → **이론 중심**, 구현은 핵심 샘플 코드만
- [x] 시각화 → **Mermaid** 다이어그램 사용
- [x] 라이브러리 → gobreaker v2 + failsafe-go 둘 다 다룸 (비교)
- [x] failsafe-go로 정책 조합 패턴 포함
