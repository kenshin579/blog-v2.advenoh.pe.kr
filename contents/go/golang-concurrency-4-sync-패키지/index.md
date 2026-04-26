---
title: "Golang Concurrency 4편 - sync 패키지 완벽 가이드"
description: "Go sync 패키지의 WaitGroup, Mutex, RWMutex, Once, sync.Map 사용법과 Race Condition 해결법을 다룹니다"
date: 2026-04-26
update: 2026-04-26
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

이번 편에서는 `sync` 패키지의 핵심 도구인 WaitGroup, Mutex, RWMutex, Once, sync.Map의 사용법과 각각의 적용 시점을 다룬다.

# 1. 왜 Synchronization이 필요한가

<img src="cover.png" alt="cover" width="75%" />

여러 goroutine이 **같은 변수에 동시에 접근**하면 **Race Condition**이 발생한다. Race Condition이란 두 개 이상의 goroutine이 공유 자원에 동시에 접근할 때, 실행 순서에 따라 결과가 달라지는 현상이다. 프로그램이 때로는 정상 동작하고 때로는 잘못된 결과를 내는 비결정적(non-deterministic) 버그를 만든다.

```go
// 위험한 코드: 보호 없이 공유 변수 접근
counter := 0
for range 1000 {
    go func() {
        counter++ // Data Race! 여러 goroutine이 동시에 읽고 쓰면 값이 유실된다
    }()
}
// 기대값: 1000, 실제값: 매번 다름 (예: 937, 982, 1000...)
```

`counter++`는 실제로 "읽기 → 증가 → 쓰기" 3단계 연산이다. 여러 goroutine이 동시에 실행하면 값이 유실된다. 예를 들어 두 goroutine이 동시에 counter 값 5를 읽고 각각 6으로 쓰면, 두 번 증가했지만 결과는 6이 된다.

> `go test -race` 또는 `go run -race`로 실행하면 Go의 Race Detector가 Data Race를 감지해준다. 프로덕션 코드에서는 반드시 race 검사를 수행하자.

# 2. sync.WaitGroup

여러 goroutine의 **완료를 기다리는** 가장 기본적인 도구다. 내부적으로 카운터를 유지하며, `Add()`로 카운터를 증가시키고 `Done()`으로 감소시킨다. `Wait()`는 카운터가 0이 될 때까지 blocking한다.

Channel로도 goroutine 완료를 기다릴 수 있지만, 단순히 "N개의 goroutine이 모두 끝날 때까지 기다리기"에는 WaitGroup이 훨씬 간결하다.

```go
var wg sync.WaitGroup

for i := range 5 {
    wg.Add(1)        // 카운터 +1: goroutine 시작 전에 반드시 호출
    go func() {
        defer wg.Done() // 카운터 -1: goroutine 완료 시 호출 (defer로 panic에도 안전)
        // 작업 수행
    }()
}

wg.Wait() // 카운터가 0이 될 때까지 blocking (모든 goroutine 완료 대기)
```

**핵심 규칙**: `wg.Add()`는 반드시 `go` 문 **앞에서** 호출해야 한다. goroutine 안에서 Add하면 `Wait()`이 먼저 실행될 수 있다.

> WaitGroup은 재사용 가능하다. 단, `Wait()`가 반환된 후에 다시 `Add()`를 호출해야 한다. `Wait()` 실행 중에 `Add()`를 호출하면 panic이 발생한다.

# 3. sync.Mutex

**상호 배제(Mutual Exclusion)** 를 보장한다. 한 시점에 하나의 goroutine만 임계 영역(critical section)에 접근할 수 있다. `Lock()`을 호출한 goroutine만 `Unlock()`할 때까지 해당 영역을 독점한다. 다른 goroutine은 `Lock()` 호출 시 기존 goroutine이 `Unlock()`할 때까지 대기한다.

Mutex는 구조체에 보호할 데이터와 함께 묶어두는 것이 Go의 관용적 패턴이다. 이렇게 하면 "어떤 데이터를 어떤 lock이 보호하는지"가 코드에서 명확해진다.

