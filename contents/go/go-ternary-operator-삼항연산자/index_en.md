---
title: "Go Ternary Operator"
description: "Why Go has no ternary operator, and how to mimic one with a function."
date: 2021-05-18
update: 2021-05-18
tags:
  - golang
  - ternary
  - operator
  - 고랭
  - 연산자
  - 삼항
  - 삼항연산자
  - 3항연산자
---


# 1. What Is the Ternary Operator?

The ternary operator is a syntax that can be used instead of an if statement in the form below. It is supported in many languages such as JavaScript and Java, and the code below is Java's ternary operator.

```java
String grade = (math >= 90) ? "pass": "fail";
```

The reason the ternary operator is missing from the Go language is to keep the design simple. The long version is more readable, and even someone who doesn't know the ternary operator can easily understand the long version, so it was left out at the language design stage.

Although Go does not support the ternary operator, you can code something like a ternary operator using a function. This is an example that returns true or false depending on whether the status value is "done".

```go

func Example_Ternary_Operator_EqualCheck() {
	checkStatus := func(status string) bool {
		if status == "done" {
			return true
		}
		return false
	}("done")

	fmt.Println(checkStatus)
	//Output: true
}


```

Please refer to [github](https://github.com/kenshin579/tutorials-go/tree/master/go-ternary) for the example code.

# 2. References

- https://golangdocs.com/ternary-operator-in-golang
- https://needneo.tistory.com/105
