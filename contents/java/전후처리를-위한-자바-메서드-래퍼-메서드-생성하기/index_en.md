---
title: "Creating Java Wrapper Methods for Pre and Post Processing"
description: "How to build Java wrapper methods that handle pre-processing and post-processing around a task."
date: 2018-08-26
update: 2018-08-26
tags:
  - java
  - wrapper
  - pre processing
  - post processing
  - 자바
  - 래퍼
  - 메서드
  - 전후처리
---

# 1. Overview

When coding, you often need pre- and post-processing before performing some task. In pre-processing you do the necessary setup before performing the actual work, and in post-processing you do something like cleanup. When you do this kind of pre/post processing multiple times, it is good to implement it as a separate method. Let's take a look at a few examples.

# 2. Examples

## 2.1 Writing a Text String Value to a File

To write to a file, you basically have to open a file stream, write the text, and then close the file stream. Let's turn the part that opens and closes the file stream into pre/post processing.

The writeLineToFile method takes 3 arguments. It is passed the file name, a string value, and a lambda function as arguments. The method passed as the lambda function is the part that runs in the middle of the pre/post processing.

```java
@Test
public void testWriteLineToFileWrapper() throws IOException {
    writeLineToFile("output.txt", "this is a test", (printWriter, line) -> {
        printWriter.print(line);
    });
}
```

Define the interface to be passed as a lambda function.

```java
private interface FileWrite {
	void writeToFile(PrintWriter pw, String line);
}
```

In the writeLineToFile method, you finish with the pre-processing code, the execution of the passed-in function, and finally the post-processing code.

```java
private static void writeLineToFile(final String fileName, String line, FileWrite fileWrite) throws IOException {
    LOG.info("pre processing : open file");
    FileWriter fileWriter = new FileWriter(fileName);
    PrintWriter printWriter = new PrintWriter(fileWriter);

    fileWrite.writeToFile(printWriter, line);

    LOG.info("post processing : close file");
    printWriter.close();
}
```

## 2.2 Testing by Changing a Constant Value Declared as static final in a Unit Test

To write a unit test while changing the value of an existing static final constant, you have to use reflection to change the constant value. Since once a static final value is changed it stays at the changed value, the result of another unit test can fail. So after the test you have to restore it to the original value. Let's look at the actual code.

This is a constant value declared as static final.

```java
public class Constants {
	public static final Integer SIZE = 10;
}
```

If you write code that changes the constant value to a different value and tests it in a unit test, it would be like the code below.

```java
@Test
public void testExecuteAndResetConstantValueWithoutInterface() throws Exception {
    int newSize = 3;

    int originalSize = Constants.SIZE;
    setFinalStaticIntField(Constants.class, "SIZE", newSize);
    LOG.info("pre processing - SIZE: {}", Constants.SIZE);

    //test with the changed value.
    assertEquals(newSize, Constants.SIZE);

    setFinalStaticIntField(Constants.class, "SIZE", originalSize);
    LOG.info("post processing - SIZE: {}", Constants.SIZE);
}
```

If you write unit tests with different SIZE values each time, it would be better to define an interface and refactor as we did in #2.1.

```java
@Test
public void testExecuteAndResetConstantValue() throws Exception {
    int newId = 3;

    //internally sets the Constant value to 3 and then restores it to the original value
    executeAndResetConstantValue(newId, () -> {
        LOG.info("Constants: {}", Constants.SIZE);
    });
}
```

Refactor the pre/post processing code into the method below.

```java
private static void executeAndResetConstantValue(int newSize, Task task) throws NoSuchFieldException, IllegalAccessException {
    int originalSize = Constants.SIZE;
    //pre processing - set to the argument value
    setFinalStaticIntField(Constants.class, "SIZE", newSize);
    LOG.info("pre processing - SIZE: {}", Constants.SIZE);

    //execution
    task.execute();

    //post processing - restore to the original value
    setFinalStaticIntField(Constants.class, "SIZE", originalSize);
    LOG.info("post processing - SIZE: {}", Constants.SIZE);
}
```

The method that uses reflection to change the static final constant value was referenced from the dzone site. (Reference - changing a static final field)

```java
private static void setFinalStaticIntField(Class<?> clazz, String fieldName, Object value) throws NoSuchFieldException, IllegalAccessException {
    Field field = clazz.getDeclaredField(fieldName);
    field.setAccessible(true);

    Field modifiers = Field.class.getDeclaredField("modifiers");
    modifiers.setAccessible(true);
    modifiers.setInt(field, field.getModifiers() & ~Modifier.FINAL);

    field.set(null, value);
}
```

This is the part that declares the interface.

```java
private interface Task {
    void execute();
}
```

Since the interface is void with no arguments and no return value, it is fine to just use the Runnable interface.

```java
private static void executeAndPrePostProcessWithRunnable(int newSize, Runnable r) throws NoSuchFieldException, IllegalAccessException {
    int originalSize = Constants.SIZE;
    //pre processing - set to the argument value
    setFinalStaticIntField(Constants.class, "SIZE", newSize);
    LOG.info("pre processing - SIZE: {}", Constants.SIZE);

    //execution
    r.run();

    //post processing - restore to the original value
    setFinalStaticIntField(Constants.class, "SIZE", originalSize);
    LOG.info("post processing - SIZE: {}", Constants.SIZE);
}
```

- The code written so far is uploaded on [github](https://github.com/kenshin579/tutorials-java-examples/tree/master/java8).

    - com.java.examples.prepost

    - - Constants
    - PrePostTest
    - FinalFieldChangeTest

# 3. References

- Pre/post processing
    - [https://www.javacodegeeks.com/2013/05/a-simple-application-of-lambda-expressions-in-java-8.html](https://www.javacodegeeks.com/2013/05/a-simple-application-of-lambda-expressions-in-java-8.html)
    - [https://stackoverflow.com/questions/43599406/create-generic-java-method-wrapper-for-pre-and-post-processing](https://stackoverflow.com/questions/43599406/create-generic-java-method-wrapper-for-pre-and-post-processing)
- Changing a static final field
    - [https://dzone.com/articles/how-to-change-private-static-final-fields](https://dzone.com/articles/how-to-change-private-static-final-fields)
- Functional interfaces
    - [http://multifrontgarden.tistory.com/125](http://multifrontgarden.tistory.com/125)
</content>
