---
title: "Golang Concurrency Part 5 - The Complete Context Guide"
description: "Covers how to use the Go context package's WithCancel, WithTimeout, WithDeadline, and WithValue, and context propagation patterns"
date: 2026-04-18
tags: ["go", "golang", "concurrency", "context", "timeout", "cancel"]
series: "Golang Concurrency"
draft: false
---

When working with multiple goroutines in Go, there are questions you naturally run into. "When should I stop this goroutine?", "What if the request doesn't finish within 3 seconds?", "How do I pass the request ID down to lower-level functions?" The answer to all these questions is the `context` package.

# 1. Introduction - Why the context Package Is Needed

<img src="cover.png" alt="cover" width="75%" />

When a server handles an HTTP request, it's common for a single request to be distributed across multiple goroutines. Three core requirements arise here.

- **goroutine cancellation**: when the client disconnects, all related goroutines must be cleaned up
- **timeout management**: you need to put a time limit on external API calls or DB queries
- **passing request-scoped values**: request ID, authentication info, etc. need to be passed along the function chain

The `context` package unifies these three into a single interface.

```go
type Context interface {
    Deadline() (deadline time.Time, ok bool)
    Done() <-chan struct{}
    Err() error
    Value(key any) any
}
```

- `Done()`: returns a channel that closes when the context is canceled or expires
- `Err()`: returns the reason the Done channel closed (`Canceled` or `DeadlineExceeded`)
- `Deadline()`: returns the expiration time
- `Value()`: looks up a value stored in the context

# 2. context.Background() and context.TODO()

There are two empty contexts that serve as the **root** of every context tree.

```go
ctx := context.Background() // the general root context
ctx := context.TODO()       // when you don't yet know which context to use
```

- `context.Background()`: used as the top-level context in the main function, initialization code, and tests
- `context.TODO()`: used temporarily when you haven't yet decided which context to pass. When you see a TODO in code review, it's a signal that "the context design here needs to be checked"

In practice, you mostly use `context.Background()` as the root and wrap it with `WithCancel`, `WithTimeout`, `WithValue`, etc. to create derived contexts.

# 3. WithCancel - Cancellation Propagation

## 3.1 Basic Usage

`context.WithCancel` returns a new context and a `cancel` function from a parent context. Calling `cancel()` closes the `Done()` channel and terminates the goroutine watching it.

```go
func TestWithCancel(t *testing.T) {
    ctx, cancel := context.WithCancel(context.Background())

    var stopped atomic.Bool

    go func() {
        <-ctx.Done() // wait until cancel() is called
        stopped.Store(true)
    }()

    cancel() // cancel explicitly
    time.Sleep(50 * time.Millisecond)

    assert.True(t, stopped.Load())
    assert.ErrorIs(t, ctx.Err(), context.Canceled)
}
```

When `cancel()` is called, `ctx.Done()` closes and the goroutine wakes up. `ctx.Err()` returns `context.Canceled`.

> If you're curious about the internal implementation of the `cancel()` function, see [FAQ - cancel() internal implementation](#9-faq).

## 3.2 Cancellation Chain (parent -> child)

A context forms a tree structure. **When a parent is canceled, all children are automatically canceled.** Conversely, canceling a child does not affect the parent.

```go
func TestCancelChain(t *testing.T) {
    parent, parentCancel := context.WithCancel(context.Background())
    child, childCancel := context.WithCancel(parent)
    defer childCancel()

    parentCancel() // cancel parent → child is canceled too
    time.Sleep(50 * time.Millisecond)

    assert.ErrorIs(t, parent.Err(), context.Canceled)
    assert.ErrorIs(t, child.Err(), context.Canceled)
}
```

Even though only `parentCancel()` was called, `child.Err()` also becomes `context.Canceled`. This is the essence of context propagation.

## 3.3 Use in the worker Pattern

This is the most commonly used pattern in practice. A worker goroutine watches `ctx.Done()` with `select` and terminates cleanly when a cancellation signal arrives.

```go
func TestCancelWorker(t *testing.T) {
    ctx, cancel := context.WithCancel(context.Background())
    results := make(chan int, 10)

    // worker: works until canceled
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

    // cancel after 50ms
    time.Sleep(50 * time.Millisecond)
    cancel()

    var collected []int
    for v := range results {
        collected = append(collected, v)
    }

    t.Logf("collected values: %v", collected)
    assert.Greater(t, len(collected), 0)
}
```