```go
func TestMutexCriticalSection(t *testing.T) {
    // Mutex와 보호할 데이터를 하나의 struct에 묶는 것이 Go의 관용적 패턴
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
            c.mu.Lock()   // 임계 영역 진입: 다른 goroutine은 여기서 대기
            c.v["key"]++  // 보호된 영역: 한 번에 하나의 goroutine만 실행
            c.mu.Unlock() // 임계 영역 해제: 대기 중인 goroutine이 진입 가능
        }()
    }

    wg.Wait()
    assert.Equal(t, 100, c.v["key"]) // Mutex 보호 덕분에 정확히 100
}
```

**Best Practice**: `defer mu.Unlock()`을 사용하면 panic이 발생해도 lock이 해제된다. 임계 영역이 길거나 return이 여러 곳에 있을 때 특히 유용하다.

> Mutex는 값 복사(copy)하면 안 된다. 함수에 전달할 때 반드시 **포인터**로 전달해야 한다. `go vet`이 Mutex 복사를 감지해준다.

# 4. sync.RWMutex

Mutex는 읽기든 쓰기든 구분 없이 모든 접근을 한 번에 하나씩만 실행되도록 강제한다. 하지만 읽기 연산은 데이터를 변경하지 않으므로 여러 goroutine이 동시에 읽어도 안전하다. **RWMutex**는 이 점을 활용하여 읽기 성능을 크게 향상시킨다.

**읽기 잠금(RLock)** 은 여러 goroutine이 **동시에 획득** 가능하다. 쓰기 잠금(Lock)은 배타적이다. 쓰기가 진행 중이면 모든 읽기/쓰기가 대기하고, 읽기가 진행 중이면 쓰기만 대기한다.

| 연산 | 다른 RLock | 다른 Lock |
|------|-----------|----------|
| RLock (읽기) | 허용 | 대기 |
| Lock (쓰기) | 대기 | 대기 |

```go
var rwmu sync.RWMutex

// 여러 reader가 동시에 실행 가능 — 읽기 성능 향상
rwmu.RLock()        // 읽기 잠금 획득: 다른 reader도 동시에 획득 가능
_ = data["key"]     // 데이터 읽기 (변경 없음)
rwmu.RUnlock()      // 읽기 잠금 해제

// writer는 exclusive — 읽기/쓰기 모두 blocking
rwmu.Lock()             // 쓰기 잠금 획득: 모든 reader/writer 대기
data["key"] = "updated" // 데이터 변경
rwmu.Unlock()           // 쓰기 잠금 해제
```

**읽기가 많고 쓰기가 적은 경우** RWMutex가 Mutex보다 성능이 좋다. 예를 들어 캐시, 설정 조회, 조회 API 등 읽기 90%+ 쓰기 10% 이하인 시나리오에 적합하다.

> 쓰기가 빈번하면 RWMutex의 내부 오버헤드 때문에 오히려 일반 Mutex보다 느릴 수 있다. 벤치마크로 확인 후 선택하자.

# 5. sync.Once

함수를 **딱 한 번만** 실행하도록 보장한다. 여러 goroutine이 동시에 `once.Do()`를 호출해도 전달된 함수는 **정확히 한 번**만 실행되며, 나머지 goroutine은 실행이 완료될 때까지 대기한다.

DB 연결 풀 초기화, 설정 파일 로딩 등 **비용이 큰 초기화를 지연(lazy)** 시키면서도 goroutine-safe하게 만들 때 가장 유용하다. `init()` 함수와 달리 실제로 필요한 시점에 초기화가 실행된다.

```go
func TestOnceSingleton(t *testing.T) {
    type Config struct {
        DBHost string
        DBPort int
    }

    var (
        instance *Config   // 한 번만 초기화될 싱글턴 인스턴스
        once     sync.Once // 초기화 함수의 단 한 번 실행을 보장
    )

    getConfig := func() *Config {
        once.Do(func() { // 이 함수는 아무리 많이 호출해도 딱 한 번만 실행
            instance = &Config{
                DBHost: "localhost",
                DBPort: 5432,
            }
        })
        return instance // 초기화 완료 후에는 즉시 캐시된 인스턴스 반환
    }

    // 여러 goroutine에서 동시에 호출해도 같은 인스턴스 반환
    var wg sync.WaitGroup
    results := make([]*Config, 10)

    for i := range 10 {
        wg.Add(1)
        go func() {
            defer wg.Done()
            results[i] = getConfig() // 10개 goroutine이 동시 호출
        }()
    }

    wg.Wait()

    for i := 1; i < len(results); i++ {
        assert.Same(t, results[0], results[i]) // 모두 같은 포인터 — 초기화는 한 번만 실행됨
    }
}
```

