---
title: "Algorithm: Counting Set Bits in an Integer"
description: "How to count the number of bits set to 1 in an integer value."
date: 2018-10-28
update: 2018-10-28
tags:
  - 알고리즘
  - 인터뷰
  - 면접
  - 코드면접
  - 비트
  - 카운트
---

# 1. Problem

This is the problem of counting the bits that are set to 1 in an integer value.

## 1.1 Input / Output

- 7 : 111 —> 3
- 23 : 10111 —> 4
- 13 : 1101 —> 3

# 2. Solution

## 2.1 Approach 1

I remember that during my computer science classes, courses dealing with assembly were always required. It was a very long time ago, but I think I naturally learned bitwise operations while doing assignments in assembly.
Now that I'm trying to solve the problem again, honestly I don't remember it. Still, there are many problems that can be solved easily just by knowing AND and OR.

To check whether there is a 1 in a binary number, you can easily count by performing an AND operation with 1 on the last bit while counting the bits.

```java
public static int countBits1(int n) {
    int count = 0;
    while (n > 0) {
        count += n & 1; //if the last bit is 1, count it (check with AND)
        n >>= 1; //remove the last bit
    }
    return count;
}
```

This algorithm repeats until the integer value becomes 0, so its complexity is O(n). Isn't there a faster way than this?
The algorithm devised by Professor Brian Kernighan can count bits in O(log n).

## 2.2 Approach 2 - Brian Kernighan's Algorithm

![Brian Kernighan](image_1.jpeg)

Some of you may be hearing about him for the first time, but Brian Kernighan ( [Brian Kernighan](https://en.wikipedia.org/wiki/Brian_Kernighan) ) is someone who developed early UNIX and also developed the AWK command frequently used in Unix. Since 2000, he has been working continuously as a professor at Princeton University. The implementation is simple, but the fact that he came up with this is truly amazing. Let's look at the basic algorithm.

- Repeat N = N AND (N-1) until the integer value becomes 0
- Counting the number of repetitions gives you the number of bits set to 1

```java
public static int countBits2(int number) {
    int count = 0;
    while (number > 0) {
        number &= number - 1;
        count++;
    }
    return count;
}
```

The algorithm is simple, so let's go through the steps to see how this result is obtained.

```
Algorithm example
N = 23 (10111)
AND 22 (10110) —> 22 (10110)
COUNT = 1

N = 22 (10110)
AND 21 (10101) —> 20 (10100)
COUNT = 2

N = 20 (10100)
AND 19 (10011) —> 16 (10000)
COUNT = 3

N = 16 (10000)
AND 15 (01111) —> 0 (00000)
COUNT = 4
```

Besides this method, there are many other algorithms (reference: [Bit Twiddling Hacks](https://graphics.stanford.edu/~seander/bithacks.html) ). It seems like someone really studied and researched this hard.

# 3. Reference

- [https://www.geeksforgeeks.org/count-set-bits-in-an-integer/](https://www.geeksforgeeks.org/count-set-bits-in-an-integer/)
- [https://www.quora.com/How-do-you-count-the-number-of-1-bits-in-a-number-using-only-bitwise-operations](https://www.quora.com/How-do-you-count-the-number-of-1-bits-in-a-number-using-only-bitwise-operations)
- Bit Twiddling Hacks
    - [https://graphics.stanford.edu/~seander/bithacks.html](https://graphics.stanford.edu/~seander/bithacks.html)
