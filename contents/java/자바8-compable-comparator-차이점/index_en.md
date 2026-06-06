---
title: "The Difference Between Comparable and Comparator in Java"
description: "The difference between the Comparable and Comparator interfaces used for sorting objects in Java."
date: 2020-04-15
update: 2020-04-15
tags:
  - java
  - java8,
  - comparator
  - comparing
  - sort
  - 자바
  - 자바8
  - 정렬
---

Let's look at the difference between the Comparator and Comparable interfaces used when sorting objects in Java.

For the example code, please refer to the github [java-compare](https://github.com/kenshin579/tutorials-java/tree/master/java-compare) module.

# 1. Comparable vs. Comparator

Both interfaces are used to set the sorting rule when sorting a collection, and the difference is as follows.

- Comparable
    - You must implement the Comparable interface on the object to be sorted and implement the compareTo() method
    - The compareTo() method is a method that returns an int value depending on the difference between the this and o objects, and sorting is performed according to this return value
        - 1 : this > o, when this is greater than o
        - -1 : this < o, when this is less than o
        - 0 : this == o, when the two objects are equal

```java
public interface Comparable<T> {
  public int compareTo(T o);
}
```

- Comparator

    - When you cannot directly modify the object to be sorted, you can sort using the Comparator interface
        - The compare() method is a method that returns an int value depending on the difference between the o1 and o2 objects, and sorting is performed according to this return value
            - 1 : o1 > o2, when the first object is greater
            - -1 : o1 < o2, when the first object is smaller
            - 0 :  o1 == o2, when the two objects are equal

```java
public interface Comparator<T> {
	int compare(T o1, T o2);
}
```

# 2. Objects to Be Sorted

In the case of Comparable, you have to implement the Comparable interface on the object itself, so I created each as a different object to distinguish it from Comparator.

## 2.1 Comparable

```java
@Getter
@Setter
@AllArgsConstructor
public class ComparablePlayer implements Comparable<ComparablePlayer> {
	private String name;
	private int score;

	@Override
	public int compareTo(ComparablePlayer o) {
		return o.getScore() - this.getScore();
	}
}

```


## 2.2 Comparator

```java
@Getter
@Setter
@AllArgsConstructor
public class ComparatorPlayer {
	private String name;
	private int score;

	public static int compareByScoreThenName(ComparatorPlayer lhs, ComparatorPlayer rhs) {
		if (lhs.getScore() == rhs.getScore()) {
			return lhs.getName().compareTo(rhs.getName());
		} else {
			return lhs.getScore() - rhs.getScore();
		}
	}
}

```

# 3. Sorting Objects

## 3.1 Sorting with Collections.sort()

The sort() method of Collections provides two methods. It provides a method that can sort a List of Comparable objects, and a method that can sort by passing a Comparator object as an argument.

```java
public static <T extends Comparable<? super T>> void sort(List<T> list);
public static <T> void sort(List<T> list, Comparator<? super T> c);
```

You can sort a list of Comparable objects and confirm whether it is sorted with the isSorted() method.

```java
@Test
public void comparable_test() {
  Collections.sort(comparablePlayers);
  assertThat(comparablePlayers).isSorted();
}
```

You can also sort a List by passing the sorting rule as a Comparator.

```java
@Test
public void comparator_lambda_Test() {
		Comparator<ComparatorPlayer> comparator = (a, b) -> b.getScore() - a.getScore();

		Collections.sort(comparatorPlayers, comparator);

		assertThat(comparatorPlayers).isSortedAccordingTo(comparator);
}
```


## 3.2 Sorting with Stream's sorted()

In a Stream, you can sort using the sorted() method. The sorted() method takes as an argument an object that implements the comparator interface.

```java
Stream<T> sorted(Comparator<? super T> comparator);
```



This is an example of converting a List to a stream and sorting it using the sorted() method.

```java
@Test
public void stream_comparable_sort() {
		List<ComparablePlayer> sortedPlayers = comparablePlayers.stream()
				.sorted((a, b) -> b.getScore() - a.getScore())
				.collect(Collectors.toList());

		assertThat(sortedPlayers).isSorted();
}
```


When sorting, you can also sort based on multiple values of an object. This is an example of sorting by name when the Score is the same.

```java
public static int compareByScoreThenName(ComparatorPlayer lhs, ComparatorPlayer rhs) {
		if (lhs.getScore() == rhs.getScore()) {
			return lhs.getName().compareTo(rhs.getName());
		} else {
			return lhs.getScore() - rhs.getScore();
		}
}
```

Since the ComparatorPlayer object has the compareByScoreThenName() method, you can write it more concisely with a method reference.

```java
@Test
public void sort_by_score_then_name() {
		List<ComparatorPlayer> sortedPlayers = comparatorPlayers.stream()
				//.sorted((a, b) -> ComparatorPlayer.compareByNameThenScore(a, b))
				.sorted(ComparatorPlayer::compareByScoreThenName)
				.collect(Collectors.toList());

assertThat(sortedPlayers).isSortedAccordingTo(ComparatorPlayer::compareByScoreThenName);
}
```



## 3.3 Java 8 Comparators

In Java 8, the comparing() factory method was added to help you easily define a Comparator. The Comparator.comparing() method returns a matching Comparator instance when you pass the field method of the object to use for comparing the items as an argument. In other words, if you just provide the field method to compare, it returns the Comparator implementation on its own.

```java
public static <T, U extends Comparable<? super U>> Comparator<T> comparing(
            Function<? super T, ? extends U> keyExtractor)
{
  Objects.requireNonNull(keyExtractor);
  return (Comparator<T> & Serializable)
    (c1, c2) -> keyExtractor.apply(c1).compareTo(keyExtractor.apply(c2));
}
```


Just as the sort_by_score_then_name example sorted by comparing the two values score and name, you can sort identically using the comparing() method and the thenComparing() method. The code has become more concise.

```java
@Test
public void thenComparing_test() {
		List<ComparatorPlayer> sortedPlayers = comparatorPlayers.stream()
				.sorted(Comparator.comparing(ComparatorPlayer::getScore)
						.thenComparing(ComparatorPlayer::getName))
				.collect(Collectors.toList());

		assertThat(sortedPlayers).isSortedAccordingTo(ComparatorPlayer::compareByScoreThenName);
}
```


# 4. References

* https://www.baeldung.com/java-8-sort-lambda
* https://www.daleseo.com/java-comparable-comparator/
* https://www.baeldung.com/java-comparator-comparable
* https://gmlwjd9405.github.io/2018/09/06/java-comparable-and-comparator.html
* https://www.leveluplunch.com/java/tutorials/007-sort-arraylist-stream-of-objects-in-java8/
* [https://velog.io/@agugu95/Java-%EA%B0%9D%EC%B2%B4-%EC%A0%95%EB%A0%AC%EA%B3%BC-%EB%B9%84%EA%B5%90](https://velog.io/@agugu95/Java-객체-정렬과-비교)
