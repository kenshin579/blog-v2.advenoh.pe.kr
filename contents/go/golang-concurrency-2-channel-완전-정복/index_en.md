---
title: "Golang Concurrency Part 2 - Mastering Channels"
description: "Covers Go channels from basic behavior to the buffered/unbuffered difference, direction restrictions, close rules, and the producer-consumer pattern"
date: 2026-03-19
update: 2026-03-19
tags:
  - golang
  - concurrency
  - channel
  - buffered
  - unbuffered
  - producer-consumer
  - 고랭
  - 동시성
  - 채널
series: "Golang Concurrency"
---

A channel is the **means of communication for exchanging data** between goroutines. It is the core mechanism that realizes Go's concurrency philosophy: "do not communicate by sharing memory; instead, share memory by communicating."

In this part, we fully cover channels — from basic behavior to the buffered/unbuffered difference, direction restrictions, and close rules.

# 1. Channel Concept and Creation

<img src="cover.png" alt="cover" width="75%" />

A channel is created with the `make` function. Think of it as a typed pipe.

```go
ch := make(chan int)       // unbuffered channel (int type)
ch := make(chan string, 5) // buffered channel (string type, buffer size 5)
```

<!-- slides -->

# 2. Send / Receive Behavior

To send a value to a channel, use the `<-` operator.

```go
ch <- 42    // send: send 42 to the channel
val := <-ch // receive: receive a value from the channel
```

```go
func TestChannelSendReceive(t *testing.T) {
    ch := make(chan int)

    go func() {
        ch <- 42 // send
    }()

    value := <-ch // receive (blocks until sent)
    assert.Equal(t, 42, value)
}
```

Channels support various types. Passing a struct lets you send a result and an error together.

```go
func TestChannelStructType(t *testing.T) {
    type Result struct {
        Value int
        Err   error
    }

    ch := make(chan Result)

    go func() {
        ch <- Result{Value: 100, Err: nil}
    }()

    result := <-ch
    assert.Equal(t, 100, result.Value)
    assert.NoError(t, result.Err)
}
```

# 3. Understanding Blocking Behavior

The most important characteristic of a channel is **blocking**.

- **Unbuffered channel**: send and receive must be **ready at the same time** to proceed
- **Buffered channel**: send blocks when the buffer is full; receive blocks when the buffer is empty

```mermaid
graph LR
    subgraph "Unbuffered Channel"
        GA[Goroutine A<br/>send - blocking] -- "handshake<br/>(proceed together)" --> GB[Goroutine B<br/>receive - blocking]
    end
```

```mermaid
graph LR
    subgraph "Buffered Channel (size 3)"
        GA2[Goroutine A<br/>3 sends OK<br/>4th send BLOCK!] --> BUF[Buffer<br/>size: 3] --> GB2[Goroutine B<br/>receive]
    end
```

# 4. Unbuffered vs Buffered Channel

## 4.1 Unbuffered Channel

```go
ch := make(chan int) // buffer size 0
```

- when you send, it blocks **until the receiver receives**
- synchronous communication: both sides must be ready to proceed

```go
func TestUnbufferedChannel(t *testing.T) {
    ch := make(chan int)

    go func() {
        ch <- 42 // blocks here until the receiver is ready
    }()

    time.Sleep(100 * time.Millisecond) // the sender is already blocking
    value := <-ch                       // the moment we receive, the sender proceeds too
    assert.Equal(t, 42, value)
}
```

## 4.2 Buffered Channel

```go
ch := make(chan int, 3) // buffer size 3
```

- if there's free space in the buffer, send completes **immediately**
- send blocks when the buffer is full
- asynchronous communication

```go
func TestBufferedChannel(t *testing.T) {
    ch := make(chan int, 3)

    // can send up to 3 even without a receiver
    ch <- 1
    ch <- 2
    ch <- 3
    // ch <- 4 → blocking (buffer full)

    assert.Equal(t, 1, <-ch)
    assert.Equal(t, 2, <-ch)
    assert.Equal(t, 3, <-ch)
}
```

