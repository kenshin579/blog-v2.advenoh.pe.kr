---
title: "WebRTC 완벽 가이드 (11): 확장 구조 - SFU와 MCU"
description: "P2P Mesh의 한계를 넘어 다자 통화를 가능하게 하는 SFU와 MCU 아키텍처를 비교합니다. Simulcast, SVC 등 확장 기법과 대표적인 오픈소스 SFU 서버(LiveKit, ion-sfu, mediasoup, Janus)를 분석합니다."
date: 2026-02-07
update: 2026-02-07
tags:
  - WebRTC
  - SFU
  - MCU
  - Simulcast
  - SVC
  - LiveKit
  - Janus
  - mediasoup
series: "WebRTC 완벽 가이드"
---

10편에서 네트워크 트러블슈팅을 다루었다. 지금까지는 1:1 연결을 중심으로 실습했지만, 화상회의처럼 **여러 명이 동시에 참여**하는 시나리오에서는 P2P 구조가 한계에 부딪힌다. 이번 편에서는 다자 통화를 가능하게 하는 **SFU(Selective Forwarding Unit)** 와 **MCU(Multipoint Control Unit)** 아키텍처를 비교하고, 대표적인 오픈소스 SFU 서버를 소개한다.

# 1. P2P Mesh의 한계

## 1.1 Full Mesh 구조

지금까지 실습한 1:1 연결을 N명으로 확장하면 **Full Mesh** 구조가 된다. 모든 참가자가 서로 직접 연결한다.

```
[Full Mesh - 4명 참가자]

     A ◄════════════► B
     ▲ ╲            ╱ ▲
     ║   ╲        ╱   ║
     ║     ╲    ╱     ║
     ║       ╲╱       ║
     ║       ╱╲       ║
     ║     ╱    ╲     ║
     ║   ╱        ╲   ║
     ▼ ╱            ╲ ▼
     C ◄════════════► D

  각 참가자: 3개의 PeerConnection
  총 연결 수: 4 × 3 / 2 = 6개
```

## 1.2 연결 수 폭발

참가자 수(N)가 늘어나면 연결 수는 **N × (N-1) / 2**로 급증한다.

| 참가자 수 | 연결 수 | 인코딩 스트림 (인당) | 총 업로드 |
|-----------|---------|--------------------|---------|
| 2 | 1 | 1 | 2 |
| 4 | 6 | 3 | 12 |
| 8 | 28 | 7 | 56 |
| 16 | 120 | 15 | 240 |
| 50 | 1,225 | 49 | 2,450 |

## 1.3 Full Mesh의 실질적 문제

```
[참가자 8명일 때 A의 상황]

  A의 업로드:
  ├── B에게 영상+음성 인코딩 → 전송 (2Mbps)
  ├── C에게 영상+음성 인코딩 → 전송 (2Mbps)
  ├── D에게 영상+음성 인코딩 → 전송 (2Mbps)
  ├── E에게 영상+음성 인코딩 → 전송 (2Mbps)
  ├── F에게 영상+음성 인코딩 → 전송 (2Mbps)
  ├── G에게 영상+음성 인코딩 → 전송 (2Mbps)
  └── H에게 영상+음성 인코딩 → 전송 (2Mbps)
  = 7 × 2Mbps = 14Mbps 업로드 필요

  A의 다운로드:
  = 7 × 2Mbps = 14Mbps 다운로드 필요

  A의 CPU:
  = 7번 인코딩 (같은 영상을 7번 인코딩하는 것은 낭비)
```

| 문제 | 설명 |
|------|------|
| **대역폭** | 참가자 수에 비례하여 업/다운로드 대역폭 급증 |
| **CPU** | 같은 영상을 N-1번 인코딩해야 함 |
| **NAT** | 참가자마다 별도 ICE/STUN/TURN 과정 필요 |
| **관리** | N-1개의 PeerConnection 상태 관리 |

실무에서 Full Mesh는 **4~5명 이하**에서만 현실적이다. 그 이상은 SFU 또는 MCU가 필요하다.

# 2. 세 가지 아키텍처 비교

## 2.1 P2P Mesh

```
[P2P Mesh]

  모든 참가자가 서로 직접 연결

     A ◄══► B
     ▲╲  ╱▲
     ║  ╲╱  ║
     ║  ╱╲  ║
     ▼╱  ╲▼
     C ◄══► D

  인코딩: N-1회 (인당)
  서버: 불필요 (Signaling만)
  지연: 최소 (P2P 직접)
  비용: 서버 비용 없음
  한계: ~4명
```

