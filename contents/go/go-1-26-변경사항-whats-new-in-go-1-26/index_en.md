---
title: "What's New in Go 1.26"
description: "A roundup of the major changes in Go 1.26. We walk through language, performance, and security improvements — new(expr) initialization, recursive generic constraints, errors.AsType, Green Tea GC enabled by default, 30% faster cgo, reflect iterators, crypto/hpke, SIMD, goroutine leak profile — with sample code."
date: 2026-03-13
update: 2026-03-13
tags:
  - golang
  - go
  - go1.26
  - new
  - green-tea-gc
  - cgo
  - simd
  - hpke
  - generics
  - errors
  - reflect
  - 고랭
  - 새기능
---

Go 1.26 was released in February 2026. The core themes of this version are **improved language expressiveness**, **major performance gains**, and **stronger security**. There are many changes you can apply to real-world work right away, such as `new(expr)` initialization, recursive generic constraints, Green Tea GC enabled by default, and a 30% cgo performance improvement.

# 1.Language Changes

## 1.1 new() Function Extension - Specifying an Initial Value

This is the most noticeable language change in Go 1.26. The previous `new(T)` could only create a pointer to a zero value, but now the `new(expr)` form lets you **create a pointer with an initial value in a single line**.

```go
func TestNewWithExpression(t *testing.T) {
	// Old way: declare a variable first, then take its address
	x := 42
	pOld := &x
	fmt.Println("old way:", *pOld) // 42

	// New way: create a pointer directly with new(expr)
	pNew := new(42)
	fmt.Println("new way:", *pNew) // 42
}
```

You can also create pointers to slices and maps directly.

```go
func TestNewWithSliceExpression(t *testing.T) {
	// Create a slice pointer
	ps := new([]int{11, 12, 13})
	fmt.Println(*ps) // [11 12 13]
}

func TestNewWithMapExpression(t *testing.T) {
	// Create a map pointer
	pm := new(map[string]int{"a": 1, "b": 2})
	fmt.Println(*pm) // map[a:1 b:2]
}
```

It is especially useful when assigning a pointer to a struct field. Previously you had to declare a separate variable, but now you can handle it in one line.

```go
type Person struct {
	Name string
	Age  *int
}

func yearsSince(t time.Time) int {
	return int(time.Since(t).Hours() / 8766)
}

func TestNewInStructField(t *testing.T) {
	born := time.Date(1990, 1, 1, 0, 0, 0, 0, time.UTC)

	// Old way: a separate variable is needed
	age := yearsSince(born)
	p1 := Person{Name: "Alice", Age: &age}

	// New way: assign directly with new(expr)
	p2 := Person{Name: "Alice", Age: new(yearsSince(born))}

	fmt.Printf("old: %s, age %d\n", p1.Name, *p1.Age)
	fmt.Printf("new: %s, age %d\n", p2.Name, *p2.Age)
}
```

It can also be used cleanly in JSON marshaling.

```go
func TestNewWithJSON(t *testing.T) {
	born := time.Date(1990, 1, 1, 0, 0, 0, 0, time.UTC)

	data, _ := json.Marshal(Person{
		Name: "Bob",
		Age:  new(yearsSince(born)),
	})
	fmt.Println(string(data)) // {"Name":"Bob","Age":36}
}
```

## 1.2 Recursive Type Constraints

A generic type can now reference itself as a type parameter. This makes it possible to implement the **F-bounded polymorphism** pattern.

### 1.2.1 What is F-bounded polymorphism?

F-bounded polymorphism is a **pattern where an interface (type constraint) takes, as a parameter, a type that implements the interface itself**. A normal generic constraint declares "T must have these methods," but an F-bounded constraint declares **"T must have a method that takes its own type as an argument."**

```
Normal constraint:     Comparable       → Equal(other any) bool
F-bounded constraint: Comparable[T]   → Equal(other T) bool   ← T refers to itself
```

The key advantage of this pattern is **type safety**. With a normal interface, `Equal(other any)` has to accept any type, which requires a type assertion at runtime. But with the F-bounded pattern, `Equal(other T)` **guarantees at compile time that only values of the same type are compared**.

It is a pattern widely used in other languages as well — Java's `Comparable<T>`, Rust's `trait Add<Rhs = Self>` — and Go supports it starting from Go 1.26.

