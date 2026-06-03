---
title: "Implementing a Job Scheduler Using Spring Boot + Quartz (In-memory)"
description: "How to build an in-memory Quartz job scheduler with Spring Boot using RAMJobStore."
date: 2019-09-09
update: 2019-09-09
tags:
  - quartz
  - spring
  - job
  - scheduler
  - memory
  - 메모리기반
  - 스케줄러
  - 스케줄
  - 스프링
  - 스프링부트
  - 분산환경
  - 다중서버
  - multiple server
  - distributed environment
series: "Spring Quartz"
---

# 1. Introduction

This post is part of the Quartz tutorial series, and following the first post [What Is the Quartz Job Scheduler?](https://blog.advenoh.pe.kr/quartz-job-scheduler란/), this is Part 2, covering the implementation of a Quartz scheduler using RAMJobStore on a Spring Boot basis. Since the basic concepts were already covered in Part 1, here let's look at how to configure and use Quartz in Spring based on the code we wrote.

# 2. Development Environment

To use Quartz in Spring Boot, you need to add the spring-boot-starter-quartz library. Add the following to the pom.xml maven file.

```xml

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-quartz</artifactId>
</dependency>
```

* OS : Mac OS
* IDE: Intellij
* Java : JDK 1.8
* Source code : [github](https://github.com/kenshin579/tutorials-java/tree/master/springboot-quartz-in-memory)
* Software management tool : Maven

# 3. Building a Spring Boot-Based Quartz Scheduler

## 3.1 Quartz-Related Configuration

### 3.1.1 Spring JavaConfig

Spring's SchedulerFactoryBean can be declared as a Bean and used via DI (dependency injection) in other classes.

```java
@Component
public class ScheduleServiceImpl implements ScheduleService {
 
    @Autowired
    private SchedulerFactoryBean schedulerFactoryBean;
```

And as mentioned in the [first post](https://blog.advenoh.pe.kr/spring/quartz-job-scheduler%EB%9E%80/), SchedulerFactoryBean manages the Scheduler in a lifecycle form within the ApplicationContext.

The Listener and Quartz-related settings are also specified here.

```java
@Bean
public SchedulerFactoryBean schedulerFactoryBean(ApplicationContext applicationContext) {
   SchedulerFactoryBean schedulerFactoryBean = new SchedulerFactoryBean();
 
   AutowiringSpringBeanJobFactory jobFactory = new AutowiringSpringBeanJobFactory();
   jobFactory.setApplicationContext(applicationContext);
   schedulerFactoryBean.setJobFactory(jobFactory);
 
   schedulerFactoryBean.setApplicationContext(applicationContext);
   
   Properties properties = new Properties();
   properties.putAll(quartzProperties.getProperties());
 
   schedulerFactoryBean.setGlobalTriggerListeners(triggersListener);
   schedulerFactoryBean.setGlobalJobListeners(jobsListener);
   schedulerFactoryBean.setOverwriteExistingJobs(true);
   schedulerFactoryBean.setQuartzProperties(properties);
   schedulerFactoryBean.setWaitForJobsToCompleteOnShutdown(true);
   return schedulerFactoryBean;
}
```

### 3.1.2 Quartz-Related Settings

In Spring Boot, you configure the Quartz-related settings in application.properties. If there are no related settings, it runs with default values. Since there are many settings related to ThreadPool, Scheduler Setting, JobStore, etc., please refer to the [Quartz Configuration](http://www.quartz-scheduler.org/documentation/quartz-2.3.0/configuration/ConfigMain.html) documentation. In the example, only 5 threadCount is created and the scheduler thread name prefix is specified as QuartzScheduler.

```
#Quartz
spring.quartz.scheduler-name=QuartzScheduler
spring.quartz.properties.org.quartz.threadPool.threadCount = 5
```

## 3.2 Implementing the Scheduler Controller and ScheduleService

The sample project provides the following APIs so that users can easily register, delete, and query their defined Jobs.

* Scheduler APIs to provide
    * Add Job : POST _scheduler_job
    * Query all registered Jobs : GET _scheduler_jobs
    * Delete Job : DELETE _scheduler_job
    * Pause Job : PUT _scheduler_job/pause
    * Resume Job : PUT _scheduler_job/resume

Looking at the controller and service logic, the basic logic is simple, so let's explain only a few APIs. Let's look at the Job to run first.

### 3.2.1 Implementing a User Job

The Job task content is to print numbers on the screen according to the specified sleep time.

#### **3.2.1.1 SimpleJob**

This is logic that loops, prints numbers on the screen, rests for the specified sleep time, and then repeats.

```java
public class SimpleJob extends QuartzJobBean {
   private int MAX_SLEEP_IN_SECONDS = 5;
   private volatile Thread currThread;
 
   @Override
   protected void executeInternal(JobExecutionContext context) throws JobExecutionException {
      JobKey jobKey = context.getJobDetail().getKey();
      currThread = Thread.currentThread();
 
      IntStream.range(0, 5).forEach(i -> {
         log.info("SimpleJob Counting - {}", i);
         try {
            TimeUnit.SECONDS.sleep(MAX_SLEEP_IN_SECONDS);
         } catch (InterruptedException e) {
            log.error(e.getMessage(), e);
         }
      });
   }
}
```

#### **3.2.1.2 CronJob**

The CronJob implementation is the same as SimpleJob, and additionally it receives the jobId via JobDataMap and prints it on the screen.

```java
public class CronJob extends QuartzJobBean {
   private int MAX_SLEEP_IN_SECONDS = 5;
   private volatile Thread currThread;
 
   @Override
   protected void executeInternal(JobExecutionContext context) throws JobExecutionException {
      JobDataMap jobDataMap = context.getJobDetail().getJobDataMap();
      int jobId = jobDataMap.getInt("jobId");
      JobKey jobKey = context.getJobDetail().getKey();
 
      currThread = Thread.currentThread();
 
     … (omitted) ...
      log.info("CronJob ended :: jobKey : {} - {}", jobKey, currThread.getName());
   }
}
```

### 3.2.2 Add Job API

#### **3.2.2.1 Adding a Job in the Controller**

In the Quartz scheduler, you can add Jobs in SimpleJob and CronJob forms, so I added a conditional to register as a CronJob when there is a cron expression.

```java
@RequestMapping(value = "/job", method = RequestMethod.POST)
public ResponseEntity<?> addScheduleJob(@ModelAttribute JobRequest jobRequest) {
… (omitted) … 
 
   JobKey jobKey = new JobKey(jobRequest.getJobName(), jobRequest.getJobGroup());
   if (!scheduleService.isJobExists(jobKey)) {
      if (jobRequest.getCronExpression() == null) {
         scheduleService.addJob(jobRequest, SimpleJob.class);
      } else {
         scheduleService.addJob(jobRequest, CronJob.class);
      }
   } else {
      return new ResponseEntity<>(new ApiResponse(false, "Job already exits"),
            HttpStatus.BAD_REQUEST);
   }
   return new ResponseEntity<>(new ApiResponse(true, "Job created successfully"), HttpStatus.CREATED);
}
```

#### **3.2.2.2 Adding a Job in the ScheduleService**

It creates a Trigger and JobDetail from the Job name, group, Cron expression, etc. provided by the user, and registers the job with Quartz using the schedulerJob() method.

```java
@Override
public boolean addJob(JobRequest jobRequest, Class<? extends Job> jobClass) {
    JobKey jobKey = null;
    JobDetail jobDetail;
    Trigger trigger;
 
    try {
        trigger = JobUtils.createTrigger(jobRequest);
        jobDetail = JobUtils.createJob(jobRequest, jobClass, context);
        jobKey = JobKey.jobKey(jobRequest.getJobName(), jobRequest.getJobGroup());
 
        Date dt = schedulerFactoryBean.getScheduler().scheduleJob(jobDetail, trigger);
        log.debug("Job with jobKey : {} scheduled successfully at date : {}", jobDetail.getKey(), dt);
        return true;
    } catch (SchedulerException e) {
        log.error("error occurred while scheduling with jobKey : {}", jobKey, e);
    }
    return false;
}
```

The service logic can also be easily checked with a unit test. I wrote it by referring to the Quartz source code.

```java
@Test
public void addJob() {
    JobRequest jobRequest = new JobRequest();
    jobRequest.setCronExpression("0/10 * * ? * *");
    jobRequest.setJobName(jobName);
    jobRequest.setJobGroup(groupName);
 
    when(schedulerFactoryBean.getScheduler()).thenReturn(scheduler);
 
    boolean result = scheduleService.addJob(jobRequest, CronJob.class);
    assertThat(result).isTrue();
 
    verify(schedulerFactoryBean).getScheduler();
}
```

### 3.2.3 Query All Registered Jobs API

The information about currently registered Jobs in the Scheduler can also be easily obtained through the various methods provided by the scheduler. In addition to individual Job information, it also counts some simple statistics and returns them as the response value.

```java
@Override
public JobStatusResponse getAllJobs() {
    JobResponse jobResponse;
    JobStatusResponse jobStatusResponse = new JobStatusResponse();
    List<JobResponse> jobs = new ArrayList<>();
    int numOfRunningJobs = 0;
    int numOfGroups = 0;
    int numOfAllJobs = 0;
 
    try {
        Scheduler scheduler = schedulerFactoryBean.getScheduler();
        for (String groupName : scheduler.getJobGroupNames()) {
            numOfGroups++;
            for (JobKey jobKey : scheduler.getJobKeys(GroupMatcher.jobGroupEquals(groupName))) {
                List<Trigger> triggers = (List<Trigger>) scheduler.getTriggersOfJob(jobKey);
 
                jobResponse = JobResponse.builder()
                        .jobName(jobKey.getName())
                        .groupName(jobKey.getGroup())
                        .scheduleTime(DateTimeUtils.toString(triggers.get(0).getStartTime()))
                        .lastFiredTime(DateTimeUtils.toString(triggers.get(0).getPreviousFireTime()))
                        .nextFireTime(DateTimeUtils.toString(triggers.get(0).getNextFireTime()))
                        .build();
 
                if (isJobRunning(jobKey)) {
                    jobResponse.setJobStatus("RUNNING");
                    numOfRunningJobs++;
                } else {
                    String jobState = getJobState(jobKey);
                    jobResponse.setJobStatus(jobState);
                }
                numOfAllJobs++;
                jobs.add(jobResponse);
            }
        }
    } catch (SchedulerException e) {
        log.error("[schedulerdebug] error while fetching all job info", e);
    }
 
    jobStatusResponse.setNumOfAllJobs(numOfAllJobs);
    jobStatusResponse.setNumOfRunningJobs(numOfRunningJobs);
    jobStatusResponse.setNumOfGroups(numOfGroups);
    jobStatusResponse.setJobs(jobs);
    return jobStatusResponse;
}
```

It returns the response value as below.

```json
{
  "numOfAllJobs": 3,
  "numOfGroups": 1,
  "numOfRunningJobs": 2,
  "jobs": [
    {
      "jobName": "cronJob1",
      "groupName": "DEFAULT",
      "jobStatus": "RUNNING",
      "scheduleTime": "2019-09-09 22:08:16",
      "lastFiredTime": "2019-09-09 22:10:00",
      "nextFireTime": "2019-09-09 22:11:00"
    },
    …(omitted)...
  ]
}
```

### 3.2.4 Listeners

#### **3.2.4.1 TriggerListener**

As you can easily tell from the method names, these are methods that are called when events occur (e.g. triggerFire, triggerMisfired).

The vetoJobExecution method is a method that can decide whether to veto (reject, prohibit) the corresponding Trigger; if true, it vetoes so the Job does not run, and if false, it does not veto so the Job can run, making it a method where you can put in specific conditions to decide whether to execute.

```java
@Component
public class TriggersListener implements TriggerListener {
    …(omitted)…
 
    @Override
    public void triggerFired(Trigger trigger, JobExecutionContext context) {
        JobKey jobKey = trigger.getJobKey();
        log.info("triggerFired at {} :: jobKey : {}", trigger.getStartTime(), jobKey);
    }
 
    @Override
    public boolean vetoJobExecution(Trigger trigger, JobExecutionContext context) {
        return false;
    }
 
    @Override
    public void triggerMisfired(Trigger trigger) {
        JobKey jobKey = trigger.getJobKey();
        log.info("triggerMisfired at {} :: jobKey : {}", trigger.getStartTime(), jobKey);
    }
 
    @Override
    public void triggerComplete(Trigger trigger, JobExecutionContext context,
                        Trigger.CompletedExecutionInstruction triggerInstructionCode) {
        JobKey jobKey = trigger.getJobKey();
        log.info("triggerComplete at {} :: jobKey : {}", trigger.getStartTime(), jobKey);
    }
}
```

#### **3.2.4.2 JobListener**

For JobListener too, you can easily tell from the method names which methods are called when events occur. jobExecutionVetoed is called when the TriggersListener.vetoJobExecution() method vetoes.

```java
@Component
public class JobsListener implements JobListener {
…(omitted)…
 
   @Override
   public void jobToBeExecuted(JobExecutionContext context) {
      JobKey jobKey = context.getJobDetail().getKey();
      log.info("jobToBeExecuted :: jobKey : {}", jobKey);
   }
 
   @Override
   public void jobExecutionVetoed(JobExecutionContext context) {
      JobKey jobKey = context.getJobDetail().getKey();
      log.info("jobExecutionVetoed :: jobKey : {}", jobKey);
   }
 
   @Override
   public void jobWasExecuted(JobExecutionContext context, JobExecutionException jobException) {
      JobKey jobKey = context.getJobDetail().getKey();
      log.info("jobWasExecuted :: jobKey : {}", jobKey);
   }
}
```

# 4. Wrap-up

Quartz provides various Scheduler features (scheduler, unschedule, pause, resume, stop), so you can implement scheduling features well within an application. In this post, we looked at how to configure and use Quartz in Spring. Because it uses RAMJobStore by default and the scheduling information is stored in memory, it is not suitable for multi-server environments. Let's look at how to configure Quartz for server redundancy in the next post.

# 5. References

* Quartz official site
    * [http://www.quartz-scheduler.org](http://www.quartz-scheduler.org/)
* Spring Boot Quartz Scheduler
    * [https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-quartz.html](https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-quartz.html)
    * [https://www.baeldung.com/spring-quartz-schedule](https://www.baeldung.com/spring-quartz-schedule)
    * [https://gs.saro.me/dev?tn=549](https://gs.saro.me/dev?tn=549)
