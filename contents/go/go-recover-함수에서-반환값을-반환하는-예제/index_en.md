---
title: "Returning a Value from a Go Recover Function"
description: "An example of how to return a value from a Go recover function."
date: 2022-08-07
update: 2022-08-07
tags:
  - golang
  - go
  - recover
  - return
  - panic
---


While developing a Validation API function, there were cases where evaluating a complex expression caused a panic for invalid expressions. When a panic occurs, the `recover()` function keeps the server from dying, but for a Validation API, we need to return a response to the client indicating that the expression is invalid.

# 1.panic() and recover() Functions

Let's look at how to return a value from a `recover()` function. These are the Go built-in functions we'll use today.

- `panic()`
    - when `panic()` is executed, it stops immediately
    - it runs all `defer` functions of the function and then terminates
- `recover()`
    - just as Java handles exceptions with a `try ~ catch` block, the `recover()` function plays a similar role
    - it prevents the program where a `panic` occurred from terminating and recovers it
    - it must be used together with `defer`



```go
func main() {
	f()
	fmt.Println("Returned normally from f.")
}

func f() {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("Recovered in f", r)
		}
	}()
	fmt.Println("Calling g.")
	g(0)
	fmt.Println("Returned normally from g.")
}

func g(i int) {
	if i > 3 {
		fmt.Println("Panicking!")
		panic(fmt.Sprintf("%v", i))
	}
	defer fmt.Println("Defer in g", i)
	fmt.Println("Printing in g", i)
	g(i + 1)
}

```



You can see that a `panic` occurs in the g() function and the `defer` functions run in the order they were pushed onto the call stack. Then, when the `defer` function defined in `f()` runs, it calls `recover()`, restoring the panicking state back to normal and running the rest of the `f()` function's code.

```bash
$ go run main.go
Printing in g 0
Printing in g 1
Printing in g 2
Printing in g 3
Panicking!
Defer in g 3
Defer in g 2
Defer in g 1
Defer in g 0
Recovered in f 4
Returned normally from f.
```



# 2.Returning a Value from a recover() Function

To return a value from a `recover()` function, give a name to the return value of `MyFunc()` and assign a value to that named variable; the value will then be returned after the `recover()` function runs.

```go

func main() {
	myFunc, err := MyFunc()
	fmt.Println("myFunc:", myFunc)
	fmt.Println("err:", err)
}

type Response struct {
	Message string
}

func MyFunc() (resp Response, err error) {
	defer func() {
		if r := recover(); r != nil {
			err = errors.New(fmt.Sprint(r))
			resp = Response{
				Message: "failure",
			}
		}
	}()
	panic("test")
	return Response{Message: "success"}, nil
}

```

Running it as a unit test confirms that the return value is returned as `Response{Message:"failure"}`.

```go
func TestMyFunc(t *testing.T) {
	resp, err := MyFunc()
	assert.Error(t, err)
	assert.Equal(t, Response{
		Message: "failure",
	}, resp)
}
```

# 3.Printing a Stack Trace in recover()

To recover after a panic and print a stack trace for easier debugging, use the `PrintStack()` function included in the Debug package.

```go

func MyFunc() (resp Response, err error) {
	defer func() {
		if r := recover(); r != nil {
			debug.PrintStack()
			err = errors.New(fmt.Sprint(r))
			resp = Response{
				Message: "Failure",
			}
		}
	}()
	panic("test")
	return Response{Message: "Success"}, nil
}
```

The `debug.PrintStack()` function prints a stack trace like the one below.

```bash
goroutine 1 [running]:
runtime/debug.Stack()
        /opt/homebrew/opt/go/libexec/src/runtime/debug/stack.go:24 +0x68
runtime/debug.PrintStack()
        /opt/homebrew/opt/go/libexec/src/runtime/debug/stack.go:16 +0x20
main.MyFunc.func1()
        /Users/user/GolandProjects/tutorials-go/go-recover/return-value/main.go:22 +0x48
panic({0x104a5b6e0, 0x104a6bc68})
        /opt/homebrew/opt/go/libexec/src/runtime/panic.go:838 +0x204
main.MyFunc()
        /Users/user/GolandProjects/tutorials-go/go-recover/return-value/main.go:29 +0x74
main.main()
        /Users/user/GolandProjects/tutorials-go/go-recover/return-value/main.go:10 +0x20
myFunc: {Failure}
err: test

```


# 4.References

- http://golang.site/go/article/20-Go-defer%EC%99%80-panic
- https://github.com/kenshin579/tutorials-go/pull/287
- https://stackoverflow.com/questions/68554968/why-does-go-panic-recover-to-return-value-with-local-variable-not-work
- https://stackoverflow.com/questions/19934641/go-returning-from-defer
- https://stackoverflow.com/questions/33167282/how-to-return-a-value-in-a-go-function-that-panics
- https://golangbot.com/panic-and-recover/
