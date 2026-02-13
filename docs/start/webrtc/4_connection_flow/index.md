---
title: "WebRTC 완벽 가이드 (4): WebRTC 연결 흐름 Step-by-Step"
description: "WebRTC 연결이 수립되는 전체 과정을 6단계로 나누어 시퀀스 다이어그램, API 호출 순서, 상태 변화와 함께 상세히 따라갑니다."
date: 2026-02-07
update: 2026-02-07
tags:
  - WebRTC
  - RTCPeerConnection
  - Offer
  - Answer
  - ICE Candidate
  - Signaling
  - 연결 흐름
series: "WebRTC 완벽 가이드"
---

3편에서 SDP, ICE, STUN, TURN, DTLS/SRTP 각각의 개념을 상세히 다루었다. 이번 편에서는 이 개념들이 실제로 **어떤 순서로 조합되어 하나의 WebRTC 연결을 만들어내는지** 전체 흐름을 따라간다.

이전 편들에서 각 조각을 이해했다면, 이번 편에서 그 조각들이 하나의 퍼즐로 맞춰지는 과정을 볼 수 있다.

# 1. 전체 흐름 개요

WebRTC 연결은 크게 **6단계**로 진행된다. 각 단계에서 어떤 프로토콜이 사용되는지를 함께 표시했다.

```
  ┌─────────────────────────────────────────────────────────────┐
  │                  WebRTC 연결 수립 6단계                       │
  │                                                             │
  │  ① Signaling 서버 연결                      [WebSocket/HTTP] │
  │       │                                                     │
  │  ② Offer 생성 및 전달                        [SDP]           │
  │       │                                                     │
  │  ③ Answer 생성 및 전달                       [SDP]           │
  │       │                                                     │
  │  ④ ICE Candidate 교환                       [ICE/STUN/TURN] │
  │       │                                                     │
  │  ⑤ PeerConnection 연결 완료                  [DTLS/SRTP]     │
  │       │                                                     │
  │  ⑥ Media / Data 전송 시작                    [RTP/SCTP]      │
  │                                                             │
  └─────────────────────────────────────────────────────────────┘
```

이 6단계를 하나의 시퀀스 다이어그램으로 표현하면 다음과 같다.

```
  Peer A (Offerer)           Signaling Server           Peer B (Answerer)
       │                           │                          │
  ① ──│── WebSocket 연결 ─────────>│<── WebSocket 연결 ───────│── ①
       │                           │                          │
       │   createOffer()           │                          │
       │   setLocalDescription()   │                          │
  ② ──│── Offer SDP ─────────────>│── Offer SDP ────────────>│── ②
       │                           │                          │
       │                           │    setRemoteDescription()│
       │                           │    createAnswer()        │
       │                           │    setLocalDescription() │
  ③ ──│<── Answer SDP ────────────│<── Answer SDP ───────────│── ③
       │   setRemoteDescription()  │                          │
       │                           │                          │
  ④ ──│── ICE Candidate ─────────>│── ICE Candidate ────────>│── ④
       │<── ICE Candidate ─────────│<── ICE Candidate ────────│
       │                           │                          │
       │   (ICE 연결성 검사)        │                          │
  ⑤ ──│◄═══════ DTLS 핸드셰이크 ══════════════════════════════│── ⑤
       │                           │                          │
  ⑥ ──│◄═══════ SRTP/SCTP 미디어·데이터 전송 ═════════════════│── ⑥
       │                           │                          │
```

이제 각 단계를 상세히 따라가 보자.

# 2. 1단계: Signaling 서버 연결

## 2.1 무엇이 일어나는가

두 피어가 WebRTC 연결을 시작하려면, 먼저 **서로에게 메시지를 전달할 수 있는 채널**이 필요하다. SDP와 ICE 후보를 교환해야 하기 때문이다. 이 채널이 Signaling 서버이다.

```
[1단계: Signaling 서버 연결]

  Peer A                    Signaling Server                    Peer B
       │                           │                              │
       │── ws://signal.example.com │                              │
       │   WebSocket 연결 ─────────>│                              │
       │                           │<── WebSocket 연결 ────────────│
       │                           │    ws://signal.example.com   │
       │                           │                              │
       │── Join Room "room-123" ──>│                              │
       │                           │<── Join Room "room-123" ─────│
       │                           │                              │
       │<── "Peer B가 입장했습니다" ─│                              │
       │                           │                              │
```

## 2.2 코드로 보기

