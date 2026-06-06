---
title: "List of New Features and Improvements - Changes in Java 11"
description: "A list of new features and improvements introduced in Java 11."
date: 2018-09-09
update: 2018-09-09
tags:
  - java
  - java11
  - upgrade
  - JEP
  - 자바
  - 자바11
  - 개선사항
---

# 1. Java 11

- JEP 181: Nest-Based Access Control
- JEP 309: Dynamic Class-File Constants
- JEP 315: Improve Aarch64 Intrinsics
- JEP 318: Epsilon: A No-Op Garbage Collector
- JEP 320: Remove the Java EE and CORBA Modules
- **JEP 321: HTTP Client (Standard)**
- **JEP 323: Local-Variable Syntax for Lambda Parameters**
- JEP 324: Key Agreement with Curve25519 and Curve448
- JEP 327: Unicode 10
- JEP 328: Flight Recorder
- JEP 329: ChaCha20 and Poly1305 Cryptographic Algorithms
- JEP 330: Launch Single-File Source-Code Programs
- JEP 331: Low-Overhead Heap Profiling
- JEP 332: Transport Layer Security (TLS) 1.3
- JEP 333: ZGC: A Scalable Low-Latency Garbage Collector (Experimental)
- JEP 335: Deprecate the Nashorn JavaScript Engine
- JEP 336: Deprecate the Pack200 Tools and API

For the various features and improvements added in Java 11, please refer to the following link.

- [http://openjdk.java.net/projects/jdk/11/](http://openjdk.java.net/projects/jdk/11/)

# 2. JEP 321: HTTP Client (Standard)

The HTTP client incubated in Java 9 & 10 was released as a standardized version in Java 11.
Package: java.net.http

For more details on HTTP2, please refer to [HTTP/2 - the one only I didn't know about](https://www.popit.kr/%EB%82%98%EB%A7%8C-%EB%AA%A8%EB%A5%B4%EA%B3%A0-%EC%9E%88%EB%8D%98-http2/).

# 3. JEP 323: Local-Variable Syntax for Lambda Parameters

var was introduced in JDK 10, but it could not be used in implicitly typed lambda expressions. From Java 11, the var keyword can also be used in lambda expressions.

```java
@Test
public void test_JEP323() {
    var xs = new in[]{3, 2, 6, 4, 8, 9};
    int x = Arrays
            .stream(xs)
            .filter((var a) -> a < 5)
            .sum();
    System.out.println(x);
}
```
## 3.1 References

- Java 11
    - [https://blog.takipi.com/java-11-will-include-more-than-just-features/?utm_source=10countdown&utm_medium=readmore](https://blog.takipi.com/java-11-will-include-more-than-just-features/?utm_source=10countdown&utm_medium=readmore)
    - [https://medium.com/antelabs/what-is-new-in-java-11-442af9315f07](https://medium.com/antelabs/what-is-new-in-java-11-442af9315f07)
