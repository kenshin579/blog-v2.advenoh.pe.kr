---
title: "How to Use kcat"
description: "A practical guide to producing, consuming, and inspecting Apache Kafka messages with kcat."
date: 2021-07-20
update: 2021-07-20
tags:
  - kcat
  - kafka
  - kafkacat 
  - 카프카
  - 브로커
  - 메시지
  - 아파치
series: "Apache Kafka"
---


`kcat` is a handy tool for easily testing and debugging Apache Kafka. With the `kcat` command you can send and receive messages or list metadata. Let's take a look at the basic usage. For Kafka installation, please refer to [Running Kafka in a local environment](https://blog.advenoh.pe.kr/로컬환경에서-kafka-실행하기-with-akhq/).

# 1. Installing kcat

There are several ways to install it, but this post explains the installation based on macOS. Install `kcat` with `brew`.


```bash
$ brew install kcat
```


# 2. Basic Usage of kcat

## 2.1 Basic Syntax

The basic command format of `kcat` is as follows.

```bash
$ kcat <mode> -b <brokers> -t new_topic
```

- `-C | -P | -L | -Q  Mode`
    - Specifies the Consume, Produce, Metadata List, or Query mode
- `-t <topic>`
    - Specifies the topic
- `-b <brokers, ...>`
    -  Specifies the list of brokers

# 3. Sending Messages (-P)

You can send messages by specifying the Produce (`-P`) mode. You must specify the Kafka broker (`-b`) and topic option (`-t`) as required arguments. Using `kcat`, you can easily send messages to a specific topic. Run the command with `-P`, type in the data you want, and then press `Ctrl-D` to finish.

## 3.1 Producing Message Values

```bash
$ kcat -b localhost:29092 -t test -P
11
22
```

To verify that the messages were sent correctly, check them with the `-C` consume mode.

```bash
$ kcat -b localhost:29092 -t test -C
11
22
```

## 3.2 Producing Messages with Keys and Values

If you want to produce a message together with a key, use the key delimiter (`-K`) option to specify the delimiter you want.

```bash
$ kcat -b localhost:29092 -t test -P -K :
key1:msg1
key2:msg2
```

## 3.3 Producing Messages from a File

You can also produce messages by reading them from a file.

```bash
$ cat msg.txt
key1:msg1
key2:msg2
key3:msg3

$ kcat -b localhost:29092 -t test -P -K: msg.txt
```

A partition is the unit by which data is distributed across each topic. In Kafka, a topic is divided and stored across several partitions, and each partition is replicated across brokers as many times as the number of replicas specified in the Kafka options.

If you have configured a topic with multiple partitions, you can send and receive messages on partition 1 as shown below.

```bash
$ kcat -b localhost:29092 -t test -P -p 1 
hello world

$ kcat -b localhost:29092 -t test -C -p 1
hello world
```

## 3.4 Increasing the Number of Partitions for a Topic

To increase the number of partitions for a topic, you can add partitions using the script provided by Kafka as shown below.

```bash
# Launch a my-kafka-client POD to use the kafka script
$ kubectl run my-kafka-client --restart='Never' --image docker.io/bitnami/kafka:2.8.0-debian-10-r30 --namespace default --command -- sleep infinity
$ kubectl exec -it my-kafka-client -- /bin/bash

# Check the current number of partitions
$ kafka-topics.sh --describe --zookeeper my-kafka-zookeeper:2181 --topic test
\Topic: test	TopicId: sLitGkHfRSyg261FxMoGCA	PartitionCount: 1	ReplicationFactor: 1	Configs:
	Topic: test	Partition: 0	Leader: 1	Replicas: 1	Isr: 1
```

```bash
# Increase the number of partitions for the test topic to 3
$ kafka-topics.sh --zookeeper my-kafka-zookeeper:2181 --alter --topic test --partitions 3
WARNING: If partitions are increased for a topic that has a key, the partition logic or ordering of the messages will be affected
Adding partitions succeeded!

# Check the updated number of partitions
$ kafka-topics.sh --describe --zookeeper my-kafka-zookeeper:2181 --topic test
Topic: test	TopicId: sLitGkHfRSyg261FxMoGCA	PartitionCount: 3	ReplicationFactor: 1	Configs:
	Topic: test	Partition: 0	Leader: 1	Replicas: 1	Isr: 1
	Topic: test	Partition: 1	Leader: 2	Replicas: 2	Isr: 2
	Topic: test	Partition: 2	Leader: 0	Replicas: 0	Isr: 0
```

