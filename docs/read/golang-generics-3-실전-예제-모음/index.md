---
title: "Golang Generics (3) - 실전 예제 모음"
description: "Golang Generics (3) - 실전 예제 모음"
date: 2026-02-15
update: 2026-02-15
tags:
  - golang
  - go
  - generics
  - 제네릭
  - stack
  - queue
  - filter
  - map
  - reduce
  - data-structure
  - 자료구조
  - 고랭
series: "Golang Generics"
seriesOrder: 3
---

1편에서 기본 문법을, 2편에서 Type Constraint를 다뤘다. 이번 편에서는 Generics를 활용한 **실전 예제**들을 구현해본다. 자료구조, 유틸 함수, 함수형 패턴, 그리고 Go 1.21+ 표준 라이브러리까지 살펴본다.

# 1. Generic 자료구조 구현

## 1.1 Generic Stack

LIFO(Last In, First Out) 구조의 Stack을 Generics로 구현한다.

```go
type Stack[T any] struct {
    items []T
}

func NewStack[T any]() *Stack[T] {
    return &Stack[T]{items: make([]T, 0)}
}

func (s *Stack[T]) Push(item T) {
    s.items = append(s.items, item)
}

func (s *Stack[T]) Pop() (T, bool) {
    var zero T
    if len(s.items) == 0 {
        return zero, false
    }
    item := s.items[len(s.items)-1]
    s.items = s.items[:len(s.items)-1]
    return item, true
}

func (s *Stack[T]) Peek() (T, bool) {
    var zero T
    if len(s.items) == 0 {
        return zero, false
    }
    return s.items[len(s.items)-1], true
}

func (s *Stack[T]) Size() int {
    return len(s.items)
}

func (s *Stack[T]) IsEmpty() bool {
    return len(s.items) == 0
}
```

하나의 구현으로 `int`, `string` 등 어떤 타입에도 사용할 수 있다.

```go
// int 스택
intStack := NewStack[int]()
intStack.Push(1)
intStack.Push(2)
intStack.Push(3)
val, _ := intStack.Pop()  // 3

// string 스택
strStack := NewStack[string]()
strStack.Push("hello")
strStack.Push("world")
val, _ := strStack.Pop()  // "world"
```

> `var zero T`는 Generic 코드에서 제로값을 반환할 때 사용하는 관용적 패턴이다. `T`의 제로값은 `int`면 `0`, `string`이면 `""`, 포인터면 `nil`이 된다.

## 1.2 Generic Queue

FIFO(First In, First Out) 구조의 Queue를 구현한다.

```go
type Queue[T any] struct {
    items []T
}

func NewQueue[T any]() *Queue[T] {
    return &Queue[T]{items: make([]T, 0)}
}

func (q *Queue[T]) Enqueue(item T) {
    q.items = append(q.items, item)
}

func (q *Queue[T]) Dequeue() (T, bool) {
    var zero T
    if len(q.items) == 0 {
        return zero, false
    }
    item := q.items[0]
    q.items = q.items[1:]
    return item, true
}

func (q *Queue[T]) Front() (T, bool) {
    var zero T
    if len(q.items) == 0 {
        return zero, false
    }
    return q.items[0], true
}
```

```go
q := NewQueue[string]()
q.Enqueue("first")
q.Enqueue("second")
q.Enqueue("third")

for !q.IsEmpty() {
    val, _ := q.Dequeue()
    fmt.Println(val)
}
// first
// second
// third
```

# 2. Generic 유틸 함수

## 2.1 Min / Max 함수

`constraints.Ordered`를 활용하면 모든 비교 가능한 타입에 대해 동작하는 Min/Max를 구현할 수 있다.

```go
import "golang.org/x/exp/constraints"

func MinOf[T constraints.Ordered](a, b T) T {
    if a < b {
        return a
    }
    return b
}

func MaxOf[T constraints.Ordered](a, b T) T {
    if a > b {
        return a
    }
    return b
}

MinOf(10, 20)              // 10
MaxOf(3.14, 2.71)          // 3.14
MinOf("apple", "banana")   // "apple"
```

슬라이스에서 최솟값/최댓값을 찾는 함수도 동일한 패턴으로 구현한다.

```go
func MinSlice[T constraints.Ordered](s []T) (T, bool) {
    var zero T
    if len(s) == 0 {
        return zero, false
    }
    result := s[0]
    for _, v := range s[1:] {
        if v < result {
            result = v
        }
    }
    return result, true
}

minVal, _ := MinSlice([]int{5, 3, 8, 1, 9})           // 1
maxVal, _ := MaxSlice([]int{5, 3, 8, 1, 9})           // 9
minStr, _ := MinSlice([]string{"banana", "apple", "cherry"}) // "apple"
```