## 4.3 cap and len

```go
func TestBufferedChannelCapLen(t *testing.T) {
    ch := make(chan string, 5)

    assert.Equal(t, 5, cap(ch)) // buffer capacity
    assert.Equal(t, 0, len(ch)) // number of values currently waiting

    ch <- "a"
    ch <- "b"

    assert.Equal(t, 5, cap(ch))
    assert.Equal(t, 2, len(ch))
}
```

## 4.4 When to Use Which?

| Situation | Choice |
|------|------|
| synchronization (handshake) between goroutines needed | Unbuffered |
| signaling (done, quit) | Unbuffered |
| buffering the difference between production and consumption speeds | Buffered |
| Producer/Consumer pattern | Buffered |
| high-throughput data transfer where performance matters | Buffered |

# 5. Channel Direction Restrictions

You can restrict a channel's direction in a function parameter.

```go
chan<- int  // send-only (can only send)
<-chan int  // receive-only (can only receive)
```

This lets you prevent incorrect use of a channel **at compile time**.

```go
// producer: send-only channel
func produce(ch chan<- int, values []int) {
    for _, v := range values {
        ch <- v
    }
    close(ch)
}

// consumer: receive-only channel
func consume(ch <-chan int) []int {
    var results []int
    for v := range ch {
        results = append(results, v)
    }
    return results
}

func TestChannelDirection(t *testing.T) {
    ch := make(chan int, 5)
    go produce(ch, []int{1, 2, 3, 4, 5})
    results := consume(ch)
    assert.Equal(t, []int{1, 2, 3, 4, 5}, results)
}
```

A bidirectional channel is **implicitly converted** to send-only or receive-only. Conversion in the opposite direction causes a compile error.

```go
var sendOnly chan<- int = ch  // OK: bidirectional → send-only
var recvOnly <-chan int = ch  // OK: bidirectional → receive-only
```

# 6. Channel Close

## 6.1 The Meaning of close

`close(ch)` is a declaration that "**no more values will be sent** to this channel."

## 6.2 Receiving from a Closed Channel

```go
func TestReceiveFromClosedChannel(t *testing.T) {
    ch := make(chan int, 1)
    ch <- 42
    close(ch)

    // if there's a value in the buffer, it returns normally
    val, ok := <-ch
    assert.Equal(t, 42, val)
    assert.True(t, ok)       // a valid value

    // empty buffer and closed channel → zero value + false
    val, ok = <-ch
    assert.Equal(t, 0, val)  // int's zero value
    assert.False(t, ok)      // closed indicator
}
```

## 6.3 Close Rules

| Rule | Description |
|------|------|
| **Sender closes** | the **sender**, not the receiver, is responsible for closing |
| **No double close** | closing an already-closed channel causes a **panic** |
| **No send on a closed channel** | sending a value to a closed channel causes a **panic** |
| **Receive from a closed channel is OK** | returns zero value + false |

## 6.4 Close Responsibility Pattern

```go
// pattern: the sender creates the channel, sends, and closes
func generator() <-chan int {
    ch := make(chan int)
    go func() {
        defer close(ch)   // the sender is responsible for closing
        for i := range 5 {
            ch <- i
        }
    }()
    return ch // return as receive-only
}
```

# 7. Range over Channel

Using `range`, values are automatically received **until the channel is closed**.

```go
func TestRangeOverChannel(t *testing.T) {
    ch := make(chan int, 5)

    go func() {
        for i := 1; i <= 5; i++ {
            ch <- i
        }
        close(ch) // close is required for range to terminate!
    }()

    var results []int
    for v := range ch {
        results = append(results, v)
    }

    assert.Equal(t, []int{1, 2, 3, 4, 5}, results)
}
```

