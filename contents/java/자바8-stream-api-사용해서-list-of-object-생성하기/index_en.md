---
title: "Creating a List of Objects with the Java 8 Stream API"
description: "How to replace a for loop with the Java 8 Stream API to create a list of objects."
date: 2020-06-29
update: 2020-06-29
tags:
  - java
  - java8
  - stream
  - object
  - lambda
  - 람다
  - 자바
  - 스트림
  - 객체
---

To get a little more familiar with the Stream API introduced in Java 8, let's convert coding that we frequently did with loops into the Stream API.

# 1. Creating a List of Objects Using a Loop - Before Java 8

In versions before Java 8, you write it using a for loop as shown below.

```java
@Test
public void generate_list_of_obj_before_Java8() {
		List<Student> students = new ArrayList<>();
		for (int i = 0; i < MAX; i++) {
			students.add(new Student("name" + i, i + 10));
		}
		assertThat(students.size()).isEqualTo(MAX);

}
```

# 2. Creating a List of Objects Using the Stream API - After Java 8

You can replace the for loop using `IntStream.range()`. And `mapToObj()` converts a primitive stream into an object stream. Here, it creates and returns Student objects and finally produces them as a List.

```java
@Test
public void convert_intstream_list_of_obj() {
		List<Student> students = IntStream.range(0, MAX)
				.mapToObj(i -> new Student("name" + i, i + 10))
				.collect(Collectors.toList());

		assertThat(students.size()).isEqualTo(MAX);
}
```

# Summary

We looked together at a simple example of using the Stream API in place of a for loop. In the next post, let's look at how to code in various stream ways.

# References

* http://jtuts.com/2017/04/21/create-list-range-integers-using-java-8/
* https://stackoverflow.com/questions/22649978/java-8-lambda-can-i-generate-a-new-arraylist-of-objects-from-an-intstream
</content>
