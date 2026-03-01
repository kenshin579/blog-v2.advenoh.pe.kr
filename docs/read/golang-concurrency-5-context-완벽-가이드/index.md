---
title: "Golang Concurrency 5편 - Context 완벽 가이드"
description: "Go context 패키지의 WithCancel, WithTimeout, WithDeadline, WithValue 사용법과 context 전파 패턴을 다룹니다"
date: 2026-04-22
tags: ["go", "golang", "concurrency", "context", "timeout", "cancel"]
series: "Golang Concurrency"
draft: false
---

Go에서 여러 goroutine을 다루다 보면 자연스럽게 마주치는 문제가 있다. "이 goroutine을 언제 멈춰야 하지?", "요청이 3초 안에 끝나지 않으면 어떻게 하지?", "요청 ID를 하위 함수까지 어떻게 전달하지?" 이 모든 질문에 대한 답이 바로 `context` 패키지다.

# 1. 서론 - context 패키지가 필요한 이유

서버가 HTTP 요청을 처리할 때, 하나의 요청이 여러 goroutine으로 분산되어 처리되는 것은 흔한 일이다. 이때 세 가지 핵심 요구사항이 생긴다.

- **goroutine 취소**: 클라이언트가 연결을 끊으면 관련 goroutine을 모두 정리해야 한다
- **timeout 관리**: 외부 API 호출이나 DB 쿼리에 시간 제한을 걸어야 한다
- **요청 범위 값 전달**: 요청 ID, 인증 정보 등을 함수 체인을 따라 전달해야 한다

`context` 패키지는 이 세 가지를 하나의 인터페이스로 통합한다.

```go
type Context interface {
    Deadline() (deadline time.Time, ok bool)
    Done() <-chan struct{}
    Err() error
    Value(key any) any
}
```

- `Done()`: context가 취소되거나 만료되면 닫히는 channel을 반환한다
- `Err()`: Done channel이 닫힌 이유를 반환한다 (`Canceled` 또는 `DeadlineExceeded`)
- `Deadline()`: 만료 시간을 반환한다
- `Value()`: context에 저장된 값을 조회한다

# 2. context.Background()와 context.TODO()

모든 context 트리의 **루트**가 되는 두 가지 빈 context가 있다.

```go
ctx := context.Background() // 일반적인 루트 context
ctx := context.TODO()       // 아직 어떤 context를 쓸지 모를 때
```

- `context.Background()`: main 함수, 초기화 코드, 테스트에서 최상위 context로 사용한다
- `context.TODO()`: 아직 어떤 context를 전달해야 할지 결정하지 못했을 때 임시로 사용한다. 코드 리뷰에서 TODO가 보이면 "여기 context 설계를 확인해야 한다"는 신호다

실무에서는 대부분 `context.Background()`를 루트로 사용하고, 여기에 `WithCancel`, `WithTimeout`, `WithValue` 등을 감싸서 파생 context를 만든다.

# 3. WithCancel - 취소 전파

## 3.1 기본 사용법

`context.WithCancel`은 부모 context로부터 새로운 context와 `cancel` 함수를 반환한다. `cancel()`을 호출하면 `Done()` channel이 닫히고, 이를 감시하는 goroutine이 종료된다.

```go
func TestWithCancel(t *testing.T) {
    ctx, cancel := context.WithCancel(context.Background())

    var stopped atomic.Bool

    go func() {
        <-ctx.Done() // cancel() 호출까지 대기
        stopped.Store(true)
    }()

    cancel() // 명시적으로 취소
    time.Sleep(50 * time.Millisecond)

    assert.True(t, stopped.Load())
    assert.ErrorIs(t, ctx.Err(), context.Canceled)
}
```

`cancel()`이 호출되면 `ctx.Done()`이 닫히면서 goroutine이 깨어난다. `ctx.Err()`는 `context.Canceled`를 반환한다.