The worker loops infinitely sending results to a channel, and when `ctx.Done()` closes, it exits via `return`. Since `defer close(results)` cleans up the channel too, `range results` terminates naturally.

# 4. WithTimeout and WithDeadline

## 4.1 The Difference Between timeout and deadline

Both cancel the context based on time, but the way they specify the time differs.

- `WithTimeout(parent, duration)`: cancel after duration **from now**
- `WithDeadline(parent, time)`: cancel at a **specific time**

Internally, `WithTimeout` calls `WithDeadline(parent, time.Now().Add(timeout))`. Ultimately it's the same mechanism.

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

Since a 50ms timeout was set, `ctx.Done()` closes before the 200ms wait completes. When canceled by timeout, `ctx.Err()` returns `context.DeadlineExceeded`.

```go
func TestWithDeadline(t *testing.T) {
    deadline := time.Now().Add(50 * time.Millisecond)
    ctx, cancel := context.WithDeadline(context.Background(), deadline)
    defer cancel()

    <-ctx.Done()
    assert.ErrorIs(t, ctx.Err(), context.DeadlineExceeded)

    // check the expiration time with the Deadline() method
    dl, ok := ctx.Deadline()
    assert.True(t, ok)
    assert.Equal(t, deadline, dl)
}
```

`WithDeadline` uses an absolute time. You can look up the set expiration time with the `Deadline()` method.

## 4.2 Nested Timeout (when the inner one is shorter)

When nesting timeouts, **the shorter timeout always takes precedence**. Even if the inner context expires first, the outer context is unaffected.

```go
func TestNestedTimeout(t *testing.T) {
    outer, outerCancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
    defer outerCancel()

    inner, innerCancel := context.WithTimeout(outer, 50*time.Millisecond)
    defer innerCancel()

    <-inner.Done()

    // inner times out first
    assert.ErrorIs(t, inner.Err(), context.DeadlineExceeded)
    // outer is still alive
    assert.NoError(t, outer.Err())
}
```

outer is 200ms, inner is 50ms. inner expires first, but outer is still valid. This pattern is like putting a shorter timeout on a DB query (inner) inside an HTTP handler (outer).

What if the inner's timeout is **longer** than the outer's? In that case too, if outer is canceled first, inner is canceled along with it. A parent's cancellation always propagates to its children.

# 5. WithValue - Passing Request-Scoped Values

## 5.1 Basic Usage

`context.WithValue` stores a key-value pair in the context. It's mainly used to pass **request-scoped** data such as request IDs, authentication tokens, and tracing information.

```go
func TestWithValue(t *testing.T) {
    ctx := context.Background()
    ctx = context.WithValue(ctx, userIDKey, "user-123")
    ctx = context.WithValue(ctx, requestIDKey, "req-456")

    // look up values
    userID := ctx.Value(userIDKey).(string)
    requestID := ctx.Value(requestIDKey).(string)

    assert.Equal(t, "user-123", userID)
    assert.Equal(t, "req-456", requestID)
}
```

Looking up a non-existent key returns `nil`. So it's safe to do a nil check before a type assertion.

## 5.2 Preventing Collisions with a typed key

If you use `string` directly as a context key, different packages might use the same string as a key, causing a collision. **Defining a private type as the key** prevents this problem.

```go
// define type-safe context keys
type contextKey string

const (
    userIDKey    contextKey = "userID"
    requestIDKey contextKey = "requestID"
)
```

`contextKey` is based on `string` but is a distinct type, so even if another package accesses it as `string("userID")`, the types differ and won't match. This is the standard pattern for preventing context key collisions in Go.

## 5.3 value chain (looking up parent -> child values)

A context value is **searched toward the parent** along the tree. When you look up a value in a child context, if it's not on the child, it checks the parent, and if not on the parent, its parent, in order.

