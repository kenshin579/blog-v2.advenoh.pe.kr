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

KubeEdge를 이해할 때 핵심은 Kubernetes의 **어느 부분을 바꾸는지**다. 그래서 Kubernetes 전체가 아니라 바뀌는 부분 위주로 짧게 짚는다.

## 3.1 control plane과 node

```mermaid
flowchart LR
    subgraph CP["control plane"]
        API["kube-apiserver"]
        ETCD[("etcd")]
        SCH["kube-scheduler"]
        CM["kube-controller-manager"]
        API --- ETCD
        SCH --> API
        CM --> API
    end
    subgraph N["worker node"]
        KL["kubelet"]
        CRT["containerd"]
        KP["kube-proxy"]
        CNI["CNI 플러그인"]
        KL --> CRT
    end
    KL -- "list-watch / 상태 보고" --> API
    API -- "logs / exec" --> KL
    KP --> API
```

control plane은 "무엇을 어디에 띄울지" 결정해서 기록하고, 각 노드가 그 결정을 실행한다. 컴포넌트끼리는 서로 직접 말하지 않고 모두 API 서버를 거친다. 스케줄러가 kubelet에게 "이거 띄워"라고 말하는 대신 API 서버에 기록하고, kubelet이 그 기록을 보고 움직이는 식이다.

| 구분 | 컴포넌트 | 하는 일 |
|---|---|---|
| control plane | kube-apiserver | 클러스터의 모든 읽기·쓰기를 받는 REST API 서버. 다른 컴포넌트는 모두 여기를 거친다 |
| control plane | etcd | 모든 리소스(Deployment, Pod, Service, Node 등)를 저장하는 key-value DB. API 서버만 접근한다 |
| control plane | kube-scheduler | 노드가 정해지지 않은 파드를 찾아 어느 노드에 둘지 정한다. 실행은 하지 않는다 |
| control plane | kube-controller-manager | 원하는 상태와 실제 상태를 비교해 맞추는 컨트롤러(Deployment, ReplicaSet, Node 등) 묶음 |
| node | kubelet | 노드마다 systemd 서비스로 도는 에이전트. 배정된 파드를 watch해 containerd로 띄우고, 상태와 하트비트를 보고한다 |
| node | containerd | 컨테이너를 실제로 만드는 런타임. kubelet과는 CRI(Container Runtime Interface)로 이야기한다 |
| node | kube-proxy | Service의 ClusterIP로 들어온 요청을 실제 파드 IP로 보내는 iptables/IPVS 규칙을 노드마다 설치한다 |
| node | CNI 플러그인 | 파드에 IP를 주고 노드 간 파드 통신 경로를 만든다. 없으면 노드가 `NotReady`로 남는다 |

## 3.2 "원하는 상태"와 list-watch

Kubernetes는 "명령"이 아니라 **"원하는 상태"를 저장**하는 방식으로 동작한다.

1. 사용자가 "nginx 파드 3개가 떠 있어야 한다"(Deployment `replicas: 3`)를 API 서버에 저장한다
2. 컨트롤러가 이 변화를 watch하다가 파드 객체 3개를 만든다
3. 스케줄러가 노드가 비어 있는 파드를 발견하고 `spec.nodeName`을 채운다
4. 각 노드의 kubelet이 "`nodeName`이 나인 파드"를 watch하다가 containerd로 컨테이너를 띄운다
5. kubelet이 파드 상태(`Running` 등)를 API 서버에 보고한다

여기서 **list-watch**는 처음에 목록을 한 번 받고(list), 이후에는 바뀐 것만 계속 받는(watch) 방식이다. 모든 컴포넌트가 이 방식으로 API 서버를 지켜본다.

**KubeEdge가 끼어드는 지점은 4·5번, kubelet ↔ API 서버 구간이다.** 나머지는 그대로 두고 이 구간만 바꾼다는 점을 기억해 두면 뒤의 구조가 쉽게 읽힌다.