```javascript
// ──── Peer A (브라우저) ────
const ws = new WebSocket('wss://signal.example.com');

ws.onopen = () => {
  // 방 참여
  ws.send(JSON.stringify({
    type: 'join',
    room: 'room-123',
    peerId: 'peer-a'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'peer-joined':
      // 새 피어가 들어오면 Offer를 시작
      startCall();
      break;
    case 'offer':
      handleOffer(message.sdp);
      break;
    case 'answer':
      handleAnswer(message.sdp);
      break;
    case 'ice-candidate':
      handleIceCandidate(message.candidate);
      break;
  }
};
```

Signaling 서버는 WebRTC 스펙에 포함되지 않으므로, 메시지 형식과 프로토콜은 자유롭게 설계할 수 있다. 위 예시는 가장 단순한 형태이다.

# 3. 2단계: Offer 생성 및 전달

## 3.1 무엇이 일어나는가

Peer A(Offerer)가 통화를 시작한다. RTCPeerConnection 객체를 생성하고, 미디어 트랙을 추가한 뒤, Offer SDP를 생성하여 상대방에게 전달한다.

```
[2단계: Offer 생성]

  Peer A (Offerer)
       │
       │  1. new RTCPeerConnection(config)
       │     → PeerConnection 객체 생성
       │     → ICE Agent 초기화
       │
       │  2. getUserMedia()
       │     → 카메라/마이크 접근 권한 요청
       │     → MediaStream 획득
       │
       │  3. addTrack(audioTrack)
       │     addTrack(videoTrack)
       │     → Transceiver 생성 (sendrecv)
       │     → SDP에 m=audio, m=video 추가 예정
       │
       │  4. createOffer()
       │     → SDP Offer 생성
       │     → 지원하는 코덱, 미디어 방향 등 포함
       │
       │  5. setLocalDescription(offer)
       │     → Offer를 로컬에 적용
       │     → ⚡ ICE 후보 수집 시작!
       │
       │  6. Signaling 서버를 통해 Offer 전달
       │
```

## 3.2 코드로 보기

```javascript
// ──── Peer A: Offer 생성 ────
async function startCall() {
  // 1. PeerConnection 생성
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      {
        urls: 'turn:turn.example.com:3478',
        username: 'user',
        credential: 'pass'
      }
    ]
  });

  // 2. 미디어 스트림 획득
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: { width: 1280, height: 720 }
  });

  // 3. 트랙 추가 → Transceiver 자동 생성
  stream.getTracks().forEach(track => {
    pc.addTrack(track, stream);
  });

  // 4. ICE 후보 발생 시 Signaling으로 전달 (④단계에서 상세 설명)
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      ws.send(JSON.stringify({
        type: 'ice-candidate',
        candidate: event.candidate
      }));
    }
  };

  // 5. Offer 생성
  const offer = await pc.createOffer();

  // 6. Local Description 설정 → ICE 수집 시작
  await pc.setLocalDescription(offer);

  // 7. Signaling 서버를 통해 Offer 전달
  ws.send(JSON.stringify({
    type: 'offer',
    sdp: pc.localDescription
  }));
}
```

## 3.3 setLocalDescription의 중요성

`setLocalDescription(offer)`을 호출하는 순간 두 가지가 동시에 일어난다.

```
  setLocalDescription(offer) 호출
       │
       ├── 1. SDP Offer를 로컬에 적용
       │      → "나는 이 조건으로 통신하겠다"고 확정
       │
       └── 2. ICE Agent가 후보 수집 시작 ⚡
              │
              ├── Host 후보 수집 (즉시)
              ├── STUN 서버에 Binding Request 전송
              ├── TURN 서버에 Allocate Request 전송
              │
              └── 후보를 발견할 때마다 onicecandidate 이벤트 발생
```

이것이 **Trickle ICE**의 시작점이다. `setLocalDescription` 이후 ICE 후보가 하나씩 발견될 때마다 `onicecandidate` 콜백이 호출되고, 각 후보를 즉시 상대방에게 전달한다.

## 3.4 이 시점의 SDP Offer에 담기는 정보

```
  ┌─────────────────────────────────────────────────┐
  │  SDP Offer 내용                                  │
  │                                                 │
  │  세션 정보:                                      │
  │  ├── BUNDLE 그룹 (오디오+비디오 하나의 연결)       │
  │  ├── ICE 인증 정보 (ufrag, pwd)                  │
  │  └── DTLS fingerprint (인증서 해시)               │
  │                                                 │
  │  오디오 미디어 설명:                               │
  │  ├── 지원 코덱: Opus, G722, PCMU, PCMA          │
  │  ├── 방향: sendrecv                             │
  │  ├── SSRC (스트림 식별자)                         │
  │  └── RTCP 피드백 지원 목록                        │
  │                                                 │
  │  비디오 미디어 설명:                               │
  │  ├── 지원 코덱: VP8, VP9, H.264, AV1            │
  │  ├── 방향: sendrecv                             │
  │  ├── SSRC                                       │
  │  └── RTCP 피드백: NACK, PLI, FIR, REMB          │
  │                                                 │
  │  ICE 후보: (Trickle ICE이면 비어있거나 일부만)     │
  └─────────────────────────────────────────────────┘
```