```go
func TestWithValueChain(t *testing.T) {
    parent := context.WithValue(context.Background(), userIDKey, "parent-user")
    child := context.WithValue(parent, requestIDKey, "child-req")

    // can access the parent's value from the child
    assert.Equal(t, "parent-user", child.Value(userIDKey))
    assert.Equal(t, "child-req", child.Value(requestIDKey))

    // cannot access the child's value from the parent
    assert.Nil(t, parent.Value(requestIDKey))
}
```

The child can access the parent's `userIDKey` value, but the parent cannot access the child's `requestIDKey` value. Value lookup always proceeds **from bottom to top** (from child toward parent).

# 6. Context Propagation Patterns

## 6.1 parent cancellation -> all children canceled

If you create multiple child goroutines from a single root context, you can clean up all goroutines at once just by canceling the root.

```go
func TestPropagation(t *testing.T) {
    root, rootCancel := context.WithCancel(context.Background())

    var stopped atomic.Int64

    // create 3 child goroutines
    for i := range 3 {
        child, childCancel := context.WithCancel(root)
        defer childCancel()

        go func() {
            <-child.Done()
            stopped.Add(1)
            t.Logf("child %d stopped", i)
        }()
    }

    rootCancel() // cancel root → all children canceled
    time.Sleep(50 * time.Millisecond)

    assert.Equal(t, int64(3), stopped.Load())
}
```

A single `rootCancel()` cleans up all 3 child goroutines. This is the power of context propagation. In an HTTP server, when a client disconnects, you can clean up all goroutines derived from that request with this pattern.

## 6.2 Pass context as the function's first parameter (Go convention)

There's a convention established in the Go community. **Pass context as the function's first parameter, and use `ctx` as the variable name.**