```go
// Ordered - a generic type referencing itself as a type parameter
type Ordered[T Ordered[T]] interface {
	Less(T) bool
}

type MyInt int

func (a MyInt) Less(b MyInt) bool {
	return a < b
}

// Min - a minimum function using recursive generics
func Min[T Ordered[T]](a, b T) T {
	if a.Less(b) {
		return a
	}
	return b
}

func TestRecursiveGenericMin(t *testing.T) {
	result := Min(MyInt(3), MyInt(7))
	fmt.Printf("Min(3, 7) = %d\n", result) // 3
}
```

It can also be used in practical patterns such as vector arithmetic.

```go
// Adder - the F-bounded polymorphism pattern
type Adder[A Adder[A]] interface {
	Add(A) A
}

type Vector2D struct {
	X, Y float64
}

func (v Vector2D) Add(other Vector2D) Vector2D {
	return Vector2D{X: v.X + other.X, Y: v.Y + other.Y}
}

func Sum[A Adder[A]](values []A) A {
	var zero A
	result := zero
	for _, v := range values {
		result = result.Add(v)
	}
	return result
}

func TestAdderInterface(t *testing.T) {
	vectors := []Vector2D{{1, 2}, {3, 4}, {5, 6}}
	result := Sum(vectors)
	fmt.Printf("Sum = %+v\n", result) // {X:9 Y:12}
}
```

# 2.Performance Improvements

## 2.1 Green Tea Garbage Collector (Enabled by Default)

The Green Tea GC, introduced experimentally in Go 1.25, is **enabled by default** in Go 1.26. It improves the marking/scanning performance of small objects, **reducing GC overhead by 10–40%**.

**Key characteristics:**
- Significantly improved memory access efficiency
- An additional 10% improvement on recent CPUs (Intel Ice Lake, AMD Zen 4 and later)
- The disable option is scheduled to be removed in Go 1.27

```bash
# Disable (scheduled for removal in Go 1.27)
GOEXPERIMENT=nogreenteagc go build
```

## 2.2 30% Faster cgo Calls

By simplifying processor state management, the baseline runtime overhead of cgo calls has been reduced by about **30%**.

```
# Benchmark comparison
Go 1.25: 28.55ns/op
Go 1.26: 19.02ns/op  (-33%)
```

## 2.3 io.ReadAll Is 2x Faster

The performance of `io.ReadAll` has improved roughly 2x and **memory usage has dropped by 50%**.

```go
func BenchmarkReadAll_1MB(b *testing.B) {
	data := bytes.Repeat([]byte("x"), 1024*1024)
	for b.Loop() {
		io.ReadAll(bytes.NewReader(data))
	}
}
```

## 2.4 fmt.Errorf Is 92% Faster

A `fmt.Errorf` call with no format arguments has been optimized to **0 allocations**, making it 92% faster than before.

```go
func BenchmarkErrorf_NoFormat(b *testing.B) {
	// Optimized to 0 allocations in Go 1.26 (previously 2 allocations)
	for b.Loop() {
		_ = fmt.Errorf("simple error message")
	}
}
```

## 2.5 Optimized Memory Allocation for Small Objects

Allocation speed for small objects of 1–512 bytes has improved by up to **30%**. Stack-based slice backing-store allocation has also been extended to more situations.

# 3.Major Standard Library Changes

## 3.1 errors.AsType - Type-Safe Error Inspection

The existing `errors.As` required you to declare the target variable in advance, but the new `errors.AsType[T]` provides **generics-based, type-safe error inspection**.

```go
type AppError struct {
	Code    int
	Message string
}

func (e *AppError) Error() string {
	return fmt.Sprintf("[%d] %s", e.Code, e.Message)
}

func TestErrorsAs_OldWay(t *testing.T) {
	err := fmt.Errorf("wrapped: %w", &AppError{Code: 404, Message: "not found"})

	// Old way: the target variable must be declared in advance
	var target *AppError
	if errors.As(err, &target) {
		fmt.Printf("Code: %d, Message: %s\n", target.Code, target.Message)
	}
}

func TestErrorsAsType_NewWay(t *testing.T) {
	err := fmt.Errorf("wrapped: %w", &AppError{Code: 404, Message: "not found"})

	// New way: errors.AsType[T]() - type-safe, no variable declaration needed
	if target, ok := errors.AsType[*AppError](err); ok {
		fmt.Printf("Code: %d, Message: %s\n", target.Code, target.Message)
	}
}
```

It also works on nested error chains.

