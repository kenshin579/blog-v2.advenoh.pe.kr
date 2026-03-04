# Go에서 Redis 활용하기 - 구현 계획

> PRD: `6_5_go_redis_prd.md`

---

## 1. 현황 분석

### 1.1 이미 구현된 것

| 항목 | 위치 | 상태 |
|------|------|------|
| 기본 Set/Get (String, Struct) | `database/redis/redis/redis_test.go` | ✅ 완료 |
| Sorted Set + 성능 테스트 | `database/redis/redis/redis_performance_test.go` | ✅ 완료 |
| Redis Cluster 연결/테스트 | `database/redis/cluster/cluster_test.go` | ✅ 완료 |
| 분산 락 (redsync) | `golang/concurrency/waitgroup/account/account_redsync.go` | ✅ 완료 |
| 분산 락 (redislock) | `golang/concurrency/waitgroup/account/account_redislock.go` | ✅ 완료 |
| Docker Compose (standalone) | `database/redis/docker-compose.yml` | ✅ 완료 |

### 1.2 신규 구현 필요

| 항목 | 위치 (예정) | 상태 |
|------|------------|------|
| Pub/Sub 예제 | `database/redis/redis/pubsub_test.go` | ❌ 미구현 |
| Redis Stream 예제 | `database/redis/redis/stream_test.go` | ❌ 미구현 |
| miniredis 테스트 | `database/redis/redis/miniredis_test.go` | ❌ 미구현 |
| 블로그 글 (index.md) | `docs/start/go-redis-활용하기/index.md` | ❌ 미작성 |

### 1.3 의존성 현황 (go.mod)

이미 등록된 의존성 (추가 설치 불필요):
- `github.com/redis/go-redis/v9 v9.0.3`
- `github.com/go-redsync/redsync/v4 v4.5.1`
- `github.com/bsm/redislock v0.8.0`
- `github.com/alicebob/miniredis/v2 v2.30.0`

---

## 2. 샘플 코드 구현

### 2.1 Pub/Sub 예제 (`database/redis/redis/pubsub_test.go`)

testcontainers로 Redis 실행 후 테스트:

```go
// 테스트 함수 목록
Test_PubSub_Basic()           // 기본 발행/구독
Test_PubSub_PatternSubscribe() // 패턴 구독 (PSubscribe)
Test_PubSub_MultiChannel()    // 다중 채널 구독
```

- 기본 흐름: Subscribe → goroutine에서 ReceiveMessage → Publish → 수신 확인
- 패턴 구독: `PSubscribe(ctx, "news.*")` → `Publish(ctx, "news.tech", msg)` → 매칭 확인
- 다중 채널: 여러 채널 동시 구독 후 각 채널별 메시지 수신 확인

### 2.2 Redis Stream 예제 (`database/redis/redis/stream_test.go`)

```go
// 테스트 함수 목록
Test_Stream_XAdd_XRead()       // 기본 메시지 추가/읽기
Test_Stream_ConsumerGroup()    // Consumer Group 패턴
Test_Stream_XRange()           // 범위 조회
```

- XADD: `client.XAdd(ctx, &redis.XAddArgs{Stream: "mystream", Values: map[string]interface{}{...}})`
- XREAD: `client.XRead(ctx, &redis.XReadArgs{Streams: []string{"mystream", "0"}})`
- Consumer Group:
  - `XGroupCreate` → `XReadGroup` → `XAck`
  - 여러 consumer가 메시지를 나눠 처리하는 패턴

### 2.3 miniredis 테스트 (`database/redis/redis/miniredis_test.go`)

```go
// 테스트 함수 목록
Test_Miniredis_Basic()         // 기본 Set/Get
Test_Miniredis_TTL()           // TTL + FastForward 시간 조작
Test_Miniredis_SortedSet()     // Sorted Set 동작 확인
Test_Miniredis_PubSub()        // Pub/Sub 동작 확인
```

- Docker 없이 인메모리 Redis로 단위 테스트
- `s := miniredis.RunT(t)` → `redis.NewClient(&redis.Options{Addr: s.Addr()})`
- TTL 테스트: `s.FastForward(time.Hour)` → 만료 확인

---

## 3. 블로그 글 작성

### 3.1 파일 위치

`blog-v2.advenoh.pe.kr/docs/start/go-redis-활용하기/index.md`

### 3.2 글 구조

```
# 1. 들어가며
  - Redis 소개 (간략), 왜 Go + Redis인지

# 2. go-redis 라이브러리
  ## 2.1 설치 및 연결
  ## 2.2 기본 데이터 조작 (String, Struct, TTL)
  ## 2.3 Sorted Set 활용
  ## 2.4 Pub/Sub 패턴
  ## 2.5 Redis Stream
  ## 2.6 성능 특성과 동시성
  ## 2.7 Redis Cluster 모드
  ## 2.8 분산 락 (Distributed Lock)
  ## 2.9 miniredis를 활용한 테스트

# 3. 마무리

# 4. 참고
```

### 3.3 작성 원칙

- 각 섹션에 핵심 코드 스니펫 포함 (전체 코드는 GitHub 링크)
- Pub/Sub vs Stream 비교표 포함
- 분산 락은 redsync 중심으로 설명 (redislock은 참고 언급)
- miniredis 섹션에서 "Docker 없이 테스트" 장점 강조

---

## 4. 기술적 고려사항

### 4.1 테스트 인프라

- 기존 테스트: testcontainers로 Redis 자동 실행 (Docker 필요)
- miniredis 테스트: Docker 불필요 (인메모리)
- 기존 테스트 스위트 패턴 (`testify/suite`) 따르기

### 4.2 Redis 버전

- go-redis v9 사용 (v8 코드도 분산 락에 일부 존재)
- 블로그 글에서는 v9 기준으로 통일하여 설명
- 분산 락 코드 중 v8 사용 부분은 현재 상태 그대로 유지 (동작하므로)
