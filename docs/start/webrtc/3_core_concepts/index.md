---
title: "WebRTC 완벽 가이드 (3): 핵심 개념 정리 - SDP, ICE, STUN, TURN"
description: "WebRTC의 핵심 프로토콜인 SDP, ICE, STUN, TURN을 실제 예시와 함께 상세히 알아보고, NAT 유형별 동작과 DTLS/SRTP 보안 메커니즘을 정리합니다."
date: 2026-02-07
update: 2026-02-07
tags:
  - WebRTC
  - SDP
  - ICE
  - STUN
  - TURN
  - NAT
  - DTLS
  - SRTP
series: "WebRTC 완벽 가이드"
---

2편에서 WebRTC의 전체 구조와 구성 요소를 살펴보았다. 이번 편에서는 WebRTC를 이해하는 데 **가장 중요한 핵심 개념** 네 가지를 파고든다. SDP, ICE, STUN, TURN이 각각 무엇이고, 실제로 어떻게 동작하는지를 예시와 함께 정리한다. 마지막으로 DTLS/SRTP 보안 메커니즘까지 다룬다.

이 편의 내용이 머릿속에서 그림으로 그려지지 않으면, 코드가 돌아가도 이해한 것이 아니다.

# 1. SDP (Session Description Protocol)

## 1.1 SDP란 무엇인가

SDP(Session Description Protocol)는 WebRTC 세션에 필요한 정보를 담는 **평문 텍스트 프로토콜**이다. RFC 8866에 정의되어 있으며, 두 피어가 통신을 시작하기 위해 "나는 이런 능력이 있고, 이런 방식으로 연결할 수 있다"는 정보를 교환하는 데 사용한다.

SDP 자체는 WebRTC를 위해 만들어진 것이 아니다. VoIP, 스트리밍 등에서 오래전부터 사용해온 표준이다. WebRTC는 SDP에 몇 가지 속성을 추가하여 자신의 요구에 맞게 확장한 것이다.

## 1.2 SDP의 구조

SDP는 **키=값** 형태의 줄(line)로 구성된다. 각 줄은 단일 문자 키로 시작하고, 등호(`=`) 뒤에 값이 온다.

```
v=0
o=- 3546004397431101218 2 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0 1
a=extmap-allow-mixed
m=audio 9 UDP/TLS/RTP/SAVPF 111 63 9 0 8 13 110 126
...
m=video 9 UDP/TLS/RTP/SAVPF 96 97 102 103 104 105 106 107
...
```

SDP는 크게 **세션 설명(Session Description)**과 **미디어 설명(Media Description)** 두 부분으로 나뉜다.

```
┌─────────────────────────────────────────┐
│  세션 설명 (Session Description)         │
│  v=, o=, s=, t=, a=group:BUNDLE ...    │
├─────────────────────────────────────────┤
│  미디어 설명 1 (Audio)                   │
│  m=audio ...                            │
│  a=rtpmap:111 opus/48000/2              │
│  a=fmtp:111 ...                         │
│  a=ice-ufrag:...                        │
│  a=candidate:...                        │
├─────────────────────────────────────────┤
│  미디어 설명 2 (Video)                   │
│  m=video ...                            │
│  a=rtpmap:96 VP8/90000                  │
│  a=ice-ufrag:...                        │
│  a=candidate:...                        │
└─────────────────────────────────────────┘
```

## 1.3 주요 SDP 키

### 1.3.1 세션 레벨 키

| 키 | 의미 | 예시 | 설명 |
|----|------|------|------|
| `v` | 버전 | `v=0` | 항상 0 |
| `o` | 오리진 | `o=- 0 0 IN IP4 127.0.0.1` | 세션 고유 ID. 재협상 시 변경 감지에 사용 |
| `s` | 세션 이름 | `s=-` | WebRTC에서는 항상 `-` |
| `t` | 타이밍 | `t=0 0` | 세션 시작/종료 시간. WebRTC에서는 항상 `0 0` |

### 1.3.2 미디어 레벨 키

`m=` 줄은 미디어 설명의 시작을 나타내며, 가장 중요한 줄 중 하나이다.

```
m=audio 9 UDP/TLS/RTP/SAVPF 111 63 9 0 8
│  │    │ │                  │
│  │    │ │                  └── Payload Type 목록
│  │    │ └── 프로토콜 (UDP 위 TLS, RTP, SAVP 피드백)
│  │    └── 포트 (9 = 아직 미정, ICE가 결정)
│  └── 미디어 타입 (audio / video / application)
└── 미디어 설명 시작
```

| 키 | 의미 | 예시 |
|----|------|------|
| `c` | 연결 정보 | `c=IN IP4 0.0.0.0` (ICE가 실제 주소 결정) |
| `a` | 속성 | 다양한 속성이 이 키를 통해 전달됨 |

## 1.4 주요 SDP 속성 (a= 라인)

SDP에서 가장 많이 등장하는 것이 `a=` 속성 줄이다. WebRTC에서 사용하는 핵심 속성들을 분류별로 정리한다.

### 1.4.1 코덱 관련

```
a=rtpmap:111 opus/48000/2
│        │   │    │     │
│        │   │    │     └── 채널 수 (2 = 스테레오)
│        │   │    └── 클럭 레이트 (48kHz)
│        │   └── 코덱 이름
│        └── Payload Type (m= 줄의 숫자와 매칭)
└── RTP Payload Type 매핑

a=fmtp:111 minptime=10;useinbandfec=1
│       │   │
│       │   └── 코덱별 추가 파라미터
│       └── Payload Type
└── 포맷 파라미터

a=rtcp-fb:96 nack
│         │   │
│         │   └── 지원하는 피드백 유형 (NACK, PLI, FIR 등)
│         └── Payload Type
└── RTCP 피드백 메커니즘
```

