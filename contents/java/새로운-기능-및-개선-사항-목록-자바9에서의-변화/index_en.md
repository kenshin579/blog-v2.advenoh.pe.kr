---
title: "List of New Features and Improvements - Changes in Java 9"
description: "A list of new features and improvements introduced in Java 9."
date: 2018-09-03
update: 2018-09-03
tags:
  - java
  - java8
  - jdk8
  - jdk1.8
  - openjdk
  - JEP
  - 자바
  - 자바8
---

# Java 9

- Java Platform Module System
- JEP 222: Jshell - REPL
- JEP 158: Unified VM logging
    * Provides a common logging system for JVM components (-Xlog)

- HTML5 Javadoc
    * A tool that can generate APIs in HTML5 format

- Language Update
    * try-with-resources improvements
    * private interface method
        * Interfaces always had to be defined as public, but private is now also allowed
    * diamond operator
        * The diamond operator is now possible in anonymous inner classes as well

- New Core Libraries
  * Process API
  * JEP264: Platform Logging API and Service
  * [http://openjdk.java.net/jeps/264](http://openjdk.java.net/jeps/264)
  * Enhanced CompletableFuture API
  * Reactive Streams - Flow API
  * [https://thepracticaldeveloper.com/2018/01/31/reactive-programming-java-9-flow/](https://thepracticaldeveloper.com/2018/01/31/reactive-programming-java-9-flow/)
  * Factory Methods for Collections (List, Set, Map)
  * Collections created with static factory methods are immutable
  * Enhanced Deprecation
  * Stack-Walking API
  * Other Improvements
  * Stream improvements
  * iterate(), takeWhile()/dropWhile(), ofNullable()
  * Optional improvements

- JEP 11 : HTTP 2.0 (Incubator Modules)
  * [http://openjdk.java.net/jeps/110](http://openjdk.java.net/jeps/110)
- Client Technologies
  * Multi-Resolution Images
  * TIFF Image I/O Plugins
- Internationalization
  * Unicode 8.0
  * Java 8 supports Unicode 6.2
  * UTF-8 Properties files
  * Default Localte Data Change

For the various features and improvements added in Java 9, please refer to the following link.

- [https://docs.oracle.com/javase/9/whatsnew/toc.htm#JSNEW-GUID-C23AFD78-C777-460B-8ACE-58BE5EA681F6](https://docs.oracle.com/javase/9/whatsnew/toc.htm#JSNEW-GUID-C23AFD78-C777-460B-8ACE-58BE5EA681F6)

One of the big changes in Java 9 is the introduction of the module system. This is also a big change with much to study, so I plan to post about it as it gets organized.