## 2.2 SFU (Selective Forwarding Unit)

```
[SFU]

  각 참가자가 서버에 1번 업로드
  서버가 다른 참가자에게 전달 (트랜스코딩 없음)

     A ──upload──┐
                 ▼
     B ──upload──► SFU ──download──► A (B,C,D의 스트림)
                 ▲     ──download──► B (A,C,D의 스트림)
     C ──upload──┘     ──download──► C (A,B,D의 스트림)
                       ──download──► D (A,B,C의 스트림)
     D ──upload──┘

  인코딩: 1회 (인당)
  서버: 패킷 포워딩 (CPU 낮음)
  지연: 낮음 (트랜스코딩 없음)
  비용: 대역폭 비용
  한계: ~수백 명
```

## 2.3 MCU (Multipoint Control Unit)

```
[MCU]

  각 참가자가 서버에 1번 업로드
  서버가 합성한 단일 스트림을 각 참가자에게 전달

     A ──upload──┐
                 ▼
     B ──upload──► MCU ──합성 스트림──► A
                 ▲  (디코딩+합성+    ──► B
     C ──upload──┘   재인코딩)       ──► C
                                     ──► D
     D ──upload──┘

  ┌────────────────────────────┐
  │  MCU 합성 결과 (그리드)     │
  │  ┌─────┬─────┐            │
  │  │  A  │  B  │            │
  │  ├─────┼─────┤            │
  │  │  C  │  D  │            │
  │  └─────┴─────┘            │
  └────────────────────────────┘

  인코딩: 1회 (인당)
  서버: 디코딩+합성+재인코딩 (CPU 매우 높음)
  지연: 높음 (트랜스코딩 추가)
  비용: 서버 CPU 비용 높음
  한계: 서버 성능에 따라
```

## 2.4 상세 비교

| 항목 | P2P Mesh | SFU | MCU |
|------|----------|-----|-----|
| **서버 역할** | 없음 (Signaling만) | 패킷 포워딩 | 디코딩+합성+인코딩 |
| **클라이언트 업로드** | N-1 스트림 | 1 스트림 | 1 스트림 |
| **클라이언트 다운로드** | N-1 스트림 | N-1 스트림 | 1 스트림 (합성) |
| **서버 CPU** | 없음 | 낮음 | **매우 높음** |
| **서버 대역폭** | 없음 | 높음 | 중간 |
| **클라이언트 CPU** | 높음 (N-1 인코딩) | 낮음 (1 인코딩) | **가장 낮음** |
| **클라이언트 대역폭** | 매우 높음 | 중간 | **가장 낮음** |
| **지연** | 최소 | 낮음 | 중간~높음 |
| **확장성** | ~4명 | ~수백 명 | ~수십 명 |
| **레이아웃 제어** | 클라이언트 | 클라이언트 | **서버** |
| **NAT 통과** | 각 피어마다 | 서버 1회 | 서버 1회 |

## 2.5 선택 가이드

```
[아키텍처 선택 기준]

  참가자 수:
  ├── 2명:           P2P (가장 단순, 서버 불필요)
  ├── 3~4명:         P2P 또는 SFU
  ├── 5~수백 명:     SFU (가장 일반적)
  └── 저사양 클라이언트: MCU (클라이언트 부담 최소)

  서비스 유형:
  ├── 화상회의:       SFU (Google Meet, Zoom 방식)
  ├── 라이브 방송:    SFU (1:N 전달)
  ├── 교육 플랫폼:    SFU + 녹화
  ├── IoT 모니터링:   SFU (다수 카메라 → 관제)
  └── 저대역폭 환경:  MCU (클라이언트 다운로드 최소)

  서버 자원:
  ├── CPU 여유 적음:  SFU (포워딩만)
  └── CPU 여유 많음:  MCU도 가능
```

# 3. SFU 동작 원리

## 3.1 Publish/Subscribe 모델

SFU의 핵심은 **Pub/Sub 모델**이다. 각 참가자는 자신의 미디어를 **Publish(업로드)** 하고, 다른 참가자의 미디어를 **Subscribe(다운로드)** 한다.

