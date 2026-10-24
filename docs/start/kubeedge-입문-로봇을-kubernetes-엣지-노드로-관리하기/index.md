---
title: "KubeEdge 입문 - 로봇을 Kubernetes 엣지 노드로 관리하기"
description: "로봇을 Kubernetes 노드로 붙이면 무엇이 문제인지, KubeEdge가 이를 어떻게 해결하는지 구조와 설치 흐름으로 정리한다"
date: 2026-10-25
update: 2026-10-25
tags:
  - kubeedge
  - kubernetes
  - k8s
  - edge-computing
  - ros2
  - robot
  - 쿠버네티스
  - 엣지컴퓨팅
  - 로봇
---

# 1. 들어가며

2026년 9월 22일부터 24일까지 캐나다 토론토에서 열린 ROSCon Global 2026에 다녀왔다. 행사 앱(Whova)으로 열린 작은 모임 중에 Kubernetes와 KubeEdge로 ROS를 운영하는 이야기를 나누는 자리가 있어서 참석했다. 15분 정도 서서 궁금한 것을 묻고 답을 듣는 형식이었다.

모임을 연 사람은 Tomoya Fujita였다. KubeEdge SIG Robotics의 chair 중 한 명이고 ROS PMC(Project Management Committee) 위원이다. ROSCon 2023에서 [ROS with Kubernetes/KubeEdge](https://roscon.ros.org/2023/talks/ROS_with_KubernetesKubeEdge.pdf)를 발표했고, 이 글에서 계속 참고할 [ros_k8s](https://github.com/fujitatomoya/ros_k8s) 저장소를 만들었다.

ros_k8s는 ROS와 ROS 2를 Kubernetes·KubeEdge 클러스터에서 돌려 보는 튜토리얼 저장소다. 실물 장비(Ubuntu PC, Raspberry Pi)나 kind 같은 가상 환경에 클러스터를 꾸리고 ROS 2 앱을 배포하는 절차가 문서로 정리되어 있다. 다만 KubeEdge 설치 문서는 명령을 따라가는 데 집중되어 있어서, KubeEdge가 무엇이고 왜 그렇게 구성하는지는 따로 공부해야 했다. 모임에서 나눈 이야기를 계기로 그 빈 곳을 채우며 정리한 것이 이 글이다.

**이 글에서 다루는 것**

- 로봇을 그냥 Kubernetes 노드로 붙이면 생기는 문제
- KubeEdge의 구조와, `kubectl apply` 한 번으로 로봇에 파드가 뜨기까지의 흐름
- 클라우드와 연결이 끊기거나 로봇이 재부팅될 때 일어나는 일
- keadm으로 로봇 한 대를 엣지 노드로 붙이는 4단계 설치
- 로봇에 적용할 때 잘 맞는 점과 주의할 점

# 2. 왜 로봇에 Kubernetes인가

Tomoya Fujita가 ROS TSC에서 발표한 [ROS with Kubernetes](https://www.slideshare.net/slideshow/rostscrosk8s20230309pdf/256331489)는 이 질문에서 출발한다. 지금은 환경마다 앱을 배포하는 방식이 따로다.

| 환경 | 지금 배포하는 방식 |
|---|---|
| 클라우드 | 컨테이너와 Kubernetes. 개발자는 kubectl·Helm·GitOps로 배포한다 |
| IoT 장치 | 장치별로 정적으로 구현되어 있어 바꾸기 어렵다 |
| 로봇 | 로봇마다 환경을 구성하고 설치한다 |

클라우드와 엣지 장치는 아키텍처부터 다르다. 그래서 같은 앱이라도 환경마다 구성하고 실행하는 데 시간과 노력이 따로 든다.

로봇과 IoT 장치도 Kubernetes 노드로 만들면 이야기가 달라진다. 클라우드 앱을 배포하던 방식 그대로 어디에든 배포할 수 있고, Kubernetes가 원래 갖고 있는 기능을 로봇에서도 쓸 수 있다.

- 라벨로 배포 대상을 고른다 (예: 배달 로봇만, 특정 현장의 로봇만)
- Rolling·Canary 방식으로 업데이트한다
- 앱이 죽으면 자동으로 복구한다
- 하드웨어를 추상화한다
- 관측하고 확장한다

로봇은 여러 대가 협업하고, 센싱 결과에 따라 앱을 올리고 내리며, 문제가 생기면 스스로 복구되어야 한다. 클라우드에서 쓰던 배포·운영 방식을 엣지까지 가져오려는 것이 로봇에 Kubernetes를 쓰려는 동기다.

그런데 로봇을 그냥 Kubernetes 노드로 붙이면 몇 가지 문제가 생긴다. 그 전에 Kubernetes가 노드를 어떻게 다루는지부터 짚는다.

# 3. Kubernetes 기본

# 4. KubeEdge가 필요한 이유

# 5. KubeEdge 구조

# 6. KubeEdge 설치

# 7. 장단점과 정리

# 8. FAQ

# 9. 마치며

# 10. 참고
