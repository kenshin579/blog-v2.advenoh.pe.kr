---
title: "Golang Concurrency 8편 - Go Memory Model과 Atomic"
description: "Go Memory Model의 happens-before 규칙과 sync/atomic 패키지의 Atomic 연산을 실전 예제로 배웁니다"
date: 2026-05-13
tags: ["go", "golang", "concurrency", "memory-model", "atomic", "happens-before"]
series: "Golang Concurrency"
draft: false
---

Mutex나 Channel을 사용하면 동시성 문제를 해결할 수 있다는 것은 앞선 편에서 다뤘다. 하지만 **왜** 이런 동기화 도구가 필요한지, 그리고 동기화 없이 공유 변수에 접근하면 **정확히 무슨 일이 벌어지는지**를 이해하려면 Go Memory Model을 알아야 한다. 이번 편에서는 Go Memory Model의 핵심인 happens-before 관계와, lock 없이 원자적 연산을 수행하는 `sync/atomic` 패키지를 다룬다.

## 1. 서론 - 왜 Memory Model을 알아야 하는가

<img src="cover.png" alt="cover" width="75%" />

### 1.1 컴파일러와 CPU의 명령어 재배치

우리가 작성한 코드가 **작성한 순서 그대로 실행되는 것은 아니다**. 컴파일러와 CPU는 성능 최적화를 위해 명령어의 실행 순서를 재배치(reordering)할 수 있다.

```go
// 개발자가 작성한 코드
a = 1
b = 2
// 컴파일러/CPU는 의존 관계가 없는 두 대입의 순서를 자유롭게 바꿀 수 있다
```

위 코드에서 `a`와 `b`는 서로 의존 관계가 없으므로, 컴파일러나 CPU가 `b = 2`를 `a = 1`보다 먼저 실행할 수 있다. 단일 goroutine에서는 이런 재배치가 관측 가능한 결과에 영향을 주지 않지만, **여러 goroutine이 같은 변수에 접근하는 경우** 문제가 된다.

### 1.2 공유 변수의 Visibility 문제

한 goroutine에서 변수를 변경했더라도, 다른 goroutine에서 **그 변경이 보이지 않을 수 있다**. CPU 캐시, 레지스터 최적화, 명령어 재배치 등 여러 원인이 있다.

```go
// 위험: 동기화 없이 공유 변수 접근
var data int
var ready bool

go func() {
    data = 42
    ready = true // 두 대입의 순서가 보존된다는 보장이 없다
}()

// 다른 goroutine에서...
if ready {
    // ready=true가 보이더라도 data=42는 아직 안 보일 수 있다
    fmt.Println(data) // 42가 아닐 수 있다!
}
```

이 코드에서 `ready = true`가 보인다고 해서 `data = 42`도 보인다는 보장이 없다. 컴파일러가 두 대입의 순서를 바꿀 수도 있고, CPU 캐시로 인해 `data`의 변경이 아직 다른 코어에 전파되지 않았을 수도 있다.

이런 문제를 명확히 정의하고 해결 방법을 제시하는 것이 바로 **Go Memory Model**이다.

## 2. Go Memory Model

Go Memory Model은 **한 goroutine에서 변수에 쓴 값이 다른 goroutine에서 읽힐 수 있는 조건**을 정의한다. 핵심 개념은 **happens-before** 관계다.

### 2.1 happens-before 관계 정의

이벤트 A가 이벤트 B보다 **happens-before**라 함은, B가 실행될 때 A의 효과(메모리 쓰기)가 **반드시 관측 가능**하다는 뜻이다.

- A happens-before B이면, A의 메모리 쓰기는 B에서 읽을 수 있다
- happens-before 관계가 **없으면**, 한 goroutine의 쓰기가 다른 goroutine에서 보일지 **보장할 수 없다**

### 2.2 Go에서 happens-before를 보장하는 방법들

Go 스펙에서 보장하는 happens-before 관계는 다음과 같다.