```
[Pub/Sub 모델]

  참가자 A                    SFU                    참가자 B
  ┌──────────┐          ┌───────────┐          ┌──────────┐
  │          │          │           │          │          │
  │ Publish ─│──────────│─► Track A │          │          │
  │ (video)  │          │     │     │          │          │
  │          │          │     ├─────│──────────│─► Sub A  │
  │          │          │     │     │          │          │
  │ Sub B  ◄─│──────────│─ Track B ◄│──────────│─ Publish │
  │          │          │     │     │          │ (video)  │
  │ Sub C  ◄─│──────────│─ Track C ◄│──────────│──────────│──┐
  │          │          │           │          │          │  │
  └──────────┘          └───────────┘          └──────────┘  │
                                                              │
  참가자 C                                                     │
  ┌──────────┐                                                │
  │          │                                                │
  │ Publish ─│────────────────────────────────────────────────┘
  │ (video)  │
  └──────────┘
```

## 3.2 SFU에서의 PeerConnection 구조

```
[SFU 기준 PeerConnection 구성]

  참가자 A ◄──── PeerConnection 1 ────► SFU
                 ├── Upload: A의 video/audio (sendonly)
                 └── Download: B,C,D의 video/audio (recvonly)

  참가자 B ◄──── PeerConnection 2 ────► SFU
                 ├── Upload: B의 video/audio (sendonly)
                 └── Download: A,C,D의 video/audio (recvonly)

  또는 (분리 구조):

  참가자 A ◄──── Publisher PC ────► SFU   (sendonly)
           ◄──── Subscriber PC ──► SFU   (recvonly)
```

SFU 구현에 따라 하나의 PeerConnection에서 송수신을 모두 처리하거나, Publisher/Subscriber를 별도 PeerConnection으로 분리한다.

## 3.3 SFU가 하는 일과 하지 않는 일

```
[SFU가 하는 일]

  ✅ RTP 패킷 포워딩 (수신 → 재전송)
  ✅ Simulcast 레이어 선택 (품질별 라우팅)
  ✅ RTCP 피드백 처리 (PLI, NACK, REMB)
  ✅ 대역폭 추정 및 적응
  ✅ 활성 화자 감지 (Audio Level)
  ✅ 구독 관리 (누가 누구의 스트림을 받을지)

[SFU가 하지 않는 일]

  ❌ 미디어 디코딩/재인코딩 (트랜스코딩)
  ❌ 영상 합성 (그리드 레이아웃)
  ❌ 코덱 변환 (VP8→H.264 등)
  ❌ 해상도/프레임레이트 변경
```

트랜스코딩이 없으므로 **서버 CPU 부담이 매우 낮다**. 이것이 SFU가 MCU보다 확장성이 좋은 핵심 이유다.

# 4. Simulcast와 SVC

SFU에서 다양한 네트워크 환경의 수신자를 지원하려면, **하나의 소스에서 여러 품질의 스트림을 제공**해야 한다. 두 가지 기법이 있다.

## 4.1 Simulcast

```
[Simulcast 동작]

  발신 측 (인코더)                    SFU                      수신 측
  ┌──────────────┐             ┌───────────┐           ┌──────────────┐
  │ 카메라 입력    │             │           │           │ PC (좋은 네트워크)│
  │  1080p       │             │           │──High────>│ → 1080p 수신  │
  │              │             │           │           └──────────────┘
  │  인코딩 3번:  │             │           │
  │  ┌─────────┐ │──High──────>│  레이어    │           ┌──────────────┐
  │  │ 1080p   │ │  (2Mbps)   │  선택     │──Mid─────>│ 모바일 (보통)  │
  │  ├─────────┤ │             │           │           │ → 720p 수신   │
  │  │ 720p    │ │──Mid───────>│           │           └──────────────┘
  │  ├─────────┤ │  (1Mbps)   │           │
  │  │ 360p    │ │             │           │           ┌──────────────┐
  │  └─────────┘ │──Low───────>│           │──Low─────>│ 모바일 (느린)  │
  │              │  (300kbps)  │           │           │ → 360p 수신   │
  └──────────────┘             └───────────┘           └──────────────┘

  발신 측: 3개 품질을 동시 인코딩 + 전송
  SFU: 수신 측 네트워크 상태에 따라 적절한 레이어 선택
  수신 측: 자신에게 맞는 품질만 수신
```

| 레이어 | 해상도 | 비트레이트 | 용도 |
|--------|--------|-----------|------|
| High (f) | 1080p/720p | 1.5~2.5 Mbps | 발표자, 큰 화면 |
| Mid (h) | 720p/360p | 500k~1 Mbps | 일반 참가자 |
| Low (q) | 360p/180p | 100~300 kbps | 썸네일, 저대역폭 |

