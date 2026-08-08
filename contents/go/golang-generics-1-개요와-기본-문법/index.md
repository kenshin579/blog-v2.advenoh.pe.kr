---
title: "Golang Generics 1편 - 개요와 기본 문법"
description: "Golang Generics 1편 - 개요와 기본 문법"
date: 2026-03-01
update: 2026-03-01
tags:
  - golang
  - generics
  - 제네릭
  - type-parameter
  - interface
  - type-inference
  - 타입-파라미터
  - 타입-추론
  - 고랭
series: "Golang Generics"
---

# 1. Generics란 무엇인가

![Golang Generics](golang-generics-hero.png)

Generics는 함수나 타입을 정의할 때 **구체적인 타입을 지정하지 않고**, 사용 시점에 타입을 결정할 수 있게 해주는 프로그래밍 기법이다. Java, C++, Rust 등 많은 언어에서 이미 지원하고 있던 기능으로, Go에서는 **Go 1.18**(2022년 3월)부터 정식 지원되었다.

Generics가 필요한 가장 큰 이유는 **코드 중복 제거**이다. 타입만 다르고 로직은 동일한 함수를 여러 번 작성해야 하는 문제를 해결해준다.

<!-- slides -->

# 2. Go에서 Generics가 도입된 배경

Go는 태생부터 **단순함(simplicity)** 을 핵심 철학으로 설계된 언어다. Rob Pike를 비롯한 Go 설계자들은 언어의 복잡도를 낮추기 위해 많은 기능을 의도적으로 제외했고, Generics도 오랫동안 그 대상이었다.

하지만 Go 커뮤니티에서 Generics는 꾸준히 가장 많이 요청된 기능이었다. `interface{}`를 사용한 우회 방법은 타입 안전성이 부족했고, 동일한 로직을 타입별로 반복 작성해야 하는 비효율이 있었다. 결국 Ian Lance Taylor의 **Type Parameters Proposal**이 채택되어 Go 1.18에 도입되었다.

> Go의 Generics는 다른 언어 대비 의도적으로 단순하게 설계되었다. 템플릿 메타프로그래밍(C++)이나 higher-kinded types(Haskell)와 같은 고급 기능은 포함하지 않으며, **실용적인 수준의 타입 파라미터**를 제공하는 것에 집중했다.

# 3. Generics 도입 전 Go의 한계

## 3.1 interface{} 기반 구현의 문제점

Generics가 없던 시절, Go에서 여러 타입을 처리하려면 `interface{}`(현재는 `any`)를 사용해야 했다. 하지만 이 방식에는 근본적인 문제가 있다.

```go
// interface{} 기반 - 리턴 타입이 interface{}이므로 타입 단언(type assertion)이 필요
func foo1(a interface{}) interface{} {
    return a
}

// generics 기반 - 리턴 타입이 T이므로 타입 단언이 필요 없다
func foo2[T any](a T) T {
    return a
}

func main() {
    var a int = 10
    var b int = 20
    var c int

    c = foo1(a).(int)  // 타입 단언 필요 (런타임에 실패 가능)
    fmt.Println(c)     // 10

    c = foo2(b)        // 타입이 자동으로 결정됨 (컴파일 타임 안전)
    fmt.Println(c)     // 20
}
```

`interface{}` 방식의 주요 문제점:
- **타입 안전성 부족**: 잘못된 타입 단언은 컴파일이 아닌 런타임에 panic을 발생시킨다
- **타입 캐스팅 비용**: 매번 `.(Type)` 형태로 타입 단언을 해야 한다
- **IDE 지원 부족**: 반환 타입이 `interface{}`이므로 자동완성, 타입 체크 등이 제한된다

## 3.2 코드 중복 문제

타입별로 동일한 로직의 함수를 반복 작성해야 하는 것도 큰 문제였다.

```go
// int용 min 함수
func minInt(a, b int) int {
    if a < b {
        return a
    }
    return b
}

// int16용 min 함수 - 로직이 완전히 동일
func minInt16(a, b int16) int16 {
    if a < b {
        return a
    }
    return b
}

// float64용 min 함수 - 또 동일한 로직 반복...
func minFloat64(a, b float64) float64 {
    if a < b {
        return a
    }
    return b
}
```