# 3. Slice 유틸 함수 (함수형 패턴)

## 3.1 Filter

조건을 만족하는 요소만 반환한다.

```go
func Filter[T any](s []T, predicate func(T) bool) []T {
    result := make([]T, 0)
    for _, v := range s {
        if predicate(v) {
            result = append(result, v)
        }
    }
    return result
}

// 짝수만 필터링
evens := Filter([]int{1, 2, 3, 4, 5, 6}, func(n int) bool {
    return n%2 == 0
})
// [2 4 6]

// 길이 3 이상인 문자열만
long := Filter([]string{"go", "java", "py", "rust"}, func(s string) bool {
    return len(s) >= 3
})
// [java rust]
```

## 3.2 Map

슬라이스의 각 요소를 변환한다. 입력과 출력의 타입이 다를 수 있으므로 타입 파라미터가 2개 필요하다.

```go
func MapSlice[T, U any](s []T, transform func(T) U) []U {
    result := make([]U, len(s))
    for i, v := range s {
        result[i] = transform(v)
    }
    return result
}

// int -> int (2배)
doubled := MapSlice([]int{1, 2, 3}, func(n int) int { return n * 2 })
// [2 4 6]

// string -> string (대문자)
uppered := MapSlice([]string{"hello", "world"}, func(s string) string {
    return strings.ToUpper(s)
})
// [HELLO WORLD]

// int -> string (타입 변환)
strs := MapSlice([]int{1, 2, 3}, func(n int) string {
    return fmt.Sprintf("#%d", n)
})
// [#1 #2 #3]
```

## 3.3 Reduce

슬라이스를 하나의 값으로 축약한다.

```go
func Reduce[T, U any](s []T, initial U, accumulator func(U, T) U) U {
    result := initial
    for _, v := range s {
        result = accumulator(result, v)
    }
    return result
}

// 합계
total := Reduce([]int{1, 2, 3, 4, 5}, 0, func(acc, n int) int {
    return acc + n
})
// 15

// 문자열 합치기
joined := Reduce([]string{"Go", "Generics", "Rock"}, "", func(acc, s string) string {
    if acc == "" { return s }
    return acc + " " + s
})
// "Go Generics Rock"
```

## 3.4 Filter + Map + Reduce 조합

함수형 패턴의 진가는 조합에서 발휘된다.

```go
nums := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}

// 짝수만 필터링 → 2배로 변환 → 합산
evens := Filter(nums, func(n int) bool { return n%2 == 0 })
doubled := MapSlice(evens, func(n int) int { return n * 2 })
total := Reduce(doubled, 0, func(acc, n int) int { return acc + n })
// (2+4+6+8+10) * 2 = 60
```

# 4. Generic Map 헬퍼

## 4.1 Values 추출

```go
func MapValues[K comparable, V any](m map[K]V) []V {
    values := make([]V, 0, len(m))
    for _, v := range m {
        values = append(values, v)
    }
    return values
}

m := map[string]int{"a": 1, "b": 2, "c": 3}
values := MapValues(m)  // [1 2 3] (순서 비보장)
```

## 4.2 Merge

두 map을 합친다. 키가 겹치면 두 번째 map의 값이 우선한다.

```go
func MapMerge[K comparable, V any](m1, m2 map[K]V) map[K]V {
    result := make(map[K]V, len(m1)+len(m2))
    for k, v := range m1 {
        result[k] = v
    }
    for k, v := range m2 {
        result[k] = v
    }
    return result
}

m1 := map[string]int{"a": 1, "b": 2}
m2 := map[string]int{"b": 20, "c": 3}
merged := MapMerge(m1, m2)
// {"a": 1, "b": 20, "c": 3}
```

## 4.3 Filter

조건을 만족하는 key-value 쌍만 반환한다.

```go
func MapFilter[K comparable, V any](m map[K]V, predicate func(K, V) bool) map[K]V {
    result := make(map[K]V)
    for k, v := range m {
        if predicate(k, v) {
            result[k] = v
        }
    }
    return result
}

scores := map[string]int{"alice": 85, "bob": 42, "carol": 91, "dave": 67}
passed := MapFilter(scores, func(k string, v int) bool {
    return v >= 70
})
// {"alice": 85, "carol": 91}
```

# 5. 표준 라이브러리 활용 (Go 1.21+)

