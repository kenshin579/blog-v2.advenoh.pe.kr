---
title: "Q&A Spring Boot Annotation Collection"
description: "A collection of Q&A notes on Spring Boot annotations."
date: 2019-07-03
update: 2019-07-03
tags:
  - Q&A
  - faq
  - spring
  - annotation
  - 스프링
  - 어노테이션
---

This is material where I personally jot down things I don't know and briefly organize the parts I come to understand.
If you know any of the unanswered ones, please leave a comment. Thank you.

# Full Q&A List

## <span style="color:orange">[Answered]</span>

I organize them in alphabetical order to make them easy to find.

## <span style="color:brown">@SpringBootApplication</span>

The @SpringBootApplication annotation is a combination of the @Configuration, @EnableAutoConfiguration, and @ComponentScan annotations.

* @EnableAutoConfiguration
    * This annotation enables Auto-Configuration in Spring Boot.
    * Spring Boot looks at the classpath, annotations, and configuration files and configures the app by adding the most appropriate technologies for it.

Reference
* [http://partnerjun.tistory.com/54](http://partnerjun.tistory.com/54)

- - - -

## <span style="color:orange">[Unanswered Questions]</span>

### - What is the difference between @SpringBootTest and @DataJpaTest?
* [https://lalwr.blogspot.com/2018/05/spring-boot-springboottest-datajpatest.html](https://lalwr.blogspot.com/2018/05/spring-boot-springboottest-datajpatest.html)