# 4. 3단계: Answer 생성 및 전달

## 4.1 무엇이 일어나는가

Peer B(Answerer)는 Offer를 수신하고, 자신이 지원하는 능력 범위 내에서 Answer를 생성한다. 이 과정에서 **코덱 협상**이 이루어진다.

```
[3단계: Answer 생성]

  Peer B (Answerer)
       │
       │  1. Signaling 서버로부터 Offer SDP 수신
       │
       │  2. new RTCPeerConnection(config)
       │     → PeerConnection 객체 생성
       │
       │  3. setRemoteDescription(offer)
       │     → 상대방(Peer A)의 능력 정보를 적용
       │     → "상대방은 이런 코덱을 지원하고, 이 주소로 접근할 수 있구나"
       │
       │  4. getUserMedia()
       │     → 자신의 미디어 스트림 획득
       │
       │  5. addTrack(audioTrack)
       │     addTrack(videoTrack)
       │
       │  6. createAnswer()
       │     → Offer와 자신의 능력을 비교
       │     → 양쪽 모두 지원하는 코덱만 선택
       │     → SDP Answer 생성
       │
       │  7. setLocalDescription(answer)
       │     → Answer를 로컬에 적용
       │     → ⚡ ICE 후보 수집 시작!
       │
       │  8. Signaling 서버를 통해 Answer 전달
       │
```

## 4.2 코드로 보기

```javascript
// ──── Peer B: Answer 생성 ────
async function handleOffer(offerSdp) {
  // 1. PeerConnection 생성
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }
    ]
  });

  // 2. Remote Description 설정 (Offer 적용)
  await pc.setRemoteDescription(new RTCSessionDescription(offerSdp));

  // 3. 미디어 스트림 획득
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
  });

  // 4. 트랙 추가
  stream.getTracks().forEach(track => {
    pc.addTrack(track, stream);
  });

  // 5. ICE 후보 전달 설정
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      ws.send(JSON.stringify({
        type: 'ice-candidate',
        candidate: event.candidate
      }));
    }
  };

  // 6. 원격 미디어 수신 설정
  pc.ontrack = (event) => {
    // 상대방의 미디어 스트림을 video 요소에 연결
    remoteVideo.srcObject = event.streams[0];
  };

  // 7. Answer 생성
  const answer = await pc.createAnswer();

  // 8. Local Description 설정 → ICE 수집 시작
  await pc.setLocalDescription(answer);

  // 9. Answer 전달
  ws.send(JSON.stringify({
    type: 'answer',
    sdp: pc.localDescription
  }));
}
```

## 4.3 코덱 협상 과정

Offer와 Answer 교환에서 핵심은 **양쪽이 공통으로 지원하는 코덱을 합의**하는 것이다.

```
[코덱 협상]

  Peer A (Offer)                              Peer B (Answer)
  지원 코덱:                                   지원 코덱:
  ├── Audio: Opus, G722, PCMU                 ├── Audio: Opus, PCMU
  └── Video: VP8, VP9, H.264, AV1            └── Video: VP8, H.264

                        협상 결과
                    ┌──────────────┐
                    │ Audio: Opus  │  ← 양쪽 모두 지원하는 최우선 코덱
                    │ Video: VP8   │  ← 양쪽 모두 지원하는 최우선 코덱
                    └──────────────┘

  Offer에 있지만 Answer에 없는 코덱은 제외됨:
  - G722 (Peer B가 미지원) → 제외
  - VP9, AV1 (Peer B가 미지원) → 제외
```

## 4.4 Peer A가 Answer를 수신한 후

```javascript
// ──── Peer A: Answer 수신 처리 ────
async function handleAnswer(answerSdp) {
  await pc.setRemoteDescription(new RTCSessionDescription(answerSdp));
  // → 양쪽 SDP 교환 완료
  // → 합의된 코덱으로 미디어 준비
  // → ICE 연결이 완료되면 미디어 전송 시작
}
```

이 시점에서 양쪽 모두 `localDescription`과 `remoteDescription`이 설정된 상태이다.

```
  Peer A                                        Peer B
  ┌────────────────────────┐                    ┌────────────────────────┐
  │ localDescription:      │                    │ localDescription:      │
  │   Offer SDP            │                    │   Answer SDP           │
  │                        │                    │                        │
  │ remoteDescription:     │                    │ remoteDescription:     │
  │   Answer SDP           │                    │   Offer SDP            │
  └────────────────────────┘                    └────────────────────────┘
```

