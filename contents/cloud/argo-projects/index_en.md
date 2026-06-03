---
title: "Argo Projects"
description: "An overview of the Argo Project, a suite of Kubernetes tools for running, deploying, and automating applications and jobs."
date: 2022-03-04
update: 2022-03-04
tags:
  - argo
  - argocd
  - events
  - workflow
  - cloud
series: "ArgoCD"
---


# Argo Projects?

The Argo Project is a set of Kubernetes tools that run applications and jobs or help with deployments in a Kubernetes environment. Every Argo program is implemented with `CRD (Custom Resource Definition)` and the user's Kubernetes cluster. There are currently four major sub-projects, and while each program can be used independently, they become even more powerful tools when used together.

## What?

- `Argo Workflows`
    - A container-based workflow engine

        - Jobs are executed at the container level rather than as processes

        - Supports various execution methods

            - ex. sequence, parallel, with dependency w/ DAG, etc

- `Argo Events`
    - An event-driven workflow automation framework tool for Kubernetes

        - It provides various Events and Triggers like the ones below, and performs the role of triggering when an Event occurs

        - Events Source (20+):

            - Github, NATS, File, NATS, MQTT, Slack, Webhooks, HDFS, K8s Resources, Kafka, Redis, etc

        - Triggers (10+)

            - Argo Workflow, Argo Rollouts, k8s Object, AWS Lambda, AWS Lamda, NATS message, Kafka message, Log, Slack Notification, etc

- [`Argo CD`](https://blog.advenoh.pe.kr/argo-cd/)
    - A declarative GitOps-based CD (Continuous Deployment) tool

- `Argo Rollouts`
    - A tool that supports Progressive Delivery

    - Supports several deployment methods

    - ex. canary, blue/green, rolling updates, etc


### References

- https://github.com/terrytangyuan/awesome-argo

## Who?

- The company Applatix created Argo and provided it as open source to the cloud-native developer community
- In 2018, a company called Intuit acquired Applatix
- In 2020, the Argo project was approved as a CNCF Incubator project
- It is currently maintained by several companies

### References

- https://argoproj.github.io/
- https://www.intuit.com/blog/innovation/cloud-native-computing-foundation-accepts-argo-as-an-incubator-project/
- https://www.intuit.com/blog/innovation/welcome-applatix-to-the-intuit-team/
- https://blog.argoproj.io/argo-goes-to-cncf-incubator-f0e9dfb40597


## Where?

- More than 180 companies are actively using it in production

- ex. Adobe, Alibaba Cloud, Data Dog, Datastax, Google, GitHub, IBM, MLB, NVIDIA, Red Hat, SAP, Tesla, Ticketmaster, Daangn Market, LINE

## Reference

- https://argoproj.github.io/

## Note

> This content is material prepared for our Platform Engineering team's internal CNCF study. If you are interested in the robotics platform development we work on, please refer to the links below, and if you are someone who wants to work together with challenge and passion, we encourage you to apply.
>
> - Why did Naver build its second headquarters, 1784?  https://www.youtube.com/watch?v=WG7JHLfClEo
> - Naver Labs - https://www.naverlabs.com/
