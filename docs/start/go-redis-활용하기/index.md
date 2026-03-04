---
title: "Go에서 Redis 활용하기: go-redis로 배우는 실전 패턴"
description: "go-redis v9를 사용하여 기본 데이터 조작, Pub/Sub, Stream, 분산 락, Cluster까지 실무에서 자주 사용하는 Redis 패턴을 다룬다."
date: 2026-03-04
update: 2026-03-04
tags:
  - Go
  - Golang
  - Redis
  - go-redis
  - Pub/Sub
  - Redis Stream
  - 분산 락
  - Distributed Lock
  - Redsync
  - Redis Cluster
  - miniredis
---

# 1. 들어가며

Redis는 인메모리 데이터 스토어로 캐싱, 세션 관리, 실시간 메시징, 분산 락 등 다양한 용도로 사용된다. Go에서는 `go-redis` 라이브러리를 통해 Redis의 모든 기능을 활용할 수 있다.

이 글에서는 go-redis v9를 기준으로 기본 데이터 조작부터 Pub/Sub, Stream, Cluster, 분산 락, 그리고 miniredis를 활용한 테스트까지 실무에서 자주 사용하는 패턴을 다룬다.

# 2. go-redis 라이브러리

## 2.1 설치 및 연결

go-redis v9를 설치한다.

```bash
go get github.com/redis/go-redis/v9
```

기본 연결은 `redis.NewClient()`로 생성한다.

```go
import "github.com/redis/go-redis/v9"

rdb := redis.NewClient(&redis.Options{
    Addr:     "localhost:6379",
    Password: "",
    DB:       0,
})

// 연결 확인
pong, err := rdb.Ping(ctx).Result()
// pong == "PONG"
```

> **v8 vs v9**: v9부터 모든 명령에 `context.Context`가 첫 번째 인자로 필수가 되었다. 또한 패키지 경로가 `github.com/go-redis/redis/v8`에서 `github.com/redis/go-redis/v9`로 변경되었다.

## 2.2 기본 데이터 조작

### 2.2.1 String: SET/GET

```go
// redis/redis_test.go
func Test_Set_Get_With_Primitive_Data_Type(t *testing.T) {
    err := client.Set(ctx, "name", "Elliot", 0).Err()
    assert.NoError(t, err)

    val, err := client.Get(ctx, "name").Result()
    assert.NoError(t, err)
    assert.Equal(t, "Elliot", val)
}
```

### 2.2.2 구조체 저장 (JSON 직렬화)

```go
// redis/redis_test.go
type Author struct {
    Name string `json:"name"`
    Age  int    `json:"age"`
}

func Test_Set_Get_With_Struct(t *testing.T) {
    authorJson, _ := json.Marshal(Author{Name: "Elliot", Age: 25})
    client.Set(ctx, "id1234", authorJson, 0)

    val, _ := client.Get(ctx, "id1234").Result()

    var a Author
    json.Unmarshal([]byte(val), &a)
    assert.Equal(t, "Elliot", a.Name)
}
```

### 2.2.3 TTL 설정

`Set`의 세 번째 인자로 만료 시간을 지정한다. `0`은 만료 없음이다.

```go
// 10분 후 자동 만료
client.Set(ctx, "session", "token-abc", 10*time.Minute)
```

## 2.3 Sorted Set 활용

Sorted Set은 스코어 기반으로 데이터를 정렬하여 저장한다. 리더보드, 랭킹 시스템에 적합하다.

```go
// miniredis_test.go
func Test_Miniredis_SortedSet(t *testing.T) {
    rdb.ZAdd(ctx, "leaderboard", redis.Z{Score: 100, Member: "player1"})
    rdb.ZAdd(ctx, "leaderboard", redis.Z{Score: 250, Member: "player2"})
    rdb.ZAdd(ctx, "leaderboard", redis.Z{Score: 180, Member: "player3"})

    // 상위 랭킹 조회 (점수 높은 순)
    result, _ := rdb.ZRevRangeWithScores(ctx, "leaderboard", 0, -1).Result()
    // result[0] = {player2, 250}
    // result[1] = {player3, 180}
    // result[2] = {player1, 100}

    // 특정 멤버 순위 조회 (0-based)
    rank, _ := rdb.ZRevRank(ctx, "leaderboard", "player2").Result()
    // rank == 0 (1등)
}
```

## 2.4 Pub/Sub 패턴

Pub/Sub는 발행-구독 메시징 모델이다. 발행자가 채널에 메시지를 보내면, 해당 채널을 구독하고 있는 모든 구독자가 메시지를 받는다.

### 2.4.1 기본 발행/구독

