---
title: "How to Use Java Jayway JsonPath"
description: "A guide to extracting data from JSON using the Java Jayway JsonPath library."
date: 2019-01-19
update: 2019-01-19
tags:
  - jayway
  - java
  - jsonpath
  - xpath
  - json-path
  - 자바
---

# 1. Introduction

Jayway JsonPath is a library that ports [Stefan Goessner's JsonPath](https://goessner.net/articles/JsonPath/) implementation to Java. The biggest advantage of XML is that you can **directly extract the part you want from an XML document using XPath (XML Path Language)**.

[w3school](https://www.w3schools.com/xml/xpath_syntax.asp) example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bookstore>
    <book>
        <title lang="en">Harry Potter</title>
        <price>29.99</price>
    </book>
    <book>
        <title lang="en">Learning XML</title>
        <price>39.95</price>
    </book>
</bookstore>
```

In the XML example above, the XPath expressions to extract the first book element of the bookstore are as follows.

- \_bookstore_book[1] : Extracts the first book element
- \_bookstore_book[last()] : Extracts the last book among the multiple books

# 2. Development Environment and Maven Dependency Configuration

The environment used is as follows. For the source written here, please refer to the github link below.

- OS : Mac OS
- IDE: Intellij
- Java : JDK 1.8
- Source code : [github](https://github.com/kenshin579/tutorials-java-examples/tree/master/jayway-jsonpath)
- Dependency management tool : Maven

To use Java Jayway JsonPath, you need to add the Maven dependency below. The **latest version is currently 2.4.0** (2017/7/5).

```xml
<dependency>
    <groupId>com.jayway.jsonpath</groupId>
    <artifactId>json-path</artifactId>
    <version>2.4.0</version>
</dependency>
```

The sample JSON file was taken from [Json Generator](https://next.json-generator.com/41_9W7rWU), and the source code was written largely by referring to the actual Jayway JsonPath source.

## 2.1 Jayway JsonPath Evaluator

If you are not yet familiar with JsonPath expressions, go to the [JsonPath Online Evaluator](http://jsonpath.herokuapp.com/) and test your expressions.

![](/media/java/Java-Jayway-JsonPath-사용법/image_1.png)

# 3. How to Use Jayway JsonPath

Let's look at JsonPath's notation and its representative operators, and through examples see how you can access and retrieve data. For the full list of Jayway JsonPath operators, functions, and filters, please refer to the JsonPath Github.

## 3.1 JsonPath Notation

JsonPath can use two notations: dot and bracket expressions.

- dot expression
    - \$.store.book[0].title
- bracket expression
    - \$[’store’][‘book’][0][’title’]

## 3.2 JsonPath's Representative Operators

These are the operators that are most commonly used.

| **Operator** | **Description** |
| -------- | ------- | 
| \$ | The root node; every Path expression starts with this symbol. |
| @ | Represents the current node being processed and is used in filter predicates.|  
| \* | A wildcard that matches all elements |
| . | The child node in a dot expression |
| [start:end] | The array slice operator |
| [?(\<expression\>)] | A filter expression that processes only all elements that match when the filter predicate is true, e.g. book[?(@.price == 49.99)] |

## 3.3 JsonPath Functions and Filters

JsonPath functions provide min(), max(), avg(), length(), and so on, and they can be appended at the very end of an expression and executed.

- \$.length() : Returns the length of the element. For an array, it returns the array size
- \$.range.avg() : Calculates the average value of the element's range array

JsonPath also provides filters. A filter has the form [?(\<expression\>)], where <expression> contains an expression that returns true or false using logical operators (e.g. ==, <, >) and other operators (e.g. in, size, empty). @ represents the element currently being processed.

- \$[?(@.age == 23 )] : Returns only the data where age is 23
- \$[?(@.name == ‘Frank’)] : Returns only the data where the name is Frank

## 3.4 JsonPath Expression Examples

| JsonPath expression | Result and description |
| ------------- | --------- |
| $..* | All elements (.. is a deep scan) |
| $[?('pariatur' in @['tags'])] | All people who have pariatur in tags |
| $[?(@.age == 26 )] | All people whose age is 26 |
| $[0][‘balance’] | The balance of the first person |
| $[*]['age'] | The age of all people |
| $..[’name’][‘first] | The name of all people |

## 3.5 Java JsonPath Examples

To extract the data you want with Jayway JsonPath, you use parse() and read(). Looking at the various versions written as unit tests will make the usage easy to understand.

- static parse() : A static method that reads in JSON depending on various input types (e.g., String, InputStream, File).
- read() : Reads an XPath expression and extracts the corresponding data
    - <T> T read(String path, Predicate... filters)

## 3.5.1 Searching by Id

This is an example of extracting the data whose \_id value is '5c2c3278acd492387a5223d7' from the array.

It uses a filter to retrieve only the data with the matching Id and returns it as an Object.

```java
@Test
public void test*id값으로*데이터를_가져오기() {
    String searchId = "5c2c3278acd492387a5223d7";
    Object dataObject = JsonPath.parse(jsonStream).read("\$[?(@._id == '" + searchId + "')]");
    assertTrue(dataObject.toString().contains("Hello, Louella! You have 8 unread messages."));
}
```

**JsonPath Output result**

```json
[
    {
    "_id" : "5c2c3278892c4a5335a2d18e",
    "index" : 0,
    "guid" : "bd56abb6-c46b-43e4-b3c7-ca8ad386dd7c",
    …(omitted)…
    "greeting" : "Hello, Franklin! You have 6 unread messages.",
    "favoriteFruit" : "banana"
    }
]
```

### 3.5.2 Using the Filter API

This is the same example as above, written using the Filter API provided by Jayway. To use the Filter API, you have to learn and get familiar with the method names, so I recommend just using JsonPath expressions.

```java
@Test
public void test*id값으로*데이터를\_가져오기() {
    String searchId = "5c2c3278acd492387a5223d7";
    List<Object> lists = JsonPath.parse(jsonStream).read("\$[?(@._id == '" + searchId + "')]");
    assertEquals(1, lists.size());
    assertTrue(lists.get(0).toString().contains("Hello, Louella! You have 8 unread messages."));
}
```

### 3.5.3 Finding All People Who Have a Specific Value in Tags

This is an example of finding all people who have the value 'pariatur' in the scanned @[’tags’]. When there is a filter predicate, there can be multiple results, so it returns a List.

```java
@Test
public void test*tags가*있는*사람은*모두() {
    List<Map<String, Object>> dataList = JsonPath.parse(jsonStream).read("\$[?('pariatur' in @['tags'])]");
    assertTrue(dataList.get(0).get("name").toString().contains("Dawn") && dataList.get(0).get("name").toString().contains("Roach"));
    assertTrue(dataList.get(1).get("name").toString().contains("Deloris") && dataList.get(1).get("name").toString().contains("Albert"));
}
```

**JsonPath Output result**

```json
[
    {
        …(omitted)…
        "tags" : [
        "incididunt",
        "elit",
        "laborum",
        **"pariatur",**
        "amet"
        ],
    },
    {
        …(omitted)…
        "tags" : [
        "adipisicing",
        "irure",
        "eu",
        "ullamco",
        **"pariatur"**
        ],
    …(omitted)…
]
```

### 3.5.4 Automatically Mapping JsonPath Query Results to a Java Object

So far we have stored the results queried with JsonPath as Object, but you can actually map the result into a real class object. If you pass an object (e.g., Person) as the targetType to the read() method, it is automatically cast and returns the typed object (e.g., Person).

```java
@Test
public void test*Person객체로*매핑하기() {
    DocumentContext documentContext = JsonPath.parse(this.getResourceAsStream("person.json"));
    Person person = documentContext.read("\$", **Person.class)**;
    assertEquals("Frank Oh", person.getName());
    assertEquals(26, person.getAge());
}
```

### 3.5.5 Using JsonPath Functions

This is an example of calculating the average value of the range attribute of the first person.

```java
@Test
public void test*jsonpath*함수() {
    DocumentContext documentContext = JsonPath.parse(jsonStream);
    double rangeAvg = documentContext.read("\$[0].range.avg()");
    assertEquals(4.5, rangeAvg, 0);
}
```

**JsonPath Output result**

```json
[{
…(omitted)…

"range": [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]

…(omitted)…
}]
```

### 3.5.6 Calculating the Total Account Balance of All People

This time we again use functions. This is an example that uses \$.length() to get the total number of people, then gets the value of each person's balance attribute and computes the total sum.

```java
@Test
public void test*모든*사람의*총*계좌*잔고을*계산하기() throws ParseException {
    NumberFormat formatter = NumberFormat.getCurrencyInstance(Locale.US);

    DocumentContext documentContext = JsonPath.parse(jsonStream);
    int maxSize = documentContext.read("\$.length()");
    double totalAmount = 0.0;

    for (int i = 0; i < maxSize; i++) {
    totalAmount += formatter.parse(documentContext.read("\$[" + i + "]['balance']")).doubleValue();
    }
    assertEquals(15998, (int) totalAmount);
}
```

### 3.5.7 Finding the Youngest Person

The last example is finding the youngest person. In #1, it uses the \$[\*][‘age] expression to collect the ages of all people into a List. In #2, it gets the minimum age, and in #3, it gets the person whose age matches the minimum age found and stores the result.

```java
@Test
public void test*제일*어린*사람을*찾기() {
    DocumentContext documentContext = JsonPath.parse(jsonStream);
    List<Integer> ageList = documentContext.read("$[**]['age']”); *#1**
    int minAge = ageList.get(ageList.indexOf(Collections.min(ageList))); **#2**
    List<Object> lists = documentContext.read("$[?(@['age'] == " + minAge + ")]”); **#3**
    assertTrue(lists.get(0).toString().contains("Deloris") && lists.get(0).toString().contains("Albert"));
}
```

So far we have looked at how to use Jayway JsonPath through examples. When working with JSON data, the Gson or Jackson libraries are widely used. You can also retrieve the intermediate values you want using these libraries, but it is somewhat difficult to write quickly and easily. JsonPath complements this part. So it is often used for quick and easy checks, and is widely used when writing unit tests.

# 4. References

- JSONPath
    - [https://goessner.net/articles/JsonPath/](https://goessner.net/articles/JsonPath/)
- Jayway JsonPath
    - [https://github.com/json-path/JsonPath](https://github.com/json-path/JsonPath)
    - [https://www.baeldung.com/guide-to-jayway-jsonpath](https://www.baeldung.com/guide-to-jayway-jsonpath)
    - [https://www.baeldung.com/jsonpath-count](https://www.baeldung.com/jsonpath-count)
    - [https://www.pluralsight.com/blog/tutorials/introduction-to-jsonpath](https://www.pluralsight.com/blog/tutorials/introduction-to-jsonpath)
