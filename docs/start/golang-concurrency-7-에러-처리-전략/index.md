---
title: "Golang Concurrency 7편 - 에러 처리 전략"
description: "Go 동시성 환경에서의 에러 처리 패턴 - error channel, errgroup, errors.Join을 활용한 실전 전략을 다룹니다"
date: 2026-05-06
tags: ["go", "golang", "concurrency", "error-handling", "errgroup"]
series: "Golang Concurrency"
draft: false
---

동시성 프로그래밍에서 가장 까다로운 부분 중 하나가 에러 처리다. 순차 코드에서는 `if err != nil`로 간단히 처리하지만, goroutine이 여러 개 동시에 실행되는 환경에서는 에러 수집, 전파, 취소 전략이 달라져야 한다.

## 서론 - 동시성 환경에서 에러 처리가 어려운 이유

### goroutine의 에러는 자동으로 전파되지 않는다

일반적인 함수 호출에서는 에러를 반환값으로 받을 수 있다. 하지만 goroutine은 독립적으로 실행되므로 호출자에게 에러가 자동으로 전달되지 않는다.

```go
// 이 에러는 어디에도 전파되지 않는다
go func() {
    _, err := doSomething()
    if err != nil {
        // 호출자는 이 에러를 알 수 없다!
        log.Println(err)
    }
}()
```

### panic은 해당 goroutine에서만 recover 가능하다

goroutine 안에서 발생한 panic은 해당 goroutine 내에서만 `recover`할 수 있다. 다른 goroutine에서 recover하는 것은 불가능하며, 처리되지 않은 panic은 프로그램 전체를 종료시킨다.

```go
go func() {
    defer func() {
        if r := recover(); r != nil {
            // 이 goroutine 안에서만 recover 가능
            log.Println("recovered:", r)
        }
    }()
    panic("something went wrong")
}()
// 메인 goroutine에서는 위 panic을 recover할 수 없다
```

이러한 이유로 동시성 환경에서는 **명시적인 에러 전달 메커니즘**이 필요하다. Go에서는 channel, errgroup, errors.Join 등을 활용한 패턴이 널리 사용된다.

## Error Channel 패턴

가장 기본적인 방법은 channel을 통해 에러와 결과를 함께 전달하는 것이다.

### Result struct로 결과와 에러 함께 전달

결과 값과 에러를 하나의 struct에 담아 channel로 보내는 패턴이다. 각 goroutine이 독립적으로 결과를 반환하고, 호출자가 이를 수집한다.

```go
// Result - 결과와 에러를 함께 전달하는 struct
type Result struct {
    Value int
    Err   error
}
```

### 여러 worker의 결과 수집

각 worker가 자신만의 결과 channel을 반환하고, 호출자가 모든 channel에서 결과를 수집하는 패턴이다.

```go
func TestErrorChannel(t *testing.T) {
    work := func(id int) <-chan Result {
        ch := make(chan Result, 1)
        go func() {
            defer close(ch)
            if id%2 == 0 {
                ch <- Result{Value: id * 10, Err: nil}
            } else {
                ch <- Result{Err: fmt.Errorf("worker %d failed", id)}
            }
        }()
        return ch
    }

    // 3개의 worker 실행
    results := make([]<-chan Result, 3)
    for i := range 3 {
        results[i] = work(i)
    }

    var successes, failures int
    for _, ch := range results {
        r := <-ch
        if r.Err != nil {
            failures++
        } else {
            successes++
        }
    }

    assert.Equal(t, 2, successes) // 0, 2
    assert.Equal(t, 1, failures)  // 1
}
```

이 패턴의 장점은 각 worker의 결과와 에러를 **개별적으로** 처리할 수 있다는 것이다. 일부 worker가 실패하더라도 성공한 결과를 활용할 수 있다.

## errors.Join으로 여러 에러 수집

Go 1.20에서 도입된 `errors.Join`을 사용하면 여러 에러를 하나의 에러로 합칠 수 있다.

### 기본 사용법

```go
func TestMultiError(t *testing.T) {
    var errs []error

    for i := range 5 {
        if i%2 != 0 {
            errs = append(errs, fmt.Errorf("task %d failed", i))
        }
    }

    combined := errors.Join(errs...)

    assert.Error(t, combined)
    assert.Contains(t, combined.Error(), "task 1 failed")
    assert.Contains(t, combined.Error(), "task 3 failed")
}
```

