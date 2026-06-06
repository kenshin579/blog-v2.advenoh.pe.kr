---
title: "Type Conversion in Go"
description: "How explicit type conversion works in Go and why Go only supports it."
date: 2021-01-16
update: 2021-01-16
tags:
  - golang
  - type
  - conversion
  - cast
  - casting
  - 형변환
  - 타입변환
  - 타입
  - 변환
  - 명시적
  - 캐스팅
---

Type conversion means changing a value's data type. Java supports both explicit type conversion and implicit type conversion, but Go supports only explicit type conversion.

The type conversion syntax converts the value `val` to type `T`, as shown below.

```go
T(val)
```

In the example, an `int` value is converted to the `float64` and `uint32` types.

```go
func Example_TypeConversion() {
	var i = 52
	var j float64 = float64(i)
	var k = uint32(j)

	fmt.Println(i)
	fmt.Println(j)
	fmt.Println(k)

	//Output:
	//52
	//52
	//52
}
```



You can find the code written in this post on [github](https://github.com/kenshin579/tutorials-go/tree/master/go-type-conversion).

# 1. References

- Go type conversion
    - https://tour.golang.org/basics/13
    - https://www.geeksforgeeks.org/type-casting-or-type-conversion-in-golang/
- Java type conversion
    - https://opentutorials.org/course/1223/5330
