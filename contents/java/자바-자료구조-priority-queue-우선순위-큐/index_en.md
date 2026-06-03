---
title: "Java Data Structures - Priority Queue"
description: "How to use Java's PriorityQueue as a min-heap and max-heap data structure."
date: 2020-09-20
update: 2020-09-20
tags:
  - java
  - queue
  - priority
  - priority queue
  - heap
  - 자바
  - 자료구조
  - 우선순위 큐
  - 큐
  - 힙
---

# 1. What Is a Priority Queue?

Among the various data structures Java provides, let's look at the `Priority Queue`. Like the `Queue` data structure we know well, it operates with the `FIFO` (First-In-First-Out) algorithm, but additionally you can think of it as operating with the `BIFO` (Best-In-First-Out) algorithm that has priority. In terms of basic data structures, it's easy to understand it as a Heap (Min, Max) data structure.

The PriorityQueue class is an implementation that implements the Queue interface, and now let's look at how to use it through examples.

![Queue-Deque-PriorityQueue-In-Java](https://media.geeksforgeeks.org/wp-content/cdn-uploads/20200903183026/Queue-Deque-PriorityQueue-In-Java.png)

> The class diagram is excerpted from GeeksforGeeks



## 1.1 Basic Methods and Complexity

This is an explanation of the basic methods provided by the `PriorityQueue` class and their complexity.

| Method name              | Complexity | Description                                      |
| ------------------------ | ---------- | ------------------------------------------------ |
| `boolean add(E element)` | O(N log N) | Inserts into the queue according to priority.    |
| `public peek()`          | O(1)       | Lets you check the first item of the queue without removing it |
| `public poll()`          | O(1)       | Removes the first item of the queue and returns the data   |

For more details on the methods, please refer to the [Oracle Java API](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/PriorityQueue.html).

# 2. How to Use a Priority Queue

# 2.1 Min Heap

If you create a `PriorityQueue` object with no additional arguments, it operates as a Min Heap. As you can see in the example, when you extract data after adding it, the lowest value is returned.

```java
 @Test
 public void test_minHeap() {
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();
        minHeap.add(3);
        minHeap.add(1);
        minHeap.add(10);
        minHeap.add(5);

        assertThat(minHeap.poll()).isEqualTo(1);
        assertThat(minHeap.poll()).isEqualTo(3);
}
```



## 2.2 Max Heap

When creating a `PriorityQueue` object, you can specify the priority for the data by passing a Comparator to the constructor. To make the Max value of Integer be returned when extracting values, specify it with the `reverseOrder()` method provided by default in Collections.

```java
 @Test
 public void test_maxHeap() {
        PriorityQueue<Integer> minHeap = new PriorityQueue<>(Collections.reverseOrder());
        minHeap.add(3);
        minHeap.add(1);
        minHeap.add(10);
        minHeap.add(5);

        assertThat(minHeap.poll()).isEqualTo(10);
        assertThat(minHeap.poll()).isEqualTo(5);
}
```



## 2.3 Min Heap - Student Object

Besides basic Integer values, you can also set a specific value in an object to have priority. In the example, it is set so that the lowest Age value of the Student object is extracted first. To pass a Comparator as an argument, the `Comparator.comparing()` method was used. The `comparing()` method returns a Comparator method function based on the field value passed as an argument, making it easy to create a Comparator.

```java
@Test
public void test_student_age() {
        int capacity = 4;
        PriorityQueue<Student> studentAgeHeap = new PriorityQueue<>(capacity, Comparator.comparing((Student student) -> student.getAge()));

        studentAgeHeap.add(new Student("Frank", 23));
        studentAgeHeap.add(new Student("Angela", 10));
        studentAgeHeap.add(new Student("David", 30));
        studentAgeHeap.add(new Student("Joe", 15));

        assertThat(studentAgeHeap.poll().getName()).isEqualTo("Angela");
        assertThat(studentAgeHeap.poll().getName()).isEqualTo("Joe");

}
```

# 3. Wrapping Up

`PriorityQueue` is a Queue data structure that has priority. If you use `PriorityQueue` during development, you can easily use it as a Min+Max Heap data structure.

For the example code, please refer to [github](https://github.com/kenshin579/tutorials-java/blob/master/java8/src/test/java/com/advenoh/structure/PriorityQueueTest.java).

# 4. References

- Priority Queue
    - http://asuraiv.blogspot.com/2015/11/java-priorityqueue.html
    - https://coding-factory.tistory.com/603
    - https://woovictory.github.io/2020/05/13/PriorityQueue/
    - https://lottogame.tistory.com/996
    - https://www.webucator.com/how-to/how-use-the-comparatorcomparing-method-java-8.cfm
    - https://medium.com/@logishudson0218/java-collection-framework-896a6496b14a
- Heap
    - https://ko.wikipedia.org/wiki/%ED%9E%99_(%EC%9E%90%EB%A3%8C_%EA%B5%AC%EC%A1%B0)
- Comparator.comparing
    - https://www.webucator.com/how-to/how-use-the-comparatorcomparing-method-java-8.cfm
