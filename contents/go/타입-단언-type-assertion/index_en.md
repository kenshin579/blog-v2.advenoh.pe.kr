---
title: "Type Assertion"
description: "How type assertion works in Go to check whether an interface holds a type T and retrieve the underlying value, including the panic cases and the comma-ok form."
date: 2021-01-16
update: 2021-01-16
tags:
  - golang
  - type
  - assertion
  - 타입
  - 형단언
  - 타입단언
  - 단언
  - 고
  - 고랭
---


Through type assertion, Go can check whether an interface variable `i` is of type `T` and retrieve the value of the actual implemented type of the interface.

```go
value := i.(T)
```

With the type assertion syntax, you check whether the interface variable `i` is of type `T` and assign the actual value to the `value` variable. The points to note when using type assertion are as follows.

- The `i` variable must be an interface
    - If the interface `i` does not hold an actual value, a panic occurs
- It checks whether `T` is a type that implements the `i` interface
    - If type T does not implement the interface's methods, a panic occurs

These are the interface and methods to be used in the type assertion examples. The methods of the `Person, Phone` interfaces are implemented to fit the `Student` struct data type.

```go

type Person interface {
	getName() string
}

type Phone interface {
	getPhone() string
}

type Student struct {
	name  string
	age   int
	phone string
}

func (c Student) getName() string {
	return c.name
}

func (c Student) getPhone() string {
	return c.phone
}
```

# 1. Type Assertion Examples


## 1.1 When Type Assertion Works Normally

### 1.1.1 Asserting to the Actual Struct

```go
func Example_TypeAssertion_retrieves_the_Student_value_of_the_interface_data_type() {
	var p Person = Student{"Frank", 13, "1111"}
	fmt.Println(p.getName())

	s := p.(Student) //Person -> Student - retrieve the actual value of student.
	fmt.Println(s.getName())
	fmt.Println(s.getPhone())

	//Output:
	//Frank
	//Frank
	//1111
}
```

The interface variable `p` holds the `Student` struct value. With the `p.(Student)` type assertion, we retrieved the actual `Student` struct value from the `p` interface value and executed the methods of that data type.

### 1.1.2 Asserting to a Different Interface

```go
func Example_TypeAssertion_retrieves_the_value_as_a_different_interface() {
	var p Person = Student{"Frank", 13, "1111"}

	ph := p.(Phone) //Person -> Phone
	fmt.Println(ph.getPhone())

	//Output:
	//1111
}
```

By type-asserting from the `Person` interface to a different interface, `Phone`, we were able to execute the methods of the `Phone` interface.

## 1.2 When a Panic Occurs During Type Assertion

Let's learn about the errors that can occur during type assertion.

### 1.2.1 When the Interface Does Not Hold a Dynamic Value of Type T

```go
//a compile error occurs because type T does not implement the interface
func Example_TypeAssertion_a_compile_error_occurs_when_the_interface_does_not_own_a_dynamic_value_of_type_T() {
	//var p Person = Student{"Frank", 13, "1111"}
	//value := p.(string) //impossible type assertion: string does not implement person (missing getName method)
	//fmt.Printf("%v, %T\n", value, value)

	//Output:
}
```

During the `i.(T)` type assertion, if type `T` does not implement the interface's methods, the interface `i` cannot hold a dynamic value of type `T`, so an `impossible type assertion` compile error occurs.

### 1.2.2 When the Interface Does Not Hold an Actual Value of Type T

If type `T` has implemented methods but the interface `i` does not hold an actual value, Go raises a panic at runtime.

```go
func Example_TypeAssertion_a_panic_occurs_when_the_interface_does_not_hold_an_actual_value_of_type_T() {
	var p Person = nil
	//value := p.(Student) //panic: interface conversion: go_type_assertions.Person is nil, not go_type_assertions.Student
	value, ok := p.(Student)
	fmt.Printf("(%v, %T), ok: %v\n", value, value, ok)

	//Output:
	//({ 0 }, go_type_assertions.Student), ok: false
}

```

To avoid a panic at runtime, you can additionally receive the ok return value during type assertion. Through the `ok` variable, you can check whether type `T` implements the interface `i` and whether `i` holds the actual type `T`. If both are satisfied, `ok` returns `true`, and otherwise it returns `false`.

```go
	value, ok := p.(Student)
```



### 1.2.3 When a Different Interface Does Not Implement Type T

```go
type Animal interface {
	walk()
}

func Example_TypeAssertion_a_panic_occurs_when_a_different_interface_does_not_implement_type_T() {
	var p Person = Student{"Frank", 13, "1111"}
	//value := p.(Animal) //panic: interface conversion: go_type_assertions.Student is not go_type_assertions.Animal: missing method walk
	value, ok := p.(Animal)
	fmt.Printf("(%v, %T) %v\n", value, value, ok)

	//Output:
	//(<nil>, <nil>) false
}

```

Because the `Student` struct does not implement the `Animal` interface, a panic occurs during the `p.(Animal)` type assertion.

# 2. Summary

Type assertion is used to retrieve the actual type value from an interface variable and execute the method appropriate for that type.

The code written in this post can be found on [github](https://github.com/kenshin579/tutorials-go/tree/master/go-type-assertions).

# 3. References

- Type assertions
    - https://yourbasic.org/golang/type-assertion-switch/
    - https://feel5ny.github.io/2017/11/18/Typescript_05/
    - https://pronist.tistory.com/92
    - https://tour.golang.org/methods/15
    - https://www.geeksforgeeks.org/type-assertions-in-golang/
    - https://www.sohamkamani.com/golang/type-assertions-vs-type-conversions/
    - https://hoonyland.medium.com/%EB%B2%88%EC%97%AD-interfaces-in-go-d5ebece9a7ea
    - https://velog.io/@kykevin/Go%EC%9D%98-Interface
- Type conversions
    - https://tour.golang.org/basics/13
