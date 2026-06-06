---
title: "Golang Generics Part 2 - A Complete Understanding of Type Constraints"
description: "A deep dive into type constraints in Go generics: any, comparable, union types, tilde, and designing reusable custom constraints."
date: 2026-03-02
update: 2026-03-02
tags:
  - golang
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
---

![Golang Generics](golang-generics-hero.png)

In Part 1, we looked at the basic syntax of generics and the `any` constraint. In this part, we'll cover **type constraints**, the core of generics, in depth.

# 1. The Constraint Concept

A constraint **restricts which types can be used** for the type parameter `T`. Without a constraint, you can't perform any operation on `T` inside a generic function.

```go
// any constraint - allows all types, but no operations possible
func print[T any](a T) {
    fmt.Println(a)  // fmt.Println accepts any, so OK
}

// The code below is a compile error: any does not support the < operation
// func min[T any](a, b T) T {
//     if a < b { return a }  // error!
//     return b
// }
```

To do a `<` comparison, you need to tell the compiler that `T` is a comparable type. This is **the role of a constraint**.

> In Go, a constraint is defined as an **interface**. Just as a regular interface defines a set of methods, a constraint defines a **set of allowed types**.

# 2. Built-in Constraints

## 2.1 any

`any` is an alias for `interface{}` added in Go 1.18. Since it allows all types, it's the loosest constraint.

```go
// The two declarations below are completely identical
func foo1[T any](a T) T { return a }
func foo2[T interface{}](a T) T { return a }
```

With the `any` constraint, you can only call functions that take `interface{}` as an argument, like `fmt.Println()`, and you cannot use operators such as `<`, `>`, or `==`.

## 2.2 comparable

`comparable` is a built-in constraint that means **a type on which the `==` and `!=` operations are possible**. This applies to `int`, `string`, `bool`, `struct` (when all fields are comparable), pointers, arrays, and so on. On the other hand, `slice`, `map`, and `func` are not comparable.

```go
func contains[T comparable](s []T, target T) bool {
    for _, v := range s {
        if v == target {  // == operation is possible because it's comparable
            return true
        }
    }
    return false
}

contains([]int{1, 2, 3, 4, 5}, 3)                       // true
contains([]string{"go", "java", "python"}, "rust")       // false
```

`comparable` is also used as the key type of a map. This is because a map key must always allow `==` comparison.

```go
// A function that extracts the keys of a map - K must be comparable
func mapKeys[K comparable, V any](m map[K]V) []K {
    keys := make([]K, 0, len(m))
    for k := range m {
        keys = append(keys, k)
    }
    return keys
}
```

A **deduplication** function using `comparable` is also useful.

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

> **any vs comparable**: `any` allows all types but permits no operations, while `comparable` only allows types on which the `==`/`!=` operations are possible. If you need magnitude comparison (`<`, `>`), you need a separate constraint.

# 3. Union Type Constraints

## 3.1 The Pipe Operator (`|`)

You can define a constraint by listing several concrete types with the **pipe operator `|`**.

```go
// Allows only one of int, int16, float32, float64
func minType[T int | int16 | int32 | int64 | float32 | float64](a, b T) T {
    if a < b {  // all the types above support the < operator
        return a
    }
    return b
}

minType(10, 20)           // int: 10
minType(3.14, 1.14)       // float64: 1.14
```

## 3.2 Defining a Constraint with an interface

Listing types inline every time makes the code long. You can define a reusable constraint with the **interface keyword**.

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

You can also **compose** constraints together.

```go
type IntegerType interface {
    int | int16 | int32 | int64
}

type Float interface {
    float32 | float64
}

// A new constraint composed of IntegerType and Float
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

## 4.1 The `~` Syntax

The `~` (tilde) token added in Go 1.18 means **all types that have the given type as their underlying type**.

```go
type Integer interface {
    ~int | int8 | int16 | int32 | int64
}
```

`~int` allows not only `int` itself but also **custom types** defined based on `int`.

## 4.2 Why `~` Is Needed

If you specify only `int` without `~`, a custom type defined like `type MyInt int` does not satisfy that constraint.

```go
type MyInt int

func min2[T Integer](a, b T) T {
    if a < b {
        return a
    }
    return b
}

// Because ~int is present, MyInt can also be used
var a MyInt = 10
var b MyInt = 20
min2(a, b)  // OK: the underlying type of MyInt is int

// If you had specified only int instead of ~int:
// → MyInt does not satisfy Integer (possibly missing ~ for int in Integer)
```

> **Practical tip**: To support custom types, it's best to add `~`. Especially when writing a library, custom types defined by users must also work, so use `~` by default.

# 5. Designing Custom Constraints

## 5.1 Grouping Numeric Types

A pattern frequently used in practice is grouping numeric types together.

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

// Compose the three constraints
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

## 5.2 Creating an Ordered Type

This is a constraint that groups types on which magnitude comparison (`<`, `>`) is possible. It's similar to the standard library's `cmp.Ordered`.

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
maxVal("apple", "banana")   // banana (lexicographic string comparison)
```

## 5.3 Using constraints.Ordered

Go's standard extension package `golang.org/x/exp/constraints` already contains well-defined constraints.

