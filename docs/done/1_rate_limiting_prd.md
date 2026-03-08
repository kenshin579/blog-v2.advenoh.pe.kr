# API Rate Limiting 사전 스터디 PRD

## 목적

API Rate Limiting에 대한 체계적인 스터디를 진행하고, 학습 내용을 블로그 포스트로 작성한다.

---

## 1. Rate Limiting이란?

### 1.1 정의
- 일정 시간 내 API 요청 수를 제한하는 기술
- 서버 과부하 방지, 공정한 리소스 분배, 악의적 사용 차단

### 1.2 왜 필요한가?
- **서버 보호**: DDoS, brute-force 공격 방어
- **공정성**: 특정 사용자의 리소스 독점 방지
- **비용 관리**: 클라우드 환경에서 인프라 비용 통제
- **SLA 준수**: 안정적인 서비스 품질 보장

---

## 2. 핵심 알고리즘

### 2.1 Fixed Window Counter
- 고정 시간 윈도우(예: 1분) 동안 요청 수 카운트
- 장점: 구현 간단, 메모리 효율적
- 단점: 윈도우 경계에서 burst 발생 가능 (2배까지)

### 2.2 Sliding Window Log
- 각 요청의 타임스탬프를 로그로 저장
- 장점: 정확한 제한
- 단점: 메모리 사용량 높음 (요청마다 타임스탬프 저장)

### 2.3 Sliding Window Counter
- Fixed Window + Sliding Window Log의 하이브리드
- 이전 윈도우와 현재 윈도우의 가중 평균 사용
- 장점: 정확도와 메모리 효율의 균형

### 2.4 Token Bucket
- 일정 속도로 토큰이 버킷에 추가됨
- 요청마다 토큰 1개 소비, 토큰 없으면 거부
- 장점: burst 트래픽 허용, 유연한 제어
- 단점: 분산 환경에서 동기화 복잡

### 2.5 Leaky Bucket
- 요청이 큐에 쌓이고 일정 속도로 처리
- 장점: 출력 속도 일정, 트래픽 평탄화
- 단점: burst 트래픽 시 대기 시간 증가

### 2.6 알고리즘 비교표

| 알고리즘 | 정확도 | 메모리 | Burst 허용 | 구현 난이도 |
|----------|--------|--------|-----------|------------|
| Fixed Window | 낮음 | O(1) | 윈도우 경계 문제 | 쉬움 |
| Sliding Window Log | 높음 | O(N) | 없음 | 보통 |
| Sliding Window Counter | 보통 | O(1) | 부분 허용 | 보통 |
| Token Bucket | 보통 | O(1) | 허용 | 보통 |
| Leaky Bucket | 높음 | O(N) | 없음 (큐잉) | 보통 |

---

## 3. 구현 시 고려사항

### 3.1 저장소 선택
- **In-Memory**: 단일 서버, 간단한 구현 (예: Go `sync.Map`, Java `ConcurrentHashMap`)
- **Redis**: 분산 환경 필수, atomic 연산 지원 (`INCR`, `EXPIRE`, Lua script)
- **비교 포인트**: 성능, 일관성, 장애 대응

### 3.2 Rate Limit Key 설계
- IP 기반: `rate:ip:{client_ip}`
- 사용자 기반: `rate:user:{user_id}`
- API Key 기반: `rate:apikey:{api_key}`
- 엔드포인트별: `rate:endpoint:{path}:{key}`
- 조합형: IP + 엔드포인트 등

### 3.3 HTTP 표준 헤더
```
X-RateLimit-Limit: 100        # 허용된 최대 요청 수
X-RateLimit-Remaining: 57     # 남은 요청 수
X-RateLimit-Reset: 1672531200 # 리셋 시간 (Unix timestamp)
Retry-After: 30               # 재시도까지 대기 시간 (초)
```
- HTTP 429 Too Many Requests 응답 코드

### 3.4 IETF 표준 초안 (RateLimit 헤더)
- `RateLimit-Policy`: 정책 정의
- `RateLimit`: 현재 상태
- 참고: draft-ietf-httpapi-ratelimit-headers

### 3.5 분산 환경 이슈
- **Race Condition**: 동시 요청 시 카운터 정확성
  - Redis Lua script로 atomic 처리
  - Redis `MULTI/EXEC` 트랜잭션
- **노드 간 동기화**: 각 노드의 로컬 카운터 vs 중앙 집중식
- **장애 대응**: Redis 다운 시 fallback 전략 (허용 vs 차단)

---