### 1.4.2 ICE 관련

```
a=ice-ufrag:EsAw
a=ice-pwd:P2uYro0UCOQ4zxjKXaWCBui1

- ice-ufrag: ICE user fragment. 트래픽 인증에 사용
- ice-pwd: ICE password. STUN 메시지 무결성 검증에 사용

a=candidate:foundation 1 udp 2130706431 192.168.1.10 50000 typ host
│           │          │ │   │          │              │     │
│           │          │ │   │          │              │     └── 후보 유형
│           │          │ │   │          │              └── 포트
│           │          │ │   │          └── IP 주소
│           │          │ │   └── 우선순위 (높을수록 먼저 시도)
│           │          │ └── 프로토콜 (udp / tcp)
│           │          └── 컴포넌트 ID (1=RTP, 2=RTCP)
│           └── foundation (같은 종류 후보 그룹화)
└── ICE 후보
```

### 1.4.3 보안 관련

```
a=fingerprint:sha-256 E1:AB:location:...
│              │       │
│              │       └── 인증서 해시값
│              └── 해시 알고리즘
└── DTLS 인증서 지문. 중간자 공격 방지에 사용

a=setup:actpass
│       │
│       └── DTLS 역할 (active / passive / actpass)
└── DTLS 핸드셰이크 역할
     - actpass: Offer 측 (어떤 역할이든 가능)
     - active: Answer 측이 주로 선택 (클라이언트 역할)
     - passive: 서버 역할
```

### 1.4.4 미디어 방향 및 식별

```
a=sendrecv       ← 양방향 송수신
a=sendonly       ← 송신만 (예: 화면 공유 송출)
a=recvonly       ← 수신만 (예: 시청자)
a=inactive       ← 비활성

a=mid:0          ← 미디어 설명 식별자 (BUNDLE에서 참조)
a=msid:stream_id track_id   ← MediaStream과 Track 식별

a=group:BUNDLE 0 1
│       │      │
│       │      └── BUNDLE에 포함된 미디어 설명의 mid 값
│       └── 그룹 유형
└── 여러 미디어를 하나의 ICE/DTLS 연결로 묶음
     (오디오와 비디오가 같은 포트를 공유)
```

### 1.4.5 SSRC 관련

```
a=ssrc:3570614608 cname:user123@example.com
│      │           │
│      │           └── CNAME (동일 소스의 오디오/비디오 동기화에 사용)
│      └── SSRC 값 (RTP 스트림 식별자)
└── 미디어 스트림 식별
```

## 1.5 실제 SDP 예시 (Offer)

실제 WebRTC Offer SDP의 핵심 부분을 보자. 각 줄의 역할을 주석으로 표시했다.

```
v=0                                           # SDP 버전
o=- 4578location 2 IN IP4 127.0.0.1          # 세션 ID
s=-                                           # 세션 이름 (미사용)
t=0 0                                         # 타이밍 (무제한)
a=group:BUNDLE 0 1                            # 오디오(0)와 비디오(1)를 하나의 연결로 묶음
a=extmap-allow-mixed                          # 확장 헤더 혼합 허용

# ──── 오디오 미디어 설명 ────
m=audio 9 UDP/TLS/RTP/SAVPF 111 63 9 0 8     # 오디오, 지원 코덱 PT: 111, 63, 9, 0, 8
c=IN IP4 0.0.0.0                              # 연결 주소 (ICE가 결정)
a=mid:0                                       # 미디어 ID: 0
a=sendrecv                                    # 양방향 송수신
a=rtpmap:111 opus/48000/2                     # PT 111 = Opus 코덱, 48kHz, 스테레오
a=fmtp:111 minptime=10;useinbandfec=1         # Opus 파라미터: FEC 활성화
a=rtpmap:9 G722/8000                          # PT 9 = G.722 코덱
a=rtcp-fb:111 nack                            # Opus에 NACK 피드백 지원
a=ice-ufrag:EsAw                              # ICE 인증 정보
a=ice-pwd:P2uYro0UCOQ4zxjKXaWCBui1            # ICE 패스워드
a=fingerprint:sha-256 E1:AB:2C:...            # DTLS 인증서 지문
a=setup:actpass                               # DTLS 역할: 어느 쪽이든 가능
a=candidate:1 1 udp 2130706431 192.168.1.10 50000 typ host
                                              # Host 후보: 로컬 IP
a=candidate:2 1 udp 1694498815 203.0.113.5 60000 typ srflx raddr 192.168.1.10 rport 50000
                                              # Server Reflexive 후보: STUN으로 발견한 공인 IP

# ──── 비디오 미디어 설명 ────
m=video 9 UDP/TLS/RTP/SAVPF 96 97            # 비디오, 지원 코덱 PT: 96, 97
c=IN IP4 0.0.0.0
a=mid:1                                       # 미디어 ID: 1
a=sendrecv
a=rtpmap:96 VP8/90000                         # PT 96 = VP8 코덱
a=rtpmap:97 H264/90000                        # PT 97 = H.264 코덱
a=fmtp:97 profile-level-id=42e01f             # H.264 프로파일 파라미터
a=rtcp-fb:96 nack                             # VP8에 NACK 지원
a=rtcp-fb:96 nack pli                         # VP8에 PLI (키프레임 요청) 지원
a=ice-ufrag:EsAw                              # 같은 ICE 인증 (BUNDLE)
a=ice-pwd:P2uYro0UCOQ4zxjKXaWCBui1
a=fingerprint:sha-256 E1:AB:2C:...
a=setup:actpass
```

## 1.6 Offer/Answer 모델

