---
title: "Gracefully Shutting Down a Job Scheduler by Interrupting a Running Job in Quartz"
description: "How to gracefully shut down a Quartz scheduler by interrupting running jobs with a shutdown hook."
date: 2019-10-12
update: 2019-10-12
tags:
  - quartz
  - spring
  - job
  - interrupt
  - hook
  - 인터럽트
  - 셧다운훅
  - 스케줄러
  - 스케줄
  - 스프링
  - 스프링부트
series: "Spring Quartz"
---

# 1. Introduction

This post is the fourth in the Quartz tutorial series and covers how to handle a Quartz server gracefully when shutting it down. When a shutdown event occurs, the internal interrupt() function is called on the running Quartz Job, and once notified by the interrupt, the developer can write the close logic as they see fit. You can kill the running thread (not recommended), or you can wait for the running Job and exclude it from the next schedule.

# 2. Development Environment

* OS : Mac OS
* IDE: Intellij
* Java : JDK 1.8
* Source code : [github](https://github.com/kenshin579/tutorials-java/tree/master/springboot-quartz-cluster-reactjs)
* Software management tool : Maven

# 3. Registering a ShutdownHook in Quartz and Implementing an Existing Job as an Interruptable Job

To gracefully shut down a running Job, you only need to configure two things.

# 3.1 Registering a ShutdownHook for the SchedulerFactoryBean in the Quartz Configuration

The SchedulerFactoryBean used in Quartz implements the SmartLifeCycle interface.

```java
public class SchedulerFactoryBean extends SchedulerAccessor implements FactoryBean<Scheduler>,
BeanNameAware, ApplicationContextAware, InitializingBean, DisposableBean, SmartLifecycle
```

Spring's SmartLifeCycle is a callback interface that has methods for various lifecycles, and the defined methods are called when the application shuts down or starts.

Register a Shutdown Hook by defining the gracefulShutdownHookForQuartz method as a bean in the QuartzConfiguration file.

```java
@Bean
public SmartLifecycle gracefulShutdownHookForQuartz(@Qualifier("schedulerFactoryBean") SchedulerFactoryBean schedulerFactoryBean) {
   return new SmartLifecycle() {
      private boolean isRunning = false;
 
      @Override
      public boolean isAutoStartup() {
         return true;
      }
 
      @Override
      public void stop(Runnable callback) {
         stop();
         log.info("Spring container is shutting down.");
         callback.run();
      }
 
      @Override
      public void start() {
         log.info("Quartz Graceful Shutdown Hook started.");
         isRunning = true;
      }
 
      @Override
      public void stop() {
         isRunning = false;
 
         try {
            log.info("Quartz Graceful Shutdown...");
            interruptJobs(schedulerFactoryBean);
            schedulerFactoryBean.destroy();
         } catch (SchedulerException e) {
            try {
               log.info("Error shutting down Quartz: ", e);
               schedulerFactoryBean.getScheduler().shutdown(false);
            } catch (SchedulerException ex) {
               log.error("Unable to shutdown the Quartz scheduler.", ex);
            }
         }
      }
 
      @Override
      public boolean isRunning() {
         return isRunning;
      }
 
      @Override
      public int getPhase() {
         return Integer.MAX_VALUE;
      }
   };
}
```

Since we need to shut down gracefully, the method we are interested in is the stop() method. When this method is called, it queries all currently running Jobs in the Quartz scheduler and calls the interrupt() method of the running Jobs. I'll explain how the Job can handle this in the next section.

```java
private void interruptJobs(SchedulerFactoryBean schedulerFactoryBean) throws SchedulerException {
   Scheduler scheduler = schedulerFactoryBean.getScheduler();
   for (JobExecutionContext jobExecutionContext : scheduler.getCurrentlyExecutingJobs()) {
      final JobDetail jobDetail = jobExecutionContext.getJobDetail();
      log.info("interrupting job :: jobKey : {}", jobDetail.getKey());
      scheduler.interrupt(jobDetail.getKey());
   }
}
```

3.2 Implementing a Quartz Job by Implementing the InterruptableJob Interface

To implement an interruptable Job, you implement the InterruptableJob interface and implement the interrupt() method. As you may have already guessed, on shutdown it is called by the stop() method of the SmartLifeCycle defined in 3.1, and it interrupts the thread of the currently running Job.

```java
public class CronJob2 extends QuartzJobBean implements InterruptableJob {
    private volatile boolean isJobInterrupted = false;
    …(omitted)…
 
    @Override
    public void executeInternal(JobExecutionContext context) throws JobExecutionException {
        JobKey jobKey = context.getJobDetail().getKey();
        if (!isJobInterrupted) { //use the flag value to exclude it from the next schedule
            …(omitted)...
        }
    }
 
    @Override
    public void interrupt() {
        isJobInterrupted = true; //set the flag to indicate it has been interrupted
        if (currThread != null) {
            log.info("interrupting - {}", currThread.getName());
            currThread.interrupt(); //if the thread is paused, wake it up immediately to run
        }
    }
}
```

# 4. Wrap-up

We looked at how to gracefully shut down a running Job. The next post is the last in the Quartz tutorial series, where we'll look at implementing the Quartz admin UI.

# 5. References

* On Servlet startup
    * [https://karismamun.tistory.com/46](https://karismamun.tistory.com/46)
* Spring SmartLifeCyle
    * [https://jjhwqqq.tistory.com/155](https://jjhwqqq.tistory.com/155)
    * [https://krksap.tistory.com/1240](https://krksap.tistory.com/1240)
* Interrupt
    * [https://m.blog.naver.com/PostView.nhn?blogId=qbxlvnf11&logNo=221106055566&proxyReferer=https%3A%2F%2Fwww.google.com%2F](https://m.blog.naver.com/PostView.nhn?blogId=qbxlvnf11&amp;logNo=221106055566&amp;proxyReferer=https%3A%2F%2Fwww.google.com%2F)
    * [https://blog.naver.com/qbxlvnf11/220921178603?proxyReferer=http%3A%2F%2Fblog.naver.com%2FPostView.nhn%3FblogId%3Dqbxlvnf11%26logNo%3D220945432938%26parentCategoryNo%3D%26categoryNo%3D12%26viewDate%3D%26isShowPopularPosts%3Dtrue%26from%3Dsearch](https://blog.naver.com/qbxlvnf11/220921178603?proxyReferer=http%3A%2F%2Fblog.naver.com%2FPostView.nhn%3FblogId%3Dqbxlvnf11%26logNo%3D220945432938%26parentCategoryNo%3D%26categoryNo%3D12%26viewDate%3D%26isShowPopularPosts%3Dtrue%26from%3Dsearch)
    * [http://blog.naver.com/PostView.nhn?blogId=qbxlvnf11&logNo=220945432938&parentCategoryNo=&categoryNo=12&viewDate=&isShowPopularPosts=true&from=search](http://blog.naver.com/PostView.nhn?blogId=qbxlvnf11&amp;logNo=220945432938&amp;parentCategoryNo=&amp;categoryNo=12&amp;viewDate=&amp;isShowPopularPosts=true&amp;from=search)