```go
// worker - a function that takes context as the first parameter (Go convention)
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

Using this worker function with a WaitGroup enables clean goroutine management.

```go
func TestContextAsFirstParam(t *testing.T) {
    ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
    defer cancel()

    results := make(chan string, 100)

    var wg sync.WaitGroup
    wg.Add(2)
    go func() { defer wg.Done(); worker(ctx, 1, results) }()
    go func() { defer wg.Done(); worker(ctx, 2, results) }()

    // close the channel after all workers terminate
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

It sets a 50ms limit with `WithTimeout`, waits for all workers to terminate with a WaitGroup, and then closes the channel. Combining context and WaitGroup lets you safely manage "parallel work with a time limit."

# 7. Best Practices

## 7.1 Don't Abuse context.Value

`context.Value` is convenient, but it should not be used to replace function signatures.

```go
// bad example: putting function parameters into context
ctx = context.WithValue(ctx, "dbConn", db)
ctx = context.WithValue(ctx, "logger", log)

// good example: use explicit parameters
func HandleRequest(ctx context.Context, db *sql.DB, log *slog.Logger) {
    // ...
}
```

Data suitable for context.Value is **request-scoped** and **hard to put in a function signature**. Typical examples are request IDs, tracing spans, and authentication tokens.

## 7.2 Don't Store context in a struct

```go
// bad example
type Server struct {
    ctx context.Context // don't store in a struct
}

// good example: pass as a method parameter
func (s *Server) HandleRequest(ctx context.Context) {
    // ...
}
```

A context should exist together with the request's lifecycle. Storing it in a struct makes it ambiguous which request's context it is, and cancellation propagation may not work properly.

## 7.3 Always Call cancel() with defer

The cancel function returned by `WithCancel`, `WithTimeout`, and `WithDeadline` **must be called**. If you don't call it, context-related resources won't be released, causing a memory leak.

```go
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel() // always call with defer

// do work...
```

Even when the timeout expires and it's automatically canceled, it's safe to call `cancel()`. Calling `cancel()` on an already-canceled context does nothing (idempotent).

# 8. Wrapping Up

| Function | Use | When Done closes | Err return value |
|------|------|-----------------|-----------|
| `WithCancel` | explicit cancellation | when `cancel()` is called | `context.Canceled` |
| `WithTimeout` | time limit (relative) | after duration elapses | `context.DeadlineExceeded` |
| `WithDeadline` | time limit (absolute) | when the deadline is reached | `context.DeadlineExceeded` |
| `WithValue` | passing values | (no cancellation feature) | - |

The core principles of the context package can be summarized as follows.

- pass **context as the function's first parameter**
- **call cancel() immediately with defer**
- **a parent's cancellation propagates to all children**
- **context.Value stores only request-scoped data**
- **pass context as a parameter, not in a struct**

context is the core tool for managing the goroutine lifecycle in Go. It's especially essential in server programming when implementing request handling, timeout management, and graceful shutdown.

# 9. FAQ

### Q. How is the cancel() function implemented internally?

The `cancel()` function returned by `context.WithCancel` is defined on the `cancelCtx` struct in the Go standard library (`go/src/context/context.go`).

```go
// cancelCtx - the internal struct of a cancelable context
type cancelCtx struct {
    Context                        // embeds the parent context
    mu       sync.Mutex            // mutex to protect concurrent access
    done     atomic.Value          // stores chan struct{}, lazily created on first call
    children map[canceler]struct{} // list of child contexts (for cancellation propagation)
    err      error                 // cancellation reason (Canceled or DeadlineExceeded)
    cause    error                 // Go 1.20+ cause chain
}

// cancel - the actual cancellation logic
func (c *cancelCtx) cancel(removeFromParent bool, err, cause error) {
    c.mu.Lock()

    if c.err != nil {
        c.mu.Unlock()
        return // ignore if already canceled (guarantees idempotency)
    }

    c.err = err     // set context.Canceled
    c.cause = cause

    // close the done channel to wake goroutines waiting on <-ctx.Done()
    d, _ := c.done.Load().(chan struct{})
    if d == nil {
        c.done.Store(closedchan) // if not yet created, store a pre-closed channel
    } else {
        close(d) // close the existing channel → all receivers wake up immediately
    }

    // recursively cancel all child contexts too
    for child := range c.children {
        child.cancel(false, err, cause)
    }
    c.children = nil
    c.mu.Unlock()

    if removeFromParent {
        removeChild(c.Context, c) // remove itself from the parent's children map
    }
}
```

The core behavior can be summarized as follows.

| Step | Behavior | Description |
|------|------|------|
| 1 | idempotency check | safe to call `cancel()` multiple times (only the first runs) |
| 2 | set `err` | set it so `ctx.Err()` returns `context.Canceled` |
| 3 | close the `done` channel | `close(d)` wakes all goroutines waiting on `<-ctx.Done()` |
| 4 | propagate cancellation to children | iterate the `children` map and recursively cancel all children |
| 5 | remove from parent | remove itself from the parent's `children` map to free memory |

`close(d)` is the key — in Go, a **closed channel immediately returns the zero value**, so all goroutines waiting on `<-ctx.Done()` wake up simultaneously. This is why context's cancellation propagation is efficient.

### Q. How should I set the context timeout when calling a DB / external API from an API handler?

When an API handler calls a DB query or an external API, if a problem occurs at any layer, the entire request can stall. To prevent this, you need to set context timeouts appropriately.

**Method 1: a single timeout for the entire request**

```go
// resty client (reused at the package level)
var client = resty.New()

func handler(w http.ResponseWriter, r *http.Request) {
    ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second) // 5-second limit for the whole thing
    defer cancel()

    // DB query — interrupted when ctx is canceled
    user, err := db.GetUser(ctx, userID)
    if err != nil { return }

    // external API call — pass the same ctx to resty
    var profile Profile
    _, err = client.R().
        SetContext(ctx).           // propagate the context
        SetResult(&profile).
        Get(fmt.Sprintf("https://api.example.com/profile/%s", user.Email))
    if err != nil { return }
}
```

It's simple, but it has the problem that if the DB takes 4.5 seconds, the external API has only 0.5 seconds.

**Method 2: per-layer individual timeouts (recommended)**

```go
func handler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context() // the parent context

    // 2-second limit for the DB
    dbCtx, dbCancel := context.WithTimeout(ctx, 2*time.Second)
    defer dbCancel()
    user, err := db.GetUser(dbCtx, userID)
    if err != nil { return }

    // 3-second limit for the external API — pass an individual context to resty
    apiCtx, apiCancel := context.WithTimeout(ctx, 3*time.Second)
    defer apiCancel()

    var profile Profile
    _, err = client.R().
        SetContext(apiCtx).        // per-layer timeout context
        SetResult(&profile).
        Get(fmt.Sprintf("https://api.example.com/profile/%s", user.Email))
    if err != nil { return }
}
```

By giving each layer an appropriate timeout, a slowdown in one doesn't affect the other layers. resty's `SetContext()` internally calls `http.Request.WithContext()`, so when a timeout or cancel occurs, **even the TCP connection is interrupted immediately**.

**Method 3: parallel calls + errgroup (when the calls are independent)**

If the DB and external API are independent of each other, you can call them in parallel and cancel the rest if any one fails.

```go
func handler(w http.ResponseWriter, r *http.Request) {
    ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
    defer cancel()

    g, gCtx := errgroup.WithContext(ctx) // any error → the rest are automatically canceled

    var user *User
    var profile Profile

    g.Go(func() error {
        var err error
        user, err = db.GetUser(gCtx, userID) // use gCtx
        return err
    })

    g.Go(func() error {
        _, err := client.R().
            SetContext(gCtx).      // errgroup's context → auto-canceled when another goroutine fails
            SetResult(&profile).
            Get(fmt.Sprintf("https://api.example.com/profile/%s", email))
        return err
    })

    if err := g.Wait(); err != nil { return }
}
```

| Pattern | When to use |
|------|----------|
| whole-request timeout | simple APIs, when there are 1-2 layers |
| per-layer timeout | when the DB/external API have different allowed times (most recommended) |
| errgroup + context | parallel independent calls, cancel the rest if one fails |

> **How resty's `SetContext()` works internally**: when you call `SetContext(ctx)`, resty internally uses the Go standard library's `http.Request.WithContext(ctx)`. This context propagates down to the `roundTrip()` step of `net/http.Transport`, so when the context is canceled, it's immediately interrupted at every step of the HTTP request — **DNS lookup, TCP connection, TLS handshake, response reading**. Therefore, as long as you pass `SetContext(ctx)` correctly, unnecessary network resources are immediately released on timeout or cancel.
>
> ```go
> // inside resty (simplified)
> func (r *Request) Execute(method, url string) (*Response, error) {
>     // 1. create an http.Request
>     req, _ := http.NewRequestWithContext(r.ctx, method, url, body)
>
>     // 2. call http.Client.Do() — immediately interrupted when the context is canceled
>     resp, err := r.client.httpClient.Do(req)
>     // returns a context.DeadlineExceeded or context.Canceled error
> }
> ```

### Q. How do I manage timeouts in the Echo framework?

Echo has a built-in `TimeoutMiddleware`, so you can automatically apply a timeout to all handlers.

```go
import "github.com/labstack/echo/v4/middleware"

e := echo.New()

// apply a 5-second timeout to all handlers
e.Use(middleware.TimeoutWithConfig(middleware.TimeoutConfig{
    Timeout: 5 * time.Second,
}))
```

In a handler, use the timeout context set by the middleware via `c.Request().Context()`.

```go
func getUser(c echo.Context) error {
    ctx := c.Request().Context() // the timeout context set by the middleware

    user, err := db.GetUser(ctx, id)
    if err != nil {
        if errors.Is(err, context.DeadlineExceeded) {
            return echo.NewHTTPError(http.StatusGatewayTimeout, "request timed out")
        }
        return err
    }
    return c.JSON(http.StatusOK, user)
}
```

You can also set a different timeout per route.

```go
// default 5 seconds
e.Use(middleware.TimeoutWithConfig(middleware.TimeoutConfig{
    Timeout: 5 * time.Second,
}))

// 30 seconds only for the file upload route
uploadGroup := e.Group("/upload")
uploadGroup.Use(middleware.TimeoutWithConfig(middleware.TimeoutConfig{
    Timeout: 30 * time.Second,
}))
```

The middleware is the **upper limit for the entire request**, while per-layer granularity (DB 2 seconds, external API 3 seconds) is, as a practical pattern, set directly inside the handler with `context.WithTimeout`.

# 10. References

- Example code: [tutorials-go/golang/concurrency/context](https://github.com/kenshin579/tutorials-go/tree/master/golang/concurrency/context)
- [Go official docs - context package](https://pkg.go.dev/context)
- [Go Blog - Contexts and structs](https://go.dev/blog/context-and-structs)
- [Go Concurrency Patterns: Context](https://go.dev/blog/context)