`errors.Join`은 nil이 아닌 에러들만 합쳐서 하나의 에러로 반환한다. 모든 에러가 nil이면 nil을 반환한다.

### errors.Join의 특징

- 합쳐진 에러의 `Error()` 메서드는 각 에러를 줄바꿈으로 구분하여 반환한다
- `errors.Is`와 `errors.As`로 개별 에러를 검사할 수 있다
- 동시성 환경에서 에러 슬라이스에 접근할 때는 **mutex로 보호**해야 한다

```go
var mu sync.Mutex
var errs []error

// 여러 goroutine에서 에러 수집
mu.Lock()
errs = append(errs, err)
mu.Unlock()

// 모든 작업 완료 후
combined := errors.Join(errs...)
```

## errgroup 패턴

`golang.org/x/sync/errgroup` 패키지는 goroutine 그룹의 에러 관리를 위한 표준 도구다. WaitGroup + 에러 처리를 하나로 합친 것이라 보면 된다.

### 기본 사용법

`errgroup.Group`은 여러 goroutine을 실행하고, 그 중 하나라도 에러를 반환하면 `Wait()`에서 첫 번째 에러를 반환한다.

```go
func TestErrgroupBasic(t *testing.T) {
    g := new(errgroup.Group)

    g.Go(func() error {
        return nil // 성공
    })

    g.Go(func() error {
        return fmt.Errorf("task failed")
    })

    err := g.Wait() // 첫 번째 에러 반환
    assert.Error(t, err)
    assert.Contains(t, err.Error(), "task failed")
}
```

### 모든 작업 성공 시

모든 goroutine이 nil을 반환하면 `Wait()`도 nil을 반환한다. 결과 수집은 공유 변수를 통해 할 수 있다.

```go
func TestErrgroupAllSuccess(t *testing.T) {
    g := new(errgroup.Group)

    results := make([]int, 5)
    for i := range 5 {
        g.Go(func() error {
            results[i] = i * i
            return nil
        })
    }

    err := g.Wait()
    assert.NoError(t, err)
    assert.Equal(t, []int{0, 1, 4, 9, 16}, results)
}
```

### errgroup.WithContext - 첫 에러 시 전체 취소

`errgroup.WithContext`를 사용하면 첫 번째 에러가 발생했을 때 context가 취소되어 나머지 goroutine에 **취소 신호**를 전파할 수 있다.

```go
func TestErrgroupWithContext(t *testing.T) {
    g, ctx := errgroup.WithContext(context.Background())

    g.Go(func() error {
        return fmt.Errorf("first error")
    })

    g.Go(func() error {
        <-ctx.Done() // 첫 번째 에러로 context가 취소됨
        return ctx.Err()
    })

    err := g.Wait()
    assert.Error(t, err)
    assert.Contains(t, err.Error(), "first error")
}
```

이 패턴은 **하나라도 실패하면 나머지를 중단**해야 하는 경우에 유용하다. 예를 들어, 여러 API를 동시에 호출하되 하나가 실패하면 나머지를 취소하는 시나리오에 적합하다.

### SetLimit로 동시성 제한

`SetLimit`을 사용하면 동시에 실행되는 goroutine 수를 제한할 수 있다. 세마포어처럼 동작하여 리소스 사용량을 제어한다.

```go
func TestErrgroupSetLimit(t *testing.T) {
    g := new(errgroup.Group)
    g.SetLimit(3) // 최대 3개 goroutine 동시 실행

    results := make([]int, 10)
    for i := range 10 {
        g.Go(func() error {
            results[i] = i
            return nil
        })
    }

    err := g.Wait()
    assert.NoError(t, err)
}
```

`SetLimit`은 내부적으로 buffered channel을 사용하여 동시 실행 수를 제한한다. `g.Go`가 호출될 때 제한에 도달하면 slot이 빌 때까지 blocking된다.

## 패턴 비교 및 선택 가이드

| 패턴 | 주 용도 | 에러 수집 방식 | 취소 전파 |
|------|--------|--------------|----------|
| Error Channel | 개별 결과 + 에러 수집 | 각 결과를 개별 처리 | 직접 구현 필요 |
| errgroup | goroutine 그룹 관리 | 첫 번째 에러만 반환 | WithContext로 지원 |
| errors.Join | 다중 에러 결합 | 모든 에러를 하나로 합침 | 해당 없음 |

### 언제 어떤 패턴을 사용할까