> `cancel()` 함수의 내부 구현이 궁금하다면 [FAQ - cancel() 내부 구현](#9-faq)을 참고하자.

## 3.2 취소 체인 (parent -> child)

context는 트리 구조를 이룬다. **부모가 취소되면 모든 자식도 자동으로 취소**된다. 반대로 자식의 취소는 부모에 영향을 주지 않는다.

```go
func TestCancelChain(t *testing.T) {
    parent, parentCancel := context.WithCancel(context.Background())
    child, childCancel := context.WithCancel(parent)
    defer childCancel()

    parentCancel() // parent 취소 → child도 취소
    time.Sleep(50 * time.Millisecond)

    assert.ErrorIs(t, parent.Err(), context.Canceled)
    assert.ErrorIs(t, child.Err(), context.Canceled)
}
```

`parentCancel()`만 호출했는데 `child.Err()`도 `context.Canceled`가 된다. 이것이 context 전파의 핵심이다.

## 3.3 worker 패턴에서의 활용

실무에서 가장 많이 쓰이는 패턴이다. worker goroutine이 `select`로 `ctx.Done()`을 감시하면서, 취소 신호가 오면 깨끗하게 종료한다.

```go
func TestCancelWorker(t *testing.T) {
    ctx, cancel := context.WithCancel(context.Background())
    results := make(chan int, 10)

    // worker: cancel될 때까지 작업
    go func() {
        defer close(results)
        for i := 0; ; i++ {
            select {
            case <-ctx.Done():
                return
            case results <- i:
                time.Sleep(10 * time.Millisecond)
            }
        }
    }()

    // 50ms 후 cancel
    time.Sleep(50 * time.Millisecond)
    cancel()

    var collected []int
    for v := range results {
        collected = append(collected, v)
    }

    t.Logf("수집된 값: %v", collected)
    assert.Greater(t, len(collected), 0)
}
```

worker는 무한 루프를 돌면서 결과를 channel로 보내다가, `ctx.Done()`이 닫히면 `return`으로 빠져나온다. `defer close(results)`로 channel도 정리되므로, `range results`가 자연스럽게 종료된다.

# 4. WithTimeout과 WithDeadline

## 4.1 timeout vs deadline 차이

둘 다 시간 기반으로 context를 취소하지만, 시간을 지정하는 방식이 다르다.

- `WithTimeout(parent, duration)`: **지금부터** duration만큼 후에 취소
- `WithDeadline(parent, time)`: **특정 시각**에 취소

내부적으로 `WithTimeout`은 `WithDeadline(parent, time.Now().Add(timeout))`을 호출한다. 결국 같은 메커니즘이다.

```go
func TestWithTimeout(t *testing.T) {
    ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
    defer cancel()

    select {
    case <-time.After(200 * time.Millisecond):
        t.Fatal("should have timed out")
    case <-ctx.Done():
        assert.ErrorIs(t, ctx.Err(), context.DeadlineExceeded)
    }
}
```

50ms timeout을 설정했으므로, 200ms를 기다리기 전에 `ctx.Done()`이 먼저 닫힌다. timeout으로 취소된 경우 `ctx.Err()`는 `context.DeadlineExceeded`를 반환한다.

```go
func TestWithDeadline(t *testing.T) {
    deadline := time.Now().Add(50 * time.Millisecond)
    ctx, cancel := context.WithDeadline(context.Background(), deadline)
    defer cancel()

    <-ctx.Done()
    assert.ErrorIs(t, ctx.Err(), context.DeadlineExceeded)

    // Deadline() 메서드로 만료 시간 확인
    dl, ok := ctx.Deadline()
    assert.True(t, ok)
    assert.Equal(t, deadline, dl)
}
```

`WithDeadline`은 절대 시각을 사용한다. `Deadline()` 메서드로 설정된 만료 시간을 조회할 수 있다.

## 4.2 중첩 timeout (inner가 더 짧은 경우)

timeout을 중첩할 때, **더 짧은 timeout이 항상 우선**한다. inner context가 먼저 만료되어도 outer context는 영향을 받지 않는다.

```go
func TestNestedTimeout(t *testing.T) {
    outer, outerCancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
    defer outerCancel()

    inner, innerCancel := context.WithTimeout(outer, 50*time.Millisecond)
    defer innerCancel()

    <-inner.Done()

    // inner가 먼저 timeout
    assert.ErrorIs(t, inner.Err(), context.DeadlineExceeded)
    // outer는 아직 살아있음
    assert.NoError(t, outer.Err())
}
```

outer는 200ms, inner는 50ms다. inner가 먼저 만료되지만, outer는 여전히 유효하다. 이 패턴은 HTTP 핸들러(outer) 안에서 DB 쿼리(inner)에 더 짧은 timeout을 거는 것과 같다.

만약 inner의 timeout이 outer보다 **길다면** 어떻게 될까? 이 경우에도 outer가 먼저 취소되면 inner도 함께 취소된다. 부모의 취소는 항상 자식에게 전파되기 때문이다.

# 5. WithValue - 요청 범위 값 전달

## 5.1 기본 사용법

`context.WithValue`는 context에 key-value 쌍을 저장한다. 주로 요청 ID, 인증 토큰, 트레이싱 정보 등 **요청 범위(request-scoped)** 데이터를 전달할 때 사용한다.

```go
func TestWithValue(t *testing.T) {
    ctx := context.Background()
    ctx = context.WithValue(ctx, userIDKey, "user-123")
    ctx = context.WithValue(ctx, requestIDKey, "req-456")

    // 값 조회
    userID := ctx.Value(userIDKey).(string)
    requestID := ctx.Value(requestIDKey).(string)

    assert.Equal(t, "user-123", userID)
    assert.Equal(t, "req-456", requestID)
}
```

존재하지 않는 키를 조회하면 `nil`이 반환된다. 따라서 type assertion 전에 nil 체크를 하는 것이 안전하다.

## 5.2 typed key로 충돌 방지

context 키로 `string`을 직접 사용하면, 서로 다른 패키지에서 같은 문자열을 키로 써서 충돌이 발생할 수 있다. **비공개 타입을 키로 정의**하면 이 문제를 방지할 수 있다.

```go
// 타입 안전한 context key 정의
type contextKey string

const (
    userIDKey    contextKey = "userID"
    requestIDKey contextKey = "requestID"
)
```

`contextKey`는 `string` 기반이지만 별도의 타입이므로, 다른 패키지에서 `string("userID")`로 접근해도 타입이 달라서 매칭되지 않는다. 이것이 Go에서 context key 충돌을 방지하는 표준 패턴이다.

## 5.3 value chain (부모 -> 자식 값 조회)

context value는 트리를 따라 **부모 방향으로 탐색**한다. 자식 context에서 값을 조회하면, 자신에게 없으면 부모를, 부모에게 없으면 그 부모를 순서대로 확인한다.

```go
func TestWithValueChain(t *testing.T) {
    parent := context.WithValue(context.Background(), userIDKey, "parent-user")
    child := context.WithValue(parent, requestIDKey, "child-req")

    // child에서 parent의 값 접근 가능
    assert.Equal(t, "parent-user", child.Value(userIDKey))
    assert.Equal(t, "child-req", child.Value(requestIDKey))

    // parent에서 child의 값은 접근 불가
    assert.Nil(t, parent.Value(requestIDKey))
}
```

child는 parent의 `userIDKey` 값에 접근할 수 있지만, parent는 child의 `requestIDKey` 값에 접근할 수 없다. 값 조회는 항상 **아래에서 위로** (자식에서 부모 방향으로) 진행된다.

# 6. Context 전파 패턴

## 6.1 parent 취소 -> 모든 child 취소

하나의 루트 context에서 여러 child goroutine을 생성하면, 루트를 취소하는 것만으로 모든 goroutine을 한 번에 정리할 수 있다.

```go
func TestPropagation(t *testing.T) {
    root, rootCancel := context.WithCancel(context.Background())

    var stopped atomic.Int64

    // 3개의 child goroutine 생성
    for i := range 3 {
        child, childCancel := context.WithCancel(root)
        defer childCancel()

        go func() {
            <-child.Done()
            stopped.Add(1)
            t.Logf("child %d stopped", i)
        }()
    }

    rootCancel() // root 취소 → 모든 child 취소
    time.Sleep(50 * time.Millisecond)

    assert.Equal(t, int64(3), stopped.Load())
}
```

`rootCancel()` 한 번으로 3개의 child goroutine이 모두 정리된다. 이것이 context 전파의 힘이다. HTTP 서버에서 클라이언트가 연결을 끊으면, 해당 요청에서 파생된 모든 goroutine을 이 패턴으로 정리할 수 있다.

## 6.2 context를 함수의 첫 번째 파라미터로 전달 (Go 관례)

Go 커뮤니티에서 확립된 관례가 있다. **context는 함수의 첫 번째 파라미터로 전달하고, 변수명은 `ctx`를 사용한다.**

```go
// worker - context를 첫 번째 파라미터로 받는 함수 (Go 관례)
func worker(ctx context.Context, id int, results chan<- string) {
    for {
        select {
        case <-ctx.Done():
            results <- fmt.Sprintf("worker %d: stopped", id)
            return
        case <-time.After(10 * time.Millisecond):
            results <- fmt.Sprintf("worker %d: working", id)
        }
    }
}
```

이 worker 함수를 WaitGroup과 함께 사용하면 깔끔한 goroutine 관리가 가능하다.

```go
func TestContextAsFirstParam(t *testing.T) {
    ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
    defer cancel()

    results := make(chan string, 100)

    var wg sync.WaitGroup
    wg.Add(2)
    go func() { defer wg.Done(); worker(ctx, 1, results) }()
    go func() { defer wg.Done(); worker(ctx, 2, results) }()

    // worker가 모두 종료된 후 channel close
    go func() {
        wg.Wait()
        close(results)
    }()

    var messages []string
    for msg := range results {
        messages = append(messages, msg)
    }

    t.Logf("messages: %v", messages)
    assert.Greater(t, len(messages), 0)
}
```

`WithTimeout`으로 50ms 제한을 걸고, WaitGroup으로 모든 worker의 종료를 기다린 후 channel을 닫는다. context와 WaitGroup을 조합하면 "시간 제한이 있는 병렬 작업"을 안전하게 관리할 수 있다.

# 7. 모범 사례

## 7.1 context.Value 남용 금지

`context.Value`는 편리하지만, 함수 시그니처를 대체하는 용도로 사용하면 안 된다.

```go
// 나쁜 예: 함수 파라미터를 context에 넣기
ctx = context.WithValue(ctx, "dbConn", db)
ctx = context.WithValue(ctx, "logger", log)

// 좋은 예: 명시적 파라미터 사용
func HandleRequest(ctx context.Context, db *sql.DB, log *slog.Logger) {
    // ...
}
```

context.Value에 적합한 데이터는 **요청 범위(request-scoped)** 이면서 **함수 시그니처에 넣기 어려운** 것들이다. 대표적으로 요청 ID, 트레이싱 span, 인증 토큰 등이 있다.

## 7.2 context는 struct에 저장하지 않기

```go
// 나쁜 예
type Server struct {
    ctx context.Context // struct에 저장하지 않기
}

// 좋은 예: 메서드 파라미터로 전달
func (s *Server) HandleRequest(ctx context.Context) {
    // ...
}
```

context는 요청의 생명주기와 함께 존재해야 한다. struct에 저장하면 어떤 요청의 context인지 모호해지고, 취소 전파가 제대로 동작하지 않을 수 있다.

## 7.3 cancel() 항상 defer로 호출

`WithCancel`, `WithTimeout`, `WithDeadline`이 반환하는 cancel 함수는 **반드시 호출**해야 한다. 호출하지 않으면 context 관련 리소스가 해제되지 않아 메모리 누수가 발생한다.

```go
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel() // 항상 defer로 호출

// 작업 수행...
```

timeout이 만료되어 자동 취소된 경우에도 `cancel()`을 호출하는 것이 안전하다. 이미 취소된 context에 `cancel()`을 호출해도 아무 일도 일어나지 않는다(idempotent).

# 8. 마무리

| 함수 | 용도 | Done 닫히는 시점 | Err 반환값 |
|------|------|-----------------|-----------|
| `WithCancel` | 명시적 취소 | `cancel()` 호출 시 | `context.Canceled` |
| `WithTimeout` | 시간 제한 (상대) | duration 경과 시 | `context.DeadlineExceeded` |
| `WithDeadline` | 시간 제한 (절대) | deadline 도달 시 | `context.DeadlineExceeded` |
| `WithValue` | 값 전달 | (취소 기능 없음) | - |

context 패키지의 핵심 원칙을 정리하면 다음과 같다.

- **context는 함수의 첫 번째 파라미터**로 전달한다
- **cancel()은 defer로 즉시 호출**한다
- **부모 취소는 모든 자식에게 전파**된다
- **context.Value는 요청 범위 데이터만** 저장한다
- **context는 struct가 아닌 파라미터**로 전달한다

context는 Go에서 goroutine의 생명주기를 관리하는 핵심 도구다. 특히 서버 프로그래밍에서 요청 처리, timeout 관리, 우아한 종료(graceful shutdown)를 구현할 때 필수적으로 사용된다.

# 9. FAQ

### Q. cancel() 함수는 내부적으로 어떻게 구현되어 있는가?

`context.WithCancel`이 반환하는 `cancel()` 함수는 Go 표준 라이브러리(`go/src/context/context.go`)의 `cancelCtx` 구조체에 정의되어 있다.

```go
// cancelCtx - 취소 가능한 context의 내부 구조체
type cancelCtx struct {
    Context                        // 부모 context 임베딩
    mu       sync.Mutex            // 동시 접근 보호용 뮤텍스
    done     atomic.Value          // chan struct{} 저장, 최초 호출 시 lazy 생성
    children map[canceler]struct{} // 자식 context 목록 (취소 전파용)
    err      error                 // 취소 사유 (Canceled 또는 DeadlineExceeded)
    cause    error                 // Go 1.20+ cause 체인
}

// cancel - 실제 취소 로직
func (c *cancelCtx) cancel(removeFromParent bool, err, cause error) {
    c.mu.Lock()

    if c.err != nil {
        c.mu.Unlock()
        return // 이미 취소된 상태면 무시 (멱등성 보장)
    }

    c.err = err     // context.Canceled 설정
    c.cause = cause

    // done channel을 닫아서 <-ctx.Done()으로 대기 중인 goroutine을 깨움
    d, _ := c.done.Load().(chan struct{})
    if d == nil {
        c.done.Store(closedchan) // 아직 생성 안 됐으면 미리 닫힌 channel 저장
    } else {
        close(d) // 기존 channel을 닫음 → 모든 수신자가 즉시 깨어남
    }

    // 모든 자식 context도 재귀적으로 취소
    for child := range c.children {
        child.cancel(false, err, cause)
    }
    c.children = nil
    c.mu.Unlock()

    if removeFromParent {
        removeChild(c.Context, c) // 부모의 children map에서 자신을 제거
    }
}
```

핵심 동작을 정리하면 다음과 같다.

| 단계 | 동작 | 설명 |
|------|------|------|
| 1 | 멱등성 체크 | `cancel()`을 여러 번 호출해도 안전 (첫 번째만 실행) |
| 2 | `err` 설정 | `ctx.Err()`가 `context.Canceled`를 반환하도록 설정 |
| 3 | `done` channel 닫기 | `close(d)`로 `<-ctx.Done()` 대기 중인 모든 goroutine을 깨움 |
| 4 | 자식 취소 전파 | `children` map을 순회하며 모든 자식도 재귀적으로 취소 |
| 5 | 부모에서 제거 | 부모의 `children` map에서 자신을 제거하여 메모리 해제 |

`close(d)`가 핵심인데, Go에서 **닫힌 channel은 즉시 zero value를 반환**하므로 `<-ctx.Done()`으로 대기 중인 모든 goroutine이 동시에 깨어난다. 이것이 context의 취소 전파가 효율적인 이유다.

# 10. 참고

- 예제 코드: [tutorials-go/golang/concurrency/context](https://github.com/kenshin579/tutorials-go/tree/master/golang/concurrency/context)
- [Go 공식 문서 - context 패키지](https://pkg.go.dev/context)
- [Go Blog - Contexts and structs](https://go.dev/blog/context-and-structs)
- [Go Concurrency Patterns: Context](https://go.dev/blog/context)
