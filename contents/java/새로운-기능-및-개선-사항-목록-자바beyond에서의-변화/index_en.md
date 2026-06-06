---
title: "List of New Features and Improvements - Changes in Java Beyond"
description: "A list of new features and improvements expected in future versions of Java."
date: 2018-09-10
update: 2018-09-10
tags:
  - java
  - upgrade
  - JEP
  - 자바
  - 개선사항
---

# 1. Java Beyond

- JEP 301: Enhanced Enums - currently on hold

- JEP 302: Lambda Leftovers - Candidate

- JEP 305: Pattern Matching - Candidate
- JEP ???: Data Classes
- JEP 312: Switch Expressions - Proposed to Target (JDK12)
- JEP 326: Raw String Literals - Candidate

As Java's release cycle has changed to 6 months, new features and improvements are expected to be reflected quickly. They have not been reflected yet, but I have organized the parts that are expected to be reflected in future Java versions.

# 2. JEP 301: Enhanced Enums - currently on hold

This proposal document is currently on hold. Since it may be introduced later, let's briefly look at what kind of improvement it is.
It is about supporting generics in Enums as well, and supporting a more precise type (sharper type) for the constant values defined in an Enum.
For reference, Enum is a feature added in Java 5; the JVM does no separate processing for Enums, and the compiler converts an Enum into a regular class.
Before improvement
After improvement

```java
//Before improvement
enum Bar {
  ONE,
  TWO
}

//After improvement
enum Bar<X> {
  ONE<>(String.class),
  TWO<>(Integer.class);

  Bar(X x) { ... }
}

Class<String> cs = Bar.ONE.getClazz(); //uses shaper typing of enum constant
```

## 2.1 References

