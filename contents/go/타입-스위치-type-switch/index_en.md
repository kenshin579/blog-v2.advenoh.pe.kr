---
title: "Type Switch"
description: "How a type switch works in Go: running a type assertion and executing the block whose case matches the variable's actual type."
date: 2021-01-16
update: 2021-01-16
tags:
  - golang
  - type
  - switch
  - 형스위치
  - 타입스위치
  - 고
  - 고랭
---

A type switch runs a type assertion and executes the block whose type matches the condition of the switch statement. A type switch declaration has the same syntax as a type assertion `variable.(T)`. However, T is replaced with the `type` keyword.

Depending on the actual type of the `i` variable passed as an argument, each case block statement is executed.

```go

func typeSwitchTest(i interface{}) {
	switch v := i.(type) {
	case nil:
		fmt.Println("x is nil")
	case int:
		fmt.Println("x is", v)
	case bool, string:
		fmt.Println("x is bool or string")
	default:
		fmt.Printf("type unknown %T\n", v)
	}
}
```
Depending on the various argument values, the switch statement is executed.

```go

func Example_TypeSwitch() {
	typeSwitchTest("value")
	typeSwitchTest(23)
	typeSwitchTest(true)
	typeSwitchTest(nil)
	typeSwitchTest([]int{})

	//Output:
	//x is bool or string
	//x is 23
	//x is bool or string
	//x is nil
	//type unknown []int
}
```

The code written in this post can be found on [github](https://github.com/kenshin579/tutorials-go/tree/master/go-type-switch).

# 1. References

* https://yourbasic.org/golang/type-assertion-switch/
* https://riptutorial.com/go/example/14736/type-switch
* https://www.geeksforgeeks.org/type-switches-in-golang/
* https://tour.golang.org/methods/16