```go
func TestErrorsAsType_ChainedErrors(t *testing.T) {
	innerErr := &ValidationError{Field: "email", Message: "invalid format"}
	wrappedErr := fmt.Errorf("outer: %w", fmt.Errorf("inner: %w", innerErr))

	// Type lookup even through a nested error chain
	if target, ok := errors.AsType[*ValidationError](wrappedErr); ok {
		fmt.Printf("Field: %s, Message: %s\n", target.Field, target.Message)
	}
}
```

## 3.2 reflect Iterators Added

`Fields()` and `Methods()` iterators have been added to `reflect.Type`, so you can iterate over fields and methods with a range loop.

```go
func TestReflectFields(t *testing.T) {
	type User struct {
		Name  string
		Email string
		Age   int
	}

	typ := reflect.TypeFor[User]()

	// Old way: iterate by index
	for i := 0; i < typ.NumField(); i++ {
		f := typ.Field(i)
		fmt.Printf("%s: %s\n", f.Name, f.Type)
	}

	// New way: range iterator
	for f := range typ.Fields() {
		fmt.Printf("%s: %s\n", f.Name, f.Type)
	}
}

func TestReflectMethods(t *testing.T) {
	// Look up methods on a pointer type
	typ := reflect.TypeFor[*http.Client]()

	for m := range typ.Methods() {
		fmt.Printf("%s\n", m.Name)
	}
	// CloseIdleConnections, Do, Get, Head, Post, PostForm
}
```

## 3.3 bytes.Buffer.Peek() Method

A `Peek` method has been added that lets you inspect the next bytes without advancing the buffer. Unlike `Read`, it does not change the buffer position.

```go
func TestBufferPeek(t *testing.T) {
	buf := bytes.NewBufferString("hello world")

	// Peek: inspect the next n bytes without advancing the buffer
	peeked, _ := buf.Peek(5)
	fmt.Printf("Peek(5): %q\n", peeked)   // "hello"
	fmt.Printf("Len: %d\n", buf.Len())     // 11 (unchanged)

	// Read: advances the buffer
	readBuf := make([]byte, 5)
	buf.Read(readBuf)
	fmt.Printf("Len after Read: %d\n", buf.Len()) // 6
}
```

## 3.4 slog.NewMultiHandler()

`NewMultiHandler`, which can write to multiple log handlers at once, has been added. It is useful when you want to use console and file, or text and JSON formats, simultaneously.

```go
func TestSlogNewMultiHandler(t *testing.T) {
	var textBuf, jsonBuf bytes.Buffer

	textHandler := slog.NewTextHandler(&textBuf, nil)
	jsonHandler := slog.NewJSONHandler(&jsonBuf, nil)

	// NewMultiHandler: write to multiple handlers at once
	multi := slog.NewMultiHandler(textHandler, jsonHandler)
	logger := slog.New(multi)

	logger.Info("user login", "user", "alice", "ip", "192.168.1.1")

	fmt.Println("Text:", textBuf.String())
	// time=... level=INFO msg="user login" user=alice ip=192.168.1.1
	fmt.Println("JSON:", jsonBuf.String())
	// {"time":"...","level":"INFO","msg":"user login","user":"alice","ip":"192.168.1.1"}
}
```

You can also set a different level for each handler.

```go
func TestSlogMultiHandlerWithLevels(t *testing.T) {
	var infoBuf, errorBuf bytes.Buffer

	infoHandler := slog.NewTextHandler(&infoBuf, &slog.HandlerOptions{Level: slog.LevelInfo})
	errorHandler := slog.NewTextHandler(&errorBuf, &slog.HandlerOptions{Level: slog.LevelError})

	multi := slog.NewMultiHandler(infoHandler, errorHandler)
	logger := slog.New(multi)

	logger.Info("info message")   // written only to infoBuf
	logger.Error("error message") // written to both handlers
}
```

## 3.5 testing.ArtifactDir() - Storing Test Artifacts

A `t.ArtifactDir()` method has been added that returns a directory for storing outputs generated during a test run (logs, screenshots, dumps, etc.).

```go
func TestArtifactDir(t *testing.T) {
	dir := t.ArtifactDir()
	fmt.Printf("Artifact directory: %s\n", dir)

	// Save a test result file
	content := []byte("test output data")
	os.WriteFile(filepath.Join(dir, "output.txt"), content, 0644)
}
```

In CI environments, you can preserve artifacts on test failure and use them for debugging.

## 3.6 signal.NotifyContext and Context Cause

