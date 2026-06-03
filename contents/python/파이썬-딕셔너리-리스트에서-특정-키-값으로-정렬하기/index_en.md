---
title: "Sorting a List of Dictionaries by a Specific Key in Python"
description: "How to sort a list of dictionaries by a specific key value in Python using lambda and itemgetter."
date: 2020-09-03
update: 2020-09-03
tags:
  - python
  - sort
  - key
  - dict
  - 파이썬
  - 정렬
  - 키
  - 딕셔너리
  - 리스트
---

# 1. Introduction

Let's look at how to sort a list of dictionaries in Python by a specific key value (e.g., age).

```python
student_list = [
  {'name': 'Homer', 'age': 39},
  {'name': 'Homer1', 'age': 20},
  {'name': 'Homer2', 'age': 5},
  {'name': 'Bart', 'age': 10}
]
```

For sorting lists, Python provides the `list.sort()` and `sorted()` functions by default.

- `list.sort()`
    - sorts in place by modifying the list directly
    - can only be used on the list data structure

```python
def test_simple_sort(self):
  a_list = [3, 2, 1, 7]
  a_list.sort()
  self.assertEqual(a_list, [1, 2, 3, 7])
```

- sorted()
    - this function returns a new sorted list
    - can also be used on iterable data structures

```python
def test_simple_sorted(self):
  a_list = [3, 2, 1, 7]
  new_list = sorted(a_list)
  self.assertEqual(new_list, [1, 2, 3, 7])
```



# 2. Sorting a List of Dictionaries by a Specific Key

You can specify a `key` function as an argument to the `list.sort()` and `sorted()` functions. The return value of this `key` function is compared to perform the sort.

## 2.1 Using a Lambda as the Key Function

Specify a [lambda function](https://blog.advenoh.pe.kr/파이썬에서-람다-함수-익숙해지기/) that returns the age value from the dictionary as the `key` function to sort by age.

```python
def sort_list_by_age_using_lambda(student_list):
    return sorted(student_list, key=lambda k: k['age'])
```

When you check the sorted result, you can confirm that it is sorted correctly by age.

```python
def test_sort_list_by_age_using_lambda(self):
  result = sort.sort_list_by_age_using_lambda(self.student_list)
  for i in range(len(result) - 1):
    print(i, result[i].get('age'))
    self.assertLess(result[i].get('age'), result[i + 1].get('age'))
```



## 2.2 Using itemgetter as the Key Function

The `operator` module provides several functions to easily access keys or attribute values in data structures. You can specify the `key` function using the `itemgetter()` method from the `operator` module.

```python
from _operator import itemgetter

def sort_list_by_age_using_itemgetter(student_list):
  return sorted(student_list, key=itemgetter('age'))
```

It is sorted by age in the same way.

```python
def test_sort_list_by_age_using_itemgetter(self):
  result = sort.sort_list_by_age_using_itemgetter(self.student_list)
  for i in range(len(result) - 1):
    print(i, result[i].get('age'))
    self.assertLess(result[i].get('age'), result[i + 1].get('age'))
```



## 2.3 Sorting by Multiple Keys

You can also sort by multiple key values (e.g., age -> name). Let's sort by name when ages are the same in the dictionary.

When using a lambda function and the `itemgetter()` function, you can specify it as follows.

```python
def sort_list_by_two_keys_using_lambda(student_list):
  return sorted(student_list, key=lambda k: (k['age'], k['name']))
```



```python
def sort_list_by_two_keys_using_itemgetter(student_list):
  return sorted(student_list, key=itemgetter('age', 'name'))
```

It sorts by age, and for entries with the same age, it sorts by name.

```python
def test_sort_list_by_two_keys_using_itemgetter(self):
  student_list = [
    {'name': 'Homer', 'age': 39},
    {'name': 'Homer2', 'age': 5},
    {'name': 'Homer3', 'age': 5},
    {'name': 'Bart', 'age': 10},
  ]
  result = sort.sort_list_by_two_keys_using_itemgetter(student_list)
  for i in range(len(result) - 1):
    if result[i].get('age') == result[i + 1].get('age'):
      self.assertLess(result[i].get('name'), result[i + 1].get('name'))
     else:
       self.assertLess(result[i].get('age'), result[i + 1].get('age'))
```

# 3. Summary

Since you can specify a `key` function in the `sorted()` function, you can easily sort by various key values. In addition to a single key, you can sort by multiple key values.

# 4. References

- https://stackoverflow.com/questions/72899/how-do-i-sort-a-list-of-dictionaries-by-a-value-of-the-dictionary
- https://www.geeksforgeeks.org/ways-sort-list-dictionaries-values-python-using-lambda-function/
- https://www.geeksforgeeks.org/ways-sort-list-dictionaries-values-python-using-itemgetter/
- https://wayhome25.github.io/python/2017/03/07/key-function/