## 4. 실전 구현 패턴

### 4.1 미들웨어/인터셉터 패턴
- 애플리케이션 코드와 분리
- Go: `net/http` middleware, Echo middleware
- Java/Spring: `HandlerInterceptor`, `Filter`
- Node.js/Express: middleware function

### 4.2 API Gateway 레벨
- **Nginx**: `limit_req_zone`, `limit_req`
- **Kong**: Rate Limiting Plugin
- **AWS API Gateway**: Usage Plans + API Keys
- **Envoy**: Local/Global rate limiting

### 4.3 계층적 Rate Limiting
```
Global Limit: 10,000 req/min (전체 시스템)
  └─ Per-User Limit: 100 req/min
      └─ Per-Endpoint Limit: 20 req/min (예: POST /api/upload)
```

### 4.4 Graceful Degradation
- Soft limit: 경고 로그 + 모니터링 알림
- Hard limit: 요청 거부 (429)
- 우선순위 기반: 유료 사용자 > 무료 사용자

---

## 5. 블로그 포스트 구성안

### 포스트 1: "API Rate Limiting 완벽 가이드 - 개념과 알고리즘"
- [ ] Rate Limiting 개념 및 필요성
- [ ] 5가지 핵심 알고리즘 설명 (다이어그램 포함)
- [ ] 알고리즘별 장단점 비교
- [ ] 어떤 상황에 어떤 알고리즘을 선택할지 가이드

### 포스트 2: "Rate Limiting 구현 - Go/Redis 실전 예제"
- [ ] Go + Redis 기반 Token Bucket 구현
- [ ] Sliding Window Counter 구현
- [ ] HTTP 응답 헤더 처리
- [ ] 미들웨어 패턴 적용
- [ ] 각 알고리즘별 Unit Test 작성
  - Fixed Window: 윈도우 내 제한, 윈도우 리셋 후 허용, 경계값 테스트
  - Sliding Window Counter: 가중 평균 계산 검증, 윈도우 슬라이딩 동작
  - Token Bucket: 토큰 소비/리필, burst 허용, 토큰 부족 시 거부
  - Leaky Bucket: 큐 처리 속도 일정, 큐 초과 시 거부
- [ ] 미들웨어 통합 테스트 (HTTP 429 응답, RateLimit 헤더 검증)
- [ ] Redis 연동 테스트 (testcontainers 또는 miniredis 활용)

### 포스트 3: "분산 환경에서의 Rate Limiting"
- [ ] 분산 환경 이슈와 해결 방법 (Race Condition, 노드 간 동기화)
- [ ] API Gateway vs 애플리케이션 레벨 비교
- [ ] 실제 서비스 사례 분석 (GitHub API, Stripe API, Cloudflare 등)
- [ ] Redis Cluster 환경에서의 Rate Limiting
- [ ] 장애 대응 전략 (Redis 다운 시 fallback)

---

## 6. 스터디할 레퍼런스

### 필수 자료
- [ ] [System Design Interview - Rate Limiter (Alex Xu)](https://bytebytego.com)
- [ ] [Redis 공식 문서 - Rate Limiting 패턴](https://redis.io/glossary/rate-limiting)
- [ ] [Stripe API Rate Limiting 구현 사례](https://stripe.com/docs/rate-limits)
- [ ] [GitHub API Rate Limiting](https://docs.github.com/en/rest/rate-limit)

### 구현 참고
- [ ] [Go rate limiter 패키지](https://pkg.go.dev/golang.org/x/time/rate)
- [ ] [go-redis/redis_rate](https://github.com/go-redis/redis_rate)
- [ ] [Nginx rate limiting](https://www.nginx.com/blog/rate-limiting-nginx/)
- [ ] [IETF RateLimit Header Fields](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/)

### 심화 자료
- [ ] [Google Cloud API Design Guide - Errors](https://cloud.google.com/apis/design/errors)
- [ ] [Cloudflare Rate Limiting 아키텍처](https://blog.cloudflare.com/counting-things-a-lot-of-different-things/)

---

## 7. 논의 결과

| 항목 | 결정 |
|------|------|
| 블로그 포스트 형식 | **시리즈** (3편) |
| 구현 언어 | **Go** |
| 실습 환경 | **Docker Compose** (Redis 포함) |
| 성능 벤치마크 | 포함하지 않음 |
| 코드 저장 위치 | `tutorials-go/rate-limiting/` |

### 코드 디렉토리 구조
- 상세 구조는 `1_rate_limiting_implementation.md` 참조