타입만 다를 뿐 **완전히 동일한 로직**을 3번 작성했다. 지원해야 할 타입이 늘어날수록 중복은 더욱 심해진다.

# 4. Generics 기본 문법

## 4.1 Type Parameter 선언

Go의 Generics는 **대괄호 `[]`** 안에 타입 파라미터를 선언한다.

```
func 함수명[T constraint](매개변수 T) T {
    // ...
}
```

- `T`: 타입 파라미터 이름 (관례적으로 대문자 한 글자)
- `constraint`: 타입 제약 조건 (어떤 타입이 올 수 있는지 제한)

## 4.2 Generic 함수

가장 기본적인 형태의 Generic 함수다.

```go
// any는 모든 타입을 허용하는 constraint이다
func printAny[T any](a T) {
    fmt.Println(a)
}

func main() {
    printAny(10)       // T = int
    printAny(3.14)     // T = float64
    printAny("hello")  // T = string
}
```

앞서 본 min 함수의 중복 문제도 Generics로 깔끔하게 해결할 수 있다.

```go
// 타입 제한자에 어떤 타입이 들어갈지 범위를 정함
func minType[T int | int16 | int32 | int64 | float32 | float64](a, b T) T {
    if a < b {
        return a
    }
    return b
}

func main() {
    fmt.Println(minType(10, 20))           // int: 10
    fmt.Println(minType(int16(10), int16(20)))  // int16: 10
    fmt.Println(minType(3.14, 1.14))       // float64: 1.14
}
```

> `any` constraint는 `< ` 연산을 지원하지 않기 때문에, 비교 연산이 필요한 경우 `int | float64` 같은 **union type constraint**로 허용 타입을 지정해야 한다. 이 부분은 2편에서 자세히 다룬다.

## 4.3 커스텀 Constraint (interface로 선언)

매번 인라인으로 타입을 나열하는 것은 비효율적이다. **interface 키워드**로 재사용 가능한 constraint를 정의할 수 있다.

```go
type IntegerType interface {
    int | int16 | int32 | int64
}

type Float interface {
    float32 | float64
}

// constraint 합성도 가능하다
type ComparableNumbers interface {
    IntegerType | Float
}

func minComparableNumbers[T ComparableNumbers](a, b T) T {
    if a < b {
        return a
    }
    return b
}
```

## 4.4 Generic Struct

함수뿐 아니라 **구조체(struct)** 에도 타입 파라미터를 사용할 수 있다.

```go
type Node[T any] struct {
    val  T
    next *Node[T]
}

func NewNode[T any](v T) *Node[T] {
    return &Node[T]{val: v}
}

// 메서드에서는 새로운 타입 파라미터를 선언할 수 없고,
// 구조체의 타입 파라미터만 사용할 수 있다
func (n *Node[T]) Push(v T) *Node[T] {
    node := NewNode(v)
    n.next = node
    return node
}
```

사용 예시:

```go
node := NewNode(1)              // *Node[int]
node.Push(2).Push(3).Push(4)

strNode := NewNode("hello")    // *Node[string]
strNode.Push("world")
```

> **주의**: Go에서 메서드(method)에는 추가 타입 파라미터를 선언할 수 없다. `func (n *Node[T]) Push[F any](f F)` 같은 문법은 허용되지 않으며, 구조체에 선언된 타입 파라미터만 사용 가능하다.

## 4.5 Generic Map 함수

두 개 이상의 타입 파라미터를 활용하면 `Map`과 같은 함수형 유틸리티도 작성할 수 있다.