# 5. 4단계: ICE Candidate 교환

## 5.1 무엇이 일어나는가

`setLocalDescription()`을 호출한 순간부터 ICE 에이전트가 후보를 수집하기 시작한다. Trickle ICE에서는 후보를 발견할 때마다 **즉시 상대방에게 전달**한다.

```
[4단계: ICE Candidate 교환 타임라인]

  Peer A                  Signaling                  Peer B
       │                      │                          │
  setLocalDescription()       │                          │
       │                      │                     setLocalDescription()
       │                      │                          │
  ~0ms │── Host 후보 ────────>│── Host 후보 ────────────>│ ~0ms
       │   192.168.1.10:5000  │                          │   10.0.0.5:6000
       │                      │                          │── Host 후보 ──>│
       │<── Host 후보 ─────────│<── Host 후보 ────────────│
       │                      │                          │
 ~200ms│── Srflx 후보 ───────>│── Srflx 후보 ───────────>│ ~200ms
       │   203.0.113.5:40001  │                          │   198.51.100.3:50001
       │                      │                          │── Srflx 후보 ──>│
       │<── Srflx 후보 ────────│<── Srflx 후보 ───────────│
       │                      │                          │
 ~500ms│── Relay 후보 ───────>│── Relay 후보 ───────────>│ ~500ms
       │   relay-a:49152      │                          │   relay-b:49200
       │                      │                          │── Relay 후보 ──>│
       │<── Relay 후보 ────────│<── Relay 후보 ───────────│
       │                      │                          │
       │── null (수집 완료) ──>│                          │
       │                      │                     null (수집 완료)
       │                      │                          │
```

## 5.2 코드로 보기

```javascript
// ──── 양쪽 공통: ICE Candidate 송신 ────
pc.onicecandidate = (event) => {
  if (event.candidate) {
    // 후보 발견 → 즉시 전달
    ws.send(JSON.stringify({
      type: 'ice-candidate',
      candidate: event.candidate
    }));
  } else {
    // event.candidate === null → 모든 후보 수집 완료
    console.log('ICE gathering complete');
  }
};

// ──── 양쪽 공통: ICE Candidate 수신 ────
async function handleIceCandidate(candidate) {
  try {
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (e) {
    console.error('Failed to add ICE candidate:', e);
  }
}
```

## 5.3 addIceCandidate의 동작

`addIceCandidate()`는 수신한 원격 후보를 ICE 에이전트에 추가한다. 추가된 후보는 즉시 기존 로컬 후보와 **페어링**되어 연결성 검사가 시작된다.

```
[addIceCandidate 이후 흐름]

  pc.addIceCandidate(remoteCandidate)
       │
       ├── 원격 후보를 ICE 에이전트에 등록
       │
       ├── 기존 로컬 후보와 페어링
       │   ├── Pair: Local Host ↔ Remote Host
       │   ├── Pair: Local Host ↔ Remote Srflx
       │   ├── Pair: Local Srflx ↔ Remote Host
       │   └── ...
       │
       └── 우선순위 높은 쌍부터 STUN 연결성 검사 시작
           ├── STUN Binding Request 전송
           └── 응답 수신 → Valid Candidate Pair
```

## 5.4 ICE 수집 상태 (Gathering State)

```
[ICE Gathering State]

  new ──────> gathering ──────> complete
   │              │                │
   │   setLocal   │   후보 수집 중   │  모든 후보 수집 완료
   │   Description│                │  (onicecandidate에
   │              │                │   null 전달)
```

```javascript
pc.onicegatheringstatechange = () => {
  console.log('ICE gathering state:', pc.iceGatheringState);
  // "new" → "gathering" → "complete"
};
```

# 6. 5단계: PeerConnection 연결 완료

## 6.1 무엇이 일어나는가

ICE 후보 교환과 연결성 검사가 완료되면, 최적의 후보쌍이 선택되고 **DTLS 핸드셰이크**가 진행된다.

```
[5단계: 연결 완료 과정]

  ICE 연결성 검사 완료
       │
       ├── Selected Candidate Pair 결정
       │   (예: Host ↔ Host 직접 연결)
       │
       ├── DTLS 핸드셰이크 시작 ──────────────────────────────┐
       │   │                                                 │
       │   ├── ClientHello / ServerHello                     │
       │   ├── Certificate 교환                               │
       │   ├── 키 교환 (Diffie-Hellman)                       │
       │   ├── Fingerprint 검증                               │
       │   │   (SDP의 a=fingerprint와 인증서 해시 비교)          │
       │   └── Finished (양쪽 암호화 준비 완료)                  │
       │                                                     │
       ├── SRTP 키 도출                                       │
       │   (DTLS에서 생성된 Master Secret으로 SRTP 키 생성)      │
       │                                                     │
       └── 연결 완료! (connectionState: "connected")          │
            └─────────────────────────────────────────────────┘
```

