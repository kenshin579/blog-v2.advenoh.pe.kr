---
title: "Getting Comfortable with Lambda Functions in Python"
description: "An introduction to Python lambda expressions and how they are used with map, filter, and reduce."
date: 2020-08-30
update: 2020-08-30
tags:
  - python
  - lambda
  - anonymous
  - function
  - 파이선
  - 람다
  - 이름없는함수
  - 익명함수
---


# 1. What Is a Lambda?

Python also supports lambda expressions, which are anonymous functions. The syntax is as follows. Since Python does not support brackets (e.g., { }), a lambda must be written on a single line. To write multiple lines in a lambda, you need to factor it out into a separate function.

```python
lambda arguments : expression
```

## 1.1 Creating and Calling Functions with Lambda Expressions

Let's create and call a lambda function. A lambda can be stored in a variable. Calling it is the same as a regular function.

```python
def test_lambda_single_parameter1(self):
  plus_ten_lambda = lambda x: x + 10
  result = plus_ten_lambda(1)
  self.assertEqual(result, 11)
```

You can also define a lambda function without storing it in a variable and call it immediately by passing arguments.

```python
def test_lambda_single_parameter2(self):
  result = (lambda x: x + 10)(1)
  self.assertEqual(result, 11)
```

This is an example of a lambda function that takes two or more arguments.

```python
def test_lambda_multiple_parameters(self):
	result = (lambda x, y: x + y)(1, 2)
	self.assertEqual(result, 3)
```


## 1.2. Map, Filter, Reduce Examples

Let's look at the representative functions in Python that take a lambda as an argument.

## 1.2.1 map

The `map` function applies the `input function` to each `item` of the `input list`, and it is a function frequently used when transforming the data format of a list. The syntax is as follows.

```python
map(input_function, input_list)
```

This is an example that adds +1 to each `item` of a list of values 0 ~ 4.

```python
def test_map(self):
  result = list(map(lambda x: x + 1, range(5)))
  self.assertEqual(result, [1, 2, 3, 4, 5])
```



## 1.2.2 filter

The `filter` function also applies the input function to each `item` of the input list and, as a result, processes only the `item`s that return true.

``` python
filter(input_function, input_list)
```

This is an example that returns data from the list where the value is greater than 5.

```python
def test_filter(self):
  result = list(filter(lambda x: x > 5, range(10)))
  self.assertEqual(result, [6, 7, 8, 9])

```

## 1.2.3 reduce

The `reduce` function takes the first and second `item`s of the list as arguments, returns a single value, and ultimately returns a single value.

```python
reduce(input_function, input_list)
```

This is an example that computes the final sum using the reduce function.

```python
from functions import reduce

def test_reduce(self):
  result = reduce(lambda x, y: x + y, [1, 2, 3])
  self.assertEqual(result, 6)
```

# 2. Summary

We've looked at the lambda expressions Python supports. A lambda function is an anonymous function with the advantage of being able to write it simply without defining a separate function. For this reason, lambda functions are frequently passed as arguments.

# 3. References

* https://wikidocs.net/64
* https://dojang.io/mod/page/view.php?id=2359
* https://book.pythontips.com/en/latest/map_filter.html