**장점**: SFU가 트랜스코딩 없이 레이어만 선택하면 됨
**단점**: 발신 측이 3번 인코딩 → 업로드 대역폭 증가 (약 3~4Mbps)

## 4.2 SVC (Scalable Video Coding)

```
[SVC 동작]

  발신 측 (인코더)                    SFU                      수신 측
  ┌──────────────┐             ┌───────────┐           ┌──────────────┐
  │ 카메라 입력    │             │           │           │              │
  │              │             │           │           │ High 레이어   │
  │  SVC 인코딩   │             │           │──Full────>│ + Mid 레이어  │
  │  (1번만)      │             │  레이어    │           │ + Low 레이어  │
  │              │             │  드롭     │           └──────────────┘
  │  ┌─────────┐ │             │           │
  │  │Base+Enh │ │──1 스트림──>│           │           ┌──────────────┐
  │  │(단일)    │ │             │           │──Mid+Low─>│ Mid 레이어   │
  │  └─────────┘ │             │           │           │ + Low 레이어  │
  │              │             │           │           └──────────────┘
  └──────────────┘             │           │
                               │           │           ┌──────────────┐
                               │           │──Low─────>│ Low 레이어만  │
                               │           │           └──────────────┘
                               └───────────┘

  발신 측: 1개 스트림만 인코딩 + 전송 (레이어 내장)
  SFU: 불필요한 상위 레이어를 드롭
  수신 측: 필요한 레이어만 수신
```

| 구분 | Simulcast | SVC |
|------|-----------|-----|
| 인코딩 횟수 | 3회 (레이어별) | 1회 (레이어 내장) |
| 업로드 대역폭 | 높음 (합산) | 낮음 (단일 스트림) |
| SFU 처리 | 스트림 선택 | 레이어 드롭 |
| 지원 코덱 | VP8, H.264, VP9, AV1 | VP9, AV1 |
| 전환 지연 | 키프레임 대기 필요 | 즉시 전환 |
| 브라우저 지원 | 광범위 | VP9/AV1만 |

**실무에서는 Simulcast가 더 보편적**이다. SVC는 VP9/AV1 코덱에서만 지원되고, 브라우저 호환성이 제한적이기 때문이다.

## 4.3 Dynacast (동적 스트림 최적화)

최신 SFU는 **Dynacast** 기능을 제공한다. 아무도 구독하지 않는 스트림의 발신을 자동으로 중단하여 대역폭을 절약한다.

```
[Dynacast 동작]

  상황: 10명 중 발표자 A만 큰 화면, 나머지는 썸네일

  Dynacast 없음:
  ├── 모든 참가자가 High+Mid+Low 3개 레이어 업로드
  └── 대부분의 High 레이어가 사용되지 않음 (낭비)

  Dynacast 있음:
  ├── 발표자 A: High+Mid+Low 업로드 (큰 화면 수신자 있음)
  ├── 나머지 9명: Low만 업로드 (썸네일만 표시됨)
  └── High/Mid 인코딩 중단 → CPU/대역폭 절약
```

# 5. 활성 화자 감지

## 5.1 동작 원리

SFU는 각 참가자의 오디오 레벨(RFC 6464)을 모니터링하여 **현재 말하고 있는 사람**을 감지한다.

```
[활성 화자 감지 흐름]

  A: 오디오 레벨 = 40dB (말하는 중)
  B: 오디오 레벨 = 5dB  (조용)
  C: 오디오 레벨 = 35dB (말하는 중)
  D: 오디오 레벨 = 2dB  (음소거)

  SFU 판단:
  ├── 활성 화자: A, C
  ├── A의 영상: High 레이어로 전달 (큰 화면)
  ├── C의 영상: High 레이어로 전달 (큰 화면)
  └── B, D의 영상: Low 레이어로 전달 (썸네일)
```

## 5.2 클라이언트에서 활용

```javascript
// LiveKit SDK 예시
room.on('activeSpeakersChanged', (speakers) => {
  // speakers: 현재 말하고 있는 참가자 목록
  speakers.forEach(speaker => {
    // 해당 참가자의 비디오를 큰 화면으로 전환
    highlightVideo(speaker.identity);
  });
});
```

# 6. 대표적인 오픈소스 SFU 서버

## 6.1 비교 요약

