---
title: "Golang Generics Part 3 - A Collection of Practical Examples"
description: "Practical examples using Go generics: data structures, utility functions, functional patterns, and the Go 1.21+ standard library."
date: 2026-03-03
update: 2026-03-03
tags:
  - golang
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
---

![Golang Generics](golang-generics-hero.png)

In Part 1, we covered the basic syntax, and in Part 2, type constraints. In this part, we'll implement **practical examples** using generics. We'll look at data structures, utility functions, functional patterns, and even the Go 1.21+ standard library.

# 1. Implementing Generic Data Structures

## 1.1 Generic Stack

Let's implement a Stack with a LIFO (Last In, First Out) structure using generics.

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
    var zero T // idiomatic pattern for returning the zero value in generics
    if len(s.items) == 0 {
        return zero, false
    }
    item := s.items[len(s.items)-1]   // take the last element
    s.items = s.items[:len(s.items)-1] // remove by shrinking the slice length
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

A single implementation can be used with any type, such as `int` or `string`.

```go
// int stack
intStack := NewStack[int]()
intStack.Push(1)
intStack.Push(2)
intStack.Push(3)
val, _ := intStack.Pop()  // 3

// string stack
strStack := NewStack[string]()
strStack.Push("hello")
strStack.Push("world")
val, _ := strStack.Pop()  // "world"
```

> `var zero T` is the idiomatic pattern used to return the zero value in generic code. The zero value of `T` is `0` for `int`, `""` for `string`, and `nil` for a pointer.

## 1.2 Generic Queue

Let's implement a Queue with a FIFO (First In, First Out) structure.

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
    q.items = q.items[1:] // remove the front element (simple implementation; consider a ring buffer for large data)
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

# 2. Generic Utility Functions

## 2.1 Min / Max Functions

Using `constraints.Ordered`, you can implement Min/Max functions that work for all comparable types.

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

A function that finds the minimum/maximum value in a slice is implemented with the same pattern.

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

# 3. Slice Utility Functions (Functional Patterns)

## 3.1 Filter

Returns only the elements that satisfy a condition.

```go
func Filter[T any](s []T, predicate func(T) bool) []T {
    result := make([]T, 0) // start with an empty slice since the result size is unknown in advance
    for _, v := range s {
        if predicate(v) { // include if the condition function returns true
            result = append(result, v)
        }
    }
    return result
}

// Filter only even numbers
evens := Filter([]int{1, 2, 3, 4, 5, 6}, func(n int) bool {
    return n%2 == 0
})
// [2 4 6]

// Only strings of length 3 or more
long := Filter([]string{"go", "java", "py", "rust"}, func(s string) bool {
    return len(s) >= 3
})
// [java rust]
```

## 3.2 Map

Transforms each element of a slice. Since the input and output types can differ, two type parameters are needed.

```go
// T → U transformation: two type parameters are needed because the input and output types can differ
func MapSlice[T, U any](s []T, transform func(T) U) []U {
    result := make([]U, len(s)) // since it's a 1:1 correspondence with the input, allocate the length in advance (no append needed)
    for i, v := range s {
        result[i] = transform(v)
    }
    return result
}

// int -> int (double)
doubled := MapSlice([]int{1, 2, 3}, func(n int) int { return n * 2 })
// [2 4 6]

// string -> string (uppercase)
uppered := MapSlice([]string{"hello", "world"}, func(s string) string {
    return strings.ToUpper(s)
})
// [HELLO WORLD]

// int -> string (type conversion)
strs := MapSlice([]int{1, 2, 3}, func(n int) string {
    return fmt.Sprintf("#%d", n)
})
// [#1 #2 #3]
```

## 3.3 Reduce

Reduces a slice to a single value.

```go
func Reduce[T, U any](s []T, initial U, accumulator func(U, T) U) U {
    result := initial // the starting point of the accumulated value (0 for a sum, "" for string concatenation)
    for _, v := range s {
        result = accumulator(result, v) // compute the new accumulated value from the previous accumulated value and the current element
    }
    return result
}

// Sum
total := Reduce([]int{1, 2, 3, 4, 5}, 0, func(acc, n int) int {
    return acc + n
})
// 15

// String concatenation
joined := Reduce([]string{"Go", "Generics", "Rock"}, "", func(acc, s string) string {
    if acc == "" { return s }
    return acc + " " + s
})
// "Go Generics Rock"
```

## 3.4 Combining Filter + Map + Reduce

The true value of functional patterns shows in composition.

```go
nums := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}

// Pipeline: Filter → Map → Reduce (each stage's result is the next stage's input)
evens := Filter(nums, func(n int) bool { return n%2 == 0 })       // [2 4 6 8 10]
doubled := MapSlice(evens, func(n int) int { return n * 2 })       // [4 8 12 16 20]
total := Reduce(doubled, 0, func(acc, n int) int { return acc + n }) // 60
```

# 4. Generic Map Helpers

## 4.1 Extracting Values

```go
func MapValues[K comparable, V any](m map[K]V) []V {
    values := make([]V, 0, len(m)) // len=0, cap=len(m): the size is known but order is not, so use append
    for _, v := range m {
        values = append(values, v)
    }
    return values
}

m := map[string]int{"a": 1, "b": 2, "c": 3}
values := MapValues(m)  // [1 2 3] (order not guaranteed)
```