## 6.2 연결 상태 변화

이 단계에서 두 가지 상태를 추적해야 한다: **ICE 연결 상태**와 **전체 연결 상태**.

### ICE 연결 상태 (iceConnectionState)

```
  new ──> checking ──> connected ──> completed
              │              │           │
              │              │       (최적 쌍 확정)
              │              │
              └──> failed    └──> disconnected ──> failed
                                                     │
                                              (ICE Restart 가능)
```

| 상태 | 의미 | 발생 시점 |
|------|------|----------|
| `new` | ICE 에이전트 초기화 | PeerConnection 생성 직후 |
| `checking` | 연결성 검사 진행 중 | 원격 후보 수신 후 |
| `connected` | 하나 이상의 후보쌍으로 통신 가능 | 첫 번째 유효 쌍 발견 |
| `completed` | 모든 검사 완료, 최종 쌍 선택됨 | ICE 수집 및 검사 완료 |
| `disconnected` | 패킷 일시 중단 | 네트워크 일시 불안정 |
| `failed` | 모든 후보쌍 실패 | 타임아웃 또는 모든 검사 실패 |

### 전체 연결 상태 (connectionState)

`connectionState`는 ICE와 DTLS 상태를 **통합**하여 제공한다.

```
  new ──> connecting ──> connected ──> disconnected ──> failed
              │                             │
              │     (ICE + DTLS 모두 성공)    │
              │                        (네트워크 문제)
              └──> failed
                (ICE 또는 DTLS 실패)
```

## 6.3 코드로 보기

```javascript
// ──── 연결 상태 모니터링 ────
pc.oniceconnectionstatechange = () => {
  console.log('ICE connection state:', pc.iceConnectionState);

  switch (pc.iceConnectionState) {
    case 'checking':
      showStatus('연결 시도 중...');
      break;
    case 'connected':
      showStatus('연결됨!');
      break;
    case 'disconnected':
      showStatus('연결 불안정...');
      break;
    case 'failed':
      showStatus('연결 실패');
      // ICE Restart 시도
      restartIce();
      break;
  }
};

pc.onconnectionstatechange = () => {
  console.log('Connection state:', pc.connectionState);
  // "new" → "connecting" → "connected"
  // 이 상태가 "connected"면 미디어 전송 준비 완료
};

// ──── ICE Restart ────
async function restartIce() {
  const offer = await pc.createOffer({ iceRestart: true });
  await pc.setLocalDescription(offer);
  ws.send(JSON.stringify({
    type: 'offer',
    sdp: pc.localDescription
  }));
}
```

## 6.4 DTLS 역할 결정

DTLS 핸드셰이크에서 누가 Client이고 누가 Server인지는 SDP의 `a=setup` 속성으로 결정된다.

```
  Offer:  a=setup:actpass   → "나는 어느 역할이든 가능"
  Answer: a=setup:active    → "내가 Client 할게" (일반적)

  결과:
  Peer A (Offerer)  = DTLS Server (passive)
  Peer B (Answerer) = DTLS Client (active)  → 핸드셰이크 시작
```

# 7. 6단계: Media / Data 전송 시작

## 7.1 무엇이 일어나는가

DTLS 핸드셰이크가 완료되면 SRTP 키가 도출되고, 드디어 **미디어와 데이터 전송이 시작**된다.

```
[6단계: 전송 시작]

  DTLS 완료 → SRTP 키 도출 완료
       │
       ├── 미디어 전송 시작
       │   ├── Audio: Opus 인코딩 → SRTP 암호화 → UDP 전송
       │   └── Video: VP8 인코딩 → SRTP 암호화 → UDP 전송
       │
       ├── 데이터 채널 활성화 (있는 경우)
       │   └── SCTP over DTLS → 메시지 송수신 가능
       │
       └── RTCP 피드백 루프 시작
           ├── Sender Report / Receiver Report 교환
           ├── 네트워크 상태에 따라 비트레이트 조절
           └── 패킷 손실 시 NACK/PLI 요청
```

## 7.2 미디어 수신 처리

```javascript
// ──── 원격 미디어 수신 ────
pc.ontrack = (event) => {
  console.log('Remote track received:', event.track.kind);
  // event.track.kind: "audio" 또는 "video"
  // event.streams[0]: 원격 미디어 스트림

  if (event.track.kind === 'video') {
    remoteVideo.srcObject = event.streams[0];
  }
  if (event.track.kind === 'audio') {
    remoteAudio.srcObject = event.streams[0];
  }
};
```