| 항목 | LiveKit | ion-sfu | mediasoup | Janus |
|------|---------|---------|-----------|-------|
| **언어** | Go | Go | Node.js / Rust | C |
| **유형** | 완성형 플랫폼 | SFU 라이브러리 | 임베더블 SFU | 모듈형 게이트웨이 |
| **Simulcast** | ✅ | ✅ | ✅ | 플러그인 |
| **SVC** | VP9, AV1 | 제한적 | VP9, AV1 | 플러그인 |
| **E2EE** | ✅ | ❌ | 가능 | 플러그인 |
| **배포 난이도** | 낮음 (단일 바이너리) | 중간 | 높음 (통합 필요) | 중간 |
| **확장성** | 분산 클러스터링 | 단일 서버 | 단일 서버 | 단일 서버 |
| **클라이언트 SDK** | 7+ 플랫폼 | JS | JS, C++, Python | JS |
| **라이선스** | Apache 2.0 | MIT | ISC | GPL v3 |
| **적합한 용도** | 프로덕션 서비스 | 커스텀 SFU 개발 | 커스텀 앱 | 다양한 프로토콜 브릿지 |

## 6.2 LiveKit (Go)

가장 활발하게 개발되는 프로덕션 레벨 SFU 플랫폼이다.

```
[LiveKit 아키텍처]

  클라이언트                     LiveKit Server                클라이언트
  ┌──────────┐              ┌─────────────────┐           ┌──────────┐
  │ JS SDK   │              │                 │           │ iOS SDK  │
  │          │──WebSocket──>│  Signaling      │<──WS──────│          │
  │          │              │  (Room 관리)     │           │          │
  │          │──WebRTC─────>│  SFU Engine     │──WebRTC──>│          │
  │          │              │  (Pion 기반)     │           │          │
  └──────────┘              │                 │           └──────────┘
                            │  ┌─────────────┐│
                            │  │ Simulcast   ││
                            │  │ Dynacast    ││
                            │  │ Speaker Det ││
                            │  │ Recording   ││
                            │  └─────────────┘│
                            └─────────────────┘
```

### 6.2.1 주요 특징

- **단일 바이너리** 배포: Go로 작성, 의존성 없음
- **JWT 인증**: API Key/Secret 기반 토큰 발급
- **분산 아키텍처**: 여러 서버에 걸친 수평 확장
- **Webhook**: 이벤트 알림 (참가자 입장/퇴장, 트랙 추가 등)
- **클라이언트 SDK**: JS, Swift, Kotlin, Flutter, React Native, Rust, Unity

### 6.2.2 빠른 시작

```bash
# 설치 (macOS)
brew install livekit

# 개발 모드 실행
livekit-server --dev
# API Key: devkey, API Secret: secret

# 토큰 생성
lk token create \
  --api-key devkey \
  --api-secret secret \
  --join \
  --room my-room \
  --identity user1 \
  --valid-for 24h

# 테스트 스트림 발행
lk room join \
  --url ws://localhost:7880 \
  --api-key devkey \
  --api-secret secret \
  --room my-room \
  --identity publisher \
  --publish-demo
```

### 6.2.3 JavaScript 클라이언트

```javascript
import { Room, RoomEvent } from 'livekit-client';

const room = new Room();

// 이벤트 핸들러
room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
  // 원격 트랙 수신
  const element = track.attach();
  document.getElementById('videos').appendChild(element);
});

room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
  // 활성 화자 변경
  console.log('Active speakers:', speakers.map(s => s.identity));
});

// 연결
await room.connect('ws://localhost:7880', token);

// 카메라/마이크 발행
await room.localParticipant.enableCameraAndMicrophone();
```

## 6.3 Pion ion-sfu (Go)

Pion WebRTC 팀이 만든 순수 Go SFU 라이브러리다.

```
[ion-sfu 아키텍처]

  클라이언트                    ion-sfu
  ┌──────────┐           ┌─────────────────┐
  │          │           │                 │
  │          │──JSON-RPC─│─► Signaling     │
  │          │  (WS)     │                 │
  │          │──WebRTC──>│─► SFU Engine    │
  │          │           │    (Pion 기반)   │
  └──────────┘           │                 │
                         │  인터페이스:      │
                         │  ├── JSON-RPC    │
                         │  ├── gRPC        │
                         │  └── Go API      │
                         └─────────────────┘
```

### 6.3.1 주요 특징

- **라이브러리 형태**: 자체 서버에 통합 가능
- **3가지 인터페이스**: JSON-RPC (브라우저), gRPC (서비스 간), Go API (임베딩)
- **혼잡 제어**: TWCC, REMB, SR/RR 지원
- **활성 화자 감지**: RFC 6464 Audio Level

