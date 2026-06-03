---
title: "Finding Max and Min Values Using Java 8 Streams"
description: "How to find max and min values from a List or array using the Java 8 Stream API."
date: 2020-10-25
update: 2020-10-25
tags:
  - java
  - java8
  - stream
  - list
  - max
  - min
  - 스트림
  - 자바
  - 자바8
  - 최대값
  - 최소값
---

# 1. Introduction

Let's look at how to find max and min values from a List or array using the Java 8 Stream API.

# 2. Finding the Max Value Using Streams

## 2.1 Finding the Max Value in a List of Numbers


```java
@Test
public void 숫자_list_max_값_찾기() {
        List<Integer> intList = Arrays.asList(2, 3, 6, 4, 10, 23);
        Integer maxValue = intList.stream()
                .mapToInt(x -> x)
                .max()
                .orElseThrow(NoSuchElementException::new);
//                .orElseThrow(() -> new NoSuchElementException());
        
        assertThat(maxValue).isEqualTo(23);
}
```

- `stream()` : to find the max value in a list of numbers
- `mapToInt()` : converts the Stream into an Int primitive stream
- `max()`
    - it is a method provided by IntStream
    - returns the result as an Optional
- `orElseThrow()`
    - throws a `NoSuchElementException` exception when there is no result

You can also use `max()` provided by Stream without converting to IntStream.


```java
@Test
public void 숫자_list_max_값_찾기2() {
        List<Integer> intList = Arrays.asList(2, 3, 6, 4, 23, 10);
        Integer maxValue = intList.stream()
                .max(Comparator.comparing(x -> x))
                .orElseThrow(NoSuchElementException::new);

        assertThat(maxValue).isEqualTo(23);
}
```

- `max()`
    - takes a Comparator as an argument value.
    - to easily create a Comparator, the `Comparator.comparing()` method was used

## 2.2 Finding the Max Value in an Array of Numbers

```java
@Test
public void 숫자_array_max_값_찾기() {
        int[] intArr = {3, 2, 6, 10, 234};
        Integer maxValue = Arrays.stream(intArr)
                .max()
                .getAsInt();
        assertThat(maxValue).isEqualTo(234);
}
```

- `Arrays.stream()`
    - converts a primitive array into an IntStream stream
- `max()`
    - returns the result as an Optional object
- `getAsInt()`
    - returns an int value.
    - if there is no max value, a `NoSuchElementException` exception can occur



## 2.3 Finding the Object with the Maximum Value of a Specific Field in a List of Objects

In this example, let's look at how to find the maximum value of a specific field in objects. This is an example of finding the oldest student among students.

```java
@Test
public void 객체_list에서_나이가_max_값_찾기() {
        int max = 5;
        List<Student> students = IntStream.range(0, max)
                .mapToObj(i -> new Student("name" + i, i + 10))
                .peek(i -> log.info("{}", i))
                .collect(Collectors.toList());

//        Comparator<Student> comparatorByAge = (x1, x2) -> Integer.compare(x1.getAge(), x2.getAge());
        Comparator<Student> comparatorByAge = Comparator.comparingInt(Student::getAge);

        Student studentWithMaxAge = students.stream()
                .max(comparatorByAge)
                .orElseThrow(NoSuchElementException::new);

        assertThat(studentWithMaxAge.getAge()).isEqualTo(14);
}
```

- Creating a list of Student objects
    - instead of a for loop, IntStream and `mapToObj()` are used to create a List of student objects
- Finding the oldest student among the students
    - to find the maximum age value among the objects, `comparatorByAge` is passed as the argument value to the `max()` method.



## 2.4 Finding the Longest String in a String Array



```java
@Test
public void array_str에서_가장_긴_string의_길이_찾기() {
        String[] lines = {"Hello", "My", "World11"};
        int maxWidth = Arrays.stream(lines).mapToInt(String::length).max().getAsInt();
        assertThat(maxWidth).isEqualTo(7);
}
```

- `mapToInt()`
    - when converting to an IntStream, it converts to the length of the string and finds the max value

# 3. Wrapping Up

In this post, we looked at how to find the maximum value in a List or Array using the `max(), min()` methods of the Java *8* Stream API.

For the example, please refer to the [Github](https://github.com/kenshin579/tutorials-java/blob/master/java8/src/test/java/com/advenoh/streams/MinMaxValueFromListTest.java) source.

# 4. References

- https://stackoverflow.com/questions/52443550/how-to-find-max-length-in-list-of-string-using-streams-in-java
- https://www.baeldung.com/java-collection-min-max
- https://codechacha.com/ko/java8-stream-max-min/
</content>