```go
// pubsub_test.go
func Test_PubSub_Basic(t *testing.T) {
    // 채널 구독
    sub := rdb.Subscribe(ctx, "notifications")
    defer sub.Close()

    // 구독 확인 대기
    _, err := sub.Receive(ctx)
    assert.NoError(t, err)

    // 메시지 발행
    rdb.Publish(ctx, "notifications", "hello redis pubsub")

    // 메시지 수신
    msg, _ := sub.ReceiveMessage(ctx)
    assert.Equal(t, "notifications", msg.Channel)
    assert.Equal(t, "hello redis pubsub", msg.Payload)
}
```

### 2.4.2 패턴 구독 (PSubscribe)

와일드카드로 여러 채널을 한 번에 구독할 수 있다.

```go
// pubsub_test.go
func Test_PubSub_PatternSubscribe(t *testing.T) {
    // news.* 패턴에 매칭되는 모든 채널 구독
    sub := rdb.PSubscribe(ctx, "news.*")
    defer sub.Close()

    _, _ = sub.Receive(ctx)

    rdb.Publish(ctx, "news.tech", "Go 1.22 released")
    rdb.Publish(ctx, "news.sports", "World Cup 2026")

    msg1, _ := sub.ReceiveMessage(ctx)
    assert.Equal(t, "news.tech", msg1.Channel)
    assert.Equal(t, "news.*", msg1.Pattern) // 매칭된 패턴

    msg2, _ := sub.ReceiveMessage(ctx)
    assert.Equal(t, "news.sports", msg2.Channel)
}
```

### 2.4.3 Channel()을 사용한 Goroutine 수신

`Channel()` 메서드를 사용하면 Go 채널로 메시지를 받을 수 있어 goroutine 패턴에 적합하다.

```go
// pubsub_test.go
ch := sub.Channel()
go func() {
    for msg := range ch {
        fmt.Printf("채널: %s, 메시지: %s\n", msg.Channel, msg.Payload)
    }
}()
```

> **주의사항**: Pub/Sub는 메시지 영속성이 없다. 구독자가 없는 상태에서 발행된 메시지는 유실된다. 메시지 영속성이 필요하면 Redis Stream을 사용한다.

## 2.5 Redis Stream

Redis Stream은 Pub/Sub의 영속성 버전이라고 볼 수 있다. 메시지가 저장되고, Consumer Group을 통해 여러 소비자가 메시지를 나눠 처리할 수 있다.

### Pub/Sub vs Stream 비교

| 특성 | Pub/Sub | Stream |
|------|---------|--------|
| 메시지 영속성 | 없음 (유실 가능) | 있음 (저장됨) |
| Consumer Group | 미지원 | 지원 |
| 메시지 재처리 | 불가 | 가능 |
| 메시지 확인(ACK) | 없음 | 지원 |
| 사용 사례 | 실시간 알림, 브로드캐스트 | 이벤트 소싱, 작업 큐 |

### 2.5.1 XADD / XREAD

```go
// stream_test.go
func Test_Stream_XAdd_XRead(t *testing.T) {
    // XADD - 메시지 추가
    id, _ := rdb.XAdd(ctx, &redis.XAddArgs{
        Stream: "mystream",
        Values: map[string]interface{}{
            "user":   "frank",
            "action": "login",
        },
    }).Result()
    // id == "1709544000000-0" (타임스탬프-시퀀스)

    // XREAD - 메시지 읽기 (처음부터)
    streams, _ := rdb.XRead(ctx, &redis.XReadArgs{
        Streams: []string{"mystream", "0"},
        Count:   10,
    }).Result()

    assert.Equal(t, "frank", streams[0].Messages[0].Values["user"])
}
```

### 2.5.2 Consumer Group

Consumer Group을 사용하면 여러 소비자가 메시지를 분산 처리할 수 있다. 각 메시지는 그룹 내 하나의 소비자에게만 전달된다.

```go
// stream_test.go
func Test_Stream_ConsumerGroup(t *testing.T) {
    stream := "orders"
    group := "order-processors"

    // 메시지 3개 추가
    rdb.XAdd(ctx, &redis.XAddArgs{
        Stream: stream,
        Values: map[string]interface{}{"order_id": "1001", "item": "laptop"},
    })
    rdb.XAdd(ctx, &redis.XAddArgs{
        Stream: stream,
        Values: map[string]interface{}{"order_id": "1002", "item": "phone"},
    })
    rdb.XAdd(ctx, &redis.XAddArgs{
        Stream: stream,
        Values: map[string]interface{}{"order_id": "1003", "item": "tablet"},
    })

    // Consumer Group 생성
    rdb.XGroupCreate(ctx, stream, group, "0")

    // Consumer 1: 2개 메시지 읽기
    result1, _ := rdb.XReadGroup(ctx, &redis.XReadGroupArgs{
        Group:    group,
        Consumer: "consumer-1",
        Streams:  []string{stream, ">"},
        Count:    2,
    }).Result()
    // result1: order_id=1001, order_id=1002

    // Consumer 2: 남은 메시지 읽기
    result2, _ := rdb.XReadGroup(ctx, &redis.XReadGroupArgs{
        Group:    group,
        Consumer: "consumer-2",
        Streams:  []string{stream, ">"},
        Count:    2,
    }).Result()
    // result2: order_id=1003

    // XACK - 처리 완료 확인
    rdb.XAck(ctx, stream, group,
        result1[0].Messages[0].ID,
        result1[0].Messages[1].ID,
    )

    // XPENDING - 미처리 메시지 확인
    pending, _ := rdb.XPending(ctx, stream, group).Result()
    assert.Equal(t, int64(1), pending.Count) // consumer-2의 1건
}
```