```go
import "golang.org/x/exp/constraints"

// constraints.Ordered covers all types on which magnitude comparison is possible: integers, floats, strings, etc.
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

> From Go 1.21, `cmp.Ordered` is included in the standard library, so you can use it without `golang.org/x/exp`.

## 5.4 Combining Method Requirements with Type Restrictions

You can define a constraint with **both a type restriction and a method requirement at the same time**. In this case, that constraint can only be used as a type parameter and cannot be used as a regular interface variable.

```go
// An interface that requires only a method - can also be used as a regular interface
type ToString interface {
    String() string
}

// A constraint that includes a type restriction - can only be used as a type parameter
type IntegerTilde interface {
    ~int8 | ~int16 | ~int32 | ~int64 | ~int
}

// Combine the type restriction + method requirement
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

To satisfy the `Stringer` constraint, a type must be **integer-based and also implement the `String()` method**.

```go
type MyIntType int

func (m MyIntType) String() string {
    return fmt.Sprintf("%d", int(m))
}

var a MyIntType = 10
var b MyIntType = 100
PrintMin(a, b)  // 10
```

> **Note**: An interface that includes a type restriction (such as `~int | ~string`) **can only be used as a constraint for a type parameter**. It cannot be used as the type of a regular function parameter.
>
> ```go
> // Compile error: cannot use type Stringer outside a type constraint
> func PrintMin3(a, b Stringer) { ... }
> ```

# 6. Strategies for Designing Reusable Constraints

Here are guidelines to refer to when designing constraints in practice.

**1. Break things into small units and compose them**

```go
type Signed interface { ~int | ~int8 | ~int16 | ~int32 | ~int64 }
type Unsigned interface { ~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 }
type Number interface { Signed | Unsigned }
```

**2. Use `~` by default**

To support custom types (`type ID int`), `~` is essential. It's especially important when building a library.

**3. Prefer standard library constraints**

| Package | Constraint | Description |
|--------|-----------|------|
| built-in | `any` | all types |
| built-in | `comparable` | `==`/`!=` operations possible |
| `cmp` (Go 1.21+) | `cmp.Ordered` | `<`/`>`/`<=`/`>=` operations possible |
| `golang.org/x/exp/constraints` | `constraints.Ordered` | the earlier version of `cmp.Ordered` |
| `golang.org/x/exp/constraints` | `constraints.Integer` | integer types |
| `golang.org/x/exp/constraints` | `constraints.Float` | float types |

**4. Avoid overly complex constraints**

A constraint that's more complex than necessary reduces readability. In many cases, `any` or `comparable` is enough.

# 7. FAQ

## 7.1 Q. What constraints are in the `golang.org/x/exp/constraints` package?

| Constraint | Included Types |
|-----------|----------|
| `Signed` | `~int`, `~int8`, `~int16`, `~int32`, `~int64` |
| `Unsigned` | `~uint`, `~uint8`, `~uint16`, `~uint32`, `~uint64`, `~uintptr` |
| `Integer` | `Signed \| Unsigned` |
| `Float` | `~float32`, `~float64` |
| `Complex` | `~complex64`, `~complex128` |
| `Ordered` | `Integer \| Float \| ~string` |

These constraints have the same structure as the `Signed`, `Unsigned`, and `Number` we implemented directly in the custom constraint design (Section 5). The difference is that the `constraints` package also includes the `~uintptr` and `Complex` types.

From Go 1.21, `cmp.Ordered` is included in the standard library, so you can use it without `golang.org/x/exp`. However, `Signed`, `Unsigned`, `Integer`, `Float`, and `Complex` are still provided only by `golang.org/x/exp/constraints`.

```go
// Go 1.18~1.20: external package needed
import "golang.org/x/exp/constraints"

func sum[T constraints.Integer](nums []T) T { ... }

// Go 1.21+: only Ordered was incorporated into the standard library
import "cmp"

func max[T cmp.Ordered](a, b T) T { ... }
```

> **Practical tip**: In a new project, if you only need `Ordered`, use `cmp.Ordered`, and only adopt `golang.org/x/exp/constraints` when you need more granular constraints such as `Integer` or `Float`.

# 8. Conclusion

| Constraint | Allowed Operations | When to Use |
|-----------|----------|----------|
| `any` | none (only fmt.Println, etc.) | general-purpose functions that don't depend on the type |
| `comparable` | `==`, `!=` | map key, equality comparison, deduplication |
| union type (`int \| string`) | all operations of those types | operations on a specific group of types |
| `~T` (tilde) | includes the underlying type | supporting custom types |
| `constraints.Ordered` | `<`, `>`, `<=`, `>=` | magnitude comparison, sorting |
| method constraint | calling that method | when a specific behavior is required |

In the next part, we'll cover **practical examples** using these constraints. We'll look at a generic Stack, Queue, Filter/Map/Reduce, and the Go 1.21+ standard library (`slices`, `maps`, `cmp`).

# 9. References

- https://go.dev/ref/spec#Type_parameter_declarations
- https://go.dev/blog/intro-generics
- https://pkg.go.dev/golang.org/x/exp/constraints
- https://pkg.go.dev/cmp
