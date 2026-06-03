---
title: "Getter and Setter Methods in Go (Getter, Setter in Go)"
description: "How to write getter and setter methods in Go for encapsulation, including the Go convention of not prefixing getters with Get."
date: 2021-01-14
update: 2021-01-14
tags:
  - go
  - golang
  - setter
  - getter
  - encapsulation
  - 고
  - 고랭
  - 캡슐화
  - 게터
  - 세터
---

Encapsulation prevents internal attribute values from being accessed directly from the outside and protects internal values by allowing access only through exposed methods (e.g. getter, setter). In other words, it hides the internal implementation and stores only valid values through data checking.

Let's write how to create getter and setter methods in Go using the `Person` struct below.

> `name, age` are lowercase, so they cannot be accessed from the outside

```go
type Person struct {
	name string
	age  int
}
```

# Setter

- A `Setter` can be created as `SetFoo()`
    - To call the method from the outside, the first letter of the method is uppercase
- In a `Setter`, the receiver argument needs to be a `Pointer receiver`
    - This is because it must return the changed value after the method executes
- In a `Setter`, you can add data validation logic to check validity

```go
func (p *Person) SetName(name string) error {
	if name == "" {
		return errors.New("invalid name")
	}
	p.name = name
	return nil
}
```

The `SetName` setter method takes name as an argument and stores the value in the name field of the `Person` struct. If `name` is empty, it returns an `Error`.

# Getter

- A `Getter` is named with just the variable name, without prefixing it with Get
    - e.g. `GetName()` - X
    - e.g. `Name()` - O
    - Even if you write the code with `GetName()`, it works fine, but by Go convention, `get` is not used

```go
func (p Person) Name() string {
	return p.name
}
```


> A `Getter` returns only a value, so it doesn't need a pointer receiver argument. However, for consistency, it's good to declare it with a pointer receiver.

```go
func (p *Person) Name() string {
   return p.name
}
```


The code written in this post can be found on [github](https://github.com/kenshin579/tutorials-go/tree/master/go-getter-setter).

# References

- https://www.socketloop.com/tutorials/golang-implement-getters-and-setters
- https://johngrib.github.io/wiki/golang-cheatsheet/
- https://golang.org/doc/effective_go.html?#Getters