**같은 goroutine 내의 순서**

같은 goroutine 안에서는 코드에 작성된 순서대로 happens-before 관계가 성립한다.

```go
x := 1
x = 2
// x = 1 happens-before x = 2 (같은 goroutine)
assert.Equal(t, 2, x) // 항상 보장
```

**Channel send/receive**

unbuffered channel에서 send는 대응하는 receive보다 happens-before다. 즉, send 이전의 모든 메모리 쓰기가 receive 이후에 관측 가능하다.

```go
ch := make(chan int)
var result int

go func() {
    result = 42
    ch <- 1 // send happens-before receive
}()

<-ch
assert.Equal(t, 42, result) // 보장됨
```

**Channel close**

channel의 close는 close로 인해 zero value를 반환하는 receive보다 happens-before다.

```go
ch := make(chan int)
var result int

go func() {
    result = 99
    close(ch) // close happens-before receive
}()

<-ch
assert.Equal(t, 99, result) // 보장됨
```

**sync.Mutex Lock/Unlock**

Mutex의 `Unlock()`은 이후에 같은 Mutex에 대한 `Lock()`보다 happens-before다.

```go
var mu sync.Mutex
var data int

// goroutine 1
mu.Lock()
data = 200
mu.Unlock() // Unlock happens-before 다음 Lock

// goroutine 2
mu.Lock()   // 이 Lock은 위 Unlock 이후에 실행됨
_ = data    // 200이 보장됨
mu.Unlock()
```

**sync.Once**

`once.Do(f)`에서 `f()`의 실행 완료는 모든 `once.Do()` 호출의 반환보다 happens-before다.

```go
var once sync.Once
var initialized int

// 여러 goroutine에서 호출해도 f()는 한 번만 실행되고,
// f() 완료 후에야 모든 Do() 호출이 반환됨
once.Do(func() {
    initialized = 1
})
// initialized == 1 보장
```

## 3. Visibility 문제와 해결

한 goroutine에서 변경한 값이 다른 goroutine에서 보이지 않는 문제를 구체적인 코드로 살펴보고, 각 해결 방법을 비교해보자.

### 3.1 atomic으로 happens-before 보장

`sync/atomic` 패키지의 연산은 happens-before 관계를 보장한다. atomic Store는 이후의 atomic Load보다 happens-before다.

```go
func TestVisibilityProblem(t *testing.T) {
    var data int
    var ready atomic.Bool

    go func() {
        data = 42
        // atomic Store는 이전에 발생한 모든 write를 함께 publish 한다 (release semantic)
        ready.Store(true)
    }()

    // atomic Load는 대응되는 Store 이전의 write들을 보게 된다 (acquire semantic)
    for !ready.Load() {
        // busy wait
    }

    assert.Equal(t, 42, data) // happens-before 덕분에 42가 반드시 보임
}
```

`ready.Store(true)`가 `ready.Load()`에서 `true`로 관측되면, Store 이전의 `data = 42`는 Load 이후에 반드시 보인다.

### 3.2 channel로 happens-before 보장

channel close도 happens-before를 보장하므로, close 이전에 쓴 값은 receive 이후에 확실히 보인다.

```go
func TestVisibilityWithChannel(t *testing.T) {
    var data int
    done := make(chan struct{})

    go func() {
        data = 100
        close(done) // channel close는 happens-before 보장
    }()

    <-done
    assert.Equal(t, 100, data)
}
```

### 3.3 mutex로 happens-before 보장

Mutex의 Unlock -> Lock은 happens-before 관계이므로, Unlock 이전에 쓴 값은 Lock 이후에 보인다. 다만 어느 goroutine이 먼저 Lock을 잡을지는 비결정적이다.