Go 1.21부터 Generics를 활용한 표준 패키지 `slices`, `maps`, `cmp`가 추가되었다. 앞서 직접 구현한 유틸 함수들의 상당수가 이미 표준 라이브러리에 포함되어 있다.

## 5.1 slices 패키지

```go
import "slices"

// 정렬
nums := []int{5, 3, 8, 1, 9, 2}
slices.Sort(nums)
// [1 2 3 5 8 9]

// 포함 여부
slices.Contains([]int{1, 2, 3, 4, 5}, 3)   // true
slices.Contains([]int{1, 2, 3, 4, 5}, 6)   // false

// 최솟값 / 최댓값
slices.Min([]int{5, 3, 8, 1, 9})  // 1
slices.Max([]int{5, 3, 8, 1, 9})  // 9
```

커스텀 정렬도 `SortFunc`로 간결하게 표현할 수 있다.

```go
// 절대값 기준 정렬
nums := []int{-5, 3, -1, 8, -2}
slices.SortFunc(nums, func(a, b int) int {
    absA, absB := a, b
    if absA < 0 { absA = -absA }
    if absB < 0 { absB = -absB }
    return absA - absB
})
// [-1 -2 3 -5 8]
```

## 5.2 maps 패키지

```go
import "maps"

// Clone - 깊은 복사
original := map[string]int{"a": 1, "b": 2, "c": 3}
cloned := maps.Clone(original)
cloned["d"] = 4  // clone 수정해도 원본 영향 없음

// Equal - 두 map 비교
m1 := map[string]int{"a": 1, "b": 2}
m2 := map[string]int{"a": 1, "b": 2}
m3 := map[string]int{"a": 1, "b": 3}
maps.Equal(m1, m2)  // true
maps.Equal(m1, m3)  // false
```

## 5.3 cmp 패키지

```go
import "cmp"

// Compare - 두 값 비교 (-1, 0, 1 반환)
cmp.Compare(1, 2)  // -1 (1 < 2)
cmp.Compare(2, 2)  //  0 (2 == 2)
cmp.Compare(3, 2)  //  1 (3 > 2)
```

`cmp.Or`는 첫 번째 non-zero 값을 반환한다. **설정값 우선순위 패턴**에 매우 유용하다.

```go
// 사용자 설정 > 환경 변수 > 기본값
userConfig := ""
envConfig := ""
defaultConfig := "localhost:8080"

addr := cmp.Or(userConfig, envConfig, defaultConfig)
// "localhost:8080" (첫 번째 비어있지 않은 값)

envConfig = "0.0.0.0:9090"
addr = cmp.Or(userConfig, envConfig, defaultConfig)
// "0.0.0.0:9090" (환경 변수가 설정된 경우)
```

# 6. 직접 구현 vs 표준 라이브러리

| 기능 | 직접 구현 | 표준 라이브러리 (Go 1.21+) |
|------|----------|--------------------------|
| Contains | `contains[T comparable]` | `slices.Contains` |
| Min/Max | `MinOf[T constraints.Ordered]` | `slices.Min`, `slices.Max` |
| Sort | - | `slices.Sort`, `slices.SortFunc` |
| Map Clone | - | `maps.Clone` |
| Map Equal | - | `maps.Equal` |
| Filter/Map/Reduce | 직접 구현 필요 | Go 1.23+ `slices.Collect` 등 일부 추가 |

> **실무 권장사항**: Go 1.21 이상을 사용한다면 `slices`, `maps`, `cmp` 표준 패키지를 우선 사용하자. 직접 구현은 표준 라이브러리에 없는 기능(Filter, Map, Reduce 등)이나 학습 목적으로 활용하면 된다.

# 7. 마무리

이번 편에서 다룬 Generic 패턴들을 요약한다.

| 패턴 | 핵심 포인트 |
|------|-----------|
| Stack / Queue | `var zero T`로 제로값 반환, 메서드에서 struct 타입 파라미터 활용 |
| Min / Max | `constraints.Ordered`로 비교 가능한 모든 타입 지원 |
| Filter / Map / Reduce | `func(T) bool`, `func(T) U` 콜백 패턴, 함수형 조합 |
| Map 헬퍼 | `K comparable, V any` 패턴으로 map key 제약 |
| 표준 라이브러리 | Go 1.21+ `slices`, `maps`, `cmp` 패키지 적극 활용 |

다음 편에서는 **Generics vs Interface 비교**와 **성능 벤치마크**를 다룬다.

# 8. 참고

- https://pkg.go.dev/slices
- https://pkg.go.dev/maps
- https://pkg.go.dev/cmp
- https://pkg.go.dev/golang.org/x/exp/constraints
