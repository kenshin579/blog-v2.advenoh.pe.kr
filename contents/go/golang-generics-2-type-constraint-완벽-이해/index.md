---
title: "Golang Generics (2) - Type Constraint 완벽 이해"
description: "Golang Generics (2) - Type Constraint 완벽 이해"
date: 2026-03-04
update: 2026-03-04
tags:
  - golang
  - go
  - generics
  - 제네릭
  - constraint
  - any
  - comparable
  - union-type
  - tilde
  - 타입-제약
  - 고랭
series: "Golang Generics"
seriesOrder: 2
---

1편에서 Generics의 기본 문법과 `any` constraint를 살펴봤다. 이번 편에서는 Generics의 핵심인 **Type Constraint(타입 제약)**를 깊이 있게 다룬다.

# 1. Constraint 개념

Constraint(제약)는 타입 파라미터 `T`에 **어떤 타입이 올 수 있는지 제한**하는 역할을 한다. Constraint가 없다면 Generic 함수 내부에서 `T`에 대해 아무 연산도 할 수 없다.

```go
// any constraint - 모든 타입 허용, 하지만 연산 불가
func print[T any](a T) {
    fmt.Println(a)  // fmt.Println은 any를 받으므로 OK
}

// 아래 코드는 컴파일 에러: any는 < 연산을 지원하지 않음
// func min[T any](a, b T) T {
//     if a < b { return a }  // 에러!
//     return b
// }
```

`<` 비교를 하려면 `T`가 비교 가능한 타입임을 컴파일러에게 알려줘야 한다. 이것이 **constraint의 역할**이다.

> Go에서 constraint는 **interface**로 정의한다. 일반적인 interface가 메서드 집합을 정의하는 것처럼, constraint는 **허용되는 타입 집합**을 정의한다.

# 2. 내장 Constraint

## 2.1 any

`any`는 Go 1.18에서 추가된 `interface{}`의 별칭(alias)이다. 모든 타입을 허용하므로 가장 느슨한 constraint이다.

```go
// 아래 두 선언은 완전히 동일하다
func foo1[T any](a T) T { return a }
func foo2[T interface{}](a T) T { return a }
```

`any` constraint에서는 `fmt.Println()` 같은 `interface{}` 를 인자로 받는 함수 호출만 가능하고, `<`, `>`, `==` 같은 연산자는 사용할 수 없다.

## 2.2 comparable

`comparable`은 **`==`와 `!=` 연산이 가능한 타입**을 의미하는 내장 constraint이다. `int`, `string`, `bool`, `struct`(필드가 모두 comparable인 경우), 포인터, 배열 등이 해당된다. 반면 `slice`, `map`, `func`은 comparable이 아니다.

```go
func contains[T comparable](s []T, target T) bool {
    for _, v := range s {
        if v == target {  // comparable이므로 == 연산 가능
            return true
        }
    }
    return false
}

contains([]int{1, 2, 3, 4, 5}, 3)                       // true
contains([]string{"go", "java", "python"}, "rust")       // false
```

`comparable`은 map의 key 타입으로도 활용된다. map의 key는 반드시 `==` 비교가 가능해야 하기 때문이다.

```go
// map의 key를 추출하는 함수 - K는 반드시 comparable이어야 한다
func mapKeys[K comparable, V any](m map[K]V) []K {
    keys := make([]K, 0, len(m))
    for k := range m {
        keys = append(keys, k)
    }
    return keys
}
```

`comparable`을 활용한 **중복 제거** 함수도 유용하다.

```go
func unique[T comparable](s []T) []T {
    seen := make(map[T]bool)
    result := make([]T, 0)
    for _, v := range s {
        if !seen[v] {
            seen[v] = true
            result = append(result, v)
        }
    }
    return result
}

unique([]int{1, 2, 2, 3, 3, 3})          // [1 2 3]
unique([]string{"a", "b", "a", "c", "b"}) // [a b c]
```

> **any vs comparable**: `any`는 모든 타입을 허용하지만 연산 불가, `comparable`은 `==`/`!=` 연산이 가능한 타입만 허용한다. 크기 비교(`<`, `>`)가 필요하면 별도의 constraint가 필요하다.

# 3. Union Type Constraint

## 3.1 파이프 연산자 (`|`)

여러 구체적인 타입을 **파이프 연산자 `|`** 로 나열하여 constraint를 정의할 수 있다.

```go
// int, int16, float32, float64 중 하나만 허용
func minType[T int | int16 | int32 | int64 | float32 | float64](a, b T) T {
    if a < b {  // 위 타입들은 모두 < 연산자를 지원
        return a
    }
    return b
}

minType(10, 20)           // int: 10
minType(3.14, 1.14)       // float64: 1.14
```

## 3.2 interface로 constraint 정의

매번 인라인으로 타입을 나열하면 코드가 길어진다. **interface 키워드**로 재사용 가능한 constraint를 정의할 수 있다.

```go
type ComparableNumbers interface {
    int | int16 | int32 | int64 | float32 | float64
}

func minComparableNumbers[T ComparableNumbers](a, b T) T {
    if a < b {
        return a
    }
    return b
}
```

