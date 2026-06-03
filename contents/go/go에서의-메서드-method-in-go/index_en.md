---
title: "Methods in Go (Method in Go)"
description: "Understanding methods in Go: value vs pointer receivers, methods on non-struct types, and pointer indirection differences between functions and methods."
date: 2021-02-19
update: 2021-02-19
tags:
  - golang
  - method
  - receiver
  - parameter
  - pointer
  - 메서드
  - 리시버
  - 인자
  - 포인터
---


In addition to functions, Go provides methods. A method is a function that has a receiver parameter. Functionally, there's little difference from a regular function, and as in the syntax below, you can add a receiver parameter between the func keyword and the method name.

```go
func (receiver_name Type) methodName(parameter_list) (return_type) {

```

# 1. Go Method Examples

## 1.1 Methods with a Receiver Parameter

### 1.1.1 Value Receiver

```go
type Car struct {
	brand   string
	color   string
	mileage int
	speed   int
}

func (c Car) Color() string {
	return c.color
}
```
To return a `Car` type value in method form, you declare the `Car` type as a receiver parameter before the method name. The `Color()` method returns the `c.color` value.

```go
func Example_Method_Value_Receiver() {
	hyundaiCar := Car{"Hyundai", "Red", 10000, 0}
	//fmt.Println("hyundaiCar", hyundaiCar)

	fmt.Println(hyundaiCar.Color())

	//Output:
	//Red
}
```

In Go, a method is called with a dot (.) like methods supported in object-oriented programming languages. We called the `hyundaiCar.Color()` method to print the car's color.

### 1.1.2 Pointer Receiver

In the example above, because the receiver parameter is declared as a value parameter, changes are not reflected in the data type value after the method executes. To keep the changed value after the method executes, you must use a pointer receiver.

```go
func (c *Car) SpeedUp(s int) {
	c.speed += s
}
```
The `SpeedUp()` method increases the `c.speed` value, and it must be declared with a pointer receiver so that the changed value is retained after the method executes.

```go
func Example_Method_Pointer_Receiver() {
	hyundaiCar := Car{"Hyundai", "Red", 10000, 0}
	fmt.Println("hyundaiCar", hyundaiCar)

	hyundaiCar.SpeedUp(10)
	fmt.Println("hyundaiCar", hyundaiCar) //increased value

	//Output:
	//hyundaiCar {Hyundai Red 10000 0}
	//hyundaiCar {Hyundai Red 10000 10}
}
```

You can see that even after executing the `hyundaiCar.SpeedUp(10)` method, it's printed with the increased value.

### 1.1.3 Conventions for Methods

When defining methods, Go generally follows the conventions below.

- Defining the receiver parameter
    - The variable name of the receiver parameter uses the first letter of the receiver type name
    - The variable is declared with only a single letter
- Value vs pointer declaration
    - When you don't need to change the value, you should declare a value receiver, but for uniformity, you don't mix value and pointer declarations — declare with a pointer (reference: *Head First Go*)

> There are places that mix value and pointer use, so it would be good to unify on a convention agreed upon within the team.

### 1.1.4 Methods with Non-struct Types

So far, we've only defined methods for struct types. It's also possible to define methods for non-struct types, but caution is needed. The definition of the receiver type and the definition of the method must be in the same package.

```go
func (f float64) ceil() float64 {
	return math.Ceil(float64(i))
}
```
In the example above, the `float64` type and the `ceil()` method don't exist at the same package level, so a compile error occurs.

```go

type myFloat float64

func (m myFloat) ceil() float64 {
	return math.Ceil(float64(m))
}

func Example_Method_Non_Struct_Type() {
	v := myFloat(1.3)
	fmt.Println(v)

	//Output:
	//1.3
}
```

To take a non-struct as a receiver parameter, declaring `float64` as a separate type makes it possible to declare it as a method.

## 1.2 Methods and Pointer Indirection/Dereference

There's a difference between functions and methods in how they handle pointers. Let's learn what the difference is through examples.

- A parameter declared as a pointer parameter in a function can only take a pointer argument
- In the case of a method's receiver parameter, it can take both pointer and value arguments

```go
func area(r *Rectangle) {
	fmt.Println(r.height * r.width)
}

func Example_Indirection_Func_Pointer_Parameter() {
	r := Rectangle{
		height: 10,
		width:  3,
	}

	//area(r) //compile error - the function can only take a pointer argument
	area(&r)

	//Output:
	//30
}
```

The argument of the area(r *Rectangle) function is declared as a pointer parameter, so passing a value causes a compile error, and you can only pass a pointer argument.



```go
func (r *Rectangle) area() {
	fmt.Println(r.height * r.width)
}

func Example_Indirection_Method_Pointer_Receiver() {
	r := Rectangle{
		height: 10,
		width:  3,
	}

	r.area()
	(&r).area()

	//Output:
	//30
	//30

}
```

In r.area(), r is a value, not a pointer, but when a method with a pointer receiver parameter is called, Go automatically interprets and executes r.area() as (&r).area().

Let's also look at the difference between a function and a method when the receiver parameter is a value.



```go
func perimeter(r Rectangle) {
	fmt.Println(2 * (r.height * r.width))
}

func Example_Indirection_Func_Value_Parameter() {
	r := Rectangle{
		height: 10,
		width:  3,
	}

	//perimeter(&r) //compile error - the function can only take a value argument
	perimeter(r)

	//Output:
	//60
}
```

The `perimeter(r Rectangle)` function is declared with a value parameter, so passing the `perimeter(&r)` pointer value as an argument causes a compile error.



```go
func (r Rectangle) perimeter() {
	fmt.Println(2 * (r.height * r.width))
}

func Example_Indirection_Method_Value_Receiver() {
	r := Rectangle{
		height: 10,
		width:  3,
	}

	r.perimeter()
  (&r).perimeter()

	//Output:
	//60
	//60
}
```

In the case of a receiver parameter, when calling (&r).perimeter(), since the receiver parameter is declared as a value parameter, Go automatically interprets and executes it as (*r).perimeter().

# Summary

In Go, both functions and methods exist. It's easy to understand a method as a version of a function with a receiver parameter added. The code written in this post can be found on [github](https://github.com/kenshin579/tutorials-go/tree/master/go-methods).

# References

- https://tour.golang.org/methods/4
- http://golang.site/go/article/17-Go-%EB%A9%94%EC%84%9C%EB%93%9C
- https://gobyexample.com/methods
- https://golangbot.com/methods/
- https://hoony-gunputer.tistory.com/entry/golang-part4Method-Pointer-and-Method-Interface-Stringers-Error-Readers
- https://go101.org/article/method.html
- https://www.geeksforgeeks.org/methods-in-golang/