When a context created with `signal.NotifyContext` is canceled, you can check which signal was received via `context.Cause`.

```go
func TestSignalNotifyContext(t *testing.T) {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	stop() // simulate cancellation

	select {
	case <-ctx.Done():
		cause := context.Cause(ctx)
		fmt.Printf("Cause: %v\n", cause) // context canceled
	}
}

func TestContextCauseBasic(t *testing.T) {
	ctx, cancel := context.WithCancelCause(context.Background())

	// Cancel with a specific cause
	cancel(fmt.Errorf("user requested cancellation"))

	cause := context.Cause(ctx)
	fmt.Printf("Context cause: %v\n", cause)
	// user requested cancellation
}
```

## 3.7 netip.Prefix.Compare - Sorting Subnets

A `Compare` method has been added to `netip.Prefix`, so you can sort CIDR-notation subnets with `slices.SortFunc`.

```go
func TestNetipPrefixCompare(t *testing.T) {
	prefixes := []netip.Prefix{
		netip.MustParsePrefix("192.168.1.0/24"),
		netip.MustParsePrefix("10.0.0.0/8"),
		netip.MustParsePrefix("172.16.0.0/12"),
		netip.MustParsePrefix("10.0.1.0/24"),
		netip.MustParsePrefix("192.168.0.0/16"),
	}

	// Go 1.26: sort with netip.Prefix.Compare
	slices.SortFunc(prefixes, netip.Prefix.Compare)

	for _, p := range prefixes {
		fmt.Println(p)
	}
	// 10.0.0.0/8
	// 10.0.1.0/24
	// 172.16.0.0/12
	// 192.168.0.0/16
	// 192.168.1.0/24
}
```

You can also sort a mix of IPv4 and IPv6, with IPv4 sorted before IPv6.

# 4.Security and Cryptography

## 4.1 crypto/hpke Package (New)

An implementation of the RFC 9180 Hybrid Public Key Encryption (HPKE) standard has been added as a new package. It also supports post-quantum hybrid KEM.

## 4.2 Cryptographic API Improvements - io.Reader Removed

In functions of `crypto/dsa`, `crypto/ecdh`, `crypto/ecdsa`, `crypto/rsa`, `crypto/rand`, and others, the `random` parameter is now ignored and a secure random source is automatically used internally.

```go
// Old way
key, _ := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)

// New way: you can pass nil (a secure source is used automatically internally)
key, _ := ecdsa.GenerateKey(elliptic.P256(), nil)
```

## 4.3 Heap Base Address Randomization

On 64-bit platforms, the heap base address is now randomized, making memory address prediction harder. This increases defense against attacks when using cgo.

```bash
# Disable
GOEXPERIMENT=norandomizedheapbase64
```

## 4.4 Stronger TLS Security

- `SecP256r1MLKEM768` and `SecP384r1MLKEM1024` key exchanges are enabled by default
- Post-quantum hybrid TLS support

# 5.Tooling Improvements

## 5.1 go fix Rewritten

The `go fix` command has been completely rewritten on top of the Go analysis framework. It includes dozens of **modernizers** that automatically update code to take advantage of the latest language features.

```bash
# Update current code to the latest patterns
go fix ./...
```

**`//go:fix inline` directive:**
A function call to a function annotated with the `//go:fix inline` directive is automatically inlined. This is useful when library authors want to automate API migrations.

```go
// Add an inline directive to a deprecated function
//go:fix inline
func OldFunc() string {
	return NewFunc()
}

// When go fix runs, calls to OldFunc() are automatically converted to NewFunc()
```

## 5.2 go mod init Default Version Changed

When you run `go mod init`, the Go version is now set with compatibility against currently supported versions in mind. When run with Go 1.26, it is set to `go 1.24.0`.

# 6.Experimental Features

## 6.1 SIMD Operations (simd/archsimd)

A `simd/archsimd` package that supports architecture-specific vectorized operations has been added experimentally. On amd64, you can use 128/256/512-bit vector operations.

```bash
# Enable
GOEXPERIMENT=simd go build
```

```go
// SIMD vector operation example (requires GOEXPERIMENT=simd)
va := archsimd.LoadFloat32x16Slice(a[i : i+16])
vb := archsimd.LoadFloat32x16Slice(b[i : i+16])
vSum := va.Add(vb)
vSum.StoreSlice(res[i : i+16])
```

## 6.2 Goroutine Leak Profile (goroutineleak)

