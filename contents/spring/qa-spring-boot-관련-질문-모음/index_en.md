---
title: "Q&A Spring Boot Questions Collection"
description: "A collection of Q&A notes on Spring Boot, including configuration, Quartz, and testing."
date: 2019-12-04
update: 2019-12-04
tags:
  - Q&A
  - faq
  - spring
  - springboot
  - batch
  - 스프링
  - 배치
  - 질문
---

This is material where I personally jot down things I don't know and briefly organize the parts I come to understand.
If you know any of the unanswered ones, please leave a comment. Thank you.


# Full Q&A List

## <span style="color:orange">[Answered]</span>

## <span style="color:brown">1. application.properties : What does the server.compression.enabled property mean?</span>

In Spring Boot, GZip compression is disabled by default. However, if you set server.compression.enabled=true, web resources (e.g. html, css) are compressed and sent to the client, which has the advantage of reducing response time.

Reference
* [https://www.callicoder.com/configuring-spring-boot-application/](https://www.callicoder.com/configuring-spring-boot-application/)


## <span style="color:brown">2. What does the @PersistJobDataAfterExecution annotation mean in Quartz? </span>

If you modify JobDataMap data in the Job logic, it is not saved to the DB after execution. However, if you add the @PersistJobDataAfterExecution annotation to the class, the data you modified in the JobDataMap is reflected, and you can read the updated data on the next execution as well.

```java
@PersistJobDataAfterExecution
@DisallowConcurrentExecution
public class StatefulDumbJob implements Job {

    public static final String NUM_EXECUTIONS = "NumExecutions";
    public static final String EXECUTION_DELAY = "ExecutionDelay";

    public StatefulDumbJob() {
    }
    public void execute(JobExecutionContext context)
        throws JobExecutionException {
        System.err.println("---" + context.getJobDetail().getKey()
                + " executing.[" + new Date() + "]");

        JobDataMap map = context.getJobDetail().getJobDataMap();

        int executeCount = 0;
        if (map.containsKey(NUM_EXECUTIONS)) {
            executeCount = map.getInt(NUM_EXECUTIONS);
        }

        executeCount++;
        map.put(NUM_EXECUTIONS, executeCount); //save it back into the JobDataMap

        long delay = 5000l;
        if (map.containsKey(EXECUTION_DELAY)) {
            delay = map.getLong(EXECUTION_DELAY);
        }

        try {
            Thread.sleep(delay);
        } catch (Exception ignore) {
        }

        System.err.println("  -" + context.getJobDetail().getKey()
                + " complete (" + executeCount + ").");
    }
}
```


* [https://www.concretepage.com/scheduler/quartz/quartz-2-scheduler-pass-parameters-to-job-with-jobdatamap-using-persistjobdataafterexecution-and-disallowconcurrentexecution-example](https://www.concretepage.com/scheduler/quartz/quartz-2-scheduler-pass-parameters-to-job-with-jobdatamap-using-persistjobdataafterexecution-and-disallowconcurrentexecution-example)
* [http://www.quartz-scheduler.org/documentation/quartz-2.1.7/examples/Example5.html](http://www.quartz-scheduler.org/documentation/quartz-2.1.7/examples/Example5.html)


## <span style="color:brown"> 3. What is the difference between @SpringBootTest and @DataJpaTest?</span>

- @SpringBootTest

    - can read all beans for testing
    - runs slowly
- @DataJpaTest
    - scans only @Entity and @Repository and sets them as beans
    - does not scan @Configuration, @Component, or @Service.
    - uses an in-memory database to perform tests
    - already includes @Transactional


**@SpringBootTest**

```java
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@BootstrapWith(SpringBootTestContextBootstrapper.class)
@ExtendWith({SpringExtension.class})
public @interface SpringBootTest {
```

**@DataJpaTest**

```java
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@BootstrapWith(DataJpaTestContextBootstrapper.class)
@ExtendWith({SpringExtension.class})
@OverrideAutoConfiguration(
    enabled = false
)
@TypeExcludeFilters({DataJpaTypeExcludeFilter.class})
@Transactional
@AutoConfigureCache
@AutoConfigureDataJpa
@AutoConfigureTestDatabase
@AutoConfigureTestEntityManager
@ImportAutoConfiguration
public @interface DataJpaTest {
```

Reference

* [https://lalwr.blogspot.com/2018/05/spring-boot-springboottest-datajpatest.html](https://lalwr.blogspot.com/2018/05/spring-boot-springboottest-datajpatest.html)
* https://kok202.tistory.com/116

- - - -

## <span style="color:orange">[Unanswered Questions]</span>