## 4.2 Merge

Merges two maps. When keys overlap, the value of the second map takes precedence.

```go
func MapMerge[K comparable, V any](m1, m2 map[K]V) map[K]V {
    result := make(map[K]V, len(m1)+len(m2)) // pre-allocate at the maximum size (prevents rehashing)
    for k, v := range m1 {
        result[k] = v
    }
    for k, v := range m2 {
        result[k] = v // on key collision, the m2 value overwrites m1
    }
    return result
}

m1 := map[string]int{"a": 1, "b": 2}
m2 := map[string]int{"b": 20, "c": 3}
merged := MapMerge(m1, m2)
// {"a": 1, "b": 20, "c": 3}
```

## 4.3 Filter

Returns only the key-value pairs that satisfy a condition.

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

# 5. Using the Standard Library (Go 1.21+)

From Go 1.21, the standard packages `slices`, `maps`, and `cmp` were added, which leverage generics. Many of the utility functions we implemented directly earlier are already included in the standard library.

## 5.1 The slices Package

```go
import "slices"

// Sort
nums := []int{5, 3, 8, 1, 9, 2}
slices.Sort(nums)
// [1 2 3 5 8 9]

// Containment check
slices.Contains([]int{1, 2, 3, 4, 5}, 3)   // true
slices.Contains([]int{1, 2, 3, 4, 5}, 6)   // false

// Min / Max
slices.Min([]int{5, 3, 8, 1, 9})  // 1
slices.Max([]int{5, 3, 8, 1, 9})  // 9
```

Custom sorting can also be expressed concisely with `SortFunc`.

```go
// Sort by absolute value: the comparison function returns negative if a<b, 0 if a==b, positive if a>b
nums := []int{-5, 3, -1, 8, -2}
slices.SortFunc(nums, func(a, b int) int {
    absA, absB := a, b
    if absA < 0 { absA = -absA }
    if absB < 0 { absB = -absB }
    return absA - absB // determine the sort order by the difference of absolute values
})
// [-1 -2 3 -5 8]
```

## 5.2 The maps Package

```go
import "maps"

// Clone - deep copy
original := map[string]int{"a": 1, "b": 2, "c": 3}
cloned := maps.Clone(original)
cloned["d"] = 4  // modifying the clone does not affect the original

// Equal - compare two maps
m1 := map[string]int{"a": 1, "b": 2}
m2 := map[string]int{"a": 1, "b": 2}
m3 := map[string]int{"a": 1, "b": 3}
maps.Equal(m1, m2)  // true
maps.Equal(m1, m3)  // false
```

## 5.3 The cmp Package

```go
import "cmp"

// Compare - compare two values (returns -1, 0, 1)
cmp.Compare(1, 2)  // -1 (1 < 2)
cmp.Compare(2, 2)  //  0 (2 == 2)
cmp.Compare(3, 2)  //  1 (3 > 2)
```

`cmp.Or` returns the first non-zero value. It's very useful for the **configuration value priority pattern**.

```go
// user config > environment variable > default value
userConfig := ""
envConfig := ""
defaultConfig := "localhost:8080"

addr := cmp.Or(userConfig, envConfig, defaultConfig) // returns the first value that is not the zero value ("")
// "localhost:8080"

envConfig = "0.0.0.0:9090"
addr = cmp.Or(userConfig, envConfig, defaultConfig)
// "0.0.0.0:9090" (when the environment variable is set)
```

# 6. Custom Implementation vs Standard Library


| Feature           | Custom Implementation          | Standard Library (Go 1.21+)           |
| ----------------- | ------------------------------ | ------------------------------------- |
| Contains          | `contains[T comparable]`       | `slices.Contains`                     |
| Min/Max           | `MinOf[T constraints.Ordered]` | `slices.Min`, `slices.Max`            |
| Sort              | -                              | `slices.Sort`, `slices.SortFunc`      |
| Map Clone         | -                              | `maps.Clone`                          |
| Map Equal         | -                              | `maps.Equal`                          |
| Filter/Map/Reduce | needs custom implementation    | some added in Go 1.23+ such as `slices.Collect` |

> **Practical recommendation**: If you're using Go 1.21 or later, prefer the `slices`, `maps`, and `cmp` standard packages. Use custom implementations for features not in the standard library (Filter, Map, Reduce, etc.) or for learning purposes.

# 7. Conclusion

Here's a summary of the generic patterns covered in this part.


| Pattern               | Key Point                                                       |
| --------------------- | ---------------------------------------------------------------- |
| Stack / Queue         | return the zero value with `var zero T`, use the struct type parameter in methods |
| Min / Max             | support all comparable types with `constraints.Ordered`         |
| Filter / Map / Reduce | the `func(T) bool`, `func(T) U` callback pattern, functional composition |
| Map helpers           | the `K comparable, V any` pattern to constrain map keys          |
| Standard library      | actively use the Go 1.21+ `slices`, `maps`, `cmp` packages       |

In the next part, we'll cover the **comparison of Generics vs Interface** and **performance benchmarks**.

# 8. References

- https://pkg.go.dev/slices
- https://pkg.go.dev/maps
- https://pkg.go.dev/cmp
- https://pkg.go.dev/golang.org/x/exp/constraints
