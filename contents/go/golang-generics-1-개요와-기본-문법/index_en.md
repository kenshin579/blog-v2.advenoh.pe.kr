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

<!-- slides -->

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

# 6. Quiz

If you've read this far, these are questions you can answer. Pick an answer and the explanation shows up right away.

```quiz
- type: mcq
  q: "Which problem with the `interface{}` approach before generics does the article point out?"
  choices: ["An incorrect type assertion is caught at compile time", "The return type is interface{}, so autocompletion works well", "An incorrect type assertion causes a panic at runtime", "You can use the extracted value without a type assertion"]
  answer: 2
  explain: "The `interface{}` approach needs a type assertion in the `.(Type)` form every time you extract a value, and if the type does not match, a panic occurs at runtime rather than at compile time. Since the return type is `interface{}`, IDE support such as autocompletion and type checking is limited too. (Section 3.1)"

- type: ox
  q: "The Go designers deliberately left generics out of the language for a long time to keep complexity low."
  answer: true
  explain: "True. Go was designed with simplicity as its core philosophy, so the designers including Rob Pike deliberately left out many features, and generics was long among them. Eventually Ian Lance Taylor's Type Parameters Proposal was adopted and introduced in Go 1.18. (Section 2)"

- type: code
  q: "In this code, what does each of the two printAny calls resolve T to?"
  lang: go
  code: |
    func printAny[T any](a T) {
        fmt.Println(a)
    }

    func main() {
        printAny(10)
        printAny("hello")
    }
  choices: ["The first call gets T = int, the second gets string", "Both calls pin T down to the single type any", "The first call gets T = int, the second is an error", "Without explicit types, both calls fail to compile"]
  answer: 0
  explain: "`any` is a constraint that allows all types, and T is inferred separately for each call from the argument passed in. So the first call gets T = int and the second call gets T = string. (Section 4.2)"

- type: mcq
  q: "Why does the article declare the min function with a union type constraint like `int | int16 | float64`?"
  choices: ["Because with any, type inference stops working entirely", "Because the any constraint does not support the `<` operation", "Because any is a keyword that cannot be a constraint at all", "Because declaring it as any makes the function panic at runtime"]
  answer: 1
  explain: "The `any` constraint does not support the `<` operation. So a function like min that needs a comparison must narrow the allowed types with a union type constraint such as `int | float64`. (Section 4.2)"

- type: blank
  q: "The name of the most basic constraint in the article, the one that allows all types, is ___."
  answer: ["any"]
  explain: "It is `any`. It is the name that replaces the older `interface{}`, and it lets any type at all be used for the type parameter. But because it allows so much, operations like comparison are not available. (Section 4.2)"

- type: code
  q: "Why does this code fail to compile?"
  lang: go
  code: |
    type Node[T any] struct {
        val  T
        next *Node[T]
    }

    func (n *Node[T]) Push[F any](f F) {
        _ = f
    }
  choices: ["Because any cannot be used on a struct type parameter", "Because a pointer receiver cannot take a type parameter", "Because the next field cannot point at its own type", "Because the method declares a new type parameter of its own"]
  answer: 3
  explain: "In Go a method cannot declare additional type parameters; it can only use the ones declared on the struct. So `Push[F any]` produces the error method must have no type parameters. Both the struct's `[T any]` and the self-referencing `*Node[T]` field are perfectly fine. (Section 4.4)"

- type: mcq
  q: "Which of these matches a main case where type inference fails, as summarized in the article?"
  choices: ["When two or more type parameters have been declared", "When the return type has been declared as a slice type", "When the arguments passed have differing types", "When no arguments at all are passed to the function"]
  answer: 3
  explain: "Type inference determines the type from the arguments, so with no arguments at all there is nothing to infer from and it fails. Having several type parameters is not a problem, since each one is inferred individually from its own argument. (Section 5.2, Section 5.3)"

- type: code
  q: "In this code, what are the types of a and b?"
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
  choices: ["a resolves to []any and b resolves to []string", "a resolves to []int and b resolves to []string", "a resolves to []int and b is an error, having no args", "a resolves to []int and b is inferred as []any"]
  answer: 1
  explain: "For a, T = int is inferred from the arguments 1, 2, 3, so it becomes []int. For b, inference is impossible with no arguments, but the type is specified explicitly as `toSlice[string]()`, so it compiles fine as []string. Writing `toSlice()` without the explicit type gives a cannot infer T error. (Section 5.3)"

- type: ox
  q: "Constraints declared with an interface cannot be composed into a new constraint."
  answer: false
  explain: "False. Composing constraints is possible. The article's `ComparableNumbers` is built by composing two previously declared constraints, as in `IntegerType | Float`. (Section 4.3)"
```

# 7. Wrapping Up

| Item | Before Generics | After Generics |
|------|-----------------|-----------------|
| supporting multiple types | `interface{}` + type assertion | type parameter `[T any]` |
| type safety | risk of runtime panic | compile-time verification |
| code duplication | repeated functions per type | a single generic function |
| data structures | struct defined per type | generic struct `[T any]` |
| IDE support | limited | full type inference |

In the next part, we'll cover **Type Constraint**, the core of generics. We'll take an in-depth look at type constraints including `any`, `comparable`, union types (`|`), tilde (`~`), and designing custom constraints.

# 8. FAQ

## 8.1 Q. What Is a Type Assertion?

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

# 9. References

- https://go.dev/doc/tutorial/generics
- https://go.dev/blog/intro-generics
- https://go.dev/ref/spec#Type_parameter_declarations
