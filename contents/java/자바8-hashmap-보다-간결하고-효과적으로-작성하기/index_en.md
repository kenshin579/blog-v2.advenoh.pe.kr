---
title: "Writing HashMap More Concisely and Effectively in Java 8"
description: "How to use HashMap more concisely and effectively with the methods added in Java 8."
date: 2020-02-30
update: 2020-02-30
tags:
  - java
  - java8
  - map
  - hashmap
  - compute
  - 자바
  - 자바8
  - 맵
  - putIfAbsent
  - computeIfPresent
  - compute
  - putIfAbsent
---

From Java 8, several methods were added to `HashMap`, so let's look at how to use `HashMap` a bit more concisely and efficiently using these methods.

- `putIfAbsent()`
- `computeIfAbsent()`
- `compute()`
- `computeIfPresent()`
- `merge()`
- `getOrDefault()`

For the written code, please refer to [java8-hashmap](https://github.com/kenshin579/tutorials-java/tree/master/java8-hashmap).

# 1. putIfAbsent() vs. computeIfAbsent()

What the two methods have in common is that they add a new key and value depending on whether the key exists.

## 1.1 putIfAbsent

putIfAbsent takes two arguments.

```java
default V putIfAbsent(K key, V value) 
```

- key : the key value of the Map
- value :  the value
- Return value
    - When the key value exists
        - Returns the Map's value
    - When the key value does not exist
        - Stores the key and value in the Map and returns null


```java
@Test
public void putIfAbsent() {
  Map<String, Integer> map = new HashMap<>();
  map.put("John", 5);

  assertThat(map.putIfAbsent("John", 10)).isEqualTo(5); //if it exists, returns the value
  assertThat(map.size()).isEqualTo(1);

  assertThat(map.putIfAbsent("John2", 10)).isNull(); //if it doesn't exist, returns null and stores in the map
  assertThat(map.size()).isEqualTo(2);
}
```

## 1.2 computeIfAbsent

`computeIfAbsent` takes two arguments.

```java
default V computeIfAbsent(K key, Function<? super K, ? extends V> mappingFunction)
```
- key : the key value of the Map
- mappingFunction
    - The `mappingFunction` lambda runs only when the key value does not exist
- Return value
    - When the key value exists
        - Returns the value in the map
    - When the key value does not exist
        - Stores a new key and value (the result of running the `mappingFunction` lambda) in the Map


```java
@Test
public void computeIfAbsent() {
  Map<String, Integer> map = new HashMap<>();
  map.put("John", 5);

  assertThat(map.computeIfAbsent("John", key -> key.length())).isEqualTo(5); //if it exists, returns the value
  assertThat(map.size()).isEqualTo(1);

  //if it doesn't exist, returns the result of running the second argument function and it's also added to the map
  assertThat(map.computeIfAbsent("John2", key -> key.length())).isEqualTo("John2".length());
  assertThat(map.get("John2")).isNotNull();
  assertThat(map.size()).isEqualTo(2);

  assertThat(map.computeIfAbsent("John3", key -> null)).isNull();
  assertThat(map.size()).isEqualTo(2);
}

```


# 2. compute() vs. computeIfPresent() vs merge()

All three methods are used when updating the value of a Map.

## 2.1 compute

`compute` takes the key and `remappingFunction` as arguments, and the key must exist for the value to be updated with the result of the `remappingFunction` lambda passed as an argument. When the key value does not exist, a `NullPointerException` occurs.

```java
default V compute(K key,
        BiFunction<? super K, ? super V, ? extends V> remappingFunction)
```


```java
@Test
public void compute() {
    Map<String, Integer> map = new HashMap<>();
    map.put("john", 20);
    map.put("paul", 30);
    map.put("peter", 40);

    map.compute("peter", (k, v) -> v + 50);
    assertThat(map.get("peter")).isEqualTo(40 + 50);
}
```

## 2.2 computeIfPresent

```java
default V compute(K key,
                  BiFunction<? super K, ? super V, ? extends V> remappingFunction)
```

Result value

- When the key value exists
    - The value is updated with the result of running the `remappingFunction` lambda
- When the key does not exist
    - Returns null

```java
@Test
public void computeIfPresent() {
  Map<String, Integer> map = new HashMap<>();
  map.put("john", 20);
  map.put("paul", 30);
  map.put("peter", 40);

  map.computeIfPresent("kelly", (k, v) -> v + 10);
  assertThat(map.get("kelly")).isNull();

  map.computeIfPresent("peter", (k, v) -> v + 10);
  assertThat(map.get("peter")).isEqualTo(40 + 10);
}
```

## 2.3 merge


```java
default V merge(K key, V value,
                BiFunction<? super V, ? super V, ? extends V> remappingFunction)
```

Result value

- When the key value exists

    - Case 1 : if the result of the `remappingFunction` lambda is not null
        - The value is updated with the result of running the `remappingFunction` lambda
    - Case 2 : if the result of the `remappingFunction` lambda is null
        - Deletes that key from the map

- When the key does not exist

    - The key and value are added to the Map



```java
@Test
public void merge() {
  Map<String, Integer> map = new HashMap<>();
  map.put("john", 20);
  map.put("paul", 30);
  map.put("peter", 40);

  //if the key exists, replaces that key's value with the result of the remapping function
  map.merge("peter", 50, (k, v) -> map.get("john") + 10);
  assertThat(map.get("peter")).isEqualTo(30);

  //if the key exists and the result of the remapping function is null, deletes that key from the map
  map.merge("peter", 30, (k, v) -> map.get("nancy"));
  assertThat(map.get("peter")).isNull();
  assertThat(map.size()).isEqualTo(3);

  //if the key doesn't exist, adds the key and value
  map.merge("kelly", 50, (k, v) -> map.get("john") + 10);
  assertThat(map.get("kelly")).isEqualTo(50);
  assertThat(map.size()).isEqualTo(4);

}
```

# 3. getOrDefault()

The value that `getOrDefault` returns is as follows.

```java
default V getOrDefault(Object key, V defaultValue)
```

- When the key value exists
    - Returns the Map's value
- When the key value does not exist
    - Returns the `defaultValue`

```java
 @Test
public void getOrDefault() {
  String str = "aagbssdf";
  Map<Character, Integer> map1 = new HashMap<>();
  Map<Character, Integer> map2 = new HashMap<>();

  //when not using getOrDefault
  for (char c : str.toCharArray()) {
    if (map2.containsKey(c)) {
      map2.put(c, map2.get(c) + 1);
    } else {
      map2.put(c, 1);
    }
  }

  //when using getOrDefault
  for (char c : str.toCharArray()) {
    map1.put(c, map1.getOrDefault(c, 0) + 1);
  }

  assertThat(map1).isEqualTo(map2);
}
```

# 4. References

* http://tech.javacafe.io/2018/12/03/HashMap/
* https://www.baeldung.com/java-hashmap
* https://docs.oracle.com/javase/8/docs/api/java/util/Map.html
