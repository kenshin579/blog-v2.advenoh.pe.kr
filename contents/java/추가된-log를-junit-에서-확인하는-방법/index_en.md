---
title: "How to Verify Added Logs in JUnit"
description: "How to capture and assert on log messages in JUnit tests using ListAppender."
date: 2019-11-18
update: 2019-11-18
tags:
  - java
  - logger
  - junit
  - unittest
  - 자바
  - 유닛테스트
  - 로거
---


# 1. Introduction

When writing a Unit Test, you basically verify the logic by checking the result of a method. In the case of a void method, you sometimes verify it based on whether an internal method is executed or based on the argument values passed to the method.

While developing, there are cases where there is no change in the logic but you simply add a log to a method. Personally, I wondered whether you have to verify the added log with a Unit Test and whether it is easy or even possible to check, so I looked into it.

There's nothing that StackOverflow doesn't have. I guess I wasn't the only one curious.

# 2. Development Environment

For the source code, please refer to the link below.

* OS : Mac OS

* IDE: Intellij

* Java : JDK 1.8

* Source code : [github](https://github.com/kenshin579/tutorials-java/tree/master/junit-unit-test)

* Software management tool : Maven

# 3. How to Verify That a Log Is Recorded

In the project being developed, I added a log to a part where exceptions were not handled, as shown below, so that the desired information is printed. Let's verify the log added in the catch clause in a Unit Test.

```java
@Slf4j
public class SomeService {
	public void requestJobId(String jobId) {
		try {
			throwMethodTest("throwing test");
		} catch (Exception e) {
			log.error("[servicedebug] error occurred : jobId : {}", jobId); //added log
		}
	}

	private void throwMethodTest(String msg) throws Exception {
		throw new Exception(msg);
	}
}
```

The ListAppender class is a class that stores occurring Log events in a List so that they can be queried later.


```java
public class LoggerTestUtil {
	public static ListAppender<ILoggingEvent> getListAppenderForClass(Class clazz) {
		Logger logger = (Logger) LoggerFactory.getLogger(clazz);

		ListAppender<ILoggingEvent> listAppender = new ListAppender<>();
		listAppender.start(); //start recording

		logger.addAppender(listAppender); //add ListAppender to the logger so that occurring logs are stored in the List

		return listAppender;
	}
}
```

A log is recorded in the someService.requestJobId() method, and the content output as a log is stored in listAppender. To verify the message of the stored log, get the List from listAppender.list.

```java
 @Test
    public void requestJobId() throws JsonProcessingException {
        String jobId = "12342";

        ListAppender<ILoggingEvent> listAppender = LoggerTestUtil.getListAppenderForClass(SomeService.class);

        someService.requestJobId(jobId); //execute the method

        List<ILoggingEvent> logsList = listAppender.list; //get the stored data
        log.info("entire logsList : {}", new ObjectMapper().writerWithDefaultPrettyPrinter() //format the JSON nicely
		        .writeValueAsString(logsList));
        assertThat(logsList.get(0).getMessage()).contains("[servicedebug] error occurred : jobId : ");
    }
```

# 4. References

* Logger Assert
    * [https://stackoverflow.com/questions/1827677/how-to-do-a-junit-assert-on-a-message-in-a-logger](https://stackoverflow.com/questions/1827677/how-to-do-a-junit-assert-on-a-message-in-a-logger)
    * [https://stackoverflow.com/questions/29076981/how-to-intercept-slf4j-with-logback-logging-via-a-junit-test](https://stackoverflow.com/questions/29076981/how-to-intercept-slf4j-with-logback-logging-via-a-junit-test)
    * [https://www.jvt.me/posts/2019/09/22/testing-slf4j-logs/](https://www.jvt.me/posts/2019/09/22/testing-slf4j-logs/)
* ListAppender
    * [http://people.apache.org/~carnold/log4j/docs/jdiff_report/Version%201.3/org/apache/log4j/varia/ListAppender.html](http://people.apache.org/~carnold/log4j/docs/jdiff_report/Version%201.3/org/apache/log4j/varia/ListAppender.html)
</content>