WebRTC는 SDP를 **Offer/Answer 모델**로 교환한다. 한쪽이 Offer를 제안하고, 상대방이 Answer를 반환한다.

```
[Offer/Answer 교환 과정]

  Peer A (Offerer)                              Peer B (Answerer)
       │                                             │
       │  1. createOffer()                            │
       │  → SDP Offer 생성                            │
       │     "나는 Opus, VP8, H.264을 지원해"          │
       │                                             │
       │  2. setLocalDescription(offer)               │
       │  → Offer를 자신에게 적용                      │
       │                                             │
       │────── 3. Offer SDP 전달 ─────────────────────>│
       │         (Signaling 채널 경유)                  │
       │                                             │
       │                              4. setRemoteDescription(offer)
       │                              → Offer를 수신 측에 적용
       │                                             │
       │                              5. createAnswer()
       │                              → "나는 Opus, VP8만 지원해"
       │                              → H.264는 Answer에서 제외
       │                                             │
       │                              6. setLocalDescription(answer)
       │                                             │
       │<───── 7. Answer SDP 전달 ────────────────────│
       │                                             │
       │  8. setRemoteDescription(answer)             │
       │  → 양쪽 합의 완료: Opus + VP8                 │
       │                                             │
```

Answer에서 **지원하지 않는 코덱을 제거**할 수 있다. Offer가 VP8, H.264를 모두 제안해도, Answerer가 VP8만 지원하면 Answer에는 VP8만 남는다. 이렇게 양쪽이 호환 가능한 최소 공통 집합을 합의한다.

## 1.7 Transceiver (트랜시버)

Transceiver는 **SDP의 미디어 설명을 JavaScript API로 노출**한 개념이다. 하나의 Transceiver는 하나의 미디어 설명(`m=` 줄)에 대응한다.

```
[Transceiver와 SDP 미디어 설명의 관계]

  JavaScript API                          SDP
┌──────────────────────┐        ┌──────────────────────┐
│  Transceiver #0      │ ←────> │  m=audio ...         │
│  - direction: sendrecv│       │  a=mid:0             │
│  - sender (Track)    │        │  a=sendrecv          │
│  - receiver (Track)  │        │  a=rtpmap:111 opus...│
├──────────────────────┤        ├──────────────────────┤
│  Transceiver #1      │ ←────> │  m=video ...         │
│  - direction: sendonly│       │  a=mid:1             │
│  - sender (Track)    │        │  a=sendonly          │
│  - receiver: null    │        │  a=rtpmap:96 VP8...  │
└──────────────────────┘        └──────────────────────┘
```

Transceiver의 방향(direction)은 4가지이다.

| 방향 | 의미 | 사용 사례 |
|------|------|----------|
| `sendrecv` | 양방향 | 화상 통화 (상호 음성/영상) |
| `sendonly` | 송신만 | 화면 공유 송출, 방송 |
| `recvonly` | 수신만 | 시청자, 모니터링 |
| `inactive` | 비활성 | 일시 중지, 보류 |

## 1.8 BUNDLE

기본적으로 각 미디어 설명(`m=` 줄)은 **별도의 ICE/DTLS 연결**을 필요로 한다. 오디오와 비디오가 각각 다른 포트를 사용하게 되는 것이다. BUNDLE은 이를 **하나의 연결로 묶어** 효율성을 높인다.

```
[BUNDLE 없이]                          [BUNDLE 사용]

  Audio ──── ICE/DTLS ──── 포트 5000     Audio ─┐
  Video ──── ICE/DTLS ──── 포트 5002     Video ─┼── ICE/DTLS ──── 포트 5000
  Data  ──── ICE/DTLS ──── 포트 5004     Data  ─┘
  (3개의 별도 연결)                       (1개의 연결 공유)
```

SDP에서는 `a=group:BUNDLE 0 1 2`로 표현된다. 숫자는 각 미디어 설명의 `mid` 값이다.

## 1.9 Trickle ICE

초기 WebRTC에서는 모든 ICE 후보를 수집한 후에야 SDP를 전달했다. 이를 **Vanilla ICE**라 한다. 문제는 STUN/TURN 응답을 기다려야 하므로 **수 초의 지연**이 발생한다는 것이다.

**Trickle ICE**는 후보를 발견할 때마다 **즉시 상대방에게 전달**하는 방식이다.

```
[Vanilla ICE]                           [Trickle ICE]

1. 모든 후보 수집 (2~5초)                 1. SDP 교환 (후보 없이도 가능)
2. SDP에 모든 후보 포함                   2. 후보 발견할 때마다 즉시 전달
3. SDP 교환                             3. 수신 측은 바로 연결 시도
4. 연결 시도
                                        → 연결 수립까지 시간 대폭 단축
```

Trickle ICE를 사용하면 SDP에는 후보가 없거나 일부만 포함되고, 나머지는 별도의 시그널링 메시지로 전달된다.

# 2. NAT (Network Address Translation)

ICE, STUN, TURN을 이해하려면 먼저 NAT의 동작을 알아야 한다.

## 2.1 NAT이 필요한 이유

IPv4 주소는 약 43억 개로 한정되어 있다. 전 세계 모든 기기에 고유한 공인 IP를 부여하기에는 부족하다. NAT은 **하나의 공인 IP를 여러 기기가 공유**할 수 있게 해준다.

