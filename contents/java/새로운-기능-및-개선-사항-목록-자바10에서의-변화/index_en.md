---
title: "List of New Features and Improvements - Changes in Java 10"
description: "A list of new features and improvements introduced in Java 10."
date: 2018-09-11
update: 2018-09-11
tags:
  - java10
  - java
  - jdk
  - openjdk
  - 자바
  - 자바10
---


# Java 10
* **Language**
    * JEP 286: Local Variable Type Inference
* JVM/Compiler
    * JEP 304: Garbage-Collector Interface
    * JEP 307: Parallel Full GC for G1
    * JEP 316: Heap Allocation on Alternative Memory Devices
    * JEP 317: Experimental Java-Based JIT Compiler
* Other changes and improvements
    * JEP 296: Consolidate the JDK Forest into a Single Repository
    * JEP 310: Application Class-Data Sharing
    * JEP 312: Thread-Local Handshakes
    * JEP 313: Remove the Native-Header Generation Tool (javah)
    * JEP 314: Additional Unicode Language-Tag Extensions
    * JEP 319: Root Certificates
    * JEP 322: Time-Based Release Versioning

For the various features and improvements added in Java 10, please refer to the following links.

* [http://openjdk.java.net/projects/jdk/10/](http://openjdk.java.net/projects/jdk/10/)
* [https://www.oracle.com/technetwork/java/javase/10-relnote-issues-4108729.html](https://www.oracle.com/technetwork/java/javase/10-relnote-issues-4108729.html)
* [https://dzone.com/articles/whats-new-in-java-10](https://dzone.com/articles/whats-new-in-java-10)

# JEP 286: Local Variable Type Inference
Type inference refers to the feature where the Java compiler infers the type of an argument by looking at each method call and the defined method declaration. Type inference has been continuously improved since Java 5.

* Java 5 : Generic methods and type-aware type inference
* Java 7 : Diamond operator (<>)
* Java 8 : Lambda expression argument types
* Java 10 : Local variable type inference

## **History of Type Inference Improvements**


### **Java 5 : Generic method type inference**
```java
List<String> cs = Collections.<String>emptyList();
```

### **Java 7 : Diamond operator (<>)**
```java
Map<String, List<String>> myMap = new HashMap<String,List<String>>();
```

### **Java 8 : Lambda expression argument types**
```java
Predicate<String> nameValidation = (String x) -> x.length() > 0;
```

### **Java 10 : Local variable type inference**
Java too introduced var to support implicit typing. var is not a keyword (e.g., abstract) but a reserved type name, so it can also be used as a variable or function name.
Also, the introduction of var does not mean Java supports dynamic types. The compiler infers the type on its own and compiles it.

**Earlier Java**
```java
Map<User, List<String>>** userChannels = new HashMap<>();
```

**Java 10**
```java
var userChannels = new HashMap<User, List<String>>();
		Path path = Paths.get("src/web.log");
		try (Stream<String> lines = Files.lines(path)) {
			long warningCount
					= lines
					.filter(line -> line.contains("WARNING"))
					.count();
			System.out.println("Found " + warningCount + " warnings in the log file");
		} catch (IOException e) {
			e.printStackTrace();
		}
		var path = Paths.get("src/web.log");
		try (var lines = Files.lines(path)) {
			var warningCount = lines
					.filter(line -> line.contains("WARNING"))
					.count();
			System.out.println("Found " + warningCount + " warnings in the log file");
		} catch (IOException e) {
			e.printStackTrace();
		}
```

As a constraint, there are cases where type inference does not work.

* When assigning to null

    * ```java
	  test = null;
	  ```
* When it is not a local variable

* ```java
	  public var x = "hello";
	  ```

* When there is no explicit initialization

    * ```java
	  var x;
	  ```
* Cases where it does not work even with initialization - array initializer

    * ```java
	  var arr = {1, 2, 3};
	  ```
* Not allowed as a method argument either

    * ```java
	  public void foo(var x) {}
	  ```
* Lambda expressions require an explicit target type

    * ```java
	  var p = (String str) -> str.length() > 1;
	  ```

Caution is needed when using var. Using var makes it impossible to know what the type is, reducing readability.

```java
//ORIGINAL
List<Customer> x = dbconn.executeQuery(query);

//BAD
var customer = dbconn.executeQuery(query);

//GOOD
var custList = dbconn.executeQuery(query);
```

It is good to add the type to the variable name and use the name to improve readability.
For more details, please refer to the guideline provided by java.net ([Style Guidelines for Local Variable Type Inference in Java](http://openjdk.java.net/projects/amber/LVTIstyle.html)).

# References

* Local variable type inference
    * [https://www.baeldung.com/java-10-local-variable-type-inference](https://www.baeldung.com/java-10-local-variable-type-inference)
    * [https://blog.codefx.org/java/java-10-var-type-inference/](https://blog.codefx.org/java/java-10-var-type-inference/)
    * [https://www.slideshare.net/OracleDeveloperkr/main-session-java](https://www.slideshare.net/OracleDeveloperkr/main-session-java)
* What is a reserved type
    * [https://stackoverflow.com/questions/49102553/what-is-the-conceptual-difference-between-a-restricted-keyword-and-reserved-t](https://stackoverflow.com/questions/49102553/what-is-the-conceptual-difference-between-a-restricted-keyword-and-reserved-t)
