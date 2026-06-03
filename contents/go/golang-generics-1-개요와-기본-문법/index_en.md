---
title: "Golang Generics Part 1 - Overview and Basic Syntax"
description: "An overview of Go generics and their basic syntax — type parameters, constraints, and type inference."
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

# 1. What Are Generics?

![Golang Generics](golang-generics-hero.png)

Generics is a programming technique that lets you define functions or types **without specifying a concrete type**, deciding the type at the point of use. It's a feature already supported in many languages such as Java, C++, and Rust, and in Go it has been officially supported since **Go 1.18** (March 2022).

The biggest reason generics are needed is **eliminating code duplication**. It solves the problem of having to write the same logic multiple times for functions that differ only in type.

# 2. The Background of Generics' Introduction in Go

Go is a language designed from the start with **simplicity** as its core philosophy. The Go designers, including Rob Pike, deliberately left out many features to keep the language's complexity low, and generics was long among them.

But in the Go community, generics was consistently the most requested feature. The workaround using `interface{}` lacked type safety, and there was the inefficiency of having to write the same logic repeatedly per type. Eventually, Ian Lance Taylor's **Type Parameters Proposal** was adopted and introduced in Go 1.18.

> Go's generics is deliberately designed to be simpler than in other languages. It does not include advanced features like template metaprogramming (C++) or higher-kinded types (Haskell), focusing instead on providing **practical-level type parameters**.

# 3. Go's Limitations Before Generics

## 3.1 Problems with interface{}-Based Implementations

Before generics existed, handling multiple types in Go required using `interface{}` (now `any`). But this approach had fundamental problems.

```go
// interface{}-based - the return type is interface{}, so a type assertion is needed
func foo1(a interface{}) interface{} {
    return a
}

// generics-based - the return type is T, so no type assertion is needed
func foo2[T any](a T) T {
    return a
}

func main() {
    var a int = 10
    var b int = 20
    var c int

    c = foo1(a).(int)  // type assertion needed (can fail at runtime)
    fmt.Println(c)     // 10

    c = foo2(b)        // type is determined automatically (compile-time safe)
    fmt.Println(c)     // 20
}
```

Major problems with the `interface{}` approach:
- **lack of type safety**: an incorrect type assertion causes a panic at runtime, not at compile time
- **type casting cost**: you have to do a type assertion in the `.(Type)` form every time
- **limited IDE support**: since the return type is `interface{}`, autocompletion, type checking, etc. are limited

## 3.2 The Code Duplication Problem

Having to write functions with the same logic repeatedly per type was also a big problem.

```go
// min function for int
func minInt(a, b int) int {
    if a < b {
        return a
    }
    return b
}

// min function for int16 - the logic is completely identical
func minInt16(a, b int16) int16 {
    if a < b {
        return a
    }
    return b
}

// min function for float64 - the same logic repeated again...
func minFloat64(a, b float64) float64 {
    if a < b {
        return a
    }
    return b
}
```

We wrote **completely identical logic** 3 times, differing only in type. The more types you need to support, the worse the duplication gets.

# 4. Generics Basic Syntax

## 4.1 Declaring a Type Parameter

Go's generics declares type parameters inside **square brackets `[]`**.

```
func funcName[T constraint](parameter T) T {
    // ...
}
```

- `T`: the type parameter name (conventionally a single uppercase letter)
- `constraint`: the type constraint (restricts which types are allowed)

## 4.2 Generic Functions

This is the most basic form of a generic function.

```go
// any is a constraint that allows all types
func printAny[T any](a T) {
    fmt.Println(a)
}

func main() {
    printAny(10)       // T = int
    printAny(3.14)     // T = float64
    printAny("hello")  // T = string
}
```

The duplication problem of the min function seen earlier can also be cleanly solved with generics.

```go
// define the range of types that can go into the type constraint
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

> The `any` constraint does not support the `< ` operation, so when a comparison operation is needed, you must specify the allowed types with a **union type constraint** like `int | float64`. This is covered in detail in Part 2.

## 4.3 Custom Constraint (declared with an interface)

Listing types inline every time is inefficient. With the **interface keyword**, you can define a reusable constraint.

```go
type IntegerType interface {
    int | int16 | int32 | int64
}

type Float interface {
    float32 | float64
}

// constraints can also be composed
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

You can use type parameters not only on functions but also on **structs**.

```go
type Node[T any] struct {
    val  T
    next *Node[T]
}

func NewNode[T any](v T) *Node[T] {
    return &Node[T]{val: v}
}

// a method cannot declare new type parameters;
// it can only use the struct's type parameters
func (n *Node[T]) Push(v T) *Node[T] {
    node := NewNode(v)
    n.next = node
    return node
}
```