### 6.3.2 Docker 실행

```bash
# JSON-RPC 모드
docker run -p 7000:7000 -p 5000-5200:5000-5200/udp \
  pionwebrtc/ion-sfu:latest-jsonrpc
```

### 6.3.3 Go 코드에서 직접 사용

```go
import "github.com/pion/ion-sfu/pkg/sfu"

// SFU 인스턴스 생성
s := sfu.NewSFU(sfu.Config{
    Router: sfu.RouterConfig{
        MaxBandwidth: 1500000,
    },
})

// WebSocket 핸들러에서 피어 추가
peer := sfu.NewPeer(s)
peer.OnTrack(func(track *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
    // 트랙 수신 처리
})
```

## 6.4 mediasoup (Node.js / Rust)

커스텀 애플리케이션에 임베딩하는 고성능 SFU다.

```
[mediasoup 아키텍처]

  ┌──────────────────────────────┐
  │  Application Server          │
  │  (Node.js / Express)         │
  │                              │
  │  ┌──────────────────────┐    │
  │  │  mediasoup (SFU)     │    │
  │  │  ├── Router          │    │  Room 단위
  │  │  │   ├── Producer    │    │  (미디어 라우팅)
  │  │  │   ├── Consumer    │    │
  │  │  │   └── Transport   │    │
  │  │  └── Worker (C++)    │    │  미디어 처리
  │  └──────────────────────┘    │
  │                              │
  │  Signaling 로직 (직접 구현)    │
  └──────────────────────────────┘
```

### 6.4.1 주요 특징

- **임베더블 설계**: 독립 서버가 아닌 애플리케이션에 통합하는 라이브러리
- **로우레벨 API**: Signaling, Room 관리를 직접 구현
- **고성능**: C++ Worker가 미디어 처리, Node.js는 제어만
- **클라이언트**: mediasoup-client (JS), libmediasoupclient (C++), Python

### 6.4.2 핵심 개념

```
[mediasoup 핵심 객체]

  Worker          → C++ 프로세스 (미디어 처리 담당)
    └── Router    → Room 단위 미디어 라우팅
         ├── Transport   → WebRTC 연결 (Producer/Consumer 포함)
         │    ├── Producer   → 미디어 발신 (업로드)
         │    └── Consumer   → 미디어 수신 (다운로드)
         └── Transport
              ├── Producer
              └── Consumer
```

## 6.5 Janus (C)

다목적 WebRTC 게이트웨이다. 플러그인 구조로 다양한 기능을 지원한다.

```
[Janus 아키텍처]

  ┌──────────────────────────────────────┐
  │  Janus Gateway (C 코어)               │
  │                                      │
  │  ┌──────────────────────────────┐    │
  │  │  WebRTC 코어                  │    │
  │  │  (ICE, DTLS, SRTP)           │    │
  │  └──────────────────────────────┘    │
  │                                      │
  │  플러그인:                            │
  │  ├── VideoRoom    (SFU 화상회의)      │
  │  ├── AudioBridge  (MCU 오디오 믹싱)   │
  │  ├── Streaming    (라이브 방송)       │
  │  ├── SIP          (VoIP 브릿지)      │
  │  ├── TextRoom     (DataChannel 채팅)  │
  │  ├── RecordPlay   (녹화/재생)         │
  │  └── 커스텀 플러그인 (C API)           │
  └──────────────────────────────────────┘
```

### 6.5.1 주요 특징

- **C로 구현**: 최소 리소스, 고성능
- **플러그인 아키텍처**: 기능을 플러그인으로 분리
- **다목적**: SFU(VideoRoom) + MCU(AudioBridge) + SIP + 스트리밍
- **JSON 메시징**: 브라우저와 JSON 기반 프로토콜

### 6.5.2 플러그인별 용도

| 플러그인 | 유형 | 용도 |
|---------|------|------|
| VideoRoom | SFU | 화상회의 (영상 포워딩) |
| AudioBridge | MCU | 오디오 믹싱 (합성 후 전달) |
| Streaming | 방송 | RTP/RTSP → WebRTC 변환 |
| SIP | 브릿지 | WebRTC ↔ SIP/VoIP 연동 |
| TextRoom | 데이터 | DataChannel 기반 채팅 |
| RecordPlay | 녹화 | 스트림 녹화/재생 |

# 7. Golang에서의 확장 전략

## 7.1 단순한 SFU 구조

