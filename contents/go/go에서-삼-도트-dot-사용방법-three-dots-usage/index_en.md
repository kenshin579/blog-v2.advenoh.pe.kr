---
title: "How to Use Three Dots in Go (Three Dots Usage)"
description: "The four ways the ... (three dots) notation is used in Go: variadic parameters, unpacking slices, array literals, and command wildcards."
date: 2021-05-08
update: 2021-05-08
tags:
  - golang
  - dot
  - three
  - 점
  - 고랭
  - 도트
  - 표기법
---

# 1. Introduction

Let's learn about how to use the `...` three dots in Go. In Go, it's used in the following 4 ways.

- Declaring a variadic parameter in a function's arguments
- Passing a slice to a function that takes a variadic argument
- Specifying the length in an array literal
- Using it as a wildcard in a Go command

# 2. Let's Learn How to Use Three Dots

## 2.1 Declaring a Variadic Parameter in a Function's Arguments

```go
func sum(nums ...int) int {
	res := 0
	for _, n := range nums {
		res += n
	}
	return res
}
```

To pass variadic arguments to the `sum` function, declaring the parameter as `...int` makes it a variadic parameter.

```go
func Example_variadicFunction() {
	total1 := sum(1, 2, 3)
	total2 := sum(1, 2)
	fmt.Println(total1)
	fmt.Println(total2)

	//Output:
	//6
	//3
}
```

When calling the `sum` function, you can freely pass 2 or 3 argument values.



## 2.2 Passing a Slice to a Function That Takes a Variadic Argument

```go
func Example_passingToVariadicFunction() {
	numList := []int{2, 3, 5, 6}
	fmt.Println(sum(numList[0], numList[1], numList[2], numList[3]))
	// using the ... notation, you can unpack and pass it to the variadic parameter
	fmt.Println(sum(numList...))

	//Output:
	//16
	//16
}
```

Because the `sum` function is declared as variadic, you have to pass it like `sum(1,2,3)`, but entering a collection declared as a slice one by one is very inconvenient. So in Go, if you use the three-dot notation after a slice as `slice...`, Go unpacks and passes it to the variadic parameter.

## 2.3 Specifying the Length in an Array Literal

```go
func Example_array_literal() {
	// in an array literal, the ... notation specifies a length equal to the number of elements in the literal
	strList := [...]string{"Frank", "Joe", "Angela"}
	fmt.Println(len(strList))

	//Output: 3
}
```

When you use the `...` notation in an array literal, the length is specified to be equal to the number of elements in the literal.



## 2.4 Using It as a Wildcard in a Go Command

```bash
# when specifying a package list, the ... notation is used as a wildcard for the package list
$ go test ./...
```

In a Go command, the `...` notation means using the package list as a wildcard. The command above means to run the test files in all folders within the current folder.

# 3. Conclusion

We looked at the various ways to use the `...` notation in Go, and the code written here can be found on [github](https://github.com/kenshin579/tutorials-go/tree/master/go-three-dots). That's it for today's post...

# 4. References

- https://yourbasic.org/golang/three-dots-ellipsis/
- https://blog.learngoprogramming.com/golang-variadic-funcs-how-to-patterns-369408f19085
- https://golangbot.com/variadic-functions/