**Error Channel을 사용하는 경우**:
- 각 goroutine의 결과와 에러를 **개별적으로** 처리해야 할 때
- 일부 실패해도 성공한 결과를 활용해야 할 때
- 결과의 순서가 중요할 때

**errgroup을 사용하는 경우**:
- 여러 goroutine을 실행하고 **전체 성공/실패**만 판단하면 될 때
- 첫 에러 시 나머지를 취소해야 할 때 (WithContext)
- 동시 실행 수를 제한해야 할 때 (SetLimit)

**errors.Join을 사용하는 경우**:
- 여러 작업의 에러를 모아서 **한꺼번에 보고**해야 할 때
- 유효성 검증처럼 모든 에러를 수집해야 할 때
- 동시성과 무관하게 다중 에러를 결합할 때

## 모범 사례

### goroutine에서 recover 사용

goroutine 안에서 panic이 발생하면 프로그램 전체가 종료될 수 있다. 외부 입력을 처리하거나 예측 불가능한 코드를 실행하는 goroutine에는 반드시 recover를 넣어야 한다.

```go
go func() {
    defer func() {
        if r := recover(); r != nil {
            log.Printf("goroutine panic recovered: %v", r)
        }
    }()

    // panic이 발생할 수 있는 코드
    riskyOperation()
}()
```

errgroup과 함께 사용할 때는 panic을 에러로 변환하는 wrapper를 만들면 유용하다.

```go
func safeGo(g *errgroup.Group, fn func() error) {
    g.Go(func() (err error) {
        defer func() {
            if r := recover(); r != nil {
                err = fmt.Errorf("panic recovered: %v", r)
            }
        }()
        return fn()
    })
}
```

### timeout과 에러 처리 조합

실무에서는 timeout과 에러 처리를 함께 사용하는 경우가 많다. `errgroup.WithContext`와 `context.WithTimeout`을 조합하면 시간 제한이 있는 병렬 작업을 안전하게 처리할 수 있다.

```go
func fetchAllWithTimeout(urls []string, timeout time.Duration) error {
    ctx, cancel := context.WithTimeout(context.Background(), timeout)
    defer cancel()

    g, ctx := errgroup.WithContext(ctx)

    for _, url := range urls {
        g.Go(func() error {
            req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
            if err != nil {
                return err
            }

            resp, err := http.DefaultClient.Do(req)
            if err != nil {
                return fmt.Errorf("fetch %s: %w", url, err)
            }
            defer resp.Body.Close()

            if resp.StatusCode != http.StatusOK {
                return fmt.Errorf("fetch %s: status %d", url, resp.StatusCode)
            }
            return nil
        })
    }

    return g.Wait()
}
```

이 패턴에서는 세 가지 취소 조건이 동시에 동작한다:
- timeout에 의한 자동 취소
- 첫 번째 에러에 의한 취소 (errgroup.WithContext)
- `cancel()` 호출에 의한 명시적 취소

## 정리

| 패턴 | 핵심 | 사용 시점 |
|------|------|----------|
| Error Channel | Result struct + channel로 개별 결과 전달 | 각 작업의 성공/실패를 개별 처리 |
| errors.Join | 여러 에러를 하나로 합침 (Go 1.20+) | 모든 에러를 수집하여 보고 |
| errgroup.Group | goroutine 그룹 + 첫 에러 반환 | 전체 성공/실패 판단 |
| errgroup.WithContext | 첫 에러 시 context 취소 전파 | 하나 실패 시 나머지 중단 |
| errgroup.SetLimit | 동시 실행 수 제한 | 리소스 사용량 제어 |
| recover wrapper | panic을 에러로 변환 | 예측 불가능한 코드 실행 시 |

동시성 환경에서의 에러 처리는 **에러를 무시하지 않는 것**이 핵심이다. goroutine에서 발생한 에러가 사라지지 않도록 channel이나 errgroup으로 반드시 수집하고, 필요에 따라 context를 통해 취소를 전파하자.

> 예제 코드는 [GitHub](https://github.com/kenshin579/tutorials-go/tree/master/golang/concurrency/errhandling)에서 확인할 수 있다.

## 참고

- [errgroup 패키지 문서](https://pkg.go.dev/golang.org/x/sync/errgroup)
- [errors.Join 문서](https://pkg.go.dev/errors#Join)
- [Go Blog - Error handling and Go](https://go.dev/blog/error-handling-and-go)