Pion을 사용하여 가장 단순한 SFU의 핵심 로직을 이해한다.

```go
// 간단한 SFU 핵심 로직 (개념 코드)

type Room struct {
    peers map[string]*Peer
    mu    sync.RWMutex
}

type Peer struct {
    id string
    pc *webrtc.PeerConnection
    // 이 피어가 발행하는 트랙들
    publishedTracks []*webrtc.TrackRemote
    // 이 피어에게 전달하는 로컬 트랙들
    localTracks     []*webrtc.TrackLocalStaticRTP
}

// 새 참가자의 트랙을 기존 참가자에게 전달
func (r *Room) onTrack(senderID string, remoteTrack *webrtc.TrackRemote) {
    r.mu.RLock()
    defer r.mu.RUnlock()

    for id, peer := range r.peers {
        if id == senderID {
            continue // 자기 자신에게는 전달하지 않음
        }

        // 로컬 트랙 생성 (원격 트랙과 같은 코덱)
        localTrack, err := webrtc.NewTrackLocalStaticRTP(
            remoteTrack.Codec().RTPCodecCapability,
            remoteTrack.ID(),
            remoteTrack.StreamID(),
        )
        if err != nil {
            continue
        }

        // 수신자의 PeerConnection에 트랙 추가
        peer.pc.AddTrack(localTrack)
        peer.localTracks = append(peer.localTracks, localTrack)

        // RTP 패킷 포워딩 고루틴
        go func() {
            buf := make([]byte, 1500)
            for {
                n, _, err := remoteTrack.Read(buf)
                if err != nil {
                    return
                }
                localTrack.Write(buf[:n])
            }
        }()
    }
}
```

## 7.2 RTP 포워딩의 핵심

```
[RTP 포워딩 흐름]

  발신자 A                    SFU                       수신자 B
  ┌─────────┐          ┌────────────────┐          ┌─────────┐
  │         │          │                │          │         │
  │ Encoder │──RTP──>  │ TrackRemote    │          │         │
  │         │  패킷     │   .Read(buf)   │          │         │
  │         │          │       │        │          │         │
  │         │          │       ▼        │          │         │
  │         │          │ TrackLocalRTP  │──RTP──>  │ Decoder │
  │         │          │   .Write(buf)  │  패킷     │         │
  │         │          │                │          │         │
  └─────────┘          └────────────────┘          └─────────┘

  핵심: 디코딩/재인코딩 없이 RTP 바이트를 그대로 복사
  → 서버 CPU 사용 최소화
  → 지연 추가 최소화
```

## 7.3 프로덕션 SFU로 가는 길

단순한 RTP 포워딩에서 프로덕션 SFU까지 추가해야 할 기능이다.

```
[프로덕션 SFU 체크리스트]

  기본 기능:
  ├── □ Room 관리 (생성, 삭제, 참가, 퇴장)
  ├── □ Signaling 서버 (WebSocket 기반)
  ├── □ RTP 포워딩 (TrackRemote → TrackLocalRTP)
  └── □ RTCP 처리 (PLI, NACK 중계)

  품질 관리:
  ├── □ Simulcast 레이어 선택
  ├── □ 대역폭 추정 (TWCC, REMB)
  ├── □ 적응형 비트레이트
  └── □ 활성 화자 감지

  안정성:
  ├── □ 참가자 입장/퇴장 시 Renegotiation
  ├── □ ICE Restart 처리
  ├── □ 재연결 로직
  └── □ Graceful shutdown

  운영:
  ├── □ 인증/인가 (JWT)
  ├── □ 모니터링/메트릭
  ├── □ 녹화
  ├── □ 수평 확장 (분산)
  └── □ TURN 서버 연동
```

**권장**: 직접 구축하기보다 **LiveKit이나 ion-sfu를 기반**으로 시작하는 것이 현실적이다. 위 목록의 기능을 처음부터 구현하는 것은 수개월의 작업이다.

# 8. SFU 배포 아키텍처

## 8.1 단일 서버

```
[단일 서버 배포]

  ┌──────────────────────────────┐
  │  Server                      │
  │  ├── SFU Engine              │
  │  ├── Signaling (WebSocket)   │
  │  └── TURN (coturn)           │
  │                              │
  │  UDP: 3478 (TURN)            │
  │  UDP: 50000-50200 (RTP)      │
  │  TCP: 443 (WSS + TURN/TLS)  │
  └──────────────────────────────┘

  적합: 소규모 (~100명 동시)
  장점: 구성 단순
  단점: 단일 장애 지점, 지리적 지연
```