- Enum improvements
    - [http://openjdk.java.net/jeps/301](http://openjdk.java.net/jeps/301)
    - [https://www.infoq.com/news/2017/01/java-enhanced-enums](https://www.infoq.com/news/2017/01/java-enhanced-enums)

# 3. JEP 302: Enhancements to Lambda Expressions : Lambda Leftovers - Status: Candidate

## 3.1 Expressing unused lambda parameters with an underscore

This is a feature that improves readability by expressing unused variables in lambda parameters with an underscore.

```java
//Before improvement
Map<String, Integer> numbers = new HashMap<>();
numbers.forEach(( **k**, v) -> System.out.println(v*2)); k is not used

After improvement
numbers.forEach(( **\_**, v) -> System.out.println(v*2));
```

## 3.2 Parameter shadowing

Variable shadowing refers to the case where a variable defined in an inner scope has the same variable name as one defined in an outer scope.

```java
public class Shadow {
    private int value = 0;

    public void shadowTheVar(){
        int value = 5; //The value of the field above gets hidden
    }
}
```

The parameter shadowing improvement is about allowing you to declare the same variable in an inner scope as well.

```java
//Before improvement
String s = "hello";

if(finished) {
    String s = "bye"; // Error, the variable s is already declared
}

Predicate<String> ps = s -> s.isEmpty(); // Error, the variable s is already declared
  

//After improvement
Map<String, Integer> map = /* ... */
String key = "theInitialKey";

map.computeIfAbsent(key, _ -> {
   String key = "theShadowKey"; // This becomes possible
   return key.length();
});
```

## 3.3 Optional: Improvements to disambiguating function calls\*\*

This is a feature where the compiler infers and compiles well on its own even without specifying the type when calling several overloaded methods.

```java
//Before improvement
private void m(Predicate<String> ps) { /* ... */ }
private void m(Function<String, String> fss) { /* ... */ }

private void callingM() {
    m((String s) -> s.isEmpty()); //Can be known directly from the type

    m(s -> s.isEmpty()); //The compiler does not know which method to call
}

//After improvement
private void m(Predicate<String> ps) { /* ... */ }
private void m(Function<String, String> fss) { /* ... */ }

private void callingM() {
    m(s -> s.isEmpty()); //This will be made possible. 
}
```

## 3.4 References

- Lambda improvement work
    - [http://openjdk.java.net/jeps/302](http://openjdk.java.net/jeps/302)
    - [https://www.infoq.com/news/2017/01/java10-lambda-leftovers](https://www.infoq.com/news/2017/01/java10-lambda-leftovers)

# 4. JEP ???: Data Classes

A data class refers to a pure data object that holds data and has no logic implementation. It has various methods (e.g., getter, setter) for accessing the data attributes. It is also called a DTO (Data Transfer Object) or VO (Value Object).

To write a data class, the developer basically had to create methods such as getter, setter, equals, and hashCode, but what this JEP proposes is a feature where the compiler generates them automatically. This idea was taken from Scala's case classes and Kotlin's data classes.

- Scala - case class
    - case class Coordinate (lat: Double, lon : Double)
- Kotlin - data class
    - data class Coordinate(val lat: Double, val lon: Double)

```java
//Before improvement
public class Coordinate {
    private double lat;
    private double lon;
    public Coordinate(double lat, double lon) {
    this.lat = lat;
    this.lon = lon;
    }
// Getters/Setters, toString(), equals(), hashCode(), etc. needed
}

//After improvement
//Java data class (proposed)
record Coordinate(double lat, double lon) {}
```

Java data class (proposed)
record Coordinate(double lat, double lon) {}
By supporting data classes, you also gain the advantage of more concise code. If object pattern matching (JEP 305) is supported, you can write code more easily and quickly.

```java
interface Shape { }
record Point(int x, int y);
record Rect(Point p1, Point p2) implements Shape;
record Circle(Point center, int radius) implements Shape;

switch (shape) {
     case Rect(Point(var x1, var y1), Point(var x2, var y2)): ...
     case Circle(Point(var x, var y), int r): ...
     ....
}
```

## 4.1 References

- Data object
    - [https://refactoring.guru/smells/data-class](https://refactoring.guru/smells/data-class)
    - [https://jungwoon.github.io/common%20sense/2017/11/16/DAO-VO-DTO/](https://jungwoon.github.io/common%20sense/2017/11/16/DAO-VO-DTO/)
    - [http://cr.openjdk.java.net/~briangoetz/amber/datum.html](http://cr.openjdk.java.net/~briangoetz/amber/datum.html)
    - [https://www.infoq.com/news/2018/02/data-classes-for-java](https://www.infoq.com/news/2018/02/data-classes-for-java)
- Other languages
    - [https://www.baeldung.com/kotlin-data-classes](https://www.baeldung.com/kotlin-data-classes)

# 5. JEP 305 : Pattern Matching - Candidate

This JEP introduces the matches keyword and covers the work to improve switch pattern matching.

The compiler interprets the **x matches Integer i** statement as the before-improvement code (the code below).
The **Integer i** statement is called a **type test pattern**, and i is recognized as the declaration of a new variable.
If the target variable (e.g., obj) is an Integer instance, it is cast to Integer and interpreted as code where the i variable can be used within the block.

```java
//Before improvement
String formatted = "unknown";
if (obj instanceof Integer) {
    int i = (Integer) obj;
    formatted = String.format("int %d", i);
} else if (obj instanceof Byte) {
    byte b = (Byte) obj;
    formatted = String.format("byte %d", b);
} else if (obj instanceof Long) {
    long l = (Long) obj;
    formatted = String.format("long %d", l);
} else if (obj instanceof Double) {
    double d = (Double) obj;
    formatted = String.format(“double %f", d);
} else if (obj instanceof String) {
    String s = (String) obj;
    formatted = String.format("String %s", s);
}

//After improvement
String formatted = "unknown";
if (obj matches Integer i) {
    formatted = String.format("int %d", i);
} else if (obj matches Byte b) {
    formatted = String.format("byte %d", b);
} else if (obj matches Long l) {
    formatted = String.format("long %d", l);
} else if (obj matches Double d) {
    formatted = String.format(“double %f", d);
} else if (obj matches String s) {
    formatted = String.format("String %s", s);
}
```

In existing Java, the switch statement could only match Number, String, and Enum, but once this improvement work is included, objects can also be matched.

```java
String formatted;
switch (obj) {
    case Integer i: formatted = String.format("int %d", i); break;
    case Byte b:    formatted = String.format("byte %d", b); break;
    case Long l:    formatted = String.format("long %d", l); break;
    case Double d:  formatted = String.format(“double %f", d); break;
    default:        formatted = String.format("String %s", s);
}
```

## 5.1 References

- Improvement work
    - [http://openjdk.java.net/jeps/305](http://openjdk.java.net/jeps/305)
    - [http://cr.openjdk.java.net/~briangoetz/amber/pattern-match.html](http://cr.openjdk.java.net/~briangoetz/amber/pattern-match.html)
