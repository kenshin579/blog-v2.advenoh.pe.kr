# KubeEdge 입문 블로그 글 설계

- 작성일: 2026-10-25
- 브랜치: `feat/kubeedge-입문`
- 원본
  - 발표 자료: ROSCon 2026 참석 후 정리한 발표 자료의 KubeEdge 파트 (19~32번 슬라이드, 비공개)
  - 스터디 노트: 「KubeEdge 입문」 개인 스터디 노트 (14개 장, 비공개)
  - 공개 저장소: [fujitatomoya/ros_k8s](https://github.com/fujitatomoya/ros_k8s) `docs/` (기준 커밋 `d4e32db`, 2026-10-14)

## 1. 목적

ROSCon 2026에서 ros_k8s 저장소 작성자와 KubeEdge 이야기를 나눈 뒤 공부한 내용을 블로그 글 한 편으로 남긴다.
시리즈로 나누지 않는다.

글의 뼈대는 발표 자료의 순서를 그대로 따른다. "로봇을 Kubernetes 노드로 붙이고 싶다"에서 출발해
문제 → 구조 → 설치 → 장단점 순서로 로봇에 KubeEdge를 적용하는 흐름을 보여 주고, 발표 자료에서
짧게 넘어간 부분을 스터디 노트로 보강한다.

## 2. 산출물

| 항목 | 값 |
|---|---|
| 제목 | `KubeEdge 입문 - 로봇을 Kubernetes 엣지 노드로 관리하기` |
| 초안 경로 | `docs/start/kubeedge-입문-로봇을-kubernetes-엣지-노드로-관리하기/index.md` |
| 발행 시 경로 | `contents/cloud/kubeedge-입문-로봇을-kubernetes-엣지-노드로-관리하기/` |
| 언어 | 한국어만 |
| 부가물 | 슬라이드·퀴즈·이미지 없음. 다이어그램은 Mermaid |
| 예상 분량 | 3만자 안팎. 넘치면 5장·7.2절을 표로 압축한다 |

카테고리를 `cloud`로 둔 이유: kind, minikube, k9s, KubeVPN 같은 Kubernetes 글이 `contents/cloud/`에 모여 있다.
`contents/ros/`는 ROS 자체를 다루는 글(URDF, ROS2 입문 시리즈)의 자리이고, 로봇 쪽 독자는 태그로 연결한다.

frontmatter:

```yaml
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
```

`category`와 `series`는 넣지 않는다.

## 3. 글 구조

heading은 블로그 관례(`# 1. 들어가며`)를 따른다. "슬라이드"는 발표 자료 번호, "노트"는 스터디 노트의 장 번호다.

| 절 | 내용 | 출처 |
|---|---|---|
| 1. 들어가며 | ROSCon 2026 모임에서 Tomoya Fujita(ros_k8s 작성자)와 나눈 15분, 이후 스터디한 계기. ros_k8s 저장소 소개 | 슬라이드 20 |
| 2. 왜 로봇에 Kubernetes인가 | 클라우드·IoT·로봇의 배포 방식이 제각각인 현재 상태, Kubernetes로 맞추면 얻는 것(라벨로 대상 지정, Rolling·Canary, 자동 복구, 하드웨어 추상화, 관측·확장) | 슬라이드 21 |
| 3. Kubernetes 기본 | "원하는 상태"와 list-watch 5단계, KubeEdge가 끼어드는 지점(kubelet ↔ API 서버). control plane / node 컴포넌트를 한두 줄씩. 노드와 연락이 끊기면 축출되기까지, taint/toleration 짧은 설명 | 슬라이드 22, 노트 2.1·2.2·2.4, 노트 FAQ 9 |
| 4. KubeEdge가 필요한 이유 | 로봇을 그냥 `kubeadm join`하면 생기는 문제를 하나씩 풀어 쓴다: NAT 뒤 양방향 연결, 끊기면 축출, 재부팅 시 파드 복구 불가, 자원·회선 부담, 장치 표현 수단 없음. 문제와 KubeEdge의 답 표, 한 줄 정의, 출발과 CNCF 단계 | 슬라이드 23, 노트 1장 |
| 5. KubeEdge 구조 | 클라우드의 CloudCore와 엣지의 edgecore, "대리인" 관계, 엣지가 먼저 여는 터널 | 슬라이드 24, 노트 3장 |
| 5.1 `kubectl apply`부터 로봇에 파드가 뜨기까지 | 슬라이드의 6단계 + 시퀀스 다이어그램. 일반 노드와 다른 점(push, SQLite 저장 후 ACK, 자기 노드 것만 수신) | 슬라이드 24, 노트 6장 |
| 5.2 CloudCore 모듈 | 모듈 표(CloudHub, EdgeController, DeviceController, SyncController, CloudStream). Router·DynamicController는 한 줄 언급. 배포 경로 흐름도 | 노트 4장 |
| 5.3 edgecore 모듈 | 모듈 표(EdgeHub, MetaManager, Edged, MetaServer, EventBus, DeviceTwin, ServiceBus, EdgeStream). `edgecore.yaml` 구조 발췌 | 노트 5장 |
| 5.4 끊겼을 때와 재부팅했을 때 | 엣지 쪽 동작과 클라우드 쪽 동작을 나눠 설명. 재부팅 복구 흐름, 메시지 전달 보장(ACK, ObjectSync, at-least-once) | 노트 7장, 노트 5.1.2 |
| 6. KubeEdge 설치 | keadm 4단계 개요, 설치 전 확인 표, 버전 호환표 | 슬라이드 25, 노트 10.1·10.2 |
| 6.1 1단계: 패키지 설치 | swap·IPv4 forwarding, containerd CRI·systemd cgroup, Kubernetes v1.32 패키지, keadm | 슬라이드 26 |
| 6.2 1단계: control-plane 생성 | `kubeadm init`, Cilium 배포, taint 제거. taint를 지우는 이유와 프로덕션에서는 toleration으로 처리하는 방식. Cilium·kube-proxy DaemonSet이 엣지 노드로 가지 않게 하는 affinity | 슬라이드 25 노트·27, 노트 FAQ 2 |
| 6.3 2단계: CloudCore 설치 | `keadm init`, `keadm gettoken`, 포트 표(10000~10004) | 슬라이드 28, 노트 3.1 |
| 6.4 3단계: 로봇 참여 | kubelet 끄기, `keadm join`, 내부 시퀀스(토큰 → 인증서 → 터널 → Node 등록) | 슬라이드 29, 노트 10.1 |
| 6.5 4단계: ROS 2 파드 배포 | talker는 로봇, listener는 클라우드. hostNetwork를 쓰는 이유: 제어 채널과 데이터 경로는 다르고 엣지에는 CNI가 없다. 통신되는 이유는 같은 LAN의 DDS 멀티캐스트 덕분이지 KubeEdge 덕분이 아니다. `kubectl logs/exec`를 켜는 법 | 슬라이드 30, 노트 8.1·8.2·12.1, 노트 FAQ 1 |
| 7. 장단점과 정리 | 한 줄 요약 | 슬라이드 31 |
| 7.1 로봇에 잘 맞는 점 | NAT·LTE 뒤 등록, 끊기거나 재부팅해도 다시 뜸, 수십 대에 같은 버전 배포, 가벼움 | 슬라이드 31, 노트 12.2 |
| 7.2 주의할 점 | 항목마다 한 단락씩: 다른 네트워크 간 DDS discovery(노트 8.4), 엣지 CNI 없음과 EdgeMesh(노트 8.2·8.3), 하드웨어 접근(로봇 본체 장치 vs 네트워크 장치, `/dev` 마운트 vs device plugin, Device CRD 2~3줄, 노트 9.1~9.3), 축출 정책과 로봇에서 생기는 일(노트 7.2, FAQ 10), 이미지 크기, 실시간성, 버전 고정 | 슬라이드 31, 노트 12.3 |
| 7.3 도입 전에 던질 질문 | 질문 5개 | 노트 12.4 |
| 8. FAQ | production에서 운용했나(현장 질문, 답은 confidential), CloudCore가 죽으면, Service 이름 접속, 엣지 사양, Mac 한 대로 체험(keink) | 슬라이드 32, 노트 FAQ 3·4·5·6 |
| 9. 마치며 | 한 줄 정리와 개인 소감(Helm 차트로 관리할 수 있다, Kubernetes를 잘 알아야 한다, 로봇 노드를 잘 구분해 배포해야 한다) | 슬라이드 31 발표자 노트 |
| 참고 자료 | KubeEdge 문서·GitHub, keadm 가이드, ros_k8s, ROSCon 2023 발표, ROS TSC 발표, EdgeMesh, 메시지 전달 보장 설계 문서 | 노트 참고 자료 |

### 넣지 않는 것

- 다른 선택지 비교(OpenYurt, K3s 등, 노트 11장): 사용자 결정으로 제외
- 용어 정리(노트 13장), MetaServer 유스케이스(노트 5.1.3), Router·DynamicController 상세
- ONVIF 카메라·Modbus 예제 YAML(노트 9.4): 로봇 흐름에서 벗어나고 분량이 크다
- 발표 자료의 KubeEdge 외 파트, 발표자 노트의 팀 내부 코멘트

## 4. 작성 방침

### 4.1 추측해서 쓰지 않는다

모든 사실·수치·날짜는 원본 또는 공식 출처로 확인된 것만 쓴다. 노트와 발표 자료에서 "(추론)", "(확인 필요)"로
표시된 부분과 버전 수치는 KubeEdge 공식 문서, GitHub 저장소·이슈, 릴리스 페이지로 확인하고, 확인되지 않으면 뺀다.

| 확인 대상 | 원본 위치 | 확인할 곳 |
|---|---|---|
| 재연결 뒤 클라우드의 삭제 결정이 엣지에 반영되는지 | 노트 7.2 | KubeEdge 문서·설계 문서 |
| `app-offline.kubeedge.io=autonomy` 라벨이 현재 버전에서 동작하는지 | 노트 7.2 | 릴리스 노트, 소스 |
| EdgeMesh가 DDS 멀티캐스트 discovery를 대신하지 않는다 | 노트 8.3 | EdgeMesh 문서 |
| 엣지 노드의 device plugin(GPU는 공식 문서, 일반 장치는 추론) | 노트 9.2 | KubeEdge GPU 문서 |
| KubeEdge ↔ Kubernetes 호환표 | 노트 10.2 | kubeedge/kubeedge README |
| Edged가 v1.12부터 kubelet 코드를 내장 | 노트 5장 | 릴리스 노트 |
| 출발 연도(2018, Huawei), CNCF Graduated | 슬라이드 24 노트, 노트 1.6 | CNCF·KubeEdge 공식 |
| CloudCore HA 구성 가능 | 노트 FAQ 4 | KubeEdge 문서 |
| keink의 성숙도(alpha) | 노트 FAQ 5 | keink 저장소 |
| ROSCon 2026 일정·장소, Tomoya Fujita 소속·역할 | 슬라이드 20 | roscon.ros.org, 공개 프로필 |

### 4.2 설치 명령과 출력

명령은 발표 자료(슬라이드 26~30)를 기준으로 하고, 출력은 ros_k8s `docs/`에서 발췌한다.
직접 실행한 결과가 아니므로 코드 블록 앞에 "ros_k8s 문서 발췌"라고 밝힌다.

| 단계 | 발췌할 출력 | 출처 문서 |
|---|---|---|
| 6.1 | `sysctl net.ipv4.ip_forward`, containerd `SystemdCgroup = true`, `docker info` cgroup, `keadm version` | Install_Kubernetes_Packages.md, Setup_KubeEdge.md |
| 6.2 | `kubeadm init` 성공 메시지, CNI 배포 전 `NotReady` 노드와 `Pending` coredns, `cilium install`, `cilium status --wait`, taint 제거 전후 | Setup_Kubernetes_Cluster.md, Setup_KubeEdge.md |
| 6.3 | `keadm init`, `kubectl get all -n kubeedge` | Setup_KubeEdge.md |
| 6.4 | `systemctl is-active containerd`, `keadm join` 마지막 줄, `systemctl status edgecore`(Memory 33.3M), `kubectl get nodes -o wide` | Setup_KubeEdge.md |
| 6.5 | `kubectl apply`, `kubectl get pods -o wide`(파드 IP = 노드 IP) | Setup_KubeEdge.md |

옮길 때의 규칙:

1. 원문의 마스킹(`xxxxx`, `v1.32.x`, `...<snip>`)은 그대로 둔다
2. Setup_Kubernetes_Cluster.md는 Kubernetes v1.37 기준이라 v1.32 흐름과 맞지 않는다. 버전이 찍힌 줄(`Using Kubernetes version: v1.37.0`, `kubeadm version` 출력 등)은 빼고 발췌한다
3. `keadm gettoken`의 토큰은 `<토큰>`으로 가린다
4. 노드 이름 `tomoyafujita`(클라우드)·`ubuntu`(Raspberry Pi)는 `cloud`·`robot-01`로 바꾸고, 6장 첫머리에 바꿨다는 사실을 한 줄 밝힌다
5. 문서에 없는 출력(listener의 `ros2 topic echo` 결과 등)은 만들지 않는다

### 4.3 문체와 형식

- 본문은 블로그 관례대로 해라체(`~다`)로 쓴다. 원본은 합니다체라 옮기면서 바꾼다
- 개인 목소리는 1절(들어가며)과 9절(마치며)에만 두고, 본문은 정리체로 쓴다
- 다이어그램은 모두 Mermaid로 그린다. 노트의 다이어그램은 노드 텍스트에 `<br/>`를 쓰는 곳이 많은데, 블로그에서는 Mermaid 파서 오류가 나므로 텍스트를 줄이거나 노드를 나눠 옮긴다
- 노트의 "N장 참고" 같은 내부 상호참조는 블로그 절 번호로 바꾼다. Obsidian 위키링크는 남기지 않는다
- 관련 블로그 글 링크: 8절 FAQ의 "Mac 한 대로 체험"에서 기존 kind 글로 연결한다

### 4.4 사내 정보는 넣지 않는다

원본 노트와 발표 자료는 비공개 저장소에 있다. 블로그와 PR에는 비공개 저장소 이름, 파일 경로, 사내 시스템 이름,
팀 내부 이야기를 넣지 않는다. 글에 들어가는 사실은 공개 출처(KubeEdge 문서, ros_k8s, ROSCon 공개 자료)로 뒷받침되는 것만 쓴다.

## 5. 진행 순서

1. 이 설계 문서 커밋
2. 구현 계획 작성
3. 4.1의 확인 대상을 조사해 결과를 정리
4. 초안 작성 (`docs/start/...`), Mermaid 문법·인코딩 확인, `npm run build`로 렌더링 확인
5. PR 생성. 머지는 사용자가 한다

## 6. 완료 기준

- 3장 표의 모든 절이 초안에 있고, "넣지 않는 것"이 들어가지 않았다
- 4.1 표의 각 항목이 "확인됨(출처 링크)" 또는 "확인 안 됨 → 뺌"으로 정리되어 있다
- 설치 출력이 4.2 규칙을 지킨다
- Mermaid 노드 텍스트에 HTML 태그가 없다
- `file -I`가 `charset=utf-8`이다
- 비공개 저장소 이름·경로·사내 식별자가 없다