```go
func TestVisibilityWithMutex(t *testing.T) {
    var mu sync.Mutex
    var data int

    go func() {
        mu.Lock()
        data = 200
        mu.Unlock()
    }()

    mu.Lock()
    // Unlock -> Lock은 happens-before 관계
    // 하지만 어느 goroutine이 먼저 Lock을 잡을지는 비결정적
    val := data
    mu.Unlock()

    t.Logf("data = %d (0 또는 200)", val)
    assert.True(t, val == 0 || val == 200)
}
```

메인 goroutine이 먼저 Lock을 잡으면 `data`는 0이고, 자식 goroutine이 먼저 Lock을 잡으면 200이다. 중요한 것은 **중간 상태(garbage 값)는 절대 보이지 않는다**는 점이다.

### 3.4 happens-before 규칙 종합

Go의 주요 happens-before 규칙을 하나의 테스트로 정리하면 다음과 같다.

```go
func TestHappensBeforeRules(t *testing.T) {
    // 1. 같은 goroutine 내에서는 순서 보장
    x := 1
    x = 2
    assert.Equal(t, 2, x) // 항상 보장

    // 2. channel send는 receive보다 happens-before
    ch := make(chan int)
    var result int
    go func() {
        result = 42
        ch <- 1 // send happens-before receive
    }()
    <-ch
    assert.Equal(t, 42, result)

    // 3. channel close는 receive(zero value)보다 happens-before
    ch2 := make(chan int)
    var result2 int
    go func() {
        result2 = 99
        close(ch2)
    }()
    <-ch2
    assert.Equal(t, 99, result2)

    // 4. sync.Once - Do()는 한 번만 실행되고 모든 호출에 happens-before
    var once sync.Once
    var initialized int
    var wg sync.WaitGroup

    wg.Add(10)
    for range 10 {
        go func() {
            defer wg.Done()
            once.Do(func() {
                initialized = 1
            })
            assert.Equal(t, 1, initialized)
        }()
    }
    wg.Wait()
}
```

## 4. sync/atomic 패키지

`sync/atomic` 패키지는 **lock 없이 원자적 연산**을 수행한다. Mutex보다 가볍고, 단순한 값의 읽기/쓰기/증가에 적합하다. Go 1.19부터 타입별 래퍼(`atomic.Int64`, `atomic.Bool` 등)가 도입되어 사용이 훨씬 편리해졌다.

### 4.1 atomic.Int64: Store, Load, Add

`atomic.Int64`는 64비트 정수에 대한 원자적 연산을 제공한다.

```go
func TestAtomicInt64(t *testing.T) {
    // atomic.Int64는 64비트 정수를 lock 없이 원자적으로 처리
    // (32비트 플랫폼에서 발생할 수 있는 word tearing 문제도 회피)
    var counter atomic.Int64

    counter.Store(10)
    assert.Equal(t, int64(10), counter.Load())

    counter.Add(5) // 단일 CPU instruction (LOCK XADD)으로 처리되어 race-free
    assert.Equal(t, int64(15), counter.Load())

    counter.Add(-3)
    assert.Equal(t, int64(12), counter.Load())
}
```

- `Store(val)`: 값을 원자적으로 저장
- `Load()`: 값을 원자적으로 읽기
- `Add(delta)`: 값을 원자적으로 더하기 (음수도 가능)

### 4.2 atomic.Bool: Store, Load, Swap

`atomic.Bool`은 플래그 용도로 많이 사용된다.

```go
func TestAtomicBool(t *testing.T) {
    var flag atomic.Bool

    assert.False(t, flag.Load())

    flag.Store(true)
    assert.True(t, flag.Load())

    // Swap은 "값 변경 + 이전 값 확인"을 한 번에 처리해서
    // "최초로 true를 설정한 자가 누구인가" 같은 단일-실행 패턴에 유용
    old := flag.Swap(false)
    assert.True(t, old)
    assert.False(t, flag.Load())
}
```

`Swap`은 새 값을 저장하면서 **이전 값을 반환**한다. "한 번만 실행" 패턴에 유용하다. 예를 들어 `flag.Swap(true)`가 `false`를 반환하면 자신이 최초 실행자임을 알 수 있다.