```
[NAT 동작 원리]

  사설 네트워크                    NAT (공유기)                  인터넷
                              ┌──────────────┐
  PC: 192.168.1.10:5000  ───> │              │ ───> 203.0.113.5:40001 ───> Server
  Phone: 192.168.1.11:5000 ──>│  NAT 매핑 테이블│ ───> 203.0.113.5:40002 ───> Server
  Tablet: 192.168.1.12:5000 ─>│              │ ───> 203.0.113.5:40003 ───> Server
                              └──────────────┘
                                  │
                          ┌───────┴───────┐
                          │  매핑 테이블    │
                          │ 192.168.1.10:5000│
                          │  ↔ :40001      │
                          │ 192.168.1.11:5000│
                          │  ↔ :40002      │
                          │ 192.168.1.12:5000│
                          │  ↔ :40003      │
                          └───────────────┘
```

NAT은 아웃바운드 트래픽에 대한 **매핑(binding)**을 생성하고, 인바운드 응답을 해당 사설 IP로 라우팅한다.

## 2.2 NAT 매핑 유형

문제는 NAT이 매핑을 생성하는 방식이 제각각이라는 것이다. NAT 유형에 따라 P2P 연결 가능 여부가 달라진다.

### Endpoint Independent Mapping (가장 관대)

외부 어디로 보내든 **같은 공인 IP:포트 매핑**을 재사용한다.

```
사설 IP: 192.168.1.10:5000

  → Server A (1.1.1.1:80)   ──>  NAT 매핑: 203.0.113.5:40001
  → Server B (2.2.2.2:80)   ──>  NAT 매핑: 203.0.113.5:40001  (같은 매핑 재사용!)

  ✅ STUN으로 알아낸 매핑을 다른 피어와의 P2P 연결에 사용 가능
```

### Address Dependent Mapping

**상대 IP가 다르면 다른 매핑**을 생성한다.

```
사설 IP: 192.168.1.10:5000

  → Server A (1.1.1.1:80)   ──>  NAT 매핑: 203.0.113.5:40001
  → Server B (2.2.2.2:80)   ──>  NAT 매핑: 203.0.113.5:40002  (다른 매핑!)

  ⚠️ STUN 서버용 매핑과 피어용 매핑이 달라 직접 연결 어려움
```

### Address and Port Dependent Mapping (가장 엄격 = 대칭 NAT)

**상대 IP와 포트가 모두 같아야 같은 매핑**을 재사용한다.

```
사설 IP: 192.168.1.10:5000

  → Server A (1.1.1.1:80)   ──>  NAT 매핑: 203.0.113.5:40001
  → Server A (1.1.1.1:443)  ──>  NAT 매핑: 203.0.113.5:40002  (포트가 달라 다른 매핑!)
  → Server B (2.2.2.2:80)   ──>  NAT 매핑: 203.0.113.5:40003  (IP가 달라 다른 매핑!)

  ❌ STUN으로 알아낸 매핑이 무용지물. TURN 필요
```

## 2.3 NAT 필터링

NAT은 매핑 외에도 **인바운드 트래픽을 필터링**한다. 매핑이 존재해도 필터에 막히면 패킷이 도달하지 못한다.

| 필터링 유형 | 규칙 | P2P 가능성 |
|------------|------|-----------|
| Endpoint Independent | 매핑이 있으면 누구든 보낼 수 있음 | 높음 |
| Address Dependent | 내가 먼저 보낸 IP만 응답 가능 | 중간 |
| Address and Port Dependent | 내가 먼저 보낸 IP:포트만 응답 가능 | 낮음 |

```
[NAT 유형에 따른 P2P 연결 가능성]

         Peer A NAT 유형
         │  EI    AD    APD
  ───────┼───────────────────
  EI     │  ✅    ✅    ✅
  AD     │  ✅    ⚠️    ❌
  APD    │  ✅    ❌    ❌

  EI  = Endpoint Independent
  AD  = Address Dependent
  APD = Address and Port Dependent (대칭 NAT)

  ✅ = STUN으로 직접 연결 가능
  ⚠️ = 양쪽 동시 STUN 바인딩으로 가능할 수 있음
  ❌ = TURN 필요
```

# 3. STUN (Session Traversal Utilities for NAT)

## 3.1 STUN의 역할

STUN 서버의 역할은 딱 하나이다: **"내 공인 IP와 포트가 뭐야?"**라는 질문에 답하는 것이다.

NAT 뒤에 있는 기기는 자신의 공인 IP를 모른다. 자신이 아는 것은 사설 IP(192.168.1.10)뿐이다. STUN 서버에 패킷을 보내면, 서버는 패킷의 소스 주소(NAT이 변환한 공인 IP:포트)를 응답으로 돌려준다.

## 3.2 STUN 프로토콜 동작

```
[STUN Binding 과정]

  Client                          NAT                         STUN Server
  (192.168.1.10:5000)     (203.0.113.5:40001)         (stun.l.google.com:19302)
       │                          │                              │
       │── Binding Request ──────>│── Binding Request ──────────>│
       │   (src: 192.168.1.10:5000)  (src: 203.0.113.5:40001)   │
       │                          │                              │
       │                          │<── Binding Response ─────────│
       │<── Binding Response ─────│   XOR-MAPPED-ADDRESS:        │
       │                          │   203.0.113.5:40001          │
       │                          │                              │

  결과: Client는 자신의 공인 주소가
        203.0.113.5:40001임을 알게 됨
        → 이것이 Server Reflexive 후보가 됨
```

STUN 메시지는 두 가지이다.

| 메시지 | 타입 코드 | 역할 |
|--------|----------|------|
| Binding Request | 0x0001 | "내 공인 주소를 알려줘" |
| Binding Response | 0x0101 | "너의 공인 주소는 X:Y야" |

Binding Response의 핵심 속성은 **XOR-MAPPED-ADDRESS(0x0020)**이다. 이 속성에 클라이언트의 NAT 매핑 주소(공인 IP:포트)가 담겨 있다.