```go
// F: 입력 슬라이스의 요소 타입, T: 출력 슬라이스의 요소 타입
// s: 변환할 원본 슬라이스, f: 각 요소를 변환하는 함수
func Map[F, T any](s []F, f func(F) T) []T {
    rst := make([]T, len(s)) // 원본과 같은 크기의 결과 슬라이스 생성
    for i, v := range s {
        rst[i] = f(v) // 각 요소에 변환 함수 적용
    }
    return rst
}

func main() {
    // int → int: 각 요소를 2배로 변환 (F=int, T=int)
    doubled := Map([]int{1, 2, 3}, func(i int) int {
        return i * 2
    })
    fmt.Println(doubled) // [2 4 6]

    // string → string: 각 요소를 대문자로 변환 (F=string, T=string)
    uppered := Map([]string{"Hello", "world"}, func(s string) string {
        return strings.ToUpper(s)
    })
    fmt.Println(uppered) // [HELLO WORLD]
}
```

# 5. 타입 추론 (Type Inference)

Go 컴파일러는 함수 인자로부터 타입 파라미터를 **자동 추론**할 수 있다. 덕분에 대부분의 경우 타입을 명시적으로 지정할 필요가 없다.

## 5.1 명시적 타입 지정 vs 타입 추론

```go
func identity[T any](v T) T {
    return v
}

// 명시적 타입 지정
result1 := identity[int](42)       // T = int 명시
result2 := identity[string]("hello") // T = string 명시

// 타입 추론 - 인자로부터 자동 추론
result3 := identity(42)            // T = int 추론
result4 := identity("hello")      // T = string 추론
```

두 방식 모두 동일한 결과를 생성한다. 타입 추론이 가능한 경우 **추론 방식이 더 간결하므로 권장**된다.

## 5.2 여러 타입 파라미터에서의 추론

타입 파라미터가 여러 개인 경우에도 각 인자로부터 개별적으로 추론한다.

```go
func pair[T, U any](a T, b U) string {
    return fmt.Sprintf("(%v, %v)", a, b)
}

// 모든 타입 파라미터가 추론 가능
pair(1, "hello")    // T=int, U=string
pair(3.14, true)    // T=float64, U=bool
```

## 5.3 타입 추론이 실패하는 경우

컴파일러가 인자로부터 타입을 결정할 수 없는 경우 **명시적 타입 지정이 필요**하다.

```go
func toSlice[T any](args ...T) []T {
    return args
}

// 추론 성공 - 인자로부터 타입 결정 가능
ints := toSlice(1, 2, 3)           // T = int

// 추론 실패 - 인자가 없어서 타입을 결정할 수 없음
emptyInts := toSlice[int]()        // 명시적 지정 필요
emptyStrings := toSlice[string]()  // 명시적 지정 필요

// 아래 코드는 컴파일 에러: cannot infer T
// result := toSlice()
```

**타입 추론이 실패하는 주요 경우:**
- 함수에 인자가 전달되지 않을 때
- 리턴 타입만으로는 타입을 결정할 수 없을 때
- 인자 타입이 모호할 때

# 6. 퀴즈

여기까지 읽었으면 풀 수 있는 문제들이다. 답을 고르면 바로 해설이 나온다.