### 4.3 CompareAndSwap (CAS) 연산

CAS는 atomic 연산의 핵심이다. **현재 값이 예상 값과 같을 때만** 새 값으로 교체한다. 성공하면 `true`, 실패하면 `false`를 반환한다.

```go
func TestAtomicCompareAndSwap(t *testing.T) {
    var counter atomic.Int64
    counter.Store(100)

    // CAS는 "비교 + 교체"를 원자적으로 수행 → race 없이 조건부 업데이트 가능
    swapped := counter.CompareAndSwap(100, 200)
    assert.True(t, swapped)
    assert.Equal(t, int64(200), counter.Load())

    // 실패는 "다른 누군가가 먼저 값을 바꿨다"는 신호이므로 호출자가 재시도를 결정한다
    swapped = counter.CompareAndSwap(100, 300)
    assert.False(t, swapped)
    assert.Equal(t, int64(200), counter.Load()) // 여전히 200
}
```

CAS는 하드웨어 수준에서 지원하는 원자적 명령어로, lock 없이 안전한 업데이트가 가능하다.

### 4.4 CAS 루프 패턴 (lock-free 업데이트)

CAS가 실패하면 다른 goroutine이 먼저 값을 변경한 것이므로, **현재 값을 다시 읽고 재시도**하는 루프를 구성한다. 이것이 lock-free 알고리즘의 기본 패턴이다.

다음은 여러 goroutine에서 동시에 최대값을 업데이트하는 예제다.

```go
func TestAtomicCASLoop(t *testing.T) {
    var max atomic.Int64

    var wg sync.WaitGroup
    values := []int64{5, 3, 8, 1, 9, 2, 7}

    wg.Add(len(values))
    for _, v := range values {
        go func() {
            defer wg.Done()
            // lock-free 알고리즘의 표준 패턴: 읽기 → 판단 → CAS → 실패 시 재시도
            for {
                current := max.Load()
                if v <= current {
                    break // 이미 더 큰 값이 있으면 종료 (불필요한 CAS 회피)
                }
                if max.CompareAndSwap(current, v) {
                    break
                }
                // CAS 실패 = current를 읽은 후 누가 먼저 바꿨다는 뜻 → 새 값으로 다시 시도
            }
        }()
    }

    wg.Wait()
    assert.Equal(t, int64(9), max.Load())
}
```

CAS 루프의 동작 흐름은 다음과 같다:

1. 현재 값을 `Load()`로 읽는다
2. 업데이트가 필요한지 판단한다
3. `CompareAndSwap(current, new)`으로 교체를 시도한다
4. 실패하면 1번으로 돌아가 다시 시도한다

이 패턴은 Mutex를 사용하지 않으므로 **lock contention이 없고**, 짧은 연산에서는 Mutex보다 빠르다.

### 4.5 atomic.Value: 임의 타입 저장 (Config 패턴)

`atomic.Value`는 `interface{}` 타입의 값을 원자적으로 저장하고 읽을 수 있다. **런타임 설정(Config)을 동적으로 교체**하는 패턴에 널리 사용된다.

```go
func TestAtomicValue(t *testing.T) {
    type Config struct {
        MaxConns int
        Timeout  int
    }

    // atomic.Value는 struct 전체를 한 번에 교체하므로 부분 갱신된 중간 상태가 노출되지 않는다
    var config atomic.Value

    config.Store(Config{MaxConns: 10, Timeout: 30})

    loaded := config.Load().(Config)
    assert.Equal(t, 10, loaded.MaxConns)
    assert.Equal(t, 30, loaded.Timeout)

    // 필드 단위 수정이 아니라 "새 Config 통째로 교체" 방식 → reader는 항상 일관된 스냅샷을 본다
    config.Store(Config{MaxConns: 20, Timeout: 60})

    updated := config.Load().(Config)
    assert.Equal(t, 20, updated.MaxConns)
    assert.Equal(t, 60, updated.Timeout)
}
```