> In Kafka, once you increase the number of partitions there is no way to decrease it, so in a real environment you need to carefully determine whether it is truly necessary before increasing it.

# 4. Receiving Messages (-D)

## 4.1 Receiving All Messages from a Topic

By default, without any additional options, `kcat` fetches all messages from the beginning of the topic.

```bash
$ kcat -b localhost:29092 -t test -P
11
22
33
44

$ kcat -b localhost:29092 -t test -C
11
22
33
44
```

## 4.2 Receiving Only N Messages

Instead of fetching all messages, if you want to fetch only a few, specify the count with the `-c` option.

```bash
$ kcat -b localhost:29092 -t test -C -c 2
11
22
```

## 4.3 Fetching Messages from a Specific Offset

The `-o` option fetches data starting from a specific offset.

```bash
$ kcat -b localhost:29092 -t test -C -o 1
22
33
44
```

> You can specify the offset as an absolute value, but you can also specify the beginning and the end with `begining` or `end`.
>
> `$ kcat -b my-kafka.default.svc.cluster.local:9092 -t test -C -o begining`

If you specify a negative offset value, it fetches messages from the end.

```bash
$ kcat -b localhost:29092 -t test -C -o -2
33
44
```

## 4.4 Changing the Output Format

By default, `kcat` outputs only the message value (the value of the Kafka record). To change the output format, you can define it using various values with the `-f` option as shown below.

```bash
Format string tokens:
  %s                 Message payload
  %S                 Message payload length (or -1 for NULL)
  %k                 Message key
  %K                 Message key length (or -1 for NULL)
  %t                 Topic
  %p                 Partition
  %o                 Message offset
  \n \r \t           Newlines, tab
  \xXX \xNNN         Any ASCII character
```

You can output the Key, Value, Partition, and Offset values in an easy-to-read way.

```bash
$ kcat -b localhost:29092 -t test -C  -f '\nKey (%K bytes): %k\t\nValue (%S bytes): %s\n\tPartition: %p\tOffset: %o\n--\n'

Key (-1 bytes):
Value (2 bytes): 11
	Partition: 0	Offset: 0
--

Key (-1 bytes):
Value (2 bytes): 22
	Partition: 0	Offset: 1
--

Key (-1 bytes):
Value (2 bytes): 33
	Partition: 0	Offset: 2
--

Key (-1 bytes):
Value (2 bytes): 44
	Partition: 0	Offset: 3
--

```



# 5. Querying Metadata (-L)

To check information about the brokers or the current topic, you can use the `-L` option. The cluster consists of 3 brokers in total, and you can also check how many partitions each topic is composed of.

```bash
$ kcat -L -b localhost:29092
Metadata for all topics (from broker -1: my-kafka.default.svc.cluster.local:9092/bootstrap):
 3 brokers:
  broker 0 at my-kafka-0.my-kafka-headless.default.svc.cluster.local:9092
  broker 2 at my-kafka-2.my-kafka-headless.default.svc.cluster.local:9092
  broker 1 at my-kafka-1.my-kafka-headless.default.svc.cluster.local:9092
 3 topics:
  topic "test" with 3 partitions:
    partition 0, leader 1, replicas: 1, isrs: 1
    partition 2, leader 0, replicas: 0, isrs: 0
    partition 1, leader 2, replicas: 2, isrs: 2
  topic "test1" with 1 partitions:
    partition 0, leader 0, replicas: 0, isrs: 0
  topic "__consumer_offsets" with 50 partitions:
    partition 0, leader 2, replicas: 2, isrs: 2
    partition 10, leader 1, replicas: 1, isrs: 1
    partition 20, leader 0, replicas: 0, isrs: 0
    partition 40, leader 1, replicas: 1, isrs: 1
    ...omitted...
```



# 6. References

- https://docs.confluent.io/platform/current/app-development/kafkacat-usage.html
- https://github.com/edenhill/kafkacat
- https://dev.to/de_maric/learn-how-to-use-kafkacat-the-most-versatile-kafka-cli-client-1kb4
- https://codingharbour.com/kafkacat-cheatsheet/
- https://docs.confluent.io/platform/current/tutorials/examples/clients/docs/kafkacat.html#client-examples-kafkacat
- https://wonyong-jang.github.io/kafka/2021/02/10/Kafka-message-order.html
- https://redhat-developer-demos.github.io/kafka-tutorial/kafka-tutorial/1.0.x/03-consumers-producers.html
