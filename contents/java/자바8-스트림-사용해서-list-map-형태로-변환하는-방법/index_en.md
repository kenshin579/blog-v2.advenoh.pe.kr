---
title: "How to Convert a List to a Map Using Java 8 Streams"
description: "How to convert a List into a Map using the Stream API introduced in Java 8."
date: 2020-04-20
update: 2020-04-20
tags:
  - java
  - java8
  - stream
  - list
  - map
  - 스트림
  - 자바
  - 자바8
  - 리스트
  - 맵
---


# 1. Introduction

When converting an object `List` into a `Map` form, you fill the `Map` by looping as shown below. Let's look at how to convert a `List` -> Map using the streams introduced in Java 8.

```java
@Test
public void convert_students_to_map_of_nameVsAge_beforeJava8() {
		int max = 3;
		List<Student> students = TestUtil.getStudentSample(max);
		Map<String, Integer> nameVsAgeMap = new HashMap<>();
		Student student;
  
		for (int i = 0; i < students.size(); i++) {
			student = students.get(i);
			nameVsAgeMap.put(student.getName(), student.getAge());
		}
		assertThat(nameVsAgeMap.size()).isEqualTo(max);
}
```

# 2. Converting List -> Map

## 2.1 Converting from List to Map Using Streams in Java 8

collect() converts the elements of a stream into the data type we want. A library called Collectors provides basic methods, and you can use toMap(), which converts into a `Map` form, to convert List -> Map.

In the example, name and age of Student, which become the key and value of the Map, are passed as arguments to `toMap()` to actually create a `Map` data type.

```java
@Test
public void convert_students_to_map_of_nameVsAge() {
		int max = 3;
		List<Student> students = TestUtil.getStudentSample(max);

		Map<String, Integer> nameVsAgeMap = students
				.stream()
				.collect(Collectors.toMap(
						i1 -> i1.getName(),
						i2 -> i2.getAge())
				);

		assertThat(nameVsAgeMap.size()).isEqualTo(max);
		log.info("nameVsAgeMap : {}", nameVsAgeMap);
}
```

You can write the lambda expression more concisely through method references.

```java
@Test
public void convert_students_to_map_of_nameVsAge_method_reference() {
   int max = 3;
   List<Student> students = TestUtil.getStudentSample(max);

   //method reference
   Map<String, Integer> nameVsAgeMap = students
         .stream()
         .collect(Collectors.toMap(
               Student::getName,
               Student::getAge)
         );

   assertThat(nameVsAgeMap.size()).isEqualTo(max);
}
```
This is an example of converting into a `Map` data type in the form of id : Student.

```java
@Test
public void convert_students_to_map_of_idVsStudent() {
		int max = 3;
		List<Student> students = TestUtil.getStudentSample(max);

		Map<Integer, Student> idVsStudentMap = IntStream.range(0, max).boxed()
				.collect(Collectors.toMap(
						i1 -> i1 + 1,
						i2 -> students.get(i2)
				));

		idVsStudentMap.forEach((it, it2) -> log.info("{}", it));

		assertThat(idVsStudentMap.size()).isEqualTo(max);

}
```

## 2.2 When There Is Duplicate Data in the List - An Exception Occurs

In the process of converting List -> Map, if there is a duplicate key in the `Map`, a `java.lang.IllegalStateException: Duplicate key` exception occurs.

```java
@Test
public void 중복키가_존재하는_경우_IllegalStateException_발생() {
		int max = 3;
		List<Student> students = TestUtil.getStudentSample(max);
		students.add(new Student("name1", 30)); //add a duplicate name

		//throw occurs - java.lang.IllegalStateException: Duplicate key
		assertThatThrownBy(() -> students.stream()
				.collect(Collectors.toMap(
						Student::getName,
						Student::getAge)
				)).hasMessage("Duplicate key name1 (attempted merging values 11 and 30)");
}
```

To prepare for cases where duplicates occur as above, you can provide a mergeFunction method as the third argument of `toMap()`. The `MergeFunciton` argument can contain the logic for how to handle duplicates when storing into the `Map`.

> `(oldValue, newValue) -> oldValue` chooses the oldValue value when there is a duplicate

```java
@Test
public void 중복키가_존재하는_경우_3rd_인자에_merge함수로_해결() {
		int max = 3;
		List<Student> students = TestUtil.getStudentSample(max);
		students.add(new Student("name1", 30)); //add a duplicate name

		Map<String, Integer> nameVsAgeMap = students
				.stream()
				.collect(Collectors.toMap(
						Student::getName,
						Student::getAge,
						(oldValue, newValue) -> {
							log.info("oldValue : {} newValue : {}", oldValue, newValue);
							return oldValue;
						})
				);

		assertThat(nameVsAgeMap.size()).isEqualTo(max);

}
```

# 3. Wrapping Up

We looked at how to convert from List -> Map form using Java 8 streams. Compared to the code style before Java 8, code written in the stream form seems to have the advantage of letting you understand the code much faster.

For the full source, please refer to [github](https://github.com/kenshin579/tutorials-java/blob/master/java8/src/test/java/com/advenoh/streams/ConvertListToMapTest.java).

# 4. References

* List -> Map conversion
    * https://mkyong.com/java8/java-8-convert-list-to-map/
    * https://www.baeldung.com/java-list-to-map
    * https://stackoverflow.com/questions/20363719/java-8-listv-into-mapk-v
* Stream
    * https://codechacha.com/ko/java8-stream-collect/
</content>
