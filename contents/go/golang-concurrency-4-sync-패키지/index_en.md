---
title: "Golang Concurrency Part 4 - The Complete sync Package Guide"
description: "Covers how to use WaitGroup, Mutex, RWMutex, Once, and sync.Map from Go's sync package, and how to resolve race conditions"
date: 2026-04-15
update: 2026-04-15
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

Go recommends communication through channels, but channels aren't optimal in every situation. For simple protection of shared memory, the synchronization primitives in the `sync` package are more intuitive and efficient.

In this part, we cover how to use the core tools of the `sync` package — WaitGroup, Mutex, RWMutex, Once, and sync.Map — and when to apply each.

# 1. Why Do We Need Synchronization?

<img src="cover.png" alt="cover" width="75%" />

When multiple goroutines **access the same variable simultaneously**, a **race condition** occurs. A race condition is the phenomenon where, when two or more goroutines access a shared resource at the same time, the result varies depending on the execution order. It creates non-deterministic bugs where the program sometimes works correctly and sometimes produces wrong results.

```go
// dangerous code: accessing a shared variable without protection
counter := 0
for range 1000 {
    go func() {
        counter++ // Data Race! values are lost when multiple goroutines read and write simultaneously
    }()
}
// expected: 1000, actual: different every time (e.g. 937, 982, 1000...)
```

`counter++` is actually a 3-step operation: "read → increment → write." When multiple goroutines run it simultaneously, values are lost. For example, if two goroutines read the counter value 5 at the same time and each write 6, it incremented twice but the result is 6.

> Running with `go test -race` or `go run -race` lets Go's Race Detector detect data races. Always perform race checks on production code.

# 2. sync.WaitGroup

The most basic tool for **waiting on the completion** of multiple goroutines. It maintains a counter internally, incrementing it with `Add()` and decrementing it with `Done()`. `Wait()` blocks until the counter reaches 0.

You can also wait for goroutine completion with a channel, but for simply "waiting until all N goroutines finish," WaitGroup is far more concise.

```go
var wg sync.WaitGroup

for i := range 5 {
    wg.Add(1)        // counter +1: must be called before starting the goroutine
    go func() {
        defer wg.Done() // counter -1: called when the goroutine completes (defer makes it panic-safe)
        // do work
    }()
}

wg.Wait() // block until the counter reaches 0 (wait for all goroutines to complete)
```

**Key rule**: `wg.Add()` must be called **before** the `go` statement. If you Add inside the goroutine, `Wait()` may run first.

> WaitGroup is reusable. However, you must call `Add()` again after `Wait()` returns. Calling `Add()` while `Wait()` is running causes a panic.

# 3. sync.Mutex

Guarantees **mutual exclusion**. Only one goroutine can access the critical section at a time. Only the goroutine that called `Lock()` monopolizes that section until it calls `Unlock()`. Other goroutines, when they call `Lock()`, wait until the existing goroutine calls `Unlock()`.

Bundling a Mutex into a struct together with the data it protects is Go's idiomatic pattern. This makes it clear in the code "which lock protects which data."

```go
func TestMutexCriticalSection(t *testing.T) {
    // bundling the Mutex and the data it protects into a single struct is Go's idiomatic pattern
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
            c.mu.Lock()   // enter the critical section: other goroutines wait here
            c.v["key"]++  // protected section: only one goroutine runs at a time
            c.mu.Unlock() // release the critical section: a waiting goroutine can enter
        }()
    }

    wg.Wait()
    assert.Equal(t, 100, c.v["key"]) // exactly 100 thanks to Mutex protection
}
```

**Best Practice**: using `defer mu.Unlock()` releases the lock even if a panic occurs. It's especially useful when the critical section is long or there are multiple return points.

> A Mutex must not be copied. When passing it to a function, always pass a **pointer**. `go vet` detects Mutex copies.

# 4. sync.RWMutex

A Mutex forces all access — read or write — to run one at a time without distinction. But read operations don't change data, so multiple goroutines can safely read simultaneously. **RWMutex** leverages this to greatly improve read performance.

A **read lock (RLock)** can be **acquired simultaneously** by multiple goroutines. The write lock (Lock) is exclusive. While a write is in progress, all reads/writes wait; while a read is in progress, only writes wait.

| Operation | Another RLock | Another Lock |
|------|-----------|----------|
| RLock (read) | allowed | wait |
| Lock (write) | wait | wait |

```go
var rwmu sync.RWMutex

// multiple readers can run simultaneously — improves read performance
rwmu.RLock()        // acquire read lock: other readers can also acquire simultaneously
_ = data["key"]     // read data (no modification)
rwmu.RUnlock()      // release read lock

// the writer is exclusive — both reads and writes block
rwmu.Lock()             // acquire write lock: all readers/writers wait
data["key"] = "updated" // modify data
rwmu.Unlock()           // release write lock
```