## 2.6 성능 특성과 동시성

Redis는 싱글 스레드로 동작하지만, Go의 동시성 모델과 결합하면 높은 처리량을 달성할 수 있다.

### 2.6.1 동시 읽기/쓰기 패턴

```go
// redis_performance_test.go
func Test_Redis_SingleThread(t *testing.T) {
    var wg sync.WaitGroup
    wg.Add(2)

    // 고루틴 1: 전체 읽기
    go func() {
        defer wg.Done()
        client.ZRange(ctx, key, 0, -1)
    }()

    // 고루틴 2: 부분 읽기
    go func() {
        defer wg.Done()
        client.ZRange(ctx, key, 0, 10)
    }()

    wg.Wait()
}
```

Redis가 싱글 스레드라도 Go 클라이언트의 요청은 비동기로 처리되므로, 여러 고루틴에서 동시에 Redis에 접근해도 안전하다. `go-redis` 클라이언트는 내부적으로 커넥션 풀을 관리한다.

### 2.6.2 파이프라인

여러 명령을 한 번에 보내 네트워크 RTT(Round Trip Time)를 최소화한다.

```go
pipe := rdb.Pipeline()
pipe.Set(ctx, "key1", "val1", 0)
pipe.Set(ctx, "key2", "val2", 0)
pipe.Get(ctx, "key1")
cmds, err := pipe.Exec(ctx)
```

## 2.7 Redis Cluster 모드

Cluster 모드는 데이터를 여러 노드에 분산하여 고가용성과 확장성을 제공한다.

```go
// cluster/cluster_test.go
rdb := redis.NewClusterClient(&redis.ClusterOptions{
    Addrs: []string{
        "localhost:7001",
        "localhost:7002",
        "localhost:7003",
    },
})

// 모든 샤드 순회
rdb.ForEachShard(ctx, func(ctx context.Context, shard *redis.Client) error {
    return shard.Ping(ctx).Err()
})
```

클러스터에서 키는 해시 슬롯(0~16383)에 자동 분배된다. `go-redis`가 내부적으로 라우팅을 처리하므로, 개발자는 Standalone과 동일한 API를 사용할 수 있다.

## 2.8 분산 락 (Distributed Lock)

여러 서비스 인스턴스가 동일한 리소스에 동시에 접근할 때, 분산 락으로 동시성 문제를 해결할 수 있다.

### 2.8.1 분산 락이 필요한 경우

- 동시성 문제: 여러 서비스 인스턴스가 같은 리소스 접근
- 단일 프로세스의 `sync.Mutex`로는 해결 불가
- Redis 기반 락: 빠르고 가벼움, TTL로 데드락 방지

### 2.8.2 Redsync 사용법

