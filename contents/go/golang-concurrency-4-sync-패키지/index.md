---
title: "Golang Concurrency (4) - sync 패키지 완벽 가이드"
description: "Go sync 패키지의 WaitGroup, Mutex, RWMutex, Once, sync.Map 사용법과 Race Condition 해결법을 다룹니다"
date: 2026-02-14
update: 2026-02-14
tags:
  - golang
  - go
  - concurrency
  - sync
  - mutex
  - rwmutex
  - waitgroup
  - once
  - race-condition
  - 고랭
  - 동시성
  - 동기화
series: "Golang Concurrency"
---

Go는 channel을 통한 통신을 권장하지만, 모든 상황에서 channel이 최적은 아니다. 단순한 공유 메모리 보호에는 `sync` 패키지의 동기화 프리미티브가 더 직관적이고 효율적이다.

## 1. 왜 Synchronization이 필요한가

여러 goroutine이 **같은 변수에 동시에 접근**하면 **Race Condition**이 발생한다.

```go
// 위험한 코드: 보호 없이 공유 변수 접근
counter := 0
for range 1000 {
    go func() {
        counter++ // Data Race!
    }()
}
```

`counter++`는 실제로 "읽기 → 증가 → 쓰기" 3단계 연산이다. 여러 goroutine이 동시에 실행하면 값이 유실된다.

## 2. sync.WaitGroup

여러 goroutine의 **완료를 기다리는** 가장 기본적인 도구다.

```go
var wg sync.WaitGroup

for i := range 5 {
    wg.Add(1)        // goroutine 시작 전에 Add
    go func() {
        defer wg.Done() // goroutine 완료 시 Done
        // 작업 수행
    }()
}

wg.Wait() // 모든 goroutine 완료까지 대기
```

**핵심 규칙**: `wg.Add()`는 반드시 `go` 문 **앞에서** 호출해야 한다. goroutine 안에서 Add하면 `Wait()`이 먼저 실행될 수 있다.

## 3. sync.Mutex

**상호 배제(Mutual Exclusion)** 를 보장한다. 한 시점에 하나의 goroutine만 임계 영역에 접근할 수 있다.

```go
func TestMutexCriticalSection(t *testing.T) {
    type SafeCounter struct {
        mu sync.Mutex
        v  map[string]int
    }

    c := SafeCounter{v: make(map[string]int)}
    var wg sync.WaitGroup

    for range 100 {
        wg.Add(1)
        go func() {
            defer wg.Done()
            c.mu.Lock()
            c.v["key"]++
            c.mu.Unlock()
        }()
    }

    wg.Wait()
    assert.Equal(t, 100, c.v["key"])
}
```

**Best Practice**: `defer mu.Unlock()`을 사용하면 panic이 발생해도 lock이 해제된다.

## 4. sync.RWMutex

**읽기 잠금(RLock)** 은 여러 goroutine이 **동시에 획득** 가능하다. 쓰기 잠금(Lock)은 배타적이다.

| 연산 | 다른 RLock | 다른 Lock |
|------|-----------|----------|
| RLock (읽기) | 허용 | 대기 |
| Lock (쓰기) | 대기 | 대기 |

```go
var rwmu sync.RWMutex

// 여러 reader 동시 실행 가능
rwmu.RLock()
_ = data["key"]
rwmu.RUnlock()

// writer는 exclusive
rwmu.Lock()
data["key"] = "updated"
rwmu.Unlock()
```

**읽기가 많고 쓰기가 적은 경우** RWMutex가 Mutex보다 성능이 좋다.

## 5. sync.Once

함수를 **딱 한 번만** 실행하도록 보장한다. Singleton 패턴 구현에 적합하다.

```go
func TestOnceSingleton(t *testing.T) {
    type Config struct {
        DBHost string
        DBPort int
    }

    var (
        instance *Config
        once     sync.Once
    )

    getConfig := func() *Config {
        once.Do(func() {
            instance = &Config{
                DBHost: "localhost",
                DBPort: 5432,
            }
        })
        return instance
    }

    // 여러 goroutine에서 호출해도 같은 인스턴스 반환
    var wg sync.WaitGroup
    results := make([]*Config, 10)

    for i := range 10 {
        wg.Add(1)
        go func() {
            defer wg.Done()
            results[i] = getConfig()
        }()
    }

    wg.Wait()

    for i := 1; i < len(results); i++ {
        assert.Same(t, results[0], results[i]) // 모두 같은 포인터
    }
}
```

## 6. sync.Map

일반 `map`은 concurrent-safe하지 않다. `sync.Map`은 lock 없이 concurrent 접근이 가능하다.

```go
var m sync.Map

m.Store("key", "value")            // 저장
val, ok := m.Load("key")           // 조회
m.Delete("key")                    // 삭제
actual, loaded := m.LoadOrStore("k", "v") // 없으면 저장

// 순회
m.Range(func(key, value any) bool {
    fmt.Println(key, value)
    return true // true: 계속, false: 중단
})
```

### 일반 map + Mutex vs sync.Map

| 상황 | 추천 |
|------|------|
| 키가 안정적이고 읽기 위주 | `sync.Map` (더 빠름) |
| 쓰기가 많거나 키가 계속 변경 | `map + RWMutex` (더 효율적) |
| 키 타입이 정해져 있고 타입 안전성 필요 | `map + RWMutex` (제네릭 활용) |

## 7. 정리

| 프리미티브 | 용도 | 핵심 |
|----------|------|------|
| WaitGroup | goroutine 완료 대기 | Add → go → Done → Wait |
| Mutex | 상호 배제 | Lock/Unlock, defer 사용 권장 |
| RWMutex | 읽기 동시성 | 읽기 많으면 Mutex보다 유리 |
| Once | 한 번만 실행 | Singleton, 초기화에 적합 |
| sync.Map | concurrent-safe map | 읽기 위주에 효율적 |

### Channel vs Mutex 언제 쓸까?

| Channel | Mutex |
|---------|-------|
| 데이터의 소유권 이전 | 단순 공유 상태 보호 |
| goroutine 간 통신 | 캐시, 카운터 |
| 파이프라인, fan-in/out | 구조체의 필드 보호 |
| 복잡한 동기화 패턴 | 간단한 임계 영역 |

다음 편에서는 goroutine의 생명주기를 관리하는 핵심 도구인 **Context 패키지**를 다룬다.

## 참고

- [Go Blog - Share Memory By Communicating](https://go.dev/blog/codelab-share)
- [sync 패키지 문서](https://pkg.go.dev/sync)
