---
title: "Q&A Collection on Cache-SSM"
description: "A collection of Q&A on Cache-SSM."
date: 2018-07-29
update: 2018-07-29
tags:
  - Q&A
  - faq
  - ssm
  - cache-ssm
  - cache
  - 캐쉬
---


This is material where I personally jot down things I don't know and briefly organize what I come to learn.
If you know something among the unanswered questions, please leave a comment. Thank you.

# Full Q&A List

## <span style="color:orange">[Answered]</span>

## <span style="color:brown">1. What is @CacheKeyMethod?</span>

It is an SSM-related annotation and a method that provides the key value; if there is none, it calls toString(). Additionally, if the namespace within the cache uses toString() and the same key exists, a collision occurs.

![](image_1.png)

Reference
* [https://m.blog.naver.com/PostView.nhn?blogId=kbh3983&logNo=220934569378&proxyReferer=https%3A%2F%2Fwww.google.co.kr%2F](https://m.blog.naver.com/PostView.nhn?blogId=kbh3983&logNo=220934569378&proxyReferer=https%3A%2F%2Fwww.google.co.kr%2F)

## <span style="color:brown">2. Why should we cache DB data?</span>

There is an issue where fetching data from the DB every time is very slow.

Reference
* [https://charsyam.wordpress.com/2016/07/27/입-개발-왜-cache를-사용하는가/](https://charsyam.wordpress.com/2016/07/27/%EC%9E%85-%EA%B0%9C%EB%B0%9C-%EC%99%9C-cache%EB%A5%BC-%EC%82%AC%EC%9A%A9%ED%95%98%EB%8A%94%EA%B0%80/)

- - - -
- 
## <span style="color:orange">[Unanswered Questions]</span>

### -