## 3.3 STUN의 한계

STUN은 **Endpoint Independent Mapping** NAT에서만 효과적이다. STUN 서버를 통해 알아낸 매핑이 다른 피어와의 통신에도 동일하게 사용되어야 하기 때문이다.

Address Dependent 또는 Address and Port Dependent NAT에서는 STUN으로 알아낸 매핑이 다른 피어와 통신할 때 바뀌기 때문에, 직접 연결에 사용할 수 없다. 이때 TURN이 필요하다.

# 4. TURN (Traversal Using Relays around NAT)

## 4.1 TURN의 역할

TURN은 직접 연결이 불가능할 때 **중계 서버를 통해 모든 트래픽을 전달**하는 프로토콜이다. "최후의 수단"이라고 할 수 있다.

```
[TURN 중계 구조]

  Peer A                    TURN Server                    Peer B
  (NAT 뒤)               (공인 IP 보유)                 (NAT 뒤)
       │                       │                            │
       │  ← Allocation ──────>│                             │
       │  (중계 주소 할당 요청)  │                             │
       │                       │                            │
       │  "네 중계 주소:         │                            │
       │   relay.example.com   │                            │
       │   :49152"             │                            │
       │                       │                            │
       │── 미디어 데이터 ──────>│── 미디어 데이터 전달 ─────────>│
       │                       │                            │
       │<── 미디어 데이터 ──────│<── 미디어 데이터 ─────────────│
       │                       │                            │
```

## 4.2 TURN 동작 과정

### 4.2.1 할당 (Allocation)

클라이언트가 TURN 서버에 Allocate Request를 보내면, 서버는 **중계 주소(Relayed Address)**를 할당한다.

```
[TURN Allocation]

  Client ──── Allocate Request ────> TURN Server
  Client <─── Allocate Response ──── TURN Server

  응답에 포함되는 주소:
  ┌─────────────────────────────────────────────────┐
  │  XOR-MAPPED-ADDRESS:  203.0.113.5:40001         │  ← NAT 매핑 주소
  │  XOR-RELAYED-ADDRESS: relay.example.com:49152   │  ← 중계 주소 (이것을 사용)
  │  LIFETIME: 600                                  │  ← 할당 유효 시간 (초)
  └─────────────────────────────────────────────────┘
```

### 4.2.2 권한 생성 (CreatePermission)

TURN 서버가 아무 피어의 트래픽이나 중계하면 보안 문제가 된다. **CreatePermission**으로 특정 피어만 중계를 허용한다.

```
Client ──── CreatePermission ────> TURN Server
             (Peer B의 IP 허용)

→ 이후 Peer B에서 중계 주소로 보낸 패킷만 Client에게 전달됨
```

### 4.2.3 데이터 전송

데이터 전송에는 두 가지 방식이 있다.

| 방식 | 헤더 오버헤드 | 설명 |
|------|-------------|------|
| Send Indication | 36바이트 | 대상 주소를 매번 지정 |
| ChannelData | 4바이트 | 채널 번호로 대상 식별 (효율적) |

ChannelData는 Send Indication보다 헤더가 작아 **실시간 미디어 전송에 더 효율적**이다. ChannelBind로 미리 채널 번호와 피어를 매핑해둔다.

## 4.3 TURN 비용이 비싼 이유

TURN은 **모든 미디어 트래픽이 서버를 경유**한다. 이것이 비용에 직접적인 영향을 미친다.

```
[P2P vs TURN 트래픽 비교]

  P2P (STUN 성공 시):
  Peer A ◄────────────► Peer B
  서버 트래픽: 0

  TURN (직접 연결 불가 시):
  Peer A ◄────────► TURN Server ◄────────► Peer B
  서버 트래픽: 양쪽 트래픽 합산 = 2배
```

| 비용 항목 | P2P | TURN |
|-----------|-----|------|
| 서버 대역폭 | 0 | 전체 미디어 트래픽 × 2 |
| 서버 CPU | 0 | 패킷 중계 처리 |
| 지연 | 최소 (직접) | 서버 경유 추가 지연 |
| 확장성 | 서버 무관 | 동시 접속자 × 대역폭 |

영상 통화 하나가 약 1~2 Mbps를 사용한다고 가정하면, TURN 서버는 양방향으로 2~4 Mbps를 처리해야 한다. 1,000명이 동시에 사용하면 서버 대역폭만 2~4 Gbps가 필요하다.

그래서 TURN은 **직접 연결이 불가능한 경우에만 최후의 수단으로 사용**해야 한다. ICE는 항상 Host → Server Reflexive → Relay 순서로 우선순위를 두어, TURN은 마지막에 시도한다.

## 4.4 TURN 사용 비율

실제 서비스에서 TURN이 필요한 비율은 환경에 따라 다르다.

| 환경 | TURN 필요 비율 | 이유 |
|------|---------------|------|
| 같은 LAN | ~0% | 직접 연결 가능 |
| 일반 가정용 NAT | ~10~20% | 대부분 STUN으로 해결 |
| 기업 방화벽 | ~30~50% | 엄격한 NAT/방화벽 정책 |
| 대칭 NAT + 대칭 NAT | ~100% | 직접 연결 불가 |

# 5. ICE (Interactive Connectivity Establishment)

## 5.1 ICE란 무엇인가

ICE는 STUN과 TURN을 조합하여 **두 피어 간 최적의 연결 경로를 찾는 프레임워크**이다. "최적"이란 가장 빠르고 안정적인 경로를 의미한다.

ICE는 다음을 수행한다.

1. 가능한 모든 연결 경로(후보)를 수집한다
2. 후보를 상대방과 교환한다
3. 모든 후보 조합을 테스트한다
4. 가장 좋은 경로를 선택한다