## 7.3 DataChannel 사용

DataChannel은 Offer/Answer 전에 생성하거나, 연결 후에 생성할 수 있다. Offer 전에 생성하면 SDP에 `m=application` 미디어 설명이 추가된다.

```javascript
// ──── Peer A: DataChannel 생성 (Offer 전) ────
const dataChannel = pc.createDataChannel('chat', {
  ordered: true        // 순서 보장
});

dataChannel.onopen = () => {
  console.log('DataChannel opened!');
  dataChannel.send('Hello from Peer A!');
};

dataChannel.onmessage = (event) => {
  console.log('Received:', event.data);
};

// ──── Peer B: DataChannel 수신 ────
pc.ondatachannel = (event) => {
  const channel = event.channel;
  console.log('DataChannel received:', channel.label);  // "chat"

  channel.onmessage = (event) => {
    console.log('Received:', event.data);
    channel.send('Hello from Peer B!');
  };
};
```

## 7.4 전송 중 품질 모니터링

연결이 수립된 후에도 네트워크 상태는 계속 변한다. `getStats()` API로 전송 품질을 모니터링할 수 있다.

```javascript
// ──── 통계 수집 (주기적 호출) ────
async function getConnectionStats() {
  const stats = await pc.getStats();

  stats.forEach(report => {
    if (report.type === 'inbound-rtp' && report.kind === 'video') {
      console.log('Video stats:', {
        packetsReceived: report.packetsReceived,
        packetsLost: report.packetsLost,
        bytesReceived: report.bytesReceived,
        framesDecoded: report.framesDecoded,
        framesPerSecond: report.framesPerSecond,
        jitter: report.jitter
      });
    }

    if (report.type === 'candidate-pair' && report.state === 'succeeded') {
      console.log('Connection:', {
        localCandidateType: report.localCandidateId,
        remoteCandidateType: report.remoteCandidateId,
        currentRoundTripTime: report.currentRoundTripTime,
        availableOutgoingBitrate: report.availableOutgoingBitrate
      });
    }
  });
}

// 2초마다 통계 수집
setInterval(getConnectionStats, 2000);
```

# 8. 전체 흐름 종합 시퀀스

지금까지의 6단계를 하나의 상세 시퀀스로 종합한다. 각 단계에서의 상태 변화도 함께 표시했다.

```
  Peer A (Offerer)            Signaling Server            Peer B (Answerer)
  [connectionState]                 │                     [connectionState]
       │                            │                            │
  ─────┼── ① Signaling 연결 ─────────┼────────────────────────────┼────────
  "new"│── WebSocket 연결 ──────────>│<── WebSocket 연결 ─────────│"new"
       │── Join "room-123" ─────────>│<── Join "room-123" ────────│
       │                            │                            │
  ─────┼── ② Offer 생성 ────────────┼────────────────────────────┼────────
       │ getUserMedia()             │                            │
       │ pc.addTrack()              │                            │
       │ createOffer()              │                            │
       │ setLocalDescription()      │                            │
       │  → ICE 수집 시작 ⚡         │                            │
       │                            │                            │
       │── Offer SDP ──────────────>│── Offer SDP ──────────────>│
       │                            │                            │
  ─────┼── ③ Answer 생성 ───────────┼────────────────────────────┼────────
       │                            │       setRemoteDescription()
       │                            │       getUserMedia()       │
       │                            │       pc.addTrack()        │
       │                            │       createAnswer()       │
       │                            │       setLocalDescription()│
       │                            │        → ICE 수집 시작 ⚡   │
       │                            │                            │
       │<── Answer SDP ─────────────│<── Answer SDP ─────────────│
       │ setRemoteDescription()     │                            │
       │                            │                            │
  ─────┼── ④ ICE Candidate 교환 ────┼────────────────────────────┼────────
       │── Host 후보 ──────────────>│── Host 후보 ──────────────>│
       │<── Host 후보 ──────────────│<── Host 후보 ──────────────│
       │── Srflx 후보 ─────────────>│── Srflx 후보 ─────────────>│
       │<── Srflx 후보 ─────────────│<── Srflx 후보 ─────────────│
       │                            │                            │
  ─────┼── ⑤ 연결 완료 ─────────────┼────────────────────────────┼────────
       │                            │                            │
"checking"                                                "checking"
       │◄══ ICE 연결성 검사 (STUN Binding Request/Response) ════>│
       │                            │                            │
"connected"                                               "connected"
       │◄══ DTLS 핸드셰이크 ════════════════════════════════════>│
       │   (Certificate, KeyExchange, Finished)                  │
       │                            │                            │
       │   SRTP 키 도출 완료                       SRTP 키 도출 완료
       │                            │                            │
  ─────┼── ⑥ 전송 시작 ─────────────┼────────────────────────────┼────────
       │                            │                            │
"connected"                                               "connected"
       │◄══ SRTP 미디어 (Audio/Video) ═════════════════════════>│
       │◄══ SCTP 데이터 (DataChannel) ═════════════════════════>│
       │◄══ RTCP 피드백 (SR/RR/NACK/PLI) ═════════════════════>│
       │                            │                            │
```