> `once.Do()` 내부에서 panic이 발생해도 "한 번 실행됨"으로 간주된다. 이후 호출에서 함수가 다시 실행되지 않으므로, 초기화 함수 내부의 에러 처리에 주의해야 한다.

# 6. sync.Map

Go의 일반 `map`은 concurrent-safe하지 않다. 여러 goroutine이 동시에 map을 읽고 쓰면 `fatal error: concurrent map writes` runtime panic이 발생한다. `sync.Map`은 내부적으로 lock-free 알고리즘과 읽기 전용 캐시를 활용하여, 별도의 lock 없이 concurrent 접근이 가능하다.

`sync.Map`은 제네릭을 지원하지 않아 `any` 타입으로 동작한다. 값을 꺼낼 때 타입 단언(type assertion)이 필요하다는 단점이 있다.

```go
var m sync.Map

m.Store("key", "value")                   // 저장: key-value 쌍 추가
val, ok := m.Load("key")                  // 조회: 값과 존재 여부 반환
m.Delete("key")                            // 삭제: 키 제거
actual, loaded := m.LoadOrStore("k", "v")  // 없으면 저장, 있으면 기존 값 반환

// 순회: 모든 key-value에 대해 함수 실행
m.Range(func(key, value any) bool {
    fmt.Println(key, value)
    return true // true: 다음 항목 계속, false: 순회 중단
})
```

그렇다면 일반 `map + Mutex`와 `sync.Map` 중 어떤 것을 선택해야 할까?

| 상황 | 추천 |
|------|------|
| 키가 안정적이고 읽기 위주 | `sync.Map` (더 빠름) |
| 쓰기가 많거나 키가 계속 변경 | `map + RWMutex` (더 효율적) |
| 키 타입이 정해져 있고 타입 안전성 필요 | `map + RWMutex` (제네릭 활용) |

> 대부분의 경우 `map + RWMutex` 조합이 더 범용적이다. `sync.Map`은 키가 한번 설정되면 거의 변경되지 않는 캐시 시나리오에서 진가를 발휘한다.

# 7. 마무리

이번 편에서는 Go의 `sync` 패키지가 제공하는 핵심 동기화 프리미티브를 살펴보았다. 각 도구는 고유한 목적이 있으며, 상황에 맞게 선택하는 것이 중요하다.

| 프리미티브 | 용도 | 핵심 |
|----------|------|------|
| WaitGroup | goroutine 완료 대기 | Add → go → Done → Wait |
| Mutex | 상호 배제 | Lock/Unlock, defer 사용 권장 |
| RWMutex | 읽기 동시성 | 읽기 많으면 Mutex보다 유리 |
| Once | 한 번만 실행 | Singleton, 초기화에 적합 |
| sync.Map | concurrent-safe map | 읽기 위주에 효율적 |

그렇다면 Channel과 Mutex 중 어떤 것을 선택해야 할까? Go 공식 Wiki에서는 "데이터의 소유권을 넘길 때는 Channel, 구조체의 내부 상태를 보호할 때는 Mutex"를 권장한다. 아래 표를 참고하여 상황에 맞는 도구를 선택하자.

| Channel | Mutex |
|---------|-------|
| 데이터의 소유권 이전 | 단순 공유 상태 보호 |
| goroutine 간 통신 | 캐시, 카운터 |
| 파이프라인, fan-in/out | 구조체의 필드 보호 |
| 복잡한 동기화 패턴 | 간단한 임계 영역 |

실무에서는 하나의 도구만 고집하기보다 상황에 맞게 조합하는 것이 좋다. 예를 들어, WaitGroup으로 goroutine 완료를 기다리면서 Mutex로 공유 데이터를 보호하는 패턴은 매우 흔하다. 중요한 것은 항상 `go test -race`로 Data Race를 검증하는 습관을 들이는 것이다.

다음 편에서는 goroutine의 생명주기를 관리하는 핵심 도구인 **Context 패키지**를 다룬다.

# 8. 참고

- [Go Blog - Share Memory By Communicating](https://go.dev/blog/codelab-share)
- [sync 패키지 문서](https://pkg.go.dev/sync)
