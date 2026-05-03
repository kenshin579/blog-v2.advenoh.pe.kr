---
title: "Go 테이블 기반 테스트와 벤치마크 작성법"
description: "Go의 표준 테스트 패턴인 테이블 기반 테스트(Table-Driven Test)와 벤치마크 작성법을 다룹니다. t.Run 서브테스트, testify/assert, go-cmp, 벤치마크, 서브벤치마크(b.Run) 패턴까지 실전 예제로 알아봅니다."
date: 2026-03-02
update: 2026-03-02
tags:
  - golang
  - test
  - table-driven-test
  - benchmark
  - testify
  - go-cmp
  - testing
series: "Go 테스트 전략"
---

## 1. 테이블 기반 테스트란?

Go 커뮤니티에서 **테이블 기반 테스트(Table-Driven Test)**는 사실상의 표준 테스트 패턴이다. Go 공식 위키에서도 이 패턴을 [권장](https://go.dev/wiki/TableDrivenTests)하고 있다.

핵심 아이디어는 간단하다. 테스트 케이스를 **슬라이스로 정의**하고, **반복문으로 실행**하는 것이다.

### 일반 테스트 vs 테이블 기반 테스트

일반적인 테스트 방식에서는 케이스마다 함수를 작성한다.

```go
func TestAverage_TwoNumbers(t *testing.T) {
    got := Average(2, 4)
    if got != 3 {
        t.Errorf("got %d, want 3", got)
    }
}

func TestAverage_ThreeNumbers(t *testing.T) {
    got := Average(1, 2, 5)
    if got != 2 {
        t.Errorf("got %d, want 2", got)
    }
}
```

테이블 기반 테스트는 이를 하나의 함수로 통합한다.

```go
func TestAverage_Basic(t *testing.T) {
    for _, tt := range []struct {
        Nos    []int
        Result int
    }{
        {Nos: []int{2, 4}, Result: 3},
        {Nos: []int{1, 2, 5}, Result: 2},
        {Nos: []int{1}, Result: 1},
        {Nos: []int{}, Result: 0},
    } {
        if avg := Average(tt.Nos...); avg != tt.Result {
            t.Fatalf("expected average of %v to be %d, got %d\n", tt.Nos, tt.Result, avg)
        }
    }
}
```

케이스를 추가할 때 구조체만 한 줄 추가하면 된다.

## 2. t.Run()으로 서브테스트 만들기

위 기본 패턴에는 한 가지 문제가 있다. 어떤 케이스가 실패했는지 **이름으로 구분**하기 어렵다. `t.Run()`을 사용하면 각 케이스에 이름을 부여할 수 있다.

```go
func TestAverage_TableDriven(t *testing.T) {
    tests := []struct {
        name string
        nos  []int
        want int
    }{
        {name: "두_수의_평균", nos: []int{2, 4}, want: 3},
        {name: "세_수의_평균", nos: []int{1, 2, 5}, want: 2},
        {name: "단일_값", nos: []int{1}, want: 1},
        {name: "빈_슬라이스", nos: []int{}, want: 0},
        {name: "합이_0인_경우", nos: []int{2, -2}, want: 0},
        {name: "큰_수", nos: []int{100, 200, 300}, want: 200},
        {name: "음수_포함", nos: []int{-10, -20, -30}, want: -20},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got := Average(tt.nos...)
            assert.Equal(t, tt.want, got)
        })
    }
}
```

실행 결과에서 각 서브테스트 이름이 표시된다.

```
=== RUN   TestAverage_TableDriven
=== RUN   TestAverage_TableDriven/두_수의_평균
=== RUN   TestAverage_TableDriven/세_수의_평균
=== RUN   TestAverage_TableDriven/단일_값
--- PASS: TestAverage_TableDriven (0.00s)
    --- PASS: TestAverage_TableDriven/두_수의_평균 (0.00s)
    --- PASS: TestAverage_TableDriven/세_수의_평균 (0.00s)
    --- PASS: TestAverage_TableDriven/단일_값 (0.00s)
```

특정 서브테스트만 실행할 수도 있다.

```bash
go test -run TestAverage_TableDriven/빈_슬라이스 -v
```

## 3. Assertion 라이브러리

### 3.1 표준 testing 패키지

Go 표준 라이브러리에는 별도의 assertion 함수가 없다. `if` 문과 `t.Errorf()`를 직접 사용한다.

```go
if got != want {
    t.Errorf("Average(%v) = %d, want %d", nos, got, want)
}
```

### 3.2 testify/assert

[testify](https://github.com/stretchr/testify)는 Go 생태계에서 가장 널리 사용되는 assertion 라이브러리다.

```go
import "github.com/stretchr/testify/assert"

func Test_Assert(t *testing.T) {
    assert.Equal(t, 3, Average(2, 4))
    assert.NotNil(t, someValue)
    assert.True(t, isValid)
    assert.Error(t, err)
}
```

자주 사용하는 assertion:

| 함수 | 설명 |
|------|------|
| `assert.Equal(t, want, got)` | 값 동등 비교 |
| `assert.NotEqual(t, a, b)` | 값이 다른지 확인 |
| `assert.Nil(t, obj)` | nil 확인 |
| `assert.NotNil(t, obj)` | nil이 아닌지 확인 |
| `assert.True(t, val)` | true 확인 |
| `assert.Error(t, err)` | error가 nil이 아닌지 확인 |
| `assert.NoError(t, err)` | error가 nil인지 확인 |
| `assert.Contains(t, s, substr)` | 문자열/슬라이스에 포함 여부 |

### 3.3 go-cmp

[go-cmp](https://github.com/google/go-cmp)는 Google이 만든 **구조체 깊은 비교** 전용 라이브러리다. `reflect.DeepEqual`의 상위 호환으로, 비교 실패 시 **어떤 필드가 다른지** 읽기 쉽게 출력한다.

```go
import (
    "github.com/google/go-cmp/cmp"
    "github.com/google/go-cmp/cmp/cmpopts"
)
```

#### cmp.Equal과 cmp.Diff

```go
func TestCmp_Diff(t *testing.T) {
    want := User{ID: 1, Name: "Alice", Email: "alice@example.com"}
    got := User{ID: 1, Name: "Alice", Email: "alice@example.com"}

    if diff := cmp.Diff(want, got); diff != "" {
        t.Errorf("User mismatch (-want +got):\n%s", diff)
    }
}
```

`cmp.Diff()`는 두 값의 차이를 `-want +got` 형식으로 보여준다. 복잡한 구조체에서 어떤 필드가 달라졌는지 한눈에 파악할 수 있다.

#### cmpopts.IgnoreFields — 특정 필드 제외

`CreatedAt`, `UpdatedAt` 같은 타임스탬프 필드를 비교에서 제외할 때 유용하다.

```go
func TestCmp_IgnoreFields(t *testing.T) {
    now := time.Now()
    user1 := User{ID: 1, Name: "Alice", CreatedAt: now}
    user2 := User{ID: 1, Name: "Alice", CreatedAt: now.Add(time.Hour)}

    opts := cmpopts.IgnoreFields(User{}, "CreatedAt", "UpdatedAt")
    if diff := cmp.Diff(user1, user2, opts); diff != "" {
        t.Errorf("User mismatch (-want +got):\n%s", diff)
    }
}
```

#### cmpopts.SortSlices — 순서 무관 비교

슬라이스 요소의 순서와 관계없이 같은 요소가 포함되어 있는지 비교한다.

```go
func TestCmp_SortSlices(t *testing.T) {
    want := []string{"banana", "apple", "cherry"}
    got := []string{"cherry", "banana", "apple"}

    opts := cmpopts.SortSlices(func(a, b string) bool { return a < b })
    if diff := cmp.Diff(want, got, opts); diff != "" {
        t.Errorf("slices mismatch (-want +got):\n%s", diff)
    }
}
```

구조체 슬라이스도 정렬 기준을 지정하여 비교할 수 있다.

```go
func TestCmp_StructSlice(t *testing.T) {
    want := []User{{ID: 1, Name: "Alice"}, {ID: 2, Name: "Bob"}}
    got := []User{{ID: 2, Name: "Bob"}, {ID: 1, Name: "Alice"}}

    opts := cmpopts.SortSlices(func(a, b User) bool { return a.ID < b.ID })
    if diff := cmp.Diff(want, got, opts); diff != "" {
        t.Errorf("users mismatch (-want +got):\n%s", diff)
    }
}
```

#### cmpopts.EquateEmpty — nil과 빈 슬라이스 동일 취급

```go
func TestCmp_EquateEmpty(t *testing.T) {
    var nilSlice []string
    emptySlice := []string{}

    // reflect.DeepEqual은 이 둘을 다르다고 판단하지만,
    // cmpopts.EquateEmpty()는 동일하게 취급한다.
    opts := cmpopts.EquateEmpty()
    if diff := cmp.Diff(nilSlice, emptySlice, opts); diff != "" {
        t.Errorf("slices should be equal (-want +got):\n%s", diff)
    }
}
```

#### testify vs go-cmp 비교

| 항목 | testify | go-cmp |
|------|---------|--------|
| 역할 | 올인원 assertion 라이브러리 | 구조체 비교에 특화 |
| 주요 기능 | Equal, NotNil, Error 등 다양한 assertion | Diff, Equal + 비교 옵션 |
| 실패 출력 | 기본적인 expected/actual 출력 | 필드별 diff 출력 (읽기 쉬움) |
| 필드 무시 | 직접 구현 필요 | `cmpopts.IgnoreFields` |
| 순서 무관 비교 | `ElementsMatch` | `cmpopts.SortSlices` |
| 추천 상황 | 일반적인 단위 테스트 | 복잡한 구조체 비교, API 응답 검증 |

두 라이브러리는 상호 보완적이다. testify로 기본 assertion을 처리하고, 복잡한 구조체 비교가 필요할 때 go-cmp를 함께 사용하는 것이 일반적이다.

## 4. 테스트 헬퍼와 유틸리티

### t.Helper()

커스텀 assertion 함수를 만들 때 `t.Helper()`를 호출하면, 테스트 실패 시 **호출 위치가 헬퍼 함수가 아닌 실제 테스트 코드를 가리킨다.**

```go
func assertEqual(t *testing.T, got, want int) {
    t.Helper() // 이 줄이 없으면 실패 시 이 함수의 라인 번호가 출력된다
    if got != want {
        t.Errorf("got %d, want %d", got, want)
    }
}
```

### t.Cleanup()

테스트 후 정리 작업을 등록한다. `defer`와 비슷하지만, 서브테스트에서도 안전하게 동작한다.

```go
func TestWithTempFile(t *testing.T) {
    f, err := os.CreateTemp("", "test")
    assert.NoError(t, err)

    t.Cleanup(func() {
        os.Remove(f.Name())
    })

    // f를 사용한 테스트...
}
```

### t.Skip()

특정 조건에서 테스트를 건너뛴다.

```go
func TestIntegration(t *testing.T) {
    if testing.Short() {
        t.Skip("skipping integration test in short mode")
    }
    // 통합 테스트 로직...
}
```

`go test -short`로 실행하면 이 테스트가 건너뛰어진다.

### t.Parallel()

서브테스트를 병렬로 실행한다. 독립적인 테스트 케이스에서 실행 시간을 단축할 수 있다.

```go
func TestAverage_Parallel(t *testing.T) {
    tests := []struct {
        name string
        nos  []int
        want int
    }{
        {name: "두_수의_평균", nos: []int{2, 4}, want: 3},
        {name: "세_수의_평균", nos: []int{1, 2, 5}, want: 2},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            t.Parallel()
            got := Average(tt.nos...)
            assert.Equal(t, tt.want, got)
        })
    }
}
```

실행 결과에서 `PAUSE`/`CONT`가 보이면 병렬 실행되고 있는 것이다.

```
=== RUN   TestAverage_Parallel/두_수의_평균
=== PAUSE TestAverage_Parallel/두_수의_평균
=== RUN   TestAverage_Parallel/세_수의_평균
=== PAUSE TestAverage_Parallel/세_수의_평균
=== CONT  TestAverage_Parallel/두_수의_평균
=== CONT  TestAverage_Parallel/세_수의_평균
```

## 5. 벤치마크 작성법

Go의 `testing` 패키지는 벤치마크를 기본 제공한다. 별도의 도구 설치 없이 성능을 측정할 수 있다.

### 기본 구조

벤치마크 함수는 `Benchmark`로 시작하고, `*testing.B`를 인자로 받는다.

```go
func BenchmarkAverage(b *testing.B) {
    nos := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
    for b.Loop() {
        Average(nos...)
    }
}
```

> `b.Loop()`은 Go 1.24에서 추가된 패턴이다. 이전 버전에서는 `for i := 0; i < b.N; i++`를 사용한다.

### 벤치마크 실행

```bash
# 벤치마크만 실행 (-run=^$로 일반 테스트 제외)
go test -bench=. -benchmem -run=^$ ./golang/testing/...
```

### 결과 읽는 법

```
BenchmarkAverage-12    330083160    3.610 ns/op    0 B/op    0 allocs/op
```

| 항목 | 의미 |
|------|------|
| `-12` | GOMAXPROCS (CPU 코어 수) |
| `330083160` | 실행 횟수 |
| `3.610 ns/op` | 1회 실행에 걸린 시간 |
| `0 B/op` | 1회 실행에 할당된 메모리 |
| `0 allocs/op` | 1회 실행에 발생한 메모리 할당 횟수 |

### b.ResetTimer()

셋업 시간을 측정에서 제외할 때 사용한다.

```go
func BenchmarkAverage_ResetTimer(b *testing.B) {
    // 셋업: 큰 슬라이스 생성 (측정 대상 아님)
    nos := make([]int, 1000)
    for i := range nos {
        nos[i] = i + 1
    }
    b.ResetTimer() // 여기서부터 측정 시작

    for b.Loop() {
        Average(nos...)
    }
}
```

### b.ReportAllocs()

`-benchmem` 플래그 없이도 메모리 할당 정보를 출력한다.

```go
func BenchmarkAverage_ReportAllocs(b *testing.B) {
    b.ReportAllocs()
    nos := []int{1, 2, 3, 4, 5}
    for b.Loop() {
        Average(nos...)
    }
}
```

## 6. 서브벤치마크 (b.Run)

`b.Run()`을 사용하면 **입력 크기별로 성능을 비교**할 수 있다. 테이블 기반 테스트의 벤치마크 버전이다.

```go
func BenchmarkAverage_SubBenchmark(b *testing.B) {
    sizes := []int{10, 100, 1000, 10000}

    for _, size := range sizes {
        nos := make([]int, size)
        for i := range nos {
            nos[i] = i + 1
        }

        b.Run(fmt.Sprintf("size=%d", size), func(b *testing.B) {
            for b.Loop() {
                Average(nos...)
            }
        })
    }
}
```

실행 결과:

```
BenchmarkAverage_SubBenchmark/size=10-12      369709827     3.159 ns/op
BenchmarkAverage_SubBenchmark/size=100-12      42924340    28.51 ns/op
BenchmarkAverage_SubBenchmark/size=1000-12      5098160   235.7 ns/op
BenchmarkAverage_SubBenchmark/size=10000-12      529780    2362 ns/op
```

입력 크기가 10배 증가할 때 실행 시간도 약 10배 증가하는 것을 확인할 수 있다 (O(n) 선형 복잡도).

### 특정 서브벤치마크만 실행

```bash
go test -bench=BenchmarkAverage_SubBenchmark/size=100 -benchmem
```

### 메모리 할당 비교

서브벤치마크로 두 가지 접근법의 성능 차이를 측정할 수 있다.

```go
func BenchmarkAverage_MemoryComparison(b *testing.B) {
    nos := generateSlice(1000)

    b.Run("direct", func(b *testing.B) {
        for b.Loop() {
            Average(nos...)
        }
    })

    b.Run("copy", func(b *testing.B) {
        for b.Loop() {
            copied := make([]int, len(nos))
            copy(copied, nos)
            Average(copied...)
        }
    })
}
```

```
BenchmarkAverage_MemoryComparison/direct-12    4805794    241.1 ns/op       0 B/op    0 allocs/op
BenchmarkAverage_MemoryComparison/copy-12      1000000   1395 ns/op      8192 B/op    1 allocs/op
```

슬라이스를 복사하면 **메모리 할당이 1회 발생**하고, 실행 시간이 약 6배 느려지는 것을 확인할 수 있다.

## 7. 실전 팁

### 테스트 파일 구성 관례

- 테스트 파일은 `_test.go` 접미사를 붙인다: `avg.go` → `avg_test.go`
- 같은 패키지에서 테스트하면 private 함수도 테스트 가능
- `_test` 패키지 접미사(예: `package go_testing_test`)를 사용하면 public API만 테스트

### 테스트 커버리지

```bash
# 커버리지 확인
go test -cover ./...

# HTML 리포트 생성
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

### Test Suite 패턴

테스트 Lifecycle 메서드(SetupSuite, SetupTest, TearDown 등)가 필요하다면 testify의 Suite 패턴을 사용한다. 자세한 내용은 [Go Test Suite (Lifecycle 메서드)](https://blog-v2.advenoh.pe.kr/go/go-test-suite-lifecycle-메서드) 글을 참고하자.

## 마무리

이 글에서 다룬 내용을 정리하면 다음과 같다.

| 주제 | 핵심 포인트 |
|------|------------|
| 테이블 기반 테스트 | `[]struct` + `t.Run()` 패턴으로 케이스 관리 |
| testify/assert | `Equal`, `NoError` 등 간결한 assertion |
| go-cmp | `cmp.Diff`로 구조체 깊은 비교, `cmpopts`로 세밀한 옵션 |
| 테스트 헬퍼 | `t.Helper()`, `t.Cleanup()`, `t.Skip()`, `t.Parallel()` |
| 벤치마크 | `b.Loop()`, `b.ResetTimer()`, `-benchmem` |
| 서브벤치마크 | `b.Run()`으로 입력 크기별 성능 비교 |

## 참고

- [Go 공식 위키 - Table-Driven Tests](https://go.dev/wiki/TableDrivenTests)
- [testify - GitHub](https://github.com/stretchr/testify)
- [go-cmp - GitHub](https://github.com/google/go-cmp)
- [Go Test Suite (Lifecycle 메서드)](https://blog-v2.advenoh.pe.kr/go/go-test-suite-lifecycle-메서드)

> 전체 예제 코드는 [GitHub](https://github.com/kenshin579/tutorials-go/tree/master/golang/testing)에서 확인할 수 있다.
