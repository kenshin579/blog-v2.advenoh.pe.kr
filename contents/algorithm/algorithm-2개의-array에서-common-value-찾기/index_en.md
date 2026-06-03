---
title: "Finding Common Values in Two Arrays"
description: "Solving the problem of finding common values between two arrays using a hash table for O(n) complexity."
date: 2018-07-29
update: 2018-07-29
tags:
  - array
  - common,
  - 알고리즘
  - 인터뷰
  - 면접
  - 코드면접
  - 배열
  - 공통값
---


# 1. Problem

This is a problem of finding the common values between two arrays and returning the result. The method definition takes two arrays as shown below and returns the result as a Set.

```java
public Set<Integer> solution(int[] A, int[] B) {
}
```



## 1.1 Input / Result

Here are simple input and result examples. The returned result does not include duplicate values.

- [1, 1, 1, 1, 2, 2] & [3, 3, 4, 1, 2] -> [1,2]
- [2, 7, 1, 4, 5, 6, 9, 8, 7] & [4, 6, 8, 2, 3, 5, 3, 1] -> [4, 6, 8, 2, 5, 1]

It's a good idea to write a unit test in advance so you can run it easily while writing the logic.

```java
@Test
public void test_find_common_values() 
    int[] A = {1, 1, 1, 1, 2, 2};
    int[] B = {3, 3, 4, 1, 2};

    Set<Integer> expectedResult = new HashSet<>(Arrays.asList(1, 2));
    Set<Integer> result = new CommonSet().solution(A, B);
    assertEquals(expectedResult, result);
}
```



# 2. Solution

## 2.1 Approach

The easiest way to solve this problem is to check whether each element of the first array exists in the second array, and if it does, add it to the result. However, the complexity of this algorithm becomes O(n2).

Is there a way to solve it in at least O(n)? If you think about it, it's simple. By using the HashTable data structure to make the lookup time O(1), the overall complexity becomes O(n).
The algorithm is as follows.

- Build the second array into a hashtable —> O(n)
- Check whether each element of the first array is in the hashtable, and if it is, add it to the result —> O(n)

```java
public Set<Integer> solution(int[] A, int[] B) {
    Set<Integer> result = new HashSet<>();
    Map<Integer, Boolean> mapB = new HashMap<>();

    for (int x : B) {
        if (!mapB.containsKey(x)) { //Remove duplicate values
            mapB.put(x, true);
        }
    }

    for (int x : A) {
        if (mapB.containsKey(x)) {
            result.add(x);
        }
    }
    return result;
}
```

For the full source code, please refer to [github](https://github.com/kenshin579/tutorials-interview-questions/blob/master/src/main/java/com/google/CommonSet.java).
Thank you.

# 3. Reference

- [https://codereview.stackexchange.com/questions/189504/finding-common-elements-in-two-arrays](https://codereview.stackexchange.com/questions/189504/finding-common-elements-in-two-arrays)
