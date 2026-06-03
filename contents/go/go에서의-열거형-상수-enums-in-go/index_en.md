---
title: "Enum Constants in Go (Enums in Go)"
description: "How to declare enum-like constants in Go using the iota keyword, with examples for ByteSize, bitwise flags, and iterating enums."
date: 2020-12-20
update: 2020-12-20
tags:
  - go
  - golang
  - enums
  - iota
  - 열거형
  - 상수
  - 고
  - 고랭
---

# 1. Introduction

In Go, the Enums type provided by Java does not exist. However, in Go too, you can easily declare and use enum-like constant values using `iota`.

The `iota` keyword is a `predefined identifier` that can be used in a `const` declaration and represents the successive integer constants 0, 1, 2, .... Let's learn how to use it through examples.

```go
//#builtin.go
// iota is a predeclared identifier representing the untyped integer ordinal
// number of the current const specification in a (usually parenthesized)
// const declaration. It is zero-indexed.
const iota = 0 // Untyped int.
```

# 2. iota Examples

## 2.1 Basic Example

The starting value of `iota` is 0, and from then on it's declared with a value incremented by +1.

```go
func Example_iota_basic() {
  const (
    c0 = iota
    c1 = iota
    c2 = iota
  )

  fmt.Println(c0, c1, c2)
  //Output:
  //0 1 2
}

```

Instead of using the `iota` keyword every time, if you declare it just once, successive values are declared for the remaining variables.

```go
func Example_iota_basic2() {
	const (
		c0 = iota
		c1
		c2
	)

	fmt.Println(c0, c1, c2)
	//Output:
	//0 1 2
}

```



## 2.2 Changing the Starting Value

You can also easily change the starting value.

```go
func Example_iota_change_start_value() {
	const (
		c0 = iota + 5
		c1
		c2
	)

	fmt.Println(c0, c1, c2)
	//Output:
	//5 6 7
}

```



## 2.3 Skipping Intermediate Values

### 2.3.1 How to Skip a Single Value

To skip an intermediate value, use a `blank identifier` to skip it.

```go

func Example_iota_intermediate_value_skipped() {
	const (
		c0 = iota + 1
		_
		c1
		c2
	)

	fmt.Println(c0, c1, c2)
	//Output:
	//1 3 4
}
```

### 2.4.2 How to Skip One or More Values

Let's learn how to skip one or more values and declare constant values, as below.

> 1, 2, 100, 101, 500, 501

#### 2.4.2.1 Calculating the Values to Jump Directly

You can declare the values of the sections to skip by calculating them directly.

```go
func Example_iota_intermediate_value_specified_differently() {
	//calculate manually
	const (
		c0 = iota + 1   //1
		c1              //2
		c2 = iota + 98  //100
		c3              //101
		c4 = iota + 496 //500
		c5              //501
	)

	fmt.Println(c0, c1, c2, c3, c4, c5)
	//Output:
	//1 2 100 101 500 501
}
```

#### 2.4.2.2 Declaring by Splitting into const Groups

Rather than directly calculating the sections to jump, splitting the declaration into multiple groups as below makes it a bit easier to declare.

```go
func Example_iota_intermediate_value_specified_differently2() {
	//calculate manually
	const (
		c0 = iota + 1 //1
		c1            //2
	)
	const (
		c2 = iota + 100 //100
		c3              //101
	)
	const (
		c4 = iota + 500 //500
		c5              //501
	)

	fmt.Println(c0, c1, c2, c3, c4, c5)
	//Output:
	//1 2 100 101 500 501
}

```

# 3. A Collection of Enum Examples

These are examples that can be used in an enum style.

## 3.1 Declaring ByteSize Constant Values

Declare data units as below. If you declare only the KB unit, the remaining units MB, GB... are also easily declared.

```go
func Example_iota_BYTE_example() {
	type ByteSize float64

	const (
		_           = iota             // ignore the first one with a blank identifier
		KB ByteSize = 1 << (10 * iota) //2^(10*1) = 1024
		MB                             //2^(10*2) = 1,048,576
		GB
		TB
		PB
		EB
		ZB
		YB
	)
	var fileSize ByteSize = 4000000000 //4 GB
	fmt.Printf("%.2f GB", fileSize/GB)
	//Output:
	//3.73 GB
}
```



## 3.2 Checking Flag Values or Options with Bitwise Operations

This is an example of applying multiple options or flags through bitwise operations and checking whether they're applied with an AND operation. In this example, we assign multiple roles to a user and check the roles.

```go

func Example_iota_bitwise_role_example() {
	const (
		isAdmin          = 1 << iota //1
		isHeadquarters               //10
		canSeeFinancials             //100

		canSeeAfrica       //1000
		canSeeAsia         //10000
		canSeeEurope       //100000
		canSeeNorthAmerica //1000000
		canSeeSouthAmerica //10000000
	)

	var myRoles byte = isAdmin | canSeeFinancials | canSeeEurope
	fmt.Printf("%b\n", myRoles)
	fmt.Printf("is admin? %v\n", isAdmin & myRoles == isAdmin)
	fmt.Printf("is HQ? %v\n", isHeadquarters & myRoles == isHeadquarters)
	//Output:
	//100101
	//is admin? true
	//is HQ? false
}

```



## 3.3 Iterating Over Declared Enums

When declaring constants, use the last value to iterate.

```go
type WeekDay int

func Example_iterate_weekdays() {
	const (
		Sunday WeekDay = iota
		Monday
		Tuesday
		Wednesday
		Thursday
		Friday
		Saturday
		numberOfDays
	)

	for day := WeekDay(0); day < numberOfDays; day++ {
		fmt.Print(" ", day)
	}
	fmt.Println("")
	//Output:
	//Sunday Monday Tuesday Wednesday Thursday Friday Saturday
}

func (d WeekDay) String() string {
	var weekDays = [...]string{
		"Sunday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
	}

	return weekDays[int(d)%len(weekDays)]
}
```

# 4. Conclusion

We looked at how to declare in an enum style in the Go language. We used the iota keyword to easily declare constant values and saw various examples too. The code written in this post can be found on [github](https://github.com/kenshin579/tutorials-go/tree/master/go-enums-iota).

# 5. References

* https://stackoverflow.com/questions/64178176/how-to-create-an-enum-in-golang-an-iterate-over-it
* https://stackoverflow.com/questions/57053373/how-to-skip-a-lot-of-values-when-define-const-variable-with-iota/57053431#57053431
* https://yourbasic.org/golang/iota/
* https://golang.org/ref/spec#Iota
* [https://www.popit.kr/%EC%A2%8C%EC%B6%A9%EC%9A%B0%EB%8F%8C-%EA%B0%9C%EB%B0%9C%EA%B8%B0-golang-%EC%97%90%EC%84%9C-enum-%EC%9E%90%EB%A3%8C%ED%98%95-%EC%82%AC%EC%9A%A9%ED%9B%84%EA%B8%B0](https://www.popit.kr/좌충우돌-개발기-golang-에서-enum-자료형-사용후기)/