## 5.2 ICE 후보 유형

ICE는 5가지 유형의 후보를 수집한다.

```
[ICE 후보 수집]

                     ICE Agent
                        │
          ┌─────────────┼─────────────────┐
          │             │                 │
     ① Host       ③ Server Reflexive  ⑤ Relay
   (로컬 IP)      (STUN 응답)        (TURN 할당)
          │             │                 │
     ② mDNS       ④ Peer Reflexive       │
   (프라이버시)    (연결 검사 중 발견)       │
          │             │                 │
          ▼             ▼                 ▼
    192.168.1.10   203.0.113.5:40001   relay:49152
    (우선순위 최고)  (우선순위 중간)    (우선순위 최저)
```

| 유형 | 설명 | 발견 방법 | 우선순위 |
|------|------|----------|---------|
| **Host** | 로컬 네트워크 인터페이스 IP | OS에서 직접 수집 | 최고 |
| **mDNS** | UUID 형태의 호스트명 (IP 노출 방지) | mDNS 프로토콜 | 높음 |
| **Server Reflexive** | NAT 외부에서 보이는 공인 IP:포트 | STUN 서버 응답 | 중간 |
| **Peer Reflexive** | 연결 검사 중 발견된 예상치 못한 주소 | 상대방의 STUN 핑 소스 | 중간 |
| **Relay** | TURN 서버의 중계 주소 | TURN Allocation | 최저 |

### Peer Reflexive 후보란?

예상치 못한 주소에서 유효한 STUN 핑이 도착하면 이를 **Peer Reflexive** 후보로 등록한다. NAT이 예측과 다르게 매핑한 경우에 발생한다.

```
[Peer Reflexive 후보 발견]

  Peer A                       NAT A                        Peer B
       │                          │                            │
       │── STUN Binding ──────>│── (NAT이 새 매핑 생성) ─────>│
       │   (예상: 203.0.113.5:40001)                            │
       │                          │                            │
       │                          │   실제 도착:                 │
       │                          │   203.0.113.5:40099 ←── 예상과 다른 포트!
       │                          │                            │
       │                          │   Peer B: "새로운 주소 발견"  │
       │                          │   → Peer Reflexive 후보 추가 │
```

## 5.3 ICE 연결 과정

### 5.3.1 후보 수집 (Gathering)

ICE 에이전트는 가능한 모든 후보를 수집한다.

```
[후보 수집 타임라인]

  시간 ──────────────────────────────────────────────>

  즉시:    Host 후보 수집 (OS 네트워크 인터페이스)
  ~50ms:   mDNS 후보 등록
  ~100ms:  STUN 요청 전송
  ~200ms:  STUN 응답 수신 → Server Reflexive 후보
  ~300ms:  TURN Allocate 요청 전송
  ~500ms:  TURN Allocate 응답 → Relay 후보

  Trickle ICE: 후보를 발견할 때마다 즉시 상대에게 전달
  Vanilla ICE: 모든 후보 수집 완료 후 한꺼번에 전달
```

### 5.3.2 후보 페어링 (Pairing)

양쪽의 후보를 모든 조합으로 **후보쌍(Candidate Pair)**을 만든다.

```
[후보 페어링 예시]

  Peer A 후보                    Peer B 후보
  ├── Host: 192.168.1.10:5000    ├── Host: 10.0.0.5:6000
  ├── Srflx: 203.0.113.5:40001  ├── Srflx: 198.51.100.3:50001
  └── Relay: relay-a:49152      └── Relay: relay-b:49200

  생성되는 후보쌍 (3 × 3 = 9개):
  ┌──────────────────────────────────────────────────────┐
  │  Pair 1: A:Host     ↔ B:Host      (최고 우선순위)     │
  │  Pair 2: A:Host     ↔ B:Srflx                       │
  │  Pair 3: A:Host     ↔ B:Relay                       │
  │  Pair 4: A:Srflx    ↔ B:Host                        │
  │  Pair 5: A:Srflx    ↔ B:Srflx                       │
  │  Pair 6: A:Srflx    ↔ B:Relay                       │
  │  Pair 7: A:Relay    ↔ B:Host                        │
  │  Pair 8: A:Relay    ↔ B:Srflx                       │
  │  Pair 9: A:Relay    ↔ B:Relay    (최저 우선순위)      │
  └──────────────────────────────────────────────────────┘
```

### 5.3.3 연결성 검사 (Connectivity Check)

각 후보쌍에 대해 **STUN Binding Request**를 보내 실제로 통신이 가능한지 확인한다.

```
[연결성 검사]

  Peer A                                          Peer B
       │                                              │
       │── STUN Binding Request (Pair 1) ────────────>│
       │<── STUN Binding Response ────────────────────│  ✅ 성공
       │                                              │
       │── STUN Binding Request (Pair 2) ────────────>│
       │   ... timeout ...                            │  ❌ 실패
       │                                              │
       │── STUN Binding Request (Pair 5) ────────────>│
       │<── STUN Binding Response ────────────────────│  ✅ 성공
       │                                              │

  성공한 쌍: Pair 1 (Host↔Host), Pair 5 (Srflx↔Srflx)
  → Valid Candidate Pair로 승격
```

STUN 메시지에는 `ice-ufrag`와 `ice-pwd`가 포함되어, 인증된 피어만 연결 검사에 응답할 수 있다.

### 5.3.4 후보 선택 (Nomination)

ICE 에이전트에는 두 가지 역할이 있다.

| 역할 | 결정 권한 | 일반적으로 |
|------|----------|-----------|
| **Controlling** | 최종 후보쌍 결정 | Offer를 보낸 측 |
| **Controlled** | 결정에 따름 | Answer를 보낸 측 |