> For `range ch` to terminate, `close(ch)` must be called. Without close, range blocks forever.

## 7.1 Signaling Channel

To send only a **completion signal** rather than data, use `chan struct{}`. struct{} takes up no memory.

```go
func TestChannelSignaling(t *testing.T) {
    done := make(chan struct{})

    go func() {
        // do work...
        close(done) // completion signal (delivered to all receivers)
    }()

    <-done // wait for completion
}
```

`close(done)` sends a signal to **all** receivers simultaneously. This is the difference from simply doing `done <- struct{}{}`.

> If you're confused about the difference between `struct{}` and `struct{}{}`, see the [FAQ](#q-whats-the-difference-between-struct-and-struct).

# 8. Practice: Producer / Consumer Pattern

```go
func TestProducerConsumer(t *testing.T) {
    ch := make(chan int, 10)
    var results []int

    // Producer: generate squares
    go func() {
        for i := 1; i <= 10; i++ {
            ch <- i * i
        }
        close(ch)
    }()

    // Consumer: collect results
    for val := range ch {
        results = append(results, val)
    }

    expected := []int{1, 4, 9, 16, 25, 36, 49, 64, 81, 100}
    assert.Equal(t, expected, results)
}
```

## 8.1 Multiple Producers

```go
func TestMultipleProducers(t *testing.T) {
    ch := make(chan int, 20)
    var wg sync.WaitGroup

    // 3 producers
    for p := range 3 {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for i := range 5 {
                ch <- p*100 + i
            }
        }()
    }

    // close the channel once all producers finish
    go func() {
        wg.Wait()
        close(ch)
    }()

    var results []int
    for val := range ch {
        results = append(results, val)
    }

    assert.Len(t, results, 15) // 3 x 5 = 15 items
}
```

# 9. Summary

| Concept | Core |
|------|------|
| Channel | a type-safe means of communication between goroutines |
| Unbuffered | synchronous handshake, requires simultaneous send/receive readiness |
| Buffered | asynchronous queue, can send up to the buffer size |
| Direction restriction | `chan<-` (send-only), `<-chan` (receive-only) |
| Close | the sender is responsible; a closed channel returns the zero value |
| Range | automatically receives until the channel is closed |
| `chan struct{}` | for signaling (0 memory) |

In the next part, we'll cover advanced channel patterns such as the **select** statement, which handles multiple channels simultaneously, and **fan-in/fan-out**.

# 10. FAQ

## 10.1 Q. What's the difference between `struct{}` and `struct{}{}`?

`struct{}` is a **type**, and `struct{}{}` is a **value (instance)**.

It's easier to understand by analogy with a regular struct:

```go
type Person struct {
    Name string
    Age  int
}

p := Person{Name: "Frank", Age: 30}
//   ^^^^^^ type
//         ^^^^^^^^^^^^^^^^^^^^^^^^ value
```

Likewise, an empty struct has the same structure:

```go
v := struct{}{}
//   ^^^^^^^^ type: struct{} (a struct with no fields)
//           ^^ value: {} (empty literal)
```

| Expression | Meaning | Analogy |
|------|------|------|
| `int` | int type | blueprint |
| `42` | int value | physical object |
| `struct{}` | empty struct type | blueprint (no fields) |
| `struct{}{}` | empty struct value | physical object (no content) |

When used with a channel:

```go
// create a channel — specify the type
done := make(chan struct{})  // a channel of type struct{}

// send a value — send a struct{}{} instance
done <- struct{}{}

// close — deliver a "closed" signal to all receivers instead of a value
close(done)
```

Since `struct{}` takes up 0 bytes of memory, it's the most efficient choice when you want to **only deliver a signal** without data.

# 11. References

- [Go Tour - Channels](https://go.dev/tour/concurrency/2)
- [Effective Go - Channels](https://go.dev/doc/effective_go#channels)
- [Go Blog - Pipelines and cancellation](https://go.dev/blog/pipelines)