**주의사항**: `atomic.Value`에 한 번 저장한 타입과 다른 타입을 저장하면 panic이 발생한다. 항상 같은 concrete type을 사용해야 한다.

동시성 환경에서의 Config 교체 패턴은 다음과 같다.

```go
func TestAtomicValueConcurrent(t *testing.T) {
    type Config struct {
        Version int
    }

    var config atomic.Value
    config.Store(Config{Version: 1})

    var wg sync.WaitGroup

    // writer: hot-reload처럼 config를 계속 교체하는 쪽
    wg.Add(1)
    go func() {
        defer wg.Done()
        for i := 2; i <= 100; i++ {
            config.Store(Config{Version: i})
        }
    }()

    // reader: writer와 동시에 동작해도 partial write가 보이지 않는다 (Version > 0 항상 보장)
    wg.Add(1)
    go func() {
        defer wg.Done()
        for range 100 {
            cfg := config.Load().(Config)
            assert.Greater(t, cfg.Version, 0)
        }
    }()

    wg.Wait()

    final := config.Load().(Config)
    assert.Equal(t, 100, final.Version)
}
```

writer가 Config를 계속 교체하는 동안 reader는 항상 **완전한 Config 값**을 읽는다. 중간 상태(부분적으로 업데이트된 struct)는 절대 보이지 않는다. 이것이 `atomic.Value`의 핵심 보장이다.

### 4.6 Atomic 카운터 예제

여러 goroutine에서 atomic 카운터를 증가시키는 실전 패턴이다.

```go
func TestAtomicCounter(t *testing.T) {
    var counter atomic.Int64
    var wg sync.WaitGroup

    wg.Add(1000)
    for range 1000 {
        go func() {
            defer wg.Done()
            // 1000개 goroutine이 동시에 호출해도 Add는 atomic이라 update 손실 없음
            // (Mutex 없이 read-modify-write가 안전하게 처리되는 이유)
            counter.Add(1)
        }()
    }

    wg.Wait()
    assert.Equal(t, int64(1000), counter.Load())
}
```

1000개의 goroutine이 동시에 `Add(1)`을 호출해도 값이 유실되지 않는다. Mutex 없이도 정확한 결과를 보장한다.

## 5. Atomic vs Mutex 성능 비교

Atomic이 Mutex보다 빠르다는 것은 직관적으로 이해되지만, 실제로 얼마나 차이가 나는지 벤치마크로 확인해보자.

### 5.1 쓰기 성능: Atomic Add vs Mutex Counter

```go
// BenchmarkAtomicCounter - atomic 카운터 성능
func BenchmarkAtomicCounter(b *testing.B) {
    var counter atomic.Int64
    // RunParallel은 GOMAXPROCS만큼 goroutine을 띄워 실제 contention 상황을 측정한다
    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            // CPU instruction 한 번으로 처리되므로 lock 획득 비용이 없다
            counter.Add(1)
        }
    })
}

// BenchmarkMutexCounter - mutex 카운터 성능
func BenchmarkMutexCounter(b *testing.B) {
    var mu sync.Mutex
    var counter int64
    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            // Lock/Unlock은 contention 시 goroutine parking까지 발생할 수 있어 atomic 대비 비싸다
            mu.Lock()
            counter++
            mu.Unlock()
        }
    })
}
```

`b.RunParallel`은 여러 goroutine에서 병렬로 벤치마크를 실행한다. 실제 contention이 있는 환경에서의 성능을 측정할 수 있다.

### 5.2 읽기 성능: Atomic Load vs Mutex vs RWMutex

