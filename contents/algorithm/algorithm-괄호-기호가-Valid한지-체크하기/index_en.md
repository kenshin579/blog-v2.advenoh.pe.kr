---
title: "Checking Whether Parentheses Symbols Are Valid"
description: "How to check whether parentheses symbols are properly matched and valid."
date: 2018-07-29
update: 2018-07-29
tags:
  - 알고리즘
  - 인터뷰
  - 면접
  - 코드면접
  - 괄호
---

# 1. Problem
This is a coding problem to verify that parentheses symbols are properly matched as OPEN and CLOSE.

```java
public boolean solution(String str) {
...
}
```

**1.1 Input / Result**
The possible input String values are as follows.

- ()()() —> true
- )( —> false
- ((()))()() —> true

# 2. Solution

## 2.1 Approach 1

The easiest way to solve this problem is to use the **stack data structure**.
The basic idea is as follows.

1. Scan the String one char at a time
1. When you encounter an OPEN\_parenthesis ‘(‘, push it onto the stack
1. When you encounter a CLOSE\_parenthesis ‘)’, pop from the stack.
1. If nothing remains in the stack, you can determine that the parentheses are valid

```java
public boolean solution(String str) {
    char[] chars = str.toCharArray();
    Stack<Character> stack = new Stack<>();

    if (str.length() % 2 != 0) {
        return false;
    }

    if (chars[0] == ')') {
        return false;
    }

    for (char ch : chars) {
        if (ch == '(') {
            stack.push(ch);
        } else {
            // close parenthesis
            stack.pop();
        }
    }
    return stack.isEmpty();
}
```

The source code can also be found on [github](https://github.com/kenshin579/tutorials-interview-questions/blob/master/src/main/java/com/google/ValidParenthesis.java).

# 3. Reference

- [https://hongku.tistory.com/251](https://hongku.tistory.com/251)
