---
title: "Polymorphism in Go (Polymorphism)"
description: "How to implement polymorphism in Go using interfaces and duck typing, illustrated with a Dog/Cat Animal example."
date: 2021-06-06
update: 2021-06-06
tags:
  - golang
  - duck
  - typing
  - duck type
  - polymorphism
  - 다형성
  - 고랭
  - 덕타입
  - 고언어
---

# 1. Polymorphism

Polymorphism is one of the characteristics you must know in the object-oriented paradigm. The basic concept is that, when an object's method is called, that object's method can have various implementations. When explaining polymorphism, shapes or animals are often used as examples. In this post, we explain it using animals.


# 2. How to Implement Polymorphism in Go

In Go, you can implement polymorphism with interfaces. Using Go's interfaces, it's easier to implement than in other languages. Let's learn through an example.

`Dog` and `Cat` can make a sound, but each makes a different sound. The common functionality is defined as the `Animal` interface.

```go
type Animal interface {
	makeSound() string
}

type Dog struct {
	name string
	legs int
}

type Cat struct {
	name string
	legs int
}
```

In Java, you have to specify the interface you intend to implement using a keyword like `implements`, but in Go, if you just implement the interface methods for each data type, it's recognized without explicitly declaring it.

> Go supports `duck typing`. Duck typing is not a way of distinguishing types by class inheritance or explicit interface implementation; rather, if an object has the methods that fit a certain type, it's regarded as that type.
>
> "If it looks like a duck, swims like a duck, and quacks like a duck, then I call it a duck."
>
> It means that if something behaves like a duck, it's regarded as a duck.

```go

func (d *Dog) makeSound() string {
	return d.name + " says Woof!"
}
func (c *Cat) makeSound() string {
	return c.name + " says Meow!"
}
```

Implement the `makeSound()` method for the `Dog` and `Cat` structs.

```go

func NewDog(name string) Animal {
	return &Dog{
		legs: 4,
		name: name,
	}
}

func NewCat(name string) Animal {
	return &Cat{
		legs: 4,
		name: name,
	}
}

func Example_Polymorphism_Interface_Usage() {
	var dog, cat Animal

	dog = NewDog("Choco")
	cat = NewCat("Lucy")

	fmt.Println(dog.makeSound())
	fmt.Println(cat.makeSound())

	//Output:
	//Choco says Woof!
	//Lucy says Meow!
}


```

Let's run it in a unit test. We create the `Dog` and `Cat` data types with separate constructors. When you call the interface method, you can see that it behaves differently according to each different struct.

For the code written in this post, please refer to [github](https://github.com/kenshin579/tutorials-go/tree/master/go-design-pattern/polymorphism).

# 3. References

- https://www.sohamkamani.com/golang/2019-03-29-polymorphism-without-interfaces/
- https://golangbot.com/polymorphism/
- https://www.geeksforgeeks.org/polymorphism-in-golang/
- https://golangbyexample.com/runtime-polymorphism-go/
- https://www.popit.kr/golang%EC%9C%BC%EB%A1%9C-%EB%A7%8C%EB%82%98%EB%B3%B4%EB%8A%94-duck-typing/
- https://ko.wikipedia.org/wiki/%EB%8D%95_%ED%83%80%EC%9D%B4%ED%95%91