## 8.2 분산 서버 (Cascading)

```
[분산 SFU 배포]

  서울 리전                    미국 리전
  ┌──────────────┐          ┌──────────────┐
  │  SFU Node 1  │◄════════>│  SFU Node 2  │
  │  (한국 사용자) │ Cascading │  (미국 사용자) │
  └──────┬───────┘          └──────┬───────┘
         │                         │
    ┌────┴────┐              ┌─────┴────┐
    │ User A  │              │ User C   │
    │ User B  │              │ User D   │
    └─────────┘              └──────────┘

  Room "meeting-1"의 참가자:
  ├── User A, B → 서울 SFU Node에 연결
  └── User C, D → 미국 SFU Node에 연결

  SFU Node 간 Cascading:
  └── 서울 Node ◄──RTP 포워딩──► 미국 Node
      (A,B의 스트림을 미국으로, C,D의 스트림을 서울로)
```

LiveKit은 이러한 **분산 아키텍처를 내장**하고 있어, 멀티 리전 배포가 가능하다.

## 8.3 Redis Pub/Sub를 이용한 시그널링 확장

```
[다중 Signaling 서버]

  Client ──WS──► Signaling 1 ──► Redis Pub/Sub ◄── Signaling 2 ◄──WS── Client
                                       │
                                  ┌────┴────┐
                                  │  SFU    │
                                  └─────────┘

  Signaling 서버를 수평 확장할 때
  Redis Pub/Sub로 서버 간 메시지 동기화
```

# 9. 정리

| 주제 | 핵심 내용 |
|------|----------|
| **P2P Mesh 한계** | N×(N-1)/2 연결, 4~5명 초과 시 비현실적 |
| **SFU** | 패킷 포워딩만, 트랜스코딩 없음, CPU 낮음, 가장 보편적 |
| **MCU** | 디코딩+합성+재인코딩, CPU 높음, 클라이언트 대역폭 최소 |
| **Simulcast** | 3개 품질 동시 인코딩, SFU가 레이어 선택, VP8/H.264 지원 |
| **SVC** | 단일 스트림에 레이어 내장, VP9/AV1만, 더 효율적 |
| **Dynacast** | 구독자 없는 스트림 자동 중단 |
| **LiveKit** | Go, 프로덕션 레벨, 분산, JWT 인증, 7+ SDK |
| **ion-sfu** | Go, Pion 기반, 라이브러리 형태, 커스텀 개발용 |
| **mediasoup** | Node.js/Rust, 임베더블, 로우레벨 API |
| **Janus** | C, 플러그인 아키텍처, SFU+MCU+SIP+스트리밍 |
| **Go 확장** | TrackRemote.Read → TrackLocalRTP.Write (RTP 포워딩) |

```
[이 시리즈의 현재 위치]

  ✅ 1편: 개요
  ✅ 2편: 전체 구조
  ✅ 3편: 핵심 개념 (SDP, ICE, STUN, TURN)
  ✅ 4편: 연결 흐름 Step-by-Step
  ✅ 5편: Signaling Server (Golang)
  ✅ 6편: Pion WebRTC 라이브러리
  ✅ 7편: 첫 연결 실습
  ✅ 8편: DataChannel 심화
  ✅ 9편: Media 스트림
  ✅ 10편: 트러블슈팅
  ✅ 11편: SFU/MCU 확장 (이 글) ← 지금 여기
  ☐ 12편: 보안과 운영
  ☐ 13편: 기술 선택 가이드
```

다음 편에서는 **보안과 운영**을 다룬다. DTLS/SRTP의 심화 개념, Signaling 단계의 인증 처리, TURN 서버 운영, 로그와 모니터링 포인트를 정리한다.

## 참고 자료

- [WebRTC for the Curious - Applied WebRTC](https://webrtcforthecurious.com/ko/docs/08-applied-webrtc/)
- [LiveKit - Open Source WebRTC SFU](https://livekit.io/)
- [Pion ion-sfu](https://github.com/pion/ion-sfu)
- [mediasoup - Cutting Edge WebRTC](https://mediasoup.org/)
- [Janus WebRTC Gateway](https://janus.conf.meetecho.com/)
- [LiveKit Docs - Architecture](https://docs.livekit.io/home/)
- [RFC 7656 - A Taxonomy of Semantics and Mechanisms for RTP Sources](https://tools.ietf.org/html/rfc7656)