```go
// BenchmarkAtomicLoad - atomic Load 성능
func BenchmarkAtomicLoad(b *testing.B) {
    var val atomic.Int64
    val.Store(42)
    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            // 읽기 전용은 사실상 일반 메모리 read 수준 비용
            _ = val.Load()
        }
    })
}

// BenchmarkMutexRead - mutex 읽기 성능
func BenchmarkMutexRead(b *testing.B) {
    var mu sync.Mutex
    val := int64(42)
    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            // 읽기만 해도 reader 사이에서 직렬화되므로 동시성이 떨어진다
            mu.Lock()
            _ = val
            mu.Unlock()
        }
    })
}

// BenchmarkRWMutexRead - RWMutex 읽기 성능
func BenchmarkRWMutexRead(b *testing.B) {
    var mu sync.RWMutex
    val := int64(42)
    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            // RLock은 reader 간 병렬 허용이지만 내부 counter 갱신 비용은 남는다
            mu.RLock()
            _ = val
            mu.RUnlock()
        }
    })
}
```

### 5.3 벤치마크 결과 분석

일반적으로 다음과 같은 성능 순서를 보인다:

| 연산 | 상대 성능 | 특징 |
|------|----------|------|
| atomic.Load | 가장 빠름 | lock 없이 CPU 명령어 수준에서 처리 |
| RWMutex.RLock | 중간 | 여러 reader 동시 접근 가능 |
| Mutex.Lock | 가장 느림 | 배타적 접근, contention 발생 |

쓰기 연산에서도 atomic.Add가 Mutex보다 빠르다. Mutex는 lock 획득/해제 오버헤드와 goroutine 스케줄링 비용이 추가되기 때문이다.

### 5.4 언제 atomic을 쓰고 언제 mutex를 쓸지

| 상황 | 권장 | 이유 |
|------|------|------|
| 단일 변수 카운터 | atomic | 가볍고 빠름 |
| bool 플래그 | atomic.Bool | Mutex 불필요 |
| Config 교체 | atomic.Value | 읽기 성능이 중요 |
| 여러 변수를 함께 보호 | Mutex | atomic은 단일 변수만 보호 |
| 복잡한 로직이 있는 임계 영역 | Mutex | CAS 루프보다 직관적 |
| map 접근 보호 | RWMutex / sync.Map | atomic으로 불가 |

**핵심 원칙**: atomic은 **단일 값**의 원자적 연산에 적합하고, **여러 변수를 묶어서 보호**해야 하면 Mutex를 사용한다. 성능보다 **정확성과 가독성**이 우선이므로, 확실하지 않으면 Mutex를 쓰는 것이 안전하다.

## 6. 정리

| 개념 | 핵심 | 용도 |
|------|------|------|
| Go Memory Model | 변수의 visibility를 정의하는 규칙 | 동시성 코드의 정확성 보장 |
| happens-before | A의 효과가 B에서 반드시 보이는 관계 | channel, mutex, atomic이 보장 |
| atomic.Int64/Bool | 단일 값의 원자적 읽기/쓰기/증가 | 카운터, 플래그 |
| CompareAndSwap | 현재 값이 예상 값일 때만 교체 | lock-free 업데이트 |
| CAS 루프 | CAS 실패 시 재시도하는 패턴 | lock-free 최대값, 상태 전이 |
| atomic.Value | 임의 타입의 원자적 저장/교체 | Config 동적 교체 |

동시성 프로그래밍에서 가장 미묘한 버그는 **대부분의 경우 동작하지만 가끔 실패하는** visibility 문제에서 발생한다. Go Memory Model의 happens-before 규칙을 이해하면 이런 버그를 원천적으로 방지할 수 있다. 단순한 값의 원자적 접근에는 `sync/atomic`을, 복잡한 상태 보호에는 Mutex를 사용하여 **명확한 happens-before 관계**를 만들자.

> 예제 코드는 [GitHub](https://github.com/kenshin579/tutorials-go/tree/master/golang/concurrency/memory-model)에서 확인할 수 있다.

## 7. 참고

- [The Go Memory Model](https://go.dev/ref/mem)
- [sync/atomic 패키지 문서](https://pkg.go.dev/sync/atomic)
- [Go Blog - Share Memory By Communicating](https://go.dev/blog/codelab-share)
