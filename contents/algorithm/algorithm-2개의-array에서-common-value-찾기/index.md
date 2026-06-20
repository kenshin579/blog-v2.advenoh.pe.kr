---
title: "Algorithm 2개의 array에서 common value 찾기"
description: "2개의 정수 배열에서 중복 없이 공통으로 등장하는 값을 HashTable로 O(n)에 찾는 방법을 정리한다."
date: 2018-07-29
update: 2018-07-29
tags:
  - array
  - common
  - 알고리즘
  - 인터뷰
  - 면접
  - 코드면접
  - 배열
  - 공통값
---


# 1. Problem

2개의 array에서 common value값을 찾아 결과를 반환하는 문제이다. 메서드 정의는 아래와 같이 2개의 array를 받고 결과를 Set으로 반환한다.

```java
public Set<Integer> solution(int[] A, int[] B) {
}
```



## 1.1 입력 / 결과

간단한 입력과 결과 예제이다. 반환 결과에서는 중복된 값은 포함되지 않는다.

- [1, 1, 1, 1, 2, 2] & [3, 3, 4, 1, 2] -> [1,2]
- [2, 7, 1, 4, 5, 6, 9, 8, 7] & [4, 6, 8, 2, 3, 5, 3, 1] -> [4, 6, 8, 2, 5, 1]

unit test를 미리 작성해서 쉽게 실행하면서 로직을 짜는게 좋겠죠.

```java
@Test
public void test_find_common_values() {
    int[] A = {1, 1, 1, 1, 2, 2};
    int[] B = {3, 3, 4, 1, 2};

    Set<Integer> expectedResult = new HashSet<>(Arrays.asList(1, 2));
    Set<Integer> result = new CommonSet().solution(A, B);
    assertEquals(expectedResult, result);
}
```



# 2. Solution

## 2.1 Approach

이 문제를 가장 쉽게 푸는 방법은 첫번째 Array의 각 요소가 두번째 Array에 존재 하는지 확인하고 있으면 결과에 추가하면 되는 문제이다. 하지만, 이런 알고리즘의 복잡도는 O(n2)가 된다.

최소 O(n)으로 풀수 있는 방법은 없을 까요? 생각해보면 쉽다. HashTable 데이터 구조를 이용해서 Lookup 타임을 O(1)으로 하면, 전체 복잡도는 O(n)이 된다.
알고리즘은 다음과 같다.

- 두번째 array를 hashtable로 만든다 —> O(n)
- 첫번째 array의 요소가 hashtable에 있는지 확인하고 있으면 결과값에 넣는다 —> O(n)

```java
public Set<Integer> solution(int[] A, int[] B) {
    Set<Integer> result = new HashSet<>();
    Map<Integer, Boolean> mapB = new HashMap<>();

    for (int x : B) {
        if (!mapB.containsKey(x)) { //중복되는 값은 제거
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

전체 소스코드는 [github](https://github.com/kenshin579/tutorials-interview-questions/blob/master/src/main/java/com/google/CommonSet.java) 를 참조해주세요.
감사한다.

# 3. Reference

- [https://codereview.stackexchange.com/questions/189504/finding-common-elements-in-two-arrays](https://codereview.stackexchange.com/questions/189504/finding-common-elements-in-two-arrays)