[redsync](https://github.com/go-redsync/redsync)는 Redlock 알고리즘을 구현한 Go 라이브러리다.

```go
// account_redsync.go
import "github.com/go-redsync/redsync/v4"

type AccountRedSync struct {
    Mutex           *redsync.Mutex
    CustomerBalance map[string]int
}

func (a *AccountRedSync) add(customerName string) {
    // 락 획득
    if err := a.Mutex.Lock(); err != nil {
        fmt.Println(err)
    }

    // 임계 영역
    a.CustomerBalance[customerName]++

    // 락 해제
    if ok, err := a.Mutex.Unlock(); !ok || err != nil {
        fmt.Println(err)
    }
}
```

```go
// account_test.go - 설정
pool := goredis.NewPool(redisV8Client)
rs := redsync.New(pool)
mutex := rs.NewMutex("account_lock_redsync")
```

### 2.8.3 Redislock 사용법

[redislock](https://github.com/bsm/redislock)은 더 간결한 API를 제공한다.

```go
// account_redislock.go
import "github.com/bsm/redislock"

func (a *AccountRedislock) add(customerName string) {
    ctx := context.TODO()
    lock, _ := a.locker.Obtain(ctx, "account_lock", 5*time.Second, &redislock.Options{
        RetryStrategy: redislock.LimitRetry(
            redislock.ExponentialBackoff(10*time.Millisecond, 300*time.Millisecond),
            100,
        ),
    })
    if lock != nil {
        defer lock.Release(ctx)
    }

    a.customerBalance[customerName]++
}
```

### 2.8.4 Redlock 알고리즘 요약

| 방식 | 설명 |
|------|------|
| 단일 인스턴스 | `SET key value NX PX milliseconds` |
| Redlock (다중 인스턴스) | 과반수 노드(N/2+1)에서 락 획득 시 성공 |

## 2.9 miniredis를 활용한 테스트

[miniredis](https://github.com/alicebob/miniredis)는 Go로 작성된 인메모리 Redis 서버다. 실제 Redis나 Docker 없이 단위 테스트를 작성할 수 있다.

### 2.9.1 기본 사용법

```go
// miniredis_test.go
import "github.com/alicebob/miniredis/v2"

func newMiniredisClient(t *testing.T) (*redis.Client, *miniredis.Miniredis) {
    s := miniredis.RunT(t) // 테스트 종료 시 자동 정리
    rdb := redis.NewClient(&redis.Options{Addr: s.Addr()})
    return rdb, s
}

func Test_Miniredis_Basic(t *testing.T) {
    rdb, _ := newMiniredisClient(t)

    rdb.Set(ctx, "name", "frank", 0)
    val, err := rdb.Get(ctx, "name").Result()
    assert.Equal(t, "frank", val)

    // 존재하지 않는 키
    _, err = rdb.Get(ctx, "nonexistent").Result()
    assert.ErrorIs(t, err, redis.Nil)
}
```

### 2.9.2 FastForward로 TTL 테스트

miniredis의 가장 큰 장점 중 하나는 시간을 조작할 수 있다는 것이다.

```go
// miniredis_test.go
func Test_Miniredis_TTL(t *testing.T) {
    rdb, s := newMiniredisClient(t)

    rdb.Set(ctx, "session", "token-abc", 10*time.Minute)

    // 키 존재 확인
    val, _ := rdb.Get(ctx, "session").Result()
    assert.Equal(t, "token-abc", val)

    // 11분 경과 시뮬레이션
    s.FastForward(11 * time.Minute)

    // TTL 만료 확인
    _, err := rdb.Get(ctx, "session").Result()
    assert.ErrorIs(t, err, redis.Nil)
}
```

### 2.9.3 miniredis 지원 기능

| 기능 | 지원 여부 |
|------|-----------|
| String, Hash, List, Set, Sorted Set | 지원 |
| Pub/Sub | 지원 |
| Stream | 지원 |
| TTL / 만료 | 지원 (FastForward 포함) |
| Cluster 모드 | 미지원 |
| Lua 스크립트 | 일부 지원 |

> **언제 miniredis를 사용할까?**: 단위 테스트에서 Docker 의존성을 제거하고 싶을 때, CI 파이프라인을 간소화하고 싶을 때, TTL 관련 테스트에서 실제 시간을 기다리지 않고 싶을 때 유용하다.

# 3. 마무리

이 글에서는 Go에서 Redis를 활용하는 다양한 패턴을 살펴봤다.

- **기본 조작**: String, Struct 저장, TTL 설정
- **Sorted Set**: 스코어 기반 정렬, 리더보드 구현
- **Pub/Sub**: 실시간 메시징, 패턴 구독
- **Redis Stream**: 영속적 메시지 처리, Consumer Group으로 분산 소비
- **Cluster**: 다중 노드 분산, 자동 라우팅
- **분산 락**: redsync/redislock으로 동시성 제어
- **miniredis**: Docker 없이 빠른 단위 테스트

Pub/Sub과 Stream은 사용 목적에 따라 선택하면 된다. 메시지 유실이 허용되는 실시간 알림에는 Pub/Sub, 메시지 영속성과 재처리가 필요한 작업 큐에는 Stream이 적합하다.

## 3.1 프로젝트 소스

전체 소스 코드는 GitHub에서 확인할 수 있다:
- https://github.com/kenshin579/tutorials-go/tree/master/database/redis
- https://github.com/kenshin579/tutorials-go/tree/master/golang/concurrency/waitgroup

# 4. 참고

- [go-redis 공식 문서](https://redis.uptrace.dev/guide/)
- [redis/go-redis GitHub](https://github.com/redis/go-redis)
- [Redis Pub/Sub](https://redis.io/docs/interact/pubsub/)
- [Redis Streams](https://redis.io/docs/data-types/streams/)
- [Redlock 알고리즘](https://redis.io/docs/manual/patterns/distributed-locks/)
- [redsync GitHub](https://github.com/go-redsync/redsync)
- [miniredis GitHub](https://github.com/alicebob/miniredis)
