---
title: "How to Sort Collections in Go (Go Sort)"
description: "Four ways to sort collections in Go: primitive types, a custom comparator, the sort interface, and sorting a map by key or value."
date: 2021-05-09
update: 2021-05-09
tags:
  - golang
  - comparator
  - sort
  - 고랭
  - 정렬
---

# 1. Introduction

Let's learn how to sort various collection types in Go.

- Sorting primitive data types
- Sorting with a custom comparator
- Sorting with the sort interface
- Sorting a map by a specific key/value

# 2. Four Ways to Sort

## 2.1 Sorting Primitive Data Types

For primitive data types, the following functions are provided.

- `sort.Ints`
- `sort.Float64`
- `sort.Strings`

```go
func Example_Sort_Int_Primitive_Type() {
	list := []int{4, 2, 3, 1}
	sort.Ints(list)
	fmt.Println(list)

	//Output:
	// [1 2 3 4]
}

func Example_Sort_String_Primitive_Type() {
	list := []string{"d", "f", "a", "y", "e"}
	sort.Strings(list)
	fmt.Println(list)

	//Output:
	// [a d e f y]
}
```



## 2.2 Sorting a Struct

You can define a custom `Comparator` function to sort by a struct's field value. Below is an example of sorting `Employee` by youngest age first.

```go

func Example_Sort_Struct_With_Custom_Comparator() {
	employee := []struct {
		Name string
		Age  int
	}{
		{"Alice", 23},
		{"David", 2},
		{"Eve", 2},
		{"Bob", 25},
	}

	// Sort by age, keeping original order or equal elements.
	sort.SliceStable(employee, func(i, j int) bool {
		return employee[i].Age < employee[j].Age
	})
	fmt.Println(employee)

	//Output:
	//[{David 2} {Eve 2} {Alice 23} {Bob 25}]
}
```



## 2.3 Sorting a Struct with the Sort Interface

You can also sort a struct with the sort interface. The `sort.Sort()` method takes the `sort.Interface` sort interface as an argument. If you implement the following 3 methods of the sort interface — `Len(), Less(), Swap()` — you can sort that struct.

```go
func Sort(data Interface) {
	n := data.Len()
	quickSort(data, 0, n, maxDepth(n))
}

type Interface interface {
	// Len is the number of elements in the collection.
	Len() int
	// Less reports whether the element with
	// index i should sort before the element with index j.
	Less(i, j int) bool
	// Swap swaps the elements with indexes i and j.
	Swap(i, j int)
}
```

First, to sort by `Age`, define the `ByAge type`. Then implement the 3 methods above for the defined type.

```go
type Employee struct {
	Name string
	Age  int
}

// ByAge implements sort.Interface based on the Age field.
type ByAge []Employee

func (a ByAge) Len() int {
	return len(a)
}

func (a ByAge) Less(i, j int) bool {
	return a[i].Age < a[j].Age
}

func (a ByAge) Swap(i, j int) {
	a[i], a[j] = a[j], a[i]
}

```

Convert the `family` array of structs to the `model.ByAge` type for the `sort.Sort()` method argument and sort it.

```go

func Example_Sort_Any_Collection_By_Implementing_Sort_Interface() {
	family := []model.Employee{
		{"Alice", 23},
		{"Eve", 2},
		{"Bob", 25},
	}
	sort.Sort(model.ByAge(family))
	fmt.Println(family)
	//Output:
	//[{Eve 2} {Alice 23} {Bob 25}]
}
```



## 2.4 Sorting a Map by a Specific Key or Value

Finally, let's learn how to sort map data by a specific key or value. In the example below, you first sort only the key values from the map, then fetch from the map using the sorted keys, which lets you sort by a specific key value.

```go

func Example_Sort_Map_By_Key_or_Value() {
	m := map[string]int{
		"Alice": 2,
		"Cecil": 1,
		"Bob":   3,
	}

	sortKeys := make([]string, 0, len(m))

	for k := range m {
		fmt.Println("k", k)
		sortKeys = append(sortKeys, k)
	}
	sort.Strings(sortKeys) //sort by keys

	//print data using the sorted keys
	for _, k := range sortKeys {
		fmt.Println(k, m[k])
	}

	//Output:
	//Alice 2
	//Bob 3
	//Cecil 1
}
```



# 3. Conclusion

We sorted arrays of various data types in many ways. The code written here can be found on [github](https://github.com/kenshin579/tutorials-go/tree/master/go-data-structure/sort).

# 4. References

- https://yourbasic.org/golang/how-to-sort-in-go/
- https://mingrammer.com/gobyexample/sorting-by-functions/
- https://mingrammer.com/gobyexample/sorting/
- http://pyrasis.com/book/GoForTheReallyImpatient/Unit54/01