Controlling 에이전트가 Valid Candidate Pair 중 하나를 **지명(Nominate)**하면, 이것이 **Selected Candidate Pair**가 되어 세션 내내 사용된다.

```
[후보 선택 과정]

  Valid Pairs:
  ├── Pair 1: Host ↔ Host         (우선순위 최고) ← Controlling이 이것을 선택!
  └── Pair 5: Srflx ↔ Srflx      (우선순위 중간)

  → Selected Candidate Pair: Pair 1
  → 이후 모든 미디어/데이터가 이 경로로 전송
```

## 5.4 ICE 상태 머신

ICE 에이전트의 연결 상태는 다음과 같이 전이한다.

```
[ICE 연결 상태]

  new ──> checking ──> connected ──> completed
              │              │           │
              │              │           │
              └──> failed    └──> disconnected ──> failed
                     │                                │
                     └─── ICE Restart ────────────────┘
                          (전체 과정 재시작)
```

| 상태 | 의미 |
|------|------|
| `new` | 아직 후보 교환 안 됨 |
| `checking` | 연결성 검사 진행 중 |
| `connected` | 하나 이상의 후보쌍 성공 (아직 더 나은 쌍 탐색 중) |
| `completed` | 최종 후보쌍 선택 완료 |
| `disconnected` | 패킷이 일시적으로 도착하지 않음 |
| `failed` | 모든 후보쌍 실패 또는 타임아웃 |

## 5.5 ICE 재시작 (Restart)

Selected Candidate Pair가 동작을 멈추면(네트워크 변경, NAT 매핑 만료 등), ICE 에이전트는 `failed` 상태로 전이한다. 이때 **ICE Restart**를 통해 전체 과정을 처음부터 다시 시작할 수 있다.

```
[ICE Restart]

  1. 새로운 ice-ufrag / ice-pwd 생성
  2. 새로운 SDP Offer 생성 (재협상)
  3. 후보 수집부터 다시 시작
  4. 기존 미디어 전송은 Restart 완료까지 유지 (가능한 경우)
```

ICE Restart는 Wi-Fi에서 LTE로 전환되거나, VPN 연결이 변경되는 등 **네트워크 환경이 바뀔 때** 특히 유용하다.

# 6. DTLS / SRTP - 보안

## 6.1 왜 보안이 필수인가

WebRTC는 보안이 **선택이 아니라 필수**이다. 모든 WebRTC 연결은 반드시 암호화되어야 한다. 이는 WebRTC 스펙에 명시된 요구사항이다.

```
[WebRTC 보안 계층]

  ┌──────────────────────────────────────────────────┐
  │              WebRTC 보안 보장                      │
  │                                                  │
  │  1. 기밀성 (Confidentiality)                      │
  │     → 제3자가 내용을 엿볼 수 없음                   │
  │                                                  │
  │  2. 무결성 (Integrity)                            │
  │     → 전송 중 데이터가 변조되지 않음                 │
  │                                                  │
  │  3. 인증 (Authentication)                         │
  │     → 상대방이 기대한 피어인지 확인                  │
  └──────────────────────────────────────────────────┘
```

## 6.2 DTLS (Datagram Transport Layer Security)

DTLS는 **TLS의 UDP 버전**이다. TLS는 TCP 위에서 동작하기 때문에 UDP 기반인 WebRTC에는 사용할 수 없다. DTLS는 UDP의 비신뢰성(패킷 손실, 순서 변경)을 자체적으로 처리한다.

### DTLS 핸드셰이크 과정

```
  Client (active)                          Server (passive)
       │                                         │
       │──── ClientHello ────────────────────────>│  암호화 스위트 목록
       │                                         │
       │<──── HelloVerifyRequest ────────────────│  쿠키 (DoS 방지)
       │                                         │
       │──── ClientHello + Cookie ───────────────>│
       │                                         │
       │<──── ServerHello ───────────────────────│  선택된 암호화 스위트
       │<──── Certificate ───────────────────────│  서버 인증서
       │<──── ServerKeyExchange ─────────────────│  키 교환 파라미터
       │<──── CertificateRequest ────────────────│  클라이언트 인증서 요청
       │<──── ServerHelloDone ───────────────────│
       │                                         │
       │──── Certificate ────────────────────────>│  클라이언트 인증서
       │──── ClientKeyExchange ──────────────────>│  키 교환 파라미터
       │──── CertificateVerify ──────────────────>│  개인키 소유 증명
       │──── ChangeCipherSpec ───────────────────>│  "이제부터 암호화"
       │──── Finished (encrypted) ───────────────>│
       │                                         │
       │<──── ChangeCipherSpec ──────────────────│
       │<──── Finished (encrypted) ──────────────│
       │                                         │
       │════ 암호화된 통신 시작 ══════════════════│
```

### 인증서 검증 (Fingerprint)

DTLS 핸드셰이크에서 교환하는 인증서는 일반적인 CA 서명 인증서가 아니라 **자체 서명 인증서(Self-Signed Certificate)**이다. 그렇다면 상대방을 어떻게 신뢰할까?

답은 **SDP의 fingerprint 속성**에 있다.

```
[Fingerprint 검증 과정]

  1. Offer SDP에 인증서 해시 포함
     a=fingerprint:sha-256 E1:AB:2C:D3:...

  2. DTLS 핸드셰이크에서 상대 인증서 수신

  3. 수신한 인증서의 해시 계산

  4. SDP의 fingerprint와 비교
     일치 → 인증 성공 ✅ (SDP를 보낸 그 피어가 맞음)
     불일치 → 연결 거부 ❌ (중간자 공격 가능성)
```