A new profile that detects leaked goroutines has been added experimentally. It is scheduled to be enabled by default in Go 1.27.

```bash
# Enable
GOEXPERIMENT=goroutineleakprofile go build

# Access the endpoint
curl http://localhost:6060/debug/pprof/goroutineleak
```

Leak example: if an error occurs on an unbuffered channel and the function returns early, goroutines block forever.

```go
func processWorkItems(ws []workItem) ([]workResult, error) {
	ch := make(chan result) // unbuffered channel
	for _, w := range ws {
		go func() {
			res, err := processWorkItem(w)
			ch <- result{res, err} // blocks → leak occurs
		}()
	}

	for range len(ws) {
		r := <-ch
		if r.err != nil {
			return nil, r.err // early return → remaining goroutines leak
		}
	}
	return results, nil
}
```

## 6.3 runtime/secret - Safely Erasing Sensitive Data

For the forward secrecy of cryptographic protocols, a `runtime/secret` package that safely erases sensitive data from memory has been added experimentally.

```bash
# Enable
GOEXPERIMENT=runtimesecret go build
```

```go
// Example of automatically erasing sensitive data
secret.Do(func() {
	privKey, _ := ecdh.P256().GenerateKey(rand.Reader)
	sharedSecret, _ := privKey.ECDH(peerPublicKey)
	// ... session key negotiation
})
// The key is automatically deleted from memory when the function returns
```

# 7.Other Changes

## 7.1 Platform Changes

| Platform | Change |
|--------|---------|
| macOS | Go 1.26 is the last version to support Monterey (Go 1.27 will require Ventura or later) |
| Windows | `windows/arm` (32-bit) removed |
| RISC-V | `linux/riscv64` race detector support |
| S390X | Register-based passing of function arguments/return values |
| WebAssembly | Sign extension and floating-point conversion standardized |

## 7.2 Other Standard Library Changes

| Package | Change |
|--------|---------|
| `net` | `DialTCP`, `DialUDP`, `DialIP`, `DialUnix` methods added to `Dialer` |
| `net/http` | Finer-grained HTTP/2 configuration, `NewClientConn()` added |
| `crypto/x509` | `String()`, `OID()` methods on `ExtKeyUsage`, `KeyUsage` |
| `runtime/metrics` | Per-goroutine-state metrics added (`/sched/goroutines/running`, etc.) |
| `os` | `Process.WithHandle()` - access to a process handle (Linux 5.4+, Windows) |

# 8.Summary

Go 1.26 is a release with meaningful improvements across language expressiveness, performance, and security.

| Category | Change | Impact |
|---------|---------|--------|
| Language | `new(expr)` initialization | ★★★ |
| Language | Recursive generics | ★★☆ |
| Performance | Green Tea GC enabled by default | ★★★ |
| Performance | 30% faster cgo | ★★★ |
| Performance | `io.ReadAll` 2x faster | ★★☆ |
| Performance | `fmt.Errorf` 92% faster | ★★☆ |
| Standard library | `errors.AsType[T]()` | ★★★ |
| Standard library | reflect iterators | ★★☆ |
| Standard library | `bytes.Buffer.Peek()` | ★★☆ |
| Standard library | `slog.NewMultiHandler()` | ★★☆ |
| Security | `crypto/hpke` new package | ★★☆ |
| Security | Heap address randomization | ★★☆ |
| Tooling | `go fix` rewrite + modernizers | ★★★ |
| Experimental | SIMD operations | ★★☆ |
| Experimental | Goroutine leak profile | ★★★ |

In particular, `new(expr)` and `errors.AsType` are features you can use immediately in everyday Go development, so adopt them actively. With Green Tea GC becoming the default, GC performance improves significantly without any extra configuration. The goroutine leak profile is experimental, but it is extremely useful for production debugging, so it is recommended to validate it in advance in a test environment.

## Go 1.27 Preview

GODEBUG options scheduled for removal in Go 1.27:
- `tlsunsafeekm`, `tlsrsakex`, `tls10server`, `tls3des`
- `x509keypairleaf`, `gotypesalias`, `asynctimerchan`
- `GOEXPERIMENT=nogreenteagc` (disable option removed)

# 9.References

- [Go 1.26 Release Notes](https://go.dev/doc/go1.26)
- [Go 1.26 is released](https://go.dev/blog/go1.26)
- [Go 1.26 변경사항 상세](https://antonz.org/go-1-26/)