Usage example:

```go
node := NewNode(1)              // *Node[int]
node.Push(2).Push(3).Push(4)

strNode := NewNode("hello")    // *Node[string]
strNode.Push("world")
```

> **Note**: In Go, you cannot declare additional type parameters on a method. Syntax like `func (n *Node[T]) Push[F any](f F)` is not allowed; only the type parameters declared on the struct can be used.

## 4.5 Generic Map Function

Using two or more type parameters, you can also write functional utilities like `Map`.

```go
// F: the element type of the input slice, T: the element type of the output slice
// s: the original slice to transform, f: the function that transforms each element
func Map[F, T any](s []F, f func(F) T) []T {
    rst := make([]T, len(s)) // create a result slice of the same size as the original
    for i, v := range s {
        rst[i] = f(v) // apply the transform function to each element
    }
    return rst
}

func main() {
    // int → int: double each element (F=int, T=int)
    doubled := Map([]int{1, 2, 3}, func(i int) int {
        return i * 2
    })
    fmt.Println(doubled) // [2 4 6]

    // string → string: uppercase each element (F=string, T=string)
    uppered := Map([]string{"Hello", "world"}, func(s string) string {
        return strings.ToUpper(s)
    })
    fmt.Println(uppered) // [HELLO WORLD]
}
```

# 5. Type Inference

The Go compiler can **automatically infer** type parameters from function arguments. Thanks to this, in most cases you don't need to specify the type explicitly.

## 5.1 Explicit Type Specification vs Type Inference

```go
func identity[T any](v T) T {
    return v
}

// explicit type specification
result1 := identity[int](42)       // T = int specified
result2 := identity[string]("hello") // T = string specified

// type inference - inferred automatically from the arguments
result3 := identity(42)            // T = int inferred
result4 := identity("hello")      // T = string inferred
```

Both approaches produce the same result. When type inference is possible, the **inference approach is more concise and therefore recommended**.

## 5.2 Inference with Multiple Type Parameters

Even with multiple type parameters, each is inferred individually from its argument.

```go
func pair[T, U any](a T, b U) string {
    return fmt.Sprintf("(%v, %v)", a, b)
}

// all type parameters can be inferred
pair(1, "hello")    // T=int, U=string
pair(3.14, true)    // T=float64, U=bool
```

## 5.3 When Type Inference Fails

When the compiler cannot determine the type from the arguments, **explicit type specification is required**.

```go
func toSlice[T any](args ...T) []T {
    return args
}

// inference succeeds - type can be determined from the arguments
ints := toSlice(1, 2, 3)           // T = int

// inference fails - no arguments, so the type can't be determined
emptyInts := toSlice[int]()        // explicit specification needed
emptyStrings := toSlice[string]()  // explicit specification needed

// the code below is a compile error: cannot infer T
// result := toSlice()
```

**Main cases where type inference fails:**
- when no arguments are passed to the function
- when the type can't be determined from the return type alone
- when the argument types are ambiguous

# 6. Wrapping Up

| Item | Before Generics | After Generics |
|------|-----------------|-----------------|
| supporting multiple types | `interface{}` + type assertion | type parameter `[T any]` |
| type safety | risk of runtime panic | compile-time verification |
| code duplication | repeated functions per type | a single generic function |
| data structures | struct defined per type | generic struct `[T any]` |
| IDE support | limited | full type inference |

In the next part, we'll cover **Type Constraint**, the core of generics. We'll take an in-depth look at type constraints including `any`, `comparable`, union types (`|`), tilde (`~`), and designing custom constraints.

# 7. FAQ

### Q. What Is a Type Assertion?

It's an operation that extracts a value of a concrete type from a value of `interface{}` type. It's used in the `value.(Type)` form.

```go
var val interface{} = "hello"

s := val.(string)  // OK: "hello"
i := val.(int)     // panic! it's a string but we try to extract it as int
```

If the actual type doesn't match, a panic occurs at runtime. To use it safely, you can check success with a second return value.

```go
s, ok := val.(string)  // ok = true, s = "hello"
i, ok := val.(int)     // ok = false, i = 0 (no panic)
```

With generics, the type assertion itself becomes unnecessary. Since the type is determined at compile time, there's no risk of a runtime panic.

# 8. References

- https://go.dev/doc/tutorial/generics
- https://go.dev/blog/intro-generics
- https://go.dev/ref/spec#Type_parameter_declarations
