---
title: "Go 1.26 변경사항 총정리 (What's New in Go 1.26)"
description: "Go 1.26의 주요 변경사항을 정리합니다. new(expr) 초기값 지정, 제네릭 자기참조, errors.AsType, Green Tea GC 기본화, cgo 30% 성능 향상, reflect 반복자, crypto/hpke, SIMD, 고루틴 누수 프로필 등 언어, 성능, 보안 개선 사항을 샘플 코드와 함께 알아봅니다."
date: 2026-02-14
update: 2026-02-14
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

Go 1.26은 2026년 2월에 릴리스되었다. 이번 버전의 핵심 테마는 **언어 표현력 향상**, **성능 대폭 개선**, **보안 강화**이다. `new(expr)` 초기값 지정, 제네릭 자기참조, Green Tea GC 기본 활성화, cgo 30% 성능 향상 등 실무에 바로 적용할 수 있는 변경사항이 많다.

> 참고 자료
> - [Go 1.26 Release Notes](https://go.dev/doc/go1.26)
> - [Go 1.26 is released](https://go.dev/blog/go1.26)
> - [Go 1.26 변경사항 상세](https://antonz.org/go-1-26/)

# 1.언어 변경사항

## 1.1 new() 함수 확장 - 초기값 지정

Go 1.26에서 가장 눈에 띄는 언어 변경사항이다. 기존 `new(T)`는 제로값 포인터만 생성할 수 있었지만, 이제 `new(expr)` 형태로 **초기값을 지정한 포인터를 한 줄로 생성**할 수 있다.

```go
func TestNewWithExpression(t *testing.T) {
	// 기존 방식: 변수를 먼저 선언한 후 주소를 가져옴
	x := 42
	pOld := &x
	fmt.Println("기존 방식:", *pOld) // 42

	// 새로운 방식: new(expr)로 직접 포인터 생성
	pNew := new(42)
	fmt.Println("새로운 방식:", *pNew) // 42
}
```

슬라이스나 맵의 포인터도 직접 생성할 수 있다.

```go
func TestNewWithSliceExpression(t *testing.T) {
	// 슬라이스 포인터 생성
	ps := new([]int{11, 12, 13})
	fmt.Println(*ps) // [11 12 13]
}

func TestNewWithMapExpression(t *testing.T) {
	// 맵 포인터 생성
	pm := new(map[string]int{"a": 1, "b": 2})
	fmt.Println(*pm) // map[a:1 b:2]
}
```

특히 구조체 필드에 포인터를 할당할 때 유용하다. 기존에는 별도 변수를 선언해야 했지만, 이제 한 줄로 처리할 수 있다.

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

	// 기존 방식: 별도 변수 필요
	age := yearsSince(born)
	p1 := Person{Name: "Alice", Age: &age}

	// 새로운 방식: new(expr)로 직접 할당
	p2 := Person{Name: "Alice", Age: new(yearsSince(born))}

	fmt.Printf("기존: %s, %d세\n", p1.Name, *p1.Age)
	fmt.Printf("신규: %s, %d세\n", p2.Name, *p2.Age)
}
```

JSON 마샬링에서도 깔끔하게 사용할 수 있다.

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

## 1.2 제네릭 타입 자기참조 (Recursive Type Constraints)

제네릭 타입이 자기 자신을 타입 파라미터로 참조할 수 있게 되었다. F-bounded 다형성(F-bounded polymorphism) 패턴을 구현할 수 있어 복잡한 타입 관계를 표현할 수 있다.

```go
// Ordered - 제네릭 타입이 자기 자신을 타입 파라미터로 참조
type Ordered[T Ordered[T]] interface {
	Less(T) bool
}

type MyInt int

func (a MyInt) Less(b MyInt) bool {
	return a < b
}

// Min - 제네릭 자기참조를 활용한 최솟값 함수
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

벡터 연산 같은 실용적인 패턴에서도 활용할 수 있다.

```go
// Adder - F-bounded 다형성 패턴
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

# 2.성능 개선

## 2.1 Green Tea 가비지 컬렉터 (기본 활성화)

Go 1.25에서 실험적으로 도입되었던 Green Tea GC가 Go 1.26에서 **기본값으로 활성화**되었다. 소형 객체의 마킹/스캔 성능을 개선하여 **GC 오버헤드를 10~40% 감소**시킨다.

**주요 특징:**
- 메모리 접근 효율성 대폭 개선
- 최신 CPU(Intel Ice Lake, AMD Zen 4 이상)에서 추가 10% 개선
- Go 1.27에서 비활성화 옵션 제거 예정

```bash
# 비활성화 (Go 1.27에서 제거 예정)
GOEXPERIMENT=nogreenteagc go build
```

## 2.2 cgo 호출 성능 30% 향상

프로세서 상태 관리 단순화로 cgo 호출의 베이스라인 런타임 오버헤드가 약 **30% 감소**했다.

```
# 벤치마크 비교
Go 1.25: 28.55ns/op
Go 1.26: 19.02ns/op  (-33%)
```

## 2.3 io.ReadAll 2배 빠른 성능

`io.ReadAll`의 성능이 약 2배 향상되고 **메모리 사용량이 50% 감소**했다.

```go
func BenchmarkReadAll_1MB(b *testing.B) {
	data := bytes.Repeat([]byte("x"), 1024*1024)
	for b.Loop() {
		io.ReadAll(bytes.NewReader(data))
	}
}
```

## 2.4 fmt.Errorf 92% 빨라짐

포맷 인자 없는 `fmt.Errorf` 호출이 **0 할당**으로 최적화되어 기존 대비 92% 빨라졌다.

```go
func BenchmarkErrorf_NoFormat(b *testing.B) {
	// Go 1.26에서 0 할당으로 최적화 (기존 2 할당)
	for b.Loop() {
		_ = fmt.Errorf("simple error message")
	}
}
```

## 2.5 소형 객체 메모리 할당 최적화

1~512바이트 소형 객체 할당 속도가 최대 **30% 향상**되었다. 스택 기반 슬라이스 백킹 스토어 할당도 더 많은 상황으로 확대되었다.

# 3.표준 라이브러리 주요 변경

## 3.1 errors.AsType - 타입 안전한 오류 검사

기존 `errors.As`는 타겟 변수를 미리 선언해야 했지만, 새로운 `errors.AsType[T]`는 **제네릭 기반으로 타입 안전한 오류 검사**를 제공한다.

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

	// 기존 방식: 타겟 변수를 미리 선언해야 함
	var target *AppError
	if errors.As(err, &target) {
		fmt.Printf("Code: %d, Message: %s\n", target.Code, target.Message)
	}
}

func TestErrorsAsType_NewWay(t *testing.T) {
	err := fmt.Errorf("wrapped: %w", &AppError{Code: 404, Message: "not found"})

	// 새로운 방식: errors.AsType[T]() - 타입 안전, 변수 선언 불필요
	if target, ok := errors.AsType[*AppError](err); ok {
		fmt.Printf("Code: %d, Message: %s\n", target.Code, target.Message)
	}
}
```

중첩된 에러 체인에서도 동작한다.

```go
func TestErrorsAsType_ChainedErrors(t *testing.T) {
	innerErr := &ValidationError{Field: "email", Message: "invalid format"}
	wrappedErr := fmt.Errorf("outer: %w", fmt.Errorf("inner: %w", innerErr))

	// 중첩된 에러 체인에서도 타입 검색
	if target, ok := errors.AsType[*ValidationError](wrappedErr); ok {
		fmt.Printf("Field: %s, Message: %s\n", target.Field, target.Message)
	}
}
```

## 3.2 reflect 반복자 추가

`reflect.Type`에 `Fields()`와 `Methods()` 반복자가 추가되어 range 루프로 필드와 메서드를 순회할 수 있다.

```go
func TestReflectFields(t *testing.T) {
	type User struct {
		Name  string
		Email string
		Age   int
	}

	typ := reflect.TypeFor[User]()

	// 기존 방식: 인덱스로 순회
	for i := 0; i < typ.NumField(); i++ {
		f := typ.Field(i)
		fmt.Printf("%s: %s\n", f.Name, f.Type)
	}

	// 새로운 방식: range 반복자
	for f := range typ.Fields() {
		fmt.Printf("%s: %s\n", f.Name, f.Type)
	}
}

func TestReflectMethods(t *testing.T) {
	// 포인터 타입으로 메서드 조회
	typ := reflect.TypeFor[*http.Client]()

	for m := range typ.Methods() {
		fmt.Printf("%s\n", m.Name)
	}
	// CloseIdleConnections, Do, Get, Head, Post, PostForm
}
```

## 3.3 bytes.Buffer.Peek() 메서드

버퍼를 진행시키지 않고 다음 바이트를 확인할 수 있는 `Peek` 메서드가 추가되었다. `Read`와 달리 버퍼 위치가 변경되지 않는다.

```go
func TestBufferPeek(t *testing.T) {
	buf := bytes.NewBufferString("hello world")

	// Peek: 버퍼를 진행시키지 않고 다음 n 바이트를 확인
	peeked, _ := buf.Peek(5)
	fmt.Printf("Peek(5): %q\n", peeked)   // "hello"
	fmt.Printf("Len: %d\n", buf.Len())     // 11 (변경 없음)

	// Read: 버퍼를 진행시킴
	readBuf := make([]byte, 5)
	buf.Read(readBuf)
	fmt.Printf("Len after Read: %d\n", buf.Len()) // 6
}
```

## 3.4 slog.NewMultiHandler()

여러 로그 핸들러에 동시에 출력할 수 있는 `NewMultiHandler`가 추가되었다. 콘솔과 파일, 또는 텍스트와 JSON 형식을 동시에 사용할 때 유용하다.

```go
func TestSlogNewMultiHandler(t *testing.T) {
	var textBuf, jsonBuf bytes.Buffer

	textHandler := slog.NewTextHandler(&textBuf, nil)
	jsonHandler := slog.NewJSONHandler(&jsonBuf, nil)

	// NewMultiHandler: 여러 핸들러에 동시 출력
	multi := slog.NewMultiHandler(textHandler, jsonHandler)
	logger := slog.New(multi)

	logger.Info("user login", "user", "alice", "ip", "192.168.1.1")

	fmt.Println("Text:", textBuf.String())
	// time=... level=INFO msg="user login" user=alice ip=192.168.1.1
	fmt.Println("JSON:", jsonBuf.String())
	// {"time":"...","level":"INFO","msg":"user login","user":"alice","ip":"192.168.1.1"}
}
```

핸들러별로 레벨을 다르게 설정할 수도 있다.

```go
func TestSlogMultiHandlerWithLevels(t *testing.T) {
	var infoBuf, errorBuf bytes.Buffer

	infoHandler := slog.NewTextHandler(&infoBuf, &slog.HandlerOptions{Level: slog.LevelInfo})
	errorHandler := slog.NewTextHandler(&errorBuf, &slog.HandlerOptions{Level: slog.LevelError})

	multi := slog.NewMultiHandler(infoHandler, errorHandler)
	logger := slog.New(multi)

	logger.Info("info message")   // infoBuf에만 출력
	logger.Error("error message") // 두 핸들러 모두 출력
}
```

## 3.5 testing.ArtifactDir() - 테스트 아티팩트 저장

테스트 실행 중 생성된 출력물(로그, 스크린샷, 덤프 등)을 저장할 디렉토리를 반환하는 `t.ArtifactDir()` 메서드가 추가되었다.

```go
func TestArtifactDir(t *testing.T) {
	dir := t.ArtifactDir()
	fmt.Printf("Artifact directory: %s\n", dir)

	// 테스트 결과 파일 저장
	content := []byte("test output data")
	os.WriteFile(filepath.Join(dir, "output.txt"), content, 0644)
}
```

CI 환경에서 테스트 실패 시 아티팩트를 보존하여 디버깅에 활용할 수 있다.

## 3.6 signal.NotifyContext와 Context Cause

`signal.NotifyContext`로 생성된 컨텍스트가 취소될 때, `context.Cause`를 통해 어떤 시그널이 수신되었는지 확인할 수 있다.

```go
func TestSignalNotifyContext(t *testing.T) {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	stop() // 취소 시뮬레이션

	select {
	case <-ctx.Done():
		cause := context.Cause(ctx)
		fmt.Printf("Cause: %v\n", cause) // context canceled
	}
}

func TestContextCauseBasic(t *testing.T) {
	ctx, cancel := context.WithCancelCause(context.Background())

	// 특정 원인으로 취소
	cancel(fmt.Errorf("user requested cancellation"))

	cause := context.Cause(ctx)
	fmt.Printf("Context cause: %v\n", cause)
	// user requested cancellation
}
```

## 3.7 netip.Prefix.Compare - 서브넷 정렬

`netip.Prefix`에 `Compare` 메서드가 추가되어 CIDR 표기법 서브넷을 `slices.SortFunc`로 정렬할 수 있다.

```go
func TestNetipPrefixCompare(t *testing.T) {
	prefixes := []netip.Prefix{
		netip.MustParsePrefix("192.168.1.0/24"),
		netip.MustParsePrefix("10.0.0.0/8"),
		netip.MustParsePrefix("172.16.0.0/12"),
		netip.MustParsePrefix("10.0.1.0/24"),
		netip.MustParsePrefix("192.168.0.0/16"),
	}

	// Go 1.26: netip.Prefix.Compare로 정렬
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

IPv4와 IPv6를 혼합하여 정렬할 수도 있으며, IPv4가 IPv6보다 먼저 정렬된다.

# 4.보안 및 암호화

## 4.1 crypto/hpke 패키지 (신규)

RFC 9180 Hybrid Public Key Encryption(HPKE) 표준 구현이 새로운 패키지로 추가되었다. 포스트-양자 하이브리드 KEM도 지원한다.

## 4.2 암호화 API 개선 - io.Reader 제거

`crypto/dsa`, `crypto/ecdh`, `crypto/ecdsa`, `crypto/rsa`, `crypto/rand` 등의 함수에서 `random` 파라미터가 무시되고, 내부적으로 안전한 랜덤 소스를 자동으로 사용한다.

```go
// 기존 방식
key, _ := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)

// 새 방식: nil 전달 가능 (내부에서 안전한 소스 자동 사용)
key, _ := ecdsa.GenerateKey(elliptic.P256(), nil)
```

## 4.3 힙 베이스 주소 무작위화

64비트 플랫폼에서 힙 베이스 주소가 무작위화되어 메모리 주소 예측이 어려워졌다. cgo 사용 시 공격 방어력이 증대된다.

```bash
# 비활성화
GOEXPERIMENT=norandomizedheapbase64
```

## 4.4 TLS 보안 강화

- `SecP256r1MLKEM768`, `SecP384r1MLKEM1024` 키 교환이 기본 활성화
- 포스트-양자 하이브리드 TLS 지원

# 5.도구 개선

## 5.1 go fix 재작성

`go fix` 명령이 Go 분석 프레임워크 기반으로 완전히 재작성되었다. 수십 개의 **modernizer**가 포함되어 최신 언어 기능을 활용하도록 코드를 자동으로 업데이트한다.

```bash
# 현재 코드를 최신 패턴으로 업데이트
go fix ./...
```

**`//go:fix inline` 지시자:**
`//go:fix inline` 지시자가 있는 함수 호출을 자동으로 인라인한다. 라이브러리 작성자가 API 마이그레이션을 자동화할 때 유용하다.

```go
// 사용 중단된 함수에 인라인 지시자 추가
//go:fix inline
func OldFunc() string {
	return NewFunc()
}

// go fix 실행 시 OldFunc() 호출이 NewFunc()로 자동 변환
```

## 5.2 go mod init 기본 버전 변경

`go mod init` 실행 시 Go 버전이 현재 지원 버전과의 호환성을 고려하여 설정된다. Go 1.26으로 실행하면 `go 1.24.0`으로 설정된다.

# 6.실험적 기능

## 6.1 SIMD 연산 (simd/archsimd)

아키텍처별 벡터화 연산을 지원하는 `simd/archsimd` 패키지가 실험적으로 추가되었다. amd64에서 128/256/512비트 벡터 연산을 사용할 수 있다.

```bash
# 활성화
GOEXPERIMENT=simd go build
```

```go
// SIMD 벡터 연산 예시 (GOEXPERIMENT=simd 필요)
va := archsimd.LoadFloat32x16Slice(a[i : i+16])
vb := archsimd.LoadFloat32x16Slice(b[i : i+16])
vSum := va.Add(vb)
vSum.StoreSlice(res[i : i+16])
```

## 6.2 고루틴 누수 프로필 (goroutineleak)

누수된 고루틴을 감지하는 새로운 프로파일이 실험적으로 추가되었다. Go 1.27에서 기본 활성화 예정이다.

```bash
# 활성화
GOEXPERIMENT=goroutineleakprofile go build

# 엔드포인트 접근
curl http://localhost:6060/debug/pprof/goroutineleak
```

누수 예시: 버퍼 없는 채널에 에러 발생 시 조기 반환하면 고루틴이 영원히 블록된다.

```go
func processWorkItems(ws []workItem) ([]workResult, error) {
	ch := make(chan result) // 언버퍼 채널
	for _, w := range ws {
		go func() {
			res, err := processWorkItem(w)
			ch <- result{res, err} // 블록 → 누수 발생
		}()
	}

	for range len(ws) {
		r := <-ch
		if r.err != nil {
			return nil, r.err // 조기 반환 → 나머지 고루틴 누수
		}
	}
	return results, nil
}
```

## 6.3 runtime/secret - 민감 데이터 안전 소거

암호화 프로토콜의 전방향 보안을 위해 민감한 데이터를 메모리에서 안전하게 삭제하는 `runtime/secret` 패키지가 실험적으로 추가되었다.

```bash
# 활성화
GOEXPERIMENT=runtimesecret go build
```

```go
// 민감 데이터 자동 소거 예시
secret.Do(func() {
	privKey, _ := ecdh.P256().GenerateKey(rand.Reader)
	sharedSecret, _ := privKey.ECDH(peerPublicKey)
	// ... 세션 키 협상
})
// 함수 종료 시 메모리에서 키 자동 삭제
```

# 7.기타 변경사항

## 7.1 플랫폼 변경

| 플랫폼 | 변경사항 |
|--------|---------|
| macOS | Go 1.26이 Monterey 지원 마지막 버전 (Go 1.27에서 Ventura 이상 필요) |
| Windows | `windows/arm` (32비트) 제거 |
| RISC-V | `linux/riscv64` race detector 지원 |
| S390X | 레지스터 기반 함수 인자/반환값 전달 |
| WebAssembly | Sign extension, floating-point conversion 표준화 |

## 7.2 기타 표준 라이브러리 변경

| 패키지 | 변경사항 |
|--------|---------|
| `net` | `Dialer`에 `DialTCP`, `DialUDP`, `DialIP`, `DialUnix` 메서드 추가 |
| `net/http` | HTTP/2 설정 세분화, `NewClientConn()` 추가 |
| `crypto/x509` | `ExtKeyUsage`, `KeyUsage`에 `String()`, `OID()` 메서드 |
| `runtime/metrics` | 고루틴 상태별 메트릭 추가 (`/sched/goroutines/running` 등) |
| `os` | `Process.WithHandle()` - 프로세스 핸들 접근 (Linux 5.4+, Windows) |

# 8.정리

Go 1.26은 언어 표현력, 성능, 보안 전반에 걸친 의미 있는 개선이 이루어진 릴리스다.

| 카테고리 | 변경사항 | 영향도 |
|---------|---------|--------|
| 언어 | `new(expr)` 초기값 지정 | ★★★ |
| 언어 | 제네릭 자기참조 | ★★☆ |
| 성능 | Green Tea GC 기본 활성화 | ★★★ |
| 성능 | cgo 30% 성능 향상 | ★★★ |
| 성능 | `io.ReadAll` 2배 빠름 | ★★☆ |
| 성능 | `fmt.Errorf` 92% 빠름 | ★★☆ |
| 표준 라이브러리 | `errors.AsType[T]()` | ★★★ |
| 표준 라이브러리 | reflect 반복자 | ★★☆ |
| 표준 라이브러리 | `bytes.Buffer.Peek()` | ★★☆ |
| 표준 라이브러리 | `slog.NewMultiHandler()` | ★★☆ |
| 보안 | `crypto/hpke` 신규 패키지 | ★★☆ |
| 보안 | 힙 주소 무작위화 | ★★☆ |
| 도구 | `go fix` 재작성 + modernizers | ★★★ |
| 실험 | SIMD 연산 | ★★☆ |
| 실험 | 고루틴 누수 프로필 | ★★★ |

특히 `new(expr)`와 `errors.AsType`은 일상적인 Go 개발에서 즉시 활용할 수 있는 기능이므로 적극적으로 도입해보자. Green Tea GC가 기본값으로 전환되면서 별도 설정 없이 GC 성능이 크게 개선된다. 고루틴 누수 프로필은 실험적이지만 프로덕션 디버깅에 매우 유용하므로 테스트 환경에서 미리 검증해보는 것을 권장한다.

## Go 1.27 예고

Go 1.27에서 제거 예정인 GODEBUG 옵션:
- `tlsunsafeekm`, `tlsrsakex`, `tls10server`, `tls3des`
- `x509keypairleaf`, `gotypesalias`, `asynctimerchan`
- `GOEXPERIMENT=nogreenteagc` (비활성화 옵션 제거)