이 방식의 보안은 **시그널링 채널의 무결성에 의존**한다. 시그널링 채널이 탈취되어 fingerprint가 변조되면 중간자 공격이 가능하다. 따라서 시그널링 채널은 반드시 TLS(WSS, HTTPS 등)로 보호해야 한다.

## 6.3 SRTP (Secure Real-time Transport Protocol)

SRTP는 RTP 미디어 패킷을 암호화하는 프로토콜이다. SRTP 자체는 키 교환 메커니즘이 없기 때문에, **DTLS 핸드셰이크에서 생성된 키를 사용**한다.

```
[DTLS에서 SRTP 키 도출]

  DTLS 핸드셰이크
       │
       ├── Pre-Master Secret (Diffie-Hellman)
       │         │
       │    Master Secret (PRF)
       │         │
       │    Session Keys
       │         │
       └────────>├── DTLS 통신 키 (DataChannel 암호화)
                 │
                 └── SRTP 키 (RFC 5705 키 내보내기)
                          │
                          ├── 송신 암호화 키
                          ├── 수신 복호화 키
                          ├── 송신 인증 키
                          └── 수신 인증 키
```

### SRTP 패킷 구조

```
  ┌─────────────────────────────────────────────┐
  │  RTP Header (평문)                           │  ← 라우팅에 필요하므로 암호화 안 함
  │  - Sequence Number, Timestamp, SSRC          │
  ├─────────────────────────────────────────────┤
  │  Encrypted Payload (암호화된 미디어 데이터)     │  ← AES 등으로 암호화
  ├─────────────────────────────────────────────┤
  │  Authentication Tag (인증 태그)               │  ← HMAC으로 무결성 보장
  └─────────────────────────────────────────────┘
```

RTP 헤더는 암호화하지 않는다. 중간의 네트워크 장비(라우터, SFU 등)가 패킷을 라우팅하려면 헤더 정보가 필요하기 때문이다. 대신 **Payload만 암호화하고, Authentication Tag로 헤더+Payload 전체의 무결성을 보장**한다.

각 패킷의 Sequence Number를 카운터로 사용하여, 같은 데이터를 두 번 보내더라도 **암호문이 매번 달라진다**. 이를 통해 패턴 인식과 재전송 공격을 방지한다.

## 6.4 보안 정리

```
[WebRTC 보안 전체 그림]

                    Signaling 채널 (TLS 보호 필수)
                           │
                     SDP 교환 (fingerprint 포함)
                           │
                    ┌──────▼──────┐
                    │ DTLS 핸드셰이크│
                    │ - 키 교환     │
                    │ - 상호 인증   │
                    │ - fingerprint │
                    │   검증       │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │                         │
       ┌──────▼──────┐          ┌──────▼──────┐
       │    SRTP     │          │    SCTP     │
       │ 미디어 암호화 │          │ over DTLS   │
       │ (RTP 패킷)  │          │ (DataChannel)│
       └─────────────┘          └─────────────┘

  보장: 기밀성 + 무결성 + 인증
  조건: 시그널링 채널이 안전해야 전체 보안이 성립
```

# 7. 정리

이번 편에서 다룬 핵심 개념을 한눈에 정리하면 다음과 같다.

| 개념 | 핵심 역할 | 기억할 포인트 |
|------|----------|--------------|
| **SDP** | 세션 협상 정보 교환 | 평문 텍스트, Offer/Answer 모델, `m=`과 `a=`가 핵심 |
| **NAT** | 사설 IP ↔ 공인 IP 변환 | 매핑 유형에 따라 P2P 가능 여부 결정 |
| **STUN** | 공인 IP:포트 발견 | Binding Request/Response, EI NAT에서만 효과적 |
| **TURN** | 트래픽 중계 (최후의 수단) | 모든 트래픽이 서버 경유, 비용이 비쌈 |
| **ICE** | 최적 연결 경로 탐색 | 후보 수집 → 페어링 → 검사 → 선택 |
| **DTLS** | 키 교환 + 상호 인증 | TLS의 UDP 버전, fingerprint로 인증 |
| **SRTP** | 미디어 암호화 | DTLS에서 도출한 키 사용, 헤더는 평문 |

```
[전체 흐름 요약]

  SDP 교환 (Signaling)
      │
  ICE 후보 수집 (Host → STUN → TURN)
      │
  ICE 후보 교환 + 연결성 검사
      │
  최적 후보쌍 선택
      │
  DTLS 핸드셰이크 (키 교환 + 인증)
      │
  SRTP/SCTP 암호화 통신 시작
```

다음 편에서는 이 개념들이 실제로 어떤 순서로 동작하는지, **WebRTC 연결 수립의 전체 흐름을 Step-by-Step**으로 따라가본다.

## 참고 자료

- [WebRTC for the Curious - Signaling](https://webrtcforthecurious.com/ko/docs/02-signaling/)
- [WebRTC for the Curious - Connecting](https://webrtcforthecurious.com/ko/docs/03-connecting/)
- [WebRTC for the Curious - Securing](https://webrtcforthecurious.com/ko/docs/04-securing/)
- [RFC 8866 - SDP](https://datatracker.ietf.org/doc/html/rfc8866)
- [RFC 8445 - ICE](https://datatracker.ietf.org/doc/html/rfc8445)
- [RFC 5389 - STUN](https://datatracker.ietf.org/doc/html/rfc5389)
- [RFC 5766 - TURN](https://datatracker.ietf.org/doc/html/rfc5766)
- [RFC 6347 - DTLS](https://datatracker.ietf.org/doc/html/rfc6347)
- [RFC 3711 - SRTP](https://datatracker.ietf.org/doc/html/rfc3711)