```quiz
- type: mcq
  q: "Generics 도입 전 `interface{}` 방식의 문제점으로 본문이 지적한 것은?"
  choices: ["잘못된 타입 단언은 컴파일 시점에 걸러진다", "반환 타입이 interface{}라 자동완성이 잘 된다", "잘못된 타입 단언이 런타임 panic을 일으킨다", "값을 꺼낼 때 타입 단언 없이 바로 쓸 수 있다"]
  answer: 2
  explain: "`interface{}` 방식은 값을 꺼낼 때마다 `.(Type)` 형태의 타입 단언이 필요하고, 타입이 맞지 않으면 컴파일이 아니라 런타임에 panic이 난다. 반환 타입이 `interface{}`라 자동완성이나 타입 체크 같은 IDE 지원도 제한된다. (3.1절)"

- type: ox
  q: "Go 설계자들은 언어의 복잡도를 낮추려고 Generics를 오랫동안 언어에서 제외해 왔다."
  answer: true
  explain: "맞다. Go는 단순함을 핵심 철학으로 설계된 언어여서 Rob Pike를 비롯한 설계자들이 많은 기능을 의도적으로 제외했고 Generics도 오랫동안 그 대상이었다. 결국 Ian Lance Taylor의 Type Parameters Proposal이 채택되면서 정식 기능으로 들어왔다. (2장)"

- type: code
  q: "이 코드에서 두 번의 printAny 호출은 T를 각각 무엇으로 결정하나?"
  lang: go
  code: |
    func printAny[T any](a T) {
        fmt.Println(a)
    }

    func main() {
        printAny(10)
        printAny("hello")
    }
  choices: ["첫 호출은 T가 int, 두 번째는 string이 된다", "두 호출 모두 T가 any 하나로 고정된다", "첫 호출은 T가 int, 두 번째는 컴파일 에러다", "명시적 지정이 없어 두 호출 모두 에러가 난다"]
  answer: 0
  explain: "`any`는 모든 타입을 허용하는 constraint이고, T는 호출할 때 넘긴 인자로부터 호출마다 따로 추론된다. 그래서 첫 호출은 T = int, 두 번째 호출은 T = string이 된다. (4.2절)"

- type: mcq
  q: "본문에서 min 함수를 `int | int16 | float64` 같은 union type constraint로 선언한 이유는?"
  choices: ["any를 쓰면 타입 추론이 아예 동작하지 않기 때문", "any constraint가 `<` 비교 연산을 지원하지 않기 때문", "any는 타입 파라미터에 올 수 없는 예약어이기 때문", "any로 선언하면 함수가 런타임 panic을 일으키기 때문"]
  answer: 1
  explain: "`any` constraint는 `<` 연산을 지원하지 않는다. 그래서 비교 연산이 필요한 min 같은 함수는 `int | float64` 같은 union type constraint로 허용 타입의 범위를 좁혀 주어야 한다. (4.2절)"

- type: blank
  q: "Go에서 Generics가 정식으로 지원되기 시작한 버전은 Go ___이다."
  answer: ["1.18", "go1.18", "go 1.18"]
  explain: "Go 1.18이다. 2022년 3월에 나온 이 버전부터 Generics가 정식 기능이 되었다. 그전까지는 커뮤니티에서 가장 많이 요청된 기능이면서도 언어에 들어오지 못한 상태였다. (1장, 2장)"

- type: code
  q: "이 코드가 컴파일되지 않는 이유는?"
  lang: go
  code: |
    type Node[T any] struct {
        val  T
        next *Node[T]
    }

    func (n *Node[T]) Push[F any](f F) {
        _ = f
    }
  choices: ["구조체 타입 파라미터에 any를 쓸 수 없기 때문", "포인터 리시버에는 타입 파라미터를 못 쓰기 때문", "next 필드가 자기 타입을 가리킬 수 없기 때문", "메서드에 타입 파라미터를 새로 선언했기 때문"]
  answer: 3
  explain: "Go에서 메서드에는 추가 타입 파라미터를 선언할 수 없고 구조체에 선언된 타입 파라미터만 쓸 수 있다. 그래서 `Push[F any]`는 method must have no type parameters 에러가 난다. 구조체의 `[T any]`와 자기 타입을 가리키는 `*Node[T]` 필드는 모두 정상이다. (4.4절)"

- type: mcq
  q: "본문이 정리한, 타입 추론이 실패하는 주요 경우에 해당하는 것은?"
  choices: ["타입 파라미터를 두 개 이상 선언했을 때", "리턴 타입이 슬라이스로 선언되어 있을 때", "인자마다 타입이 서로 다른 값을 넘길 때", "함수에 인자가 하나도 전달되지 않을 때"]
  answer: 3
  explain: "타입 추론은 인자로부터 타입을 결정하므로, 인자가 하나도 없으면 결정할 근거가 없어 실패한다. 타입 파라미터가 여러 개여도 각 인자로부터 개별적으로 추론되므로 문제가 되지 않는다. (5.2절, 5.3절)"

- type: code
  q: "이 코드에서 a와 b의 타입은 각각 무엇인가?"
  lang: go
  code: |
    func toSlice[T any](args ...T) []T {
        return args
    }

    func main() {
        a := toSlice(1, 2, 3)
        b := toSlice[string]()
        _, _ = a, b
    }
  choices: ["a는 []any, b는 []string으로 결정된다", "a는 []int, b는 []string으로 결정된다", "a는 []int, b는 인자가 없어 에러가 난다", "a는 []int, b는 []any로 자동 결정된다"]
  answer: 1
  explain: "a는 인자 1, 2, 3으로부터 T = int가 추론되어 []int가 된다. b는 인자가 없어 추론이 불가능하지만 `toSlice[string]()`처럼 타입을 명시했으므로 []string으로 정상 컴파일된다. 명시 없이 `toSlice()`라고 쓰면 cannot infer T 에러가 난다. (5.3절)"

- type: ox
  q: "interface로 선언한 constraint끼리 합성해 새로운 constraint를 만들 수는 없다."
  answer: false
  explain: "아니다. constraint 합성은 가능하다. 본문의 `ComparableNumbers`는 `IntegerType | Float`처럼 앞서 선언한 두 constraint를 합성해 만든 것이다. (4.3절)"

- type: code
  q: "이 코드를 실행하면 무엇이 출력되나?"
  lang: go
  code: |
    func Map[F, T any](s []F, f func(F) T) []T {
        rst := make([]T, len(s))
        for i, v := range s {
            rst[i] = f(v)
        }
        return rst
    }

    func main() {
        doubled := Map([]int{1, 2, 3}, func(i int) int {
            return i * 2
        })
        fmt.Println(doubled)
    }
  choices: ["[1 2 3] — 원본 슬라이스가 그대로 나온다", "6 — 변환한 값을 모두 더한 결과가 나온다", "[2 4 6] — 각 요소에 변환이 적용되어 나온다", "[] — 길이 0인 빈 슬라이스가 만들어져 나온다"]
  answer: 2
  explain: "`Map`은 원본과 같은 크기의 결과 슬라이스를 만든 뒤 각 요소에 변환 함수를 적용한다. 여기서는 F와 T가 모두 int로 정해지고 각 요소가 2배가 되므로 [2 4 6]이 출력된다. (4.5절)"
```