constraint끼리 **합성**도 가능하다.

```go
type IntegerType interface {
    int | int16 | int32 | int64
}

type Float interface {
    float32 | float64
}

// IntegerType과 Float를 합성한 새 constraint
type ComparableNumbers2 interface {
    IntegerType | Float
}

func minComparableNumbers2[T ComparableNumbers2](a, b T) T {
    if a < b {
        return a
    }
    return b
}
```

# 4. Tilde (`~`) - Underlying Type Constraint

## 4.1 `~` 문법

Go 1.18에서 추가된 `~` (tilde) 토큰은 **해당 타입을 기반(underlying type)으로 하는 모든 타입**을 포함한다는 의미이다.

```go
type Integer interface {
    ~int | int8 | int16 | int32 | int64
}
```

`~int`는 `int` 자체뿐 아니라, `int`를 기반으로 정의된 **커스텀 타입**까지 허용한다.

## 4.2 `~` 가 필요한 이유

`~` 없이 `int`만 명시하면, `type MyInt int`처럼 정의된 커스텀 타입은 해당 constraint를 만족하지 못한다.

```go
type MyInt int

func min2[T Integer](a, b T) T {
    if a < b {
        return a
    }
    return b
}

// ~int가 있으므로 MyInt도 사용 가능
var a MyInt = 10
var b MyInt = 20
min2(a, b)  // OK: MyInt의 underlying type이 int

// 만약 ~int가 아닌 int만 명시했다면:
// → MyInt does not satisfy Integer (possibly missing ~ for int in Integer)
```

> **실무 팁**: 커스텀 타입을 지원하려면 `~`를 붙이는 것이 좋다. 특히 라이브러리를 작성할 때는 사용자가 정의한 커스텀 타입도 동작해야 하므로 `~`를 기본으로 사용하자.

# 5. 커스텀 Constraint 설계

## 5.1 숫자 타입 묶기

실무에서 자주 사용하는 패턴은 숫자 타입들을 그룹으로 묶는 것이다.

```go
type Signed interface {
    ~int | ~int8 | ~int16 | ~int32 | ~int64
}

type Unsigned interface {
    ~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64
}

type FloatType interface {
    ~float32 | ~float64
}

// 세 constraint를 합성
type Number interface {
    Signed | Unsigned | FloatType
}

func sum[T Number](nums []T) T {
    var total T
    for _, n := range nums {
        total += n
    }
    return total
}

sum([]int{1, 2, 3, 4, 5})       // 15
sum([]float64{1.5, 2.5, 3.0})   // 7
sum([]uint{10, 20, 30})         // 60
```

## 5.2 Ordered 타입 만들기

크기 비교(`<`, `>`)가 가능한 타입을 묶는 constraint이다. 표준 라이브러리 `cmp.Ordered`와 유사하다.

```go
type MyOrdered interface {
    Signed | Unsigned | FloatType | ~string
}

func maxVal[T MyOrdered](a, b T) T {
    if a > b {
        return a
    }
    return b
}

maxVal(10, 20)              // 20
maxVal(3.14, 2.71)          // 3.14
maxVal("apple", "banana")   // banana (문자열 사전순 비교)
```

## 5.3 constraints.Ordered 활용

Go 표준 확장 패키지 `golang.org/x/exp/constraints`에는 이미 잘 정의된 constraint들이 있다.

```go
import "golang.org/x/exp/constraints"

// constraints.Ordered는 정수, 실수, 문자열 등 크기 비교가 가능한 모든 타입
func min[T constraints.Ordered](a, b T) T {
    if a < b {
        return a
    }
    return b
}

min(10, 20)              // 10
min(int16(10), int16(20)) // 10
min("Hello", "World")    // Hello
```

> Go 1.21부터는 `cmp.Ordered`가 표준 라이브러리에 포함되어 `golang.org/x/exp` 없이도 사용할 수 있다.

## 5.4 메서드 요구 + 타입 제한 결합

constraint에 **타입 제한과 메서드 요구를 동시에** 정의할 수 있다. 이 경우 해당 constraint는 타입 파라미터로만 사용 가능하고, 일반 인터페이스 변수로는 사용할 수 없다.

```go
// 메서드만 요구하는 인터페이스 - 일반 인터페이스로도 사용 가능
type ToString interface {
    String() string
}

// 타입 제한이 포함된 constraint - 타입 파라미터로만 사용 가능
type IntegerTilde interface {
    ~int8 | ~int16 | ~int32 | ~int64 | ~int
}

// 타입 제한 + 메서드 요구를 결합
type Stringer interface {
    IntegerTilde
    ToString
}

func PrintMin[T Stringer](a, b T) {
    if a < b {
        fmt.Println(a.String())
    } else {
        fmt.Println(b.String())
    }
}
```

`Stringer` constraint를 만족하려면 타입이 **정수 기반이면서 동시에 `String()` 메서드**를 구현해야 한다.

