# Rate Limiting과 Circuit Breaker 패턴 PRD

> 시리즈: Golang 블로그 주제 Phase 5 - 신규 주제 (3/3)
> 참조: `6_golang_topic_prd.md` P3-3

---

## 1. 개요

분산 시스템에서 서비스 안정성을 확보하기 위한 두 가지 핵심 패턴. Rate Limiting으로 트래픽을 제어하고, Circuit Breaker로 장애 전파를 차단한다. Go 표준 라이브러리와 인기 서드파티 라이브러리를 활용한 구현법을 다룬다.

**대상 독자**: 백엔드 서비스 안정성에 관심 있는 중급 이상 개발자
**난이도**: 중고급
**예제 코드**: 신규 작성 필요

---

## 2. 블로그 구조

### 2.1 왜 필요한가?
- 과도한 트래픽으로 인한 서비스 장애 시나리오
- 외부 서비스 장애가 내부로 전파되는 Cascading Failure
- 방어적 프로그래밍의 핵심 패턴

### 2.2 Rate Limiting

#### 알고리즘 개요
- **Token Bucket**: 일정 속도로 토큰 충전, 요청 시 토큰 소비
- **Leaky Bucket**: 일정 속도로만 처리, 초과분 대기/거부
- **Fixed Window**: 고정 시간 창 내 요청 수 제한
- **Sliding Window**: 이동 시간 창으로 더 정확한 제한

#### Go 표준 라이브러리
- `golang.org/x/time/rate`: Token Bucket 구현
- `rate.NewLimiter(rate, burst)` - 리미터 생성
- `Allow()`, `Wait()`, `Reserve()` - 3가지 사용 방식
- HTTP 미들웨어로 적용

#### 분산 Rate Limiting
- Redis 기반 Rate Limiting (여러 서버 인스턴스 공유)
- Sliding Window Counter 패턴
- `go-redis/redis_rate` 라이브러리

### 2.3 Circuit Breaker

#### 상태 머신
- **Closed** (정상): 요청 통과, 실패 횟수 카운트
- **Open** (차단): 요청 즉시 거부, 타임아웃 대기
- **Half-Open** (시험): 일부 요청 허용, 성공 시 Closed로 복귀

#### Go 구현
- `sony/gobreaker`: 가장 널리 사용되는 Circuit Breaker
- `gobreaker.NewCircuitBreaker(settings)` - 생성
- `cb.Execute(func() (interface{}, error))` - 실행
- 설정: MaxRequests, Interval, Timeout, ReadyToTrip

#### 실전 패턴
- HTTP 클라이언트에 Circuit Breaker 적용
- 외부 API 호출 보호
- Fallback 전략: 캐시 데이터 반환, 기본값 사용

### 2.4 두 패턴의 조합
- Rate Limiting + Circuit Breaker 함께 적용
- 미들웨어 체인에서의 위치와 순서
- 모니터링: 메트릭 수집 (제한 횟수, 차단 횟수)

### 2.5 테스트 전략
- Rate Limiter 테스트: 시간 기반 테스트 패턴
- Circuit Breaker 테스트: 상태 전이 검증
- 동시성 테스트: goroutine으로 부하 시뮬레이션

---

## 3. 샘플 코드 계획

신규 작성 필요. 예상 구조:

```
tutorials-go/golang/resilience/
├── ratelimit/
│   ├── token_bucket.go         # x/time/rate 활용
│   ├── token_bucket_test.go
│   ├── middleware.go           # HTTP 미들웨어
│   └── redis_limiter.go       # 분산 Rate Limiting
├── circuitbreaker/
│   ├── breaker.go             # gobreaker 활용
│   ├── breaker_test.go
│   └── http_client.go        # HTTP 클라이언트 래핑
├── combined/
│   └── main.go               # 두 패턴 조합 예제
└── README.md
```

---

## 4. 논의 사항

- [ ] Rate Limiting과 Circuit Breaker를 한 글에 다룰지, 분리할지
- [ ] 알고리즘 설명 깊이: 이론 중심 vs 구현 중심
- [ ] 분산 Rate Limiting (Redis 기반)까지 다루면 범위가 넓어짐
- [ ] Retry 패턴 (backoff, jitter)도 함께 다룰지
- [ ] Mermaid 상태 다이어그램으로 Circuit Breaker 시각화
- [ ] 코드 전체를 신규 작성해야 하므로 작업량 확인
- [ ] `failsafe-go` (최신 라이브러리) vs `gobreaker` 선택