# 7. 마무리

| 항목 | Generics 도입 전 | Generics 도입 후 |
|------|-----------------|-----------------|
| 여러 타입 지원 | `interface{}` + 타입 단언 | 타입 파라미터 `[T any]` |
| 타입 안전성 | 런타임 panic 위험 | 컴파일 타임 검증 |
| 코드 중복 | 타입별 함수 반복 작성 | 하나의 Generic 함수 |
| 자료구조 | 타입별 struct 정의 | Generic struct `[T any]` |
| IDE 지원 | 제한적 | 완전한 타입 추론 |

다음 편에서는 Generics의 핵심인 **Type Constraint**를 다룬다. `any`, `comparable`, union type(`|`), tilde(`~`), 커스텀 constraint 설계 등 타입 제약 조건을 깊이 있게 살펴본다.

# 8. FAQ

## 8.1 Q. 타입 단언(Type Assertion)이란?

`interface{}` 타입의 값에서 실제 구체적인 타입의 값을 꺼내는 연산이다. `value.(Type)` 형태로 사용한다.

```go
var val interface{} = "hello"

s := val.(string)  // OK: "hello"
i := val.(int)     // panic! string인데 int로 꺼내려 함
```

만약 실제 타입이 일치하지 않으면 런타임에 panic이 발생한다. 안전하게 사용하려면 두 번째 반환값으로 성공 여부를 확인할 수 있다.

```go
s, ok := val.(string)  // ok = true, s = "hello"
i, ok := val.(int)     // ok = false, i = 0 (panic 없음)
```

Generics를 사용하면 타입 단언 자체가 불필요해진다. 컴파일 타임에 타입이 결정되므로 런타임 panic 위험이 없다.

# 9. 참고

- https://go.dev/doc/tutorial/generics
- https://go.dev/blog/intro-generics
- https://go.dev/ref/spec#Type_parameter_declarations