```go
type MyIntType int

func (m MyIntType) String() string {
    return fmt.Sprintf("%d", int(m))
}

var a MyIntType = 10
var b MyIntType = 100
PrintMin(a, b)  // 10
```

> **주의**: 타입 제한(`~int | ~string` 등)이 포함된 interface는 **타입 파라미터의 constraint로만 사용 가능**하다. 일반 함수 파라미터의 타입으로는 사용할 수 없다.
>
> ```go
> // 컴파일 에러: cannot use type Stringer outside a type constraint
> func PrintMin3(a, b Stringer) { ... }
> ```

# 6. 재사용 가능한 Constraint 설계 전략

실무에서 constraint를 설계할 때 참고할 가이드라인을 정리한다.

**1. 작은 단위로 분리하고 합성하라**

```go
type Signed interface { ~int | ~int8 | ~int16 | ~int32 | ~int64 }
type Unsigned interface { ~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 }
type Number interface { Signed | Unsigned }
```

**2. `~`를 기본으로 사용하라**

커스텀 타입(`type ID int`)을 지원하려면 `~`가 필수다. 라이브러리를 만들 때는 특히 중요하다.

**3. 표준 라이브러리 constraint를 우선 활용하라**

| 패키지 | Constraint | 설명 |
|--------|-----------|------|
| 내장 | `any` | 모든 타입 |
| 내장 | `comparable` | `==`/`!=` 연산 가능 |
| `cmp` (Go 1.21+) | `cmp.Ordered` | `<`/`>`/`<=`/`>=` 연산 가능 |
| `golang.org/x/exp/constraints` | `constraints.Ordered` | `cmp.Ordered`의 이전 버전 |
| `golang.org/x/exp/constraints` | `constraints.Integer` | 정수 타입 |
| `golang.org/x/exp/constraints` | `constraints.Float` | 실수 타입 |

**4. 과도한 constraint를 피하라**

필요 이상으로 복잡한 constraint는 가독성을 떨어뜨린다. `any`나 `comparable`로 충분한 경우가 많다.

# 7. FAQ

### Q. `golang.org/x/exp/constraints` 패키지에는 어떤 constraint가 있는가?

| Constraint | 포함 타입 |
|-----------|----------|
| `Signed` | `~int`, `~int8`, `~int16`, `~int32`, `~int64` |
| `Unsigned` | `~uint`, `~uint8`, `~uint16`, `~uint32`, `~uint64`, `~uintptr` |
| `Integer` | `Signed \| Unsigned` |
| `Float` | `~float32`, `~float64` |
| `Complex` | `~complex64`, `~complex128` |
| `Ordered` | `Integer \| Float \| ~string` |

이 constraint들은 본문의 커스텀 Constraint 설계(5장)에서 직접 구현한 `Signed`, `Unsigned`, `Number`와 동일한 구조다. 차이점은 `constraints` 패키지가 `~uintptr`과 `Complex` 타입까지 포함한다는 것이다.

Go 1.21부터는 `cmp.Ordered`가 표준 라이브러리에 포함되어 `golang.org/x/exp` 없이도 사용할 수 있다. 다만 `Signed`, `Unsigned`, `Integer`, `Float`, `Complex`는 여전히 `golang.org/x/exp/constraints`에서만 제공된다.

```go
// Go 1.18~1.20: 외부 패키지 필요
import "golang.org/x/exp/constraints"

func sum[T constraints.Integer](nums []T) T { ... }

// Go 1.21+: Ordered만 표준 라이브러리로 편입
import "cmp"

func max[T cmp.Ordered](a, b T) T { ... }
```

> **실무 팁**: 새 프로젝트에서 `Ordered`만 필요하면 `cmp.Ordered`를 사용하고, `Integer`나 `Float` 등 세분화된 constraint가 필요할 때만 `golang.org/x/exp/constraints`를 도입하자.

# 8. 마무리

| Constraint | 허용 연산 | 사용 시점 |
|-----------|----------|----------|
| `any` | 없음 (fmt.Println 등만) | 타입에 의존하지 않는 범용 함수 |
| `comparable` | `==`, `!=` | map key, 동등 비교, 중복 제거 |
| union type (`int \| string`) | 해당 타입의 모든 연산 | 특정 타입 그룹에 대한 연산 |
| `~T` (tilde) | underlying type 포함 | 커스텀 타입 지원 |
| `constraints.Ordered` | `<`, `>`, `<=`, `>=` | 크기 비교, 정렬 |
| 메서드 constraint | 해당 메서드 호출 | 특정 행동을 요구하는 경우 |

다음 편에서는 이 constraint들을 활용한 **실전 예제**를 다룬다. Generic Stack, Queue, Filter/Map/Reduce, 그리고 Go 1.21+ 표준 라이브러리(`slices`, `maps`, `cmp`)를 살펴본다.

# 9. 참고

- https://go.dev/ref/spec#Type_parameter_declarations
- https://go.dev/blog/intro-generics
- https://pkg.go.dev/golang.org/x/exp/constraints
- https://pkg.go.dev/cmp