**When reads are frequent and writes are rare**, RWMutex performs better than Mutex. For example, it's a good fit for scenarios like caches, config lookups, and read APIs where reads are 90%+ and writes are 10% or less.

> If writes are frequent, RWMutex may actually be slower than a plain Mutex due to its internal overhead. Choose after verifying with a benchmark.

# 5. sync.Once

Guarantees that a function runs **exactly once**. Even if multiple goroutines call `once.Do()` simultaneously, the passed function runs **exactly once**, and the remaining goroutines wait until execution completes.

It's most useful when you want to **lazily** perform an **expensive initialization** (DB connection pool initialization, config file loading, etc.) while making it goroutine-safe. Unlike an `init()` function, the initialization runs at the point it's actually needed.

```go
func TestOnceSingleton(t *testing.T) {
    type Config struct {
        DBHost string
        DBPort int
    }

    var (
        instance *Config   // the singleton instance to be initialized only once
        once     sync.Once // guarantees the initialization function runs exactly once
    )

    getConfig := func() *Config {
        once.Do(func() { // no matter how many times this is called, it runs exactly once
            instance = &Config{
                DBHost: "localhost",
                DBPort: 5432,
            }
        })
        return instance // after initialization, immediately return the cached instance
    }

    // returns the same instance even when called simultaneously from multiple goroutines
    var wg sync.WaitGroup
    results := make([]*Config, 10)

    for i := range 10 {
        wg.Add(1)
        go func() {
            defer wg.Done()
            results[i] = getConfig() // 10 goroutines call simultaneously
        }()
    }

    wg.Wait()

    for i := 1; i < len(results); i++ {
        assert.Same(t, results[0], results[i]) // all the same pointer — initialization ran only once
    }
}
```

> Even if a panic occurs inside `once.Do()`, it is considered "executed once." The function won't run again on subsequent calls, so be careful with error handling inside the initialization function.

# 6. sync.Map

Go's regular `map` is not concurrent-safe. If multiple goroutines read and write a map simultaneously, a `fatal error: concurrent map writes` runtime panic occurs. `sync.Map` uses a lock-free algorithm and a read-only cache internally, enabling concurrent access without a separate lock.

`sync.Map` does not support generics, so it operates with the `any` type. A downside is that you need a type assertion when retrieving values.

```go
var m sync.Map

m.Store("key", "value")                   // store: add a key-value pair
val, ok := m.Load("key")                  // load: returns the value and whether it exists
m.Delete("key")                            // delete: remove a key
actual, loaded := m.LoadOrStore("k", "v")  // store if absent, return the existing value if present

// iterate: run a function for every key-value
m.Range(func(key, value any) bool {
    fmt.Println(key, value)
    return true // true: continue to the next item, false: stop iteration
})
```

So which should you choose between a regular `map + Mutex` and `sync.Map`?

| Situation | Recommended |
|------|------|
| keys are stable and reads dominate | `sync.Map` (faster) |
| writes are frequent or keys keep changing | `map + RWMutex` (more efficient) |
| key type is fixed and type safety is needed | `map + RWMutex` (use generics) |

> In most cases, the `map + RWMutex` combination is more general-purpose. `sync.Map` shines in cache scenarios where keys are rarely changed once set.

# 7. Wrapping Up

In this part, we looked at the core synchronization primitives provided by Go's `sync` package. Each tool has its own purpose, and it's important to choose the right one for the situation.

| Primitive | Use | Core |
|----------|------|------|
| WaitGroup | wait for goroutine completion | Add → go → Done → Wait |
| Mutex | mutual exclusion | Lock/Unlock, use of defer recommended |
| RWMutex | read concurrency | better than Mutex when reads are frequent |
| Once | run only once | Singleton, suitable for initialization |
| sync.Map | concurrent-safe map | efficient for read-heavy workloads |

So which should you choose between Channel and Mutex? The official Go Wiki recommends "Channel for transferring ownership of data, Mutex for protecting the internal state of a struct." Refer to the table below to choose the right tool for the situation.

| Channel | Mutex |
|---------|-------|
| transferring ownership of data | protecting simple shared state |
| communication between goroutines | caches, counters |
| pipelines, fan-in/out | protecting a struct's fields |
| complex synchronization patterns | simple critical sections |

In practice, rather than sticking to a single tool, it's better to combine them to fit the situation. For example, the pattern of waiting for goroutine completion with WaitGroup while protecting shared data with Mutex is very common. The important thing is to make a habit of always verifying data races with `go test -race`.

In the next part, we'll cover the **Context package**, the core tool for managing the goroutine lifecycle.

# 8. References

- [Go Blog - Share Memory By Communicating](https://go.dev/blog/codelab-share)
- [sync package docs](https://pkg.go.dev/sync)