# 9. 주요 API 메서드 정리

전체 흐름에서 사용된 API를 단계별로 정리한다.

## 9.1 RTCPeerConnection

| 메서드 | 사용 단계 | 역할 |
|--------|----------|------|
| `new RTCPeerConnection(config)` | ②③ | PeerConnection 생성. iceServers에 STUN/TURN 설정 |
| `addTrack(track, stream)` | ②③ | 미디어 트랙 추가. Transceiver 자동 생성 |
| `createOffer()` | ② | Offer SDP 생성 |
| `createAnswer()` | ③ | Answer SDP 생성 |
| `setLocalDescription(sdp)` | ②③ | 로컬 SDP 적용. ICE 수집 시작 트리거 |
| `setRemoteDescription(sdp)` | ②③ | 원격 SDP 적용 |
| `addIceCandidate(candidate)` | ④ | 원격 ICE 후보 추가. 연결성 검사 시작 |
| `createDataChannel(label, options)` | ⑥ | DataChannel 생성 |
| `getStats()` | ⑥ | 전송 통계 조회 |
| `close()` | - | 연결 종료. 모든 리소스 해제 |

## 9.2 이벤트 핸들러

| 이벤트 | 사용 단계 | 발생 시점 |
|--------|----------|----------|
| `onicecandidate` | ④ | ICE 후보가 발견될 때마다 |
| `onicegatheringstatechange` | ④ | ICE 수집 상태 변경 시 |
| `oniceconnectionstatechange` | ⑤ | ICE 연결 상태 변경 시 |
| `onconnectionstatechange` | ⑤ | 전체 연결 상태 변경 시 |
| `ontrack` | ⑥ | 원격 미디어 트랙 수신 시 |
| `ondatachannel` | ⑥ | 원격에서 DataChannel 생성 시 |
| `onnegotiationneeded` | - | 재협상이 필요할 때 |

## 9.3 호출 순서 요약

```
[Offerer 호출 순서]
  new RTCPeerConnection()
  → getUserMedia()
  → addTrack()                    (× N tracks)
  → createOffer()
  → setLocalDescription(offer)    ⚡ ICE 수집 시작
  → send offer via signaling
  → receive answer via signaling
  → setRemoteDescription(answer)
  → addIceCandidate()             (× N candidates)
  → ontrack                       (원격 미디어 수신)

[Answerer 호출 순서]
  new RTCPeerConnection()
  → receive offer via signaling
  → setRemoteDescription(offer)
  → getUserMedia()
  → addTrack()                    (× N tracks)
  → createAnswer()
  → setLocalDescription(answer)   ⚡ ICE 수집 시작
  → send answer via signaling
  → addIceCandidate()             (× N candidates)
  → ontrack                       (원격 미디어 수신)
```

# 10. 연결 실패와 재협상

## 10.1 연결 실패 시 대응

연결이 실패하는 대표적인 원인과 대응 방법이다.

| 실패 원인 | 증상 | 대응 |
|-----------|------|------|
| 양쪽 대칭 NAT | ICE `failed` | TURN 서버 추가 |
| 방화벽 UDP 차단 | ICE `failed` | TURN TCP/TLS 사용 |
| 시그널링 지연 | SDP 교환 타임아웃 | 시그널링 채널 안정성 확보 |
| 네트워크 전환 (Wi-Fi→LTE) | `disconnected` | ICE Restart |
| NAT 매핑 만료 | `disconnected` → `failed` | ICE Restart |

## 10.2 ICE Restart

네트워크가 변경되었을 때 기존 연결을 복구하는 방법이다.

```
[ICE Restart 흐름]

  Peer A                          Signaling                     Peer B
       │                              │                            │
       │  connectionState:            │                            │
       │  "disconnected"              │                            │
       │                              │                            │
       │  createOffer({iceRestart:true})                           │
       │  → 새로운 ice-ufrag/pwd 생성  │                            │
       │  setLocalDescription()       │                            │
       │  → 새 ICE 후보 수집 시작       │                            │
       │                              │                            │
       │── 새 Offer SDP ─────────────>│── 새 Offer SDP ───────────>│
       │                              │                            │
       │                              │  setRemoteDescription()    │
       │                              │  createAnswer()            │
       │                              │  setLocalDescription()     │
       │                              │                            │
       │<── 새 Answer SDP ────────────│<── 새 Answer SDP ──────────│
       │                              │                            │
       │── 새 ICE 후보 ──────────────>│── 새 ICE 후보 ────────────>│
       │<── 새 ICE 후보 ──────────────│<── 새 ICE 후보 ────────────│
       │                              │                            │
       │◄══ 새 ICE 연결성 검사 ═══════════════════════════════════>│
       │                              │                            │
       │  connectionState:            │  connectionState:          │
       │  "connected" (복구됨!)        │  "connected"               │
       │                              │                            │
```