## 3.3 노드와 연락이 끊기면

1. 노드의 하트비트가 끊기면 노드 상태가 `Unknown`(화면에는 `NotReady`)으로 바뀌고, 노드에 `node.kubernetes.io/unreachable:NoExecute` taint가 붙는다
2. Kubernetes는 일반 파드에 이 taint를 **300초** 동안만 견디는 toleration을 자동으로 넣는다. 그래서 5분이 지나면 그 노드의 파드가 축출(eviction) 대상이 된다
3. DaemonSet 파드는 이 taint를 기한 없이 견디는 toleration을 받으므로 축출되지 않는다

여기에 하나가 더 있다. 노드와 통신이 끊긴 동안에는 API 서버가 내린 파드 삭제 결정이 그 노드의 kubelet에 전달되지 않는다. 그래서 삭제 대상이 된 파드가 끊긴 노드에서는 계속 돌 수 있다([Kubernetes 문서](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/#taint-based-evictions)). 이 어긋남은 5.4절과 7.2절에서 다시 나온다.

## 3.4 taint와 toleration

taint는 노드에 붙이는 **"이 노드는 피하라"는 표시**다. 파드가 "나는 이 표시를 견딘다"고 선언하면 피하지 않는데, 이 선언이 toleration이다. taint는 `key=value:effect` 모양이고, effect가 무엇을 막을지 정한다.

| effect | 동작 |
|---|---|
| `NoSchedule` | 견디지 못하는 새 파드를 배치하지 않는다. 이미 떠 있는 파드는 그대로 둔다 |
| `PreferNoSchedule` | 되도록 피하지만 보장하지는 않는다 |
| `NoExecute` | 새 파드를 배치하지 않고, 이미 떠 있는 파드 중 견디지 못하는 것은 쫓아낸다(축출) |

taint는 파드를 밀어내기만 하고 끌어당기지 않는다. toleration은 "가도 된다"는 허가일 뿐이라, 특정 노드에 파드를 고정하려면 `nodeSelector`나 node affinity를 함께 쓴다.

## 3.5 정리

이 글에서 계속 쓰일 세 가지다.

1. 모든 것은 API 서버를 거친다
2. 노드 쪽 대리인은 kubelet이다
3. 연결이 끊기면 클라우드는 노드를 의심한다

# 4. KubeEdge가 필요한 이유

클라우드에 Kubernetes 클러스터가 있고, 공장·매장·건물 곳곳에 로봇이 수십 대 있다고 해 보자. 이 로봇들에 컨테이너 앱을 배포하고 버전을 관리하고 싶다. 가장 단순한 방법은 로봇을 **일반 worker 노드로 `kubeadm join`**하는 것이다. 그렇게 하면 다음 문제가 생긴다.

## 4.1 노드와 API 서버가 서로 닿아야 한다

일반 Kubernetes 노드는 **양방향 연결**을 전제한다.

- kubelet → API 서버(6443): 내게 배정된 파드 목록을 받고 상태를 보고한다
- API 서버 → kubelet(10250): `kubectl logs`, `kubectl exec`, `port-forward`를 할 때 API 서버가 kubelet에 **직접 접속**한다
- CNI 오버레이(VXLAN 등)도 노드끼리 직접 통신할 수 있다고 가정한다

로봇은 LTE 라우터나 공유기 뒤, 즉 **NAT 뒤**에 있는 경우가 많다. 로봇에서 클라우드로 나가는 연결은 되지만 클라우드에서 로봇으로 들어오는 연결은 막힌다. 노드 IP도 사설 IP라 클라우드에서 보이지 않는다. 그래서 그냥 join하면 클라우드 → 로봇 방향이 필요한 `logs`·`exec`부터 동작하지 않는다.

## 4.2 회선이 끊기면 클라우드가 노드를 의심한다

3.3절에서 본 대로 하트비트가 끊기면 노드는 `NotReady`가 되고, 5분 뒤 그 노드의 파드가 축출 대상이 된다. 클라우드는 "노드가 죽었다"와 "회선만 끊겼다"를 구분하지 못한다. 로봇은 멀쩡히 일하고 있는데, 클라우드는 그 파드를 지우고 다른 곳에 띄우려는 어긋남이 생긴다.

## 4.3 끊긴 상태에서 재부팅하면 파드를 못 살린다

kubelet은 실행할 파드 목록을 API 서버에서 받아온다(static pod는 예외). 클라우드와 끊긴 상태에서 로봇이 재부팅되면 API 서버에서 목록을 받아올 수 없으니, 무엇을 띄워야 할지 모르는 상태가 된다.

## 4.4 장비가 작고 회선이 느리다

Raspberry Pi나 산업용 게이트웨이 같은 장비는 자원이 넉넉하지 않다. kubelet, kube-proxy, CNI 에이전트, 로그 수집기를 모두 올리면 부담이 된다. LTE처럼 느리고 비싼 회선에서 클러스터 정보를 계속 주고받는 것도 낭비다.

## 4.5 컨테이너가 아닌 장치를 다룰 방법이 없다

Kubernetes는 컨테이너를 관리한다. Modbus 센서, 블루투스 장치, PLC처럼 "컨테이너가 아닌 장치"를 표현할 기본 리소스가 없다.

## 4.6 KubeEdge의 답

| 문제 | KubeEdge의 답 | 자세히 |
|---|---|---|
| NAT 뒤 장비, 양방향 연결 필요 | 엣지가 클라우드로 **먼저 접속**한 터널 하나로 모든 제어를 처리 | 5절 |
| 끊기면 클라우드가 노드를 의심 | 엣지는 클라우드 판단과 상관없이 계속 동작하고, 다시 연결되면 동기화 | 5.4절 |
| 재부팅하면 파드를 못 살림 | 받은 정보를 엣지의 **SQLite에 저장**해 두고 그것으로 다시 띄움 | 5.3절, 5.4절 |
| 장비가 작고 회선이 느림 | kubelet을 줄인 **edgecore** 하나만 설치하고, 그 노드에 필요한 정보만 받음 | 5.1절, 5.3절 |
| 장치를 다룰 방법이 없음 | 장치를 CRD(`Device`, `DeviceModel`)로 표현 | 7.2절 |

한 줄로 정리하면 다음과 같다.

> **KubeEdge는 Kubernetes 클러스터는 클라우드에 그대로 두고, 엣지 장비에는 kubelet 대신 edgecore라는 가벼운 에이전트를 두어, 엣지가 먼저 연결한 터널 하나로 관리하는 프레임워크다.**

KubeEdge는 2018년 11월 Huawei Cloud가 오픈소스로 공개했다. 2019년 CNCF Sandbox에 들어갔고 2020년 9월 Incubating을 거쳐 2024년 10월 CNCF 졸업(Graduated) 프로젝트가 되었다([CNCF 발표](https://www.cncf.io/announcements/2024/10/15/cloud-native-computing-foundation-announces-kubeedge-graduation/)).

# 5. KubeEdge 구조

```mermaid
flowchart TB
    subgraph Cloud["클라우드 (기존 Kubernetes 클러스터)"]
        API["kube-apiserver"]
        CC["CloudCore (kubeedge 네임스페이스 파드)"]
        CC -- "list-watch / 상태 반영" --> API
    end
    subgraph Edge["엣지 장비 (로봇, Raspberry Pi 등)"]
        EC["edgecore (systemd 서비스)"]
        DB[("SQLite")]
        CRT["containerd"]
        P1["앱 파드"]
        P2["앱 파드"]
        EC --- DB
        EC --> CRT --> P1
        CRT --> P2
    end
    EC == "WebSocket/QUIC 터널, 엣지가 먼저 접속" ==> CC
```

- **클라우드**: 기존 Kubernetes를 그대로 쓰고 **CloudCore**가 하나 추가된다. `keadm init`이 Helm chart로 `kubeedge` 네임스페이스에 배포한다
- **엣지**: kubelet 대신 **edgecore**가 systemd 서비스로 돈다. 바이너리 하나이고, 컨테이너 런타임(containerd)은 따로 필요하다
- **연결**: 엣지 → 클라우드 방향으로 **장기 연결 하나**를 맺는다. 클라우드에서 엣지로 새 연결을 열 일이 없으므로 엣지가 NAT 뒤에 있어도 된다. 필요한 것은 클라우드 쪽 포트 개방뿐이다
- **클라우드에서 보이는 모습**: 엣지 장비도 `kubectl get nodes`에 일반 노드처럼 나타난다. ROLES가 `agent,edge`로 표시되고(6.4절), 배포는 평소처럼 `kubectl`이나 Helm으로 한다

역할을 대리인 관계로 보면 이해가 쉽다.

| | 상대방이 보기에 |
|---|---|
| **CloudCore** | 엣지 입장에서 "API 서버의 대리인" |
| **edgecore** | 클라우드 입장에서 "kubelet의 대리인" |

본사(클라우드)와 지점(엣지)에 비유할 수 있다. 지점이 본사에 전화를 걸어 회선을 열어 두고 지시를 받는다. 받은 지시서는 지점 캐비닛(SQLite)에 보관한다. 전화가 끊겨도 지점은 캐비닛을 보고 하던 일을 계속하고, 다시 연결되면 그동안의 일을 보고한다.

## 5.1 `kubectl apply`부터 로봇에 파드가 뜨기까지

1. `kubectl apply`로 Deployment를 저장하면 스케줄러가 엣지 노드를 지정한다
2. CloudCore가 엣지 노드에 배정된 파드를 watch한다
3. 엣지가 먼저 열어 둔 터널로 파드 정보를 엣지에 밀어 준다(push)
4. edgecore가 받은 정보를 SQLite에 먼저 저장하고 ACK를 보낸다
5. containerd로 이미지를 받고 컨테이너를 실행한다
6. 상태(`Running`)를 터널로 보고하고, CloudCore가 API 서버에 반영한다

모듈 단위로 펼치면 다음과 같다. 각 모듈은 5.2절과 5.3절에서 설명한다.

```mermaid
sequenceDiagram
    actor U as 사용자
    participant API as kube-apiserver
    participant SCH as scheduler
    participant ECtl as EdgeController
    participant CH as CloudHub
    participant EH as EdgeHub
    participant MM as MetaManager (SQLite)
    participant ED as Edged
    participant CT as containerd

    U->>API: kubectl apply (Deployment)
    API->>API: 컨트롤러가 Pod 생성
    SCH->>API: Pod.spec.nodeName = 엣지 노드
    API-->>ECtl: watch: 엣지 노드에 배정된 Pod
    ECtl->>CH: Pod (+ ConfigMap, Secret) 메시지
    CH->>EH: 터널로 전송
    EH->>MM: 메시지 전달
    MM->>MM: SQLite 에 저장
    MM-->>CH: ACK
    MM->>ED: Pod 생성 요청
    ED->>CT: CRI: 이미지 pull, 컨테이너 시작
    ED->>MM: Pod 상태 (Running)
    MM->>EH: 상태 메시지
    EH->>CH: 터널로 전송
    CH->>ECtl: 상태 전달
    ECtl->>API: Pod status 갱신
    U->>API: kubectl get pods → Running
```

일반 노드와 다른 점은 세 가지다.

- 일반 노드는 **kubelet이 API 서버를 직접 watch**한다. KubeEdge는 **CloudCore가 대신 watch하다가 엣지로 밀어 준다**
- 엣지는 받은 정보를 먼저 **SQLite에 저장**하고 ACK를 보낸 다음 실행한다. 그래서 이후 재부팅해도 같은 정보로 다시 띄울 수 있다
- 엣지는 **자기 노드에 배정된 것만** 받는다. 클러스터 전체 정보를 받지 않으므로 회선 부담이 작다

스케줄러는 엣지 노드를 일반 노드와 똑같이 취급한다. 그래서 의도한 로봇에 파드를 보내려면 라벨로 지정해야 한다.

```yaml
# 엣지 노드 중 하나에
nodeSelector:
  node-role.kubernetes.io/edge: ""

# 특정 로봇 한 대에
nodeSelector:
  kubernetes.io/hostname: robot-01
```

## 5.2 CloudCore 모듈

CloudCore와 edgecore는 각각 여러 모듈의 묶음이다. 모듈마다 기능이 하나씩 있고, 모듈끼리는 Beehive라는 프로세스 내부 메시지 프레임워크로 메시지를 주고받는다.

| 모듈 | 하는 일 |
|---|---|
| **CloudHub** | edgecore가 접속하는 WebSocket/QUIC 서버. 엣지 노드별 메시지 큐를 두고 ACK를 받으며 순서대로 보낸다. 엣지 인증서 발급(10002)도 맡는다 |
| **EdgeController** | 엣지 노드에 배정된 Pod와 그 파드가 쓰는 ConfigMap·Secret 등을 API 서버에서 watch해 해당 엣지로 보낸다. 엣지에서 올라온 노드·파드 상태를 API 서버에 반영한다 |
| **DeviceController** | 장치 CRD(`Device`, `DeviceModel`)를 엣지의 DeviceTwin과 동기화한다 |
| **SyncController** | 어느 엣지에 어떤 리소스가 어느 버전까지 전달됐는지 `ObjectSync` CRD로 기록하고, 빠진 메시지를 보충한다 |
| **CloudStream** | `kubectl logs`/`exec` 요청을 엣지로 전달한다. 엣지의 EdgeStream과 짝을 이룬다 |

이 밖에 선택 기능으로 클라우드와 엣지 사이 사용자 정의 메시지를 라우팅하는 Router, 엣지 앱의 list-watch를 지원하는 DynamicController가 있다.

정리하면 **CloudHub가 통신**을 맡고, **EdgeController·DeviceController가 "무엇을 보낼지"** 정하고, **SyncController가 "제대로 갔는지"** 확인하는 구조다.

엣지로 가는 길은 둘이다.

```mermaid
flowchart LR
    U1["kubectl apply"] -->|"배포 1. Pod 생성"| API["kube-apiserver"]
    U2["kubectl logs / exec"] -->|"로그 1. 요청"| API
    subgraph CC["CloudCore"]
        ECtl["EdgeController"]
        CH["CloudHub"]
        CS["CloudStream"]
    end
    API -->|"배포 2. 배정된 Pod 감지"| ECtl
    ECtl -->|"배포 3. 메시지 전달"| CH
    API -->|"로그 2. 전달 (10003)"| CS
    ECtl ~~~ CS
    CH <==>|"배포 4. 전송 / 배포 5. Running 보고 (터널 10000)"| EDGE["엣지 노드"]
    CS <==>|"로그 3. 요청 / 로그 4. 로그 스트림 (터널 10004)"| EDGE
```

- **배포 경로**: EdgeController가 kubelet 대신 API 서버를 지켜보다가, 엣지로 보낼 Pod를 CloudHub에 넘긴다. 엣지가 보고한 상태는 같은 길을 거꾸로 올라가 API 서버의 Pod status에 반영된다
- **로그 경로**: 일반 노드라면 API 서버가 kubelet(10250)에 직접 접속하지만, 엣지 노드에는 직접 닿을 수 없다. 그래서 CloudStream이 대신 받아 별도의 스트림 터널로 넘긴다. 켜는 방법은 6.5절에 있다

Kubernetes 리소스와 상태는 CloudHub 터널로, `kubectl logs`/`exec` 같은 실시간 스트림은 CloudStream 터널로 간다.

## 5.3 edgecore 모듈

| 모듈 | 하는 일 |
|---|---|
| **EdgeHub** | CloudHub에 접속하는 클라이언트. 하트비트를 보내고, 끊기면 다시 접속한다. 받은 메시지를 내부 모듈로 나눠 준다 |
| **MetaManager** | EdgeHub와 Edged 사이의 메시지 처리기. 받은 Pod·ConfigMap·Secret 등을 **SQLite에 저장**한 뒤 Edged에 넘긴다 |
| **Edged** | **경량 kubelet**. kubelet을 최적화해 edgecore에 통합한 것으로, v1.11에서 Beta, v1.12에서 GA가 되었다. CRI로 containerd를 호출해 파드를 띄우고 probe·볼륨·상태 보고를 처리한다. API 서버 대신 MetaManager를 통해 정보를 주고받는다 |
| **MetaServer** | 엣지 안의 작은 API 서버(기본 주소 `127.0.0.1:10550`). 엣지 파드가 Kubernetes API를 list-watch하면 클라우드 대신 SQLite의 데이터로 응답한다. 기본으로 꺼져 있다 |
| **EventBus** | MQTT 클라이언트. 엣지의 MQTT 브로커(mosquitto)를 통해 장치·앱과 메시지를 주고받는다 |
| **DeviceTwin** | 장치 상태를 SQLite에 저장하고 클라우드와 동기화한다 |
| **ServiceBus** | 클라우드에서 엣지의 HTTP 서버를 호출할 때 쓰는 HTTP 클라이언트 |
| **EdgeStream** | CloudStream과 짝. `kubectl logs`/`exec`를 엣지 파드로 연결한다 |

**받은 Pod를 SQLite에 먼저 저장한 다음 Edged에 넘기는 것이 일반 kubelet과 다른 점이다.** 이 저장 덕분에 5.4절의 재부팅 복구가 가능하다.

설정 파일은 `/etc/kubeedge/config/edgecore.yaml`에 있고, 모듈별로 `enable`을 켜고 끌 수 있다. 고친 뒤에는 `systemctl restart edgecore`로 반영한다.

```yaml
# /etc/kubeedge/config/edgecore.yaml 일부 (구조만 보기 위한 발췌, 값은 환경마다 다름)
database:
  dataSource: /var/lib/kubeedge/edgecore.db
modules:
  edgeHub:
    heartbeat: 15
    websocket:
      enable: true
      server: <클라우드 IP>:10000
  edged:
    tailoredKubeletConfig:
      cgroupDriver: systemd
  metaManager:
    metaServer:
      enable: true        # 필요할 때 켬 (기본값 false)
  edgeStream:
    enable: true          # kubectl logs/exec 를 쓰려면 켬 (기본값 false)
    server: <클라우드 IP>:10004
```

## 5.4 끊겼을 때와 재부팅했을 때

클라우드와 끊기거나 엣지가 재시작돼도 엣지의 앱이 정상 동작하도록 하는 것을 KubeEdge는 **엣지 자율성(Edge Autonomy)**이라고 부른다. KubeEdge의 가장 중요한 특징이다. 끊겼을 때 양쪽에서 각각 무슨 일이 일어나는지 나눠서 본다.

### 5.4.1 끊겼을 때 엣지에서

- 실행 중인 파드는 그대로 돈다
- probe와 재시작 정책(`restartPolicy`)도 엣지에서 계속 동작한다. 컨테이너가 죽으면 엣지가 알아서 다시 띄운다
- **edgecore가 재시작되거나 장비가 재부팅돼도 SQLite에 저장된 파드 정보로 다시 띄운다.** 일반 kubelet과 가장 크게 다른 점이다(4.3절)
- MetaServer를 켜 두었다면 엣지 앱의 Kubernetes API 조회에도 로컬 데이터로 계속 응답한다

재부팅 후 복구 흐름은 다음과 같다.

```mermaid
flowchart LR
    R["장비 재부팅"] -->|"1. edgecore 시작"| ED["Edged"]
    ED -->|"2. 저장된 Pod 정보 요청"| MM["MetaManager"]
    MM -->|"3. 읽기"| DB[("SQLite")]
    ED -->|"4. 컨테이너 다시 시작"| CT["containerd"]
    EH["EdgeHub"] -.->|"5. 클라우드와 연결되면 상태 보고"| CLOUD["CloudCore"]
```

1~4번은 클라우드와 연결되지 않아도 엣지 혼자 진행된다.

### 5.4.2 끊겼을 때 클라우드에서

- 하트비트가 끊기므로 노드가 `NotReady`로 바뀐다
- 일반 파드는 3.3절에서 본 규칙대로 기본 5분 뒤 **축출 대상**이 된다. 클라우드에서는 파드가 `Terminating`으로 보이지만, 그 결정이 엣지에 전달되지 못하므로 엣지에서는 계속 돈다
- 끊긴 동안 클라우드에서 바뀐 것은 다시 연결된 뒤에 엣지로 내려간다. KubeEdge 설계 문서([reliable message delivery](https://github.com/kubeedge/kubeedge/blob/master/docs/proposals/sig-node/reliable-message-delivery.md))에 따르면, 엣지가 오프라인인 동안 CloudHub의 노드별 큐가 메시지를 쌓아 두었다가 다시 연결되면 보낸다. 삭제 이벤트를 놓친 경우에도 SyncController가 `ObjectSync` 기록과 실제 객체를 비교해 삭제 이벤트를 다시 만들어 보낸다. 설계대로라면 앞의 `Terminating` 파드도 다시 연결된 뒤 이 경로로 엣지에서 정리된다

로봇처럼 파드가 그 장비에 묶여 있어야 하는 경우에는 이 축출이 오히려 문제를 만든다. 무슨 일이 생기고 어떻게 피하는지는 7.2절에서 다룬다.

### 5.4.3 메시지 전달 보장

불안정한 회선에서 메시지가 빠지지 않도록 다음 장치를 둔다.

```mermaid
sequenceDiagram
    participant CH as CloudHub
    participant OS as ObjectSync CRD
    participant E as edgecore

    CH->>E: 메시지 (resourceVersion 100)
    E->>E: SQLite 저장
    E-->>CH: ACK
    CH->>OS: "이 노드에 100 까지 전달" 기록
    CH-xE: 메시지 (101) — 회선 끊김
    Note over CH: ACK 없음 → 재전송 대기
    E->>CH: 재접속
    CH->>OS: 마지막 전달 버전 확인 (100)
    CH->>E: 101 부터 다시 전송
    E-->>CH: ACK
```

- CloudHub는 엣지 노드마다 메시지 큐를 두고, 엣지가 **로컬에 저장한 뒤 보내는 ACK**를 받아야 다음 메시지를 보낸다
- ACK가 오지 않으면 재전송한다. ACK만 유실돼 같은 메시지가 두 번 가도 엣지가 중복을 처리한다
- 전달된 리소스 버전은 `ObjectSync` CRD(클러스터 범위 리소스는 `ClusterObjectSync`)에 기록되므로, CloudCore가 재시작해도 이미 보낸 것을 다시 보내지 않고 이어서 보낼 수 있다
- 결과적으로 **최소 한 번(at-least-once)** 전달을 보장한다. 설계 문서는 정확히 한 번(exactly-once)이 비용이 커서 at-least-once를 택했다고 밝힌다

# 6. KubeEdge 설치

# 7. 장단점과 정리

# 8. FAQ

# 9. 마치며

# 10. 참고