ICE Restart의 핵심은 `createOffer({ iceRestart: true })`이다. 이 옵션을 주면 새로운 `ice-ufrag`와 `ice-pwd`가 생성되어, 기존 NAT 매핑이 아닌 **새로운 경로**로 연결을 시도한다.

## 10.3 재협상 (Renegotiation)

연결이 수립된 후에도 미디어 구성을 변경할 수 있다. 예를 들어 화면 공유를 추가하거나, 비디오를 끄는 경우이다.

```
[재협상이 필요한 상황]

  ┌────────────────────────────────────────────────────┐
  │  - 새 트랙 추가 (화면 공유 시작)                     │
  │  - 트랙 제거 (비디오 끄기)                           │
  │  - 코덱 변경                                       │
  │  - DataChannel 추가                                │
  │  - 미디어 방향 변경 (sendrecv → sendonly)            │
  └────────────────────────────────────────────────────┘
         │
         ▼
  onnegotiationneeded 이벤트 발생
         │
         ▼
  새로운 Offer/Answer 교환 (②③ 단계 반복)
  → 기존 ICE 연결은 유지 (ICE Restart 아님)
  → SDP만 업데이트
```

```javascript
// ──── 화면 공유 추가 예시 ────
async function startScreenShare() {
  const screenStream = await navigator.mediaDevices.getDisplayMedia({
    video: true
  });

  // 새 트랙 추가 → onnegotiationneeded 자동 발생
  screenStream.getTracks().forEach(track => {
    pc.addTrack(track, screenStream);
  });
}

// onnegotiationneeded가 자동으로 새 Offer/Answer 교환을 트리거
pc.onnegotiationneeded = async () => {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  ws.send(JSON.stringify({
    type: 'offer',
    sdp: pc.localDescription
  }));
};
```

# 11. 정리

WebRTC 연결 수립의 전체 흐름을 6단계로 정리하면 다음과 같다.

| 단계 | 핵심 동작 | 사용 프로토콜 | 결과 |
|------|----------|-------------|------|
| ① Signaling 연결 | WebSocket 등으로 메시지 채널 확보 | WebSocket/HTTP | 양쪽 통신 가능 |
| ② Offer 생성 | createOffer → setLocalDescription | SDP | Offer 전달, ICE 수집 시작 |
| ③ Answer 생성 | setRemoteDescription → createAnswer → setLocalDescription | SDP | 코덱 합의, ICE 수집 시작 |
| ④ ICE 교환 | onicecandidate → addIceCandidate | ICE/STUN/TURN | 후보쌍 생성 |
| ⑤ 연결 완료 | 연결성 검사 → DTLS 핸드셰이크 | ICE/DTLS | 보안 연결 수립 |
| ⑥ 전송 시작 | 미디어/데이터 송수신 | RTP/SRTP/SCTP | 실시간 통신 |

```
[기억해야 할 핵심 포인트]

  1. setLocalDescription()이 ICE 수집을 트리거한다
  2. Trickle ICE로 후보를 즉시 전달하면 연결이 빨라진다
  3. connectionState가 "connected"면 미디어 전송 준비 완료
  4. 네트워크 변경 시 ICE Restart로 복구할 수 있다
  5. 미디어 구성 변경 시 재협상(onnegotiationneeded)이 자동 발생한다
```

이것으로 WebRTC의 개념 단계(1~4편)가 완료되었다. 다음 편부터는 실제 구현 단계로 들어가, **Golang(Pion) 기반의 Signaling 서버를 직접 설계하고 구현**해본다.

## 참고 자료

- [WebRTC for the Curious - Signaling](https://webrtcforthecurious.com/ko/docs/02-signaling/)
- [WebRTC for the Curious - Connecting](https://webrtcforthecurious.com/ko/docs/03-connecting/)
- [MDN - RTCPeerConnection](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection)
- [MDN - WebRTC 연결 수립](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Connectivity)
- [RFC 8829 - JSEP (JavaScript Session Establishment Protocol)](https://datatracker.ietf.org/doc/html/rfc8829)
- [RFC 8838 - Trickle ICE](https://datatracker.ietf.org/doc/html/rfc8838)
