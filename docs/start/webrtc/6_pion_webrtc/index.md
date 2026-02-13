---
title: "WebRTC 완벽 가이드 (6): Golang WebRTC 라이브러리 - Pion"
description: "Pure Go로 구현된 WebRTC 라이브러리 Pion의 주요 컴포넌트, 브라우저 API와의 차이점, 그리고 개발 환경 세팅부터 기본 사용법까지 알아봅니다."
date: 2026-02-07
update: 2026-02-07
tags:
  - WebRTC
  - Pion
  - Golang
  - PeerConnection
  - Track
  - DataChannel
  - RTP
series: "WebRTC 완벽 가이드"
---

5편에서 Signaling 서버를 Golang으로 구현했다. 이번 편에서는 Golang에서 WebRTC 피어를 구현하기 위한 핵심 라이브러리인 **Pion WebRTC**를 다룬다. Pion의 구조와 주요 API를 파악하고, 브라우저 WebRTC API와 어떻게 대응되는지, 그리고 실제 코드에서 어떻게 사용하는지를 정리한다.

# 1. Pion WebRTC 소개

## 1.1 Pion이란

[Pion](https://github.com/pion/webrtc)은 **Pure Go**로 구현된 WebRTC 라이브러리이다. W3C WebRTC 명세를 Go 언어로 충실히 구현하여, Golang 애플리케이션이 브라우저나 다른 WebRTC 클라이언트와 직접 통신할 수 있게 해준다.

```
[Pion의 위치]

  브라우저 (Chrome, Firefox, Safari)       Golang 서버/애플리케이션
  ┌──────────────────────────┐           ┌──────────────────────────┐
  │  JavaScript WebRTC API   │           │  Pion WebRTC (Go)        │
  │  (W3C 명세)              │ ◄═══════► │  (W3C 명세 Go 구현)       │
  ├──────────────────────────┤   WebRTC  ├──────────────────────────┤
  │  libwebrtc (C++)         │  프로토콜  │  Pure Go 구현             │
  │  (Google 구현)           │           │  (Cgo 미사용)             │
  └──────────────────────────┘           └──────────────────────────┘

  양쪽 모두 동일한 WebRTC 프로토콜을 구현하므로 상호운용 가능
```

## 1.2 왜 Pion인가

Golang에서 WebRTC를 사용하려면 몇 가지 선택지가 있다.

| 라이브러리 | 언어 | 특징 |
|-----------|------|------|
| **Pion** | Pure Go | Cgo 없음, 크로스 플랫폼, MIT 라이선스 |
| libwebrtc (Go 바인딩) | C++ + Go 바인딩 | Google 공식 구현, 빌드 복잡 |
| GStreamer 바인딩 | C + Go 바인딩 | 미디어 파이프라인 강력, Cgo 필요 |

Pion을 선택하는 이유는 명확하다.

### Pure Go (Cgo 없음)

Pion은 C/C++ 라이브러리에 의존하지 않는다. 이것은 단순히 기술적 깔끔함을 넘어 **실용적인 이점**을 제공한다.

```
[Cgo가 없으면 좋은 점]

  빌드:
  ├── 크로스 컴파일 간단 (GOOS=linux GOARCH=arm go build)
  ├── 빌드 시간 ~0.3초 (C++ 빌드 대비 수십 배 빠름)
  └── Docker 이미지 경량화 (scratch 베이스 이미지 사용 가능)

  배포:
  ├── 단일 바이너리 (의존성 없음)
  ├── 라즈베리파이, ARM 서버 등에 그대로 배포
  └── WASM으로도 컴파일 가능

  디버깅:
  ├── Go 표준 도구 사용 (pprof, race detector 등)
  └── C/C++ 메모리 이슈 없음
```

### 넓은 플랫폼 지원

| 플랫폼 | OS | 아키텍처 |
|--------|-----|---------|
| 데스크톱 | Windows, macOS, Linux, FreeBSD | amd64, arm64 |
| 모바일 | iOS, Android | arm64 |
| 임베디드 | Linux | arm, mips, ppc64 |
| 웹 | WASM | - |

### 활발한 생태계

- GitHub 16,000+ 스타
- MIT 라이선스
- 활발한 Discord 커뮤니티
- 지속적인 업데이트 (v4 최신)

# 2. Pion 모듈 구조

Pion은 하나의 거대한 패키지가 아니라 **기능별로 분리된 모듈**로 구성되어 있다. 필요한 것만 임포트할 수 있다.

```
[Pion 모듈 구조]

  github.com/pion/
  ├── webrtc/v4        ← 핵심: PeerConnection, Track, DataChannel
  ├── ice/v4           ← ICE Agent, 후보 수집
  ├── dtls/v3          ← DTLS 핸드셰이크
  ├── srtp/v3          ← SRTP 암호화/복호화
  ├── rtp/v2           ← RTP 패킷 파싱/생성
  ├── rtcp/v2          ← RTCP 패킷 파싱/생성
  ├── sdp/v3           ← SDP 파싱/생성
  ├── sctp             ← SCTP (DataChannel 전송)
  ├── stun/v3          ← STUN 프로토콜
  ├── turn/v4          ← TURN 프로토콜
  ├── interceptor      ← RTP/RTCP 미들웨어 (NACK, TWCC 등)
  ├── mediadevices     ← getUserMedia (카메라/마이크 접근)
  └── logging          ← 로깅 프레임워크
```

대부분의 경우 `github.com/pion/webrtc/v4`만 임포트하면 된다. 이 패키지가 내부적으로 다른 모듈을 사용한다.

```go
import "github.com/pion/webrtc/v4"
```

저수준 제어가 필요할 때(예: RTP 패킷 직접 조작)만 개별 모듈을 임포트한다.

```go
import (
    "github.com/pion/webrtc/v4"
    "github.com/pion/rtp/v2"
    "github.com/pion/rtcp/v2"
)
```

# 3. 주요 컴포넌트

## 3.1 PeerConnection

PeerConnection은 WebRTC의 **최상위 객체**이다. 하나의 PeerConnection이 하나의 WebRTC 연결을 나타낸다.

### 생성

```go
// STUN/TURN 서버 설정
config := webrtc.Configuration{
    ICEServers: []webrtc.ICEServer{
        {
            URLs: []string{"stun:stun.l.google.com:19302"},
        },
        {
            URLs:       []string{"turn:turn.example.com:3478"},
            Username:   "user",
            Credential: "pass",
        },
    },
}

// PeerConnection 생성
pc, err := webrtc.NewPeerConnection(config)
if err != nil {
    log.Fatal(err)
}
defer pc.Close()
```

### Offer/Answer 교환

```go
// ──── Offerer 측 ────
offer, err := pc.CreateOffer(nil)
if err != nil {
    log.Fatal(err)
}

err = pc.SetLocalDescription(offer)
if err != nil {
    log.Fatal(err)
}
// offer.SDP를 시그널링으로 전달

// ──── Answerer 측 ────
err = pc.SetRemoteDescription(webrtc.SessionDescription{
    Type: webrtc.SDPTypeOffer,
    SDP:  offerSDP, // 시그널링으로 수신한 SDP
})
if err != nil {
    log.Fatal(err)
}

answer, err := pc.CreateAnswer(nil)
if err != nil {
    log.Fatal(err)
}

err = pc.SetLocalDescription(answer)
if err != nil {
    log.Fatal(err)
}
// answer.SDP를 시그널링으로 전달
```

### ICE Candidate 처리

```go
// ICE 후보 발생 시 콜백
pc.OnICECandidate(func(candidate *webrtc.ICECandidate) {
    if candidate == nil {
        return // 수집 완료
    }
    // candidate.ToJSON()을 시그널링으로 전달
    candidateJSON := candidate.ToJSON()
    sendViaSignaling(candidateJSON)
})

// 원격 ICE 후보 추가
err = pc.AddICECandidate(webrtc.ICECandidateInit{
    Candidate: candidateString, // 시그널링으로 수신
})
```

### 연결 상태 모니터링

```go
// ICE 연결 상태
pc.OnICEConnectionStateChange(func(state webrtc.ICEConnectionState) {
    log.Printf("ICE connection state: %s", state.String())
    // new → checking → connected → completed
    // 또는 disconnected → failed
})

// 전체 연결 상태 (ICE + DTLS 통합)
pc.OnConnectionStateChange(func(state webrtc.PeerConnectionState) {
    log.Printf("Connection state: %s", state.String())

    switch state {
    case webrtc.PeerConnectionStateConnected:
        log.Println("P2P 연결 성공!")
    case webrtc.PeerConnectionStateFailed:
        log.Println("연결 실패")
    case webrtc.PeerConnectionStateClosed:
        log.Println("연결 종료")
    }
})

// 시그널링 상태
pc.OnSignalingStateChange(func(state webrtc.SignalingState) {
    log.Printf("Signaling state: %s", state.String())
    // stable → have-local-offer → have-remote-pranswer → stable
})
```

## 3.2 Track - 미디어 스트림

Pion에서 Track은 **로컬 트랙(TrackLocal)**과 **원격 트랙(TrackRemote)** 두 가지로 나뉜다.

```
[Track 구조]

  송신 (내가 보내는 미디어)              수신 (상대가 보내는 미디어)
  ┌──────────────────────┐            ┌──────────────────────┐
  │  TrackLocal          │            │  TrackRemote         │
  │  (인터페이스)          │            │  (구조체)             │
  │                      │            │                      │
  │  구현체:              │            │  pc.OnTrack()로 수신  │
  │  ├── TrackLocalStaticRTP    │     │  .Read() / .ReadRTP()│
  │  │   (RTP 패킷 직접 전달)    │     │  로 RTP 패킷 읽기     │
  │  └── TrackLocalStaticSample │     │                      │
  │      (Sample 단위 전달)     │      │                      │
  └──────────────────────┘            └──────────────────────┘
         │                                     │
    pc.AddTrack(track)                  pc.OnTrack(callback)
```

### TrackLocalStaticRTP - RTP 패킷 단위 전송

RTP 패킷을 직접 제어할 때 사용한다. 다른 피어에서 받은 RTP 패킷을 그대로 포워딩하거나, 파일에서 읽은 RTP 패킷을 전송할 때 적합하다.

```go
// VP8 비디오 트랙 생성
videoTrack, err := webrtc.NewTrackLocalStaticRTP(
    webrtc.RTPCodecCapability{MimeType: webrtc.MimeTypeVP8},
    "video",       // Track ID
    "video-stream", // Stream ID
)
if err != nil {
    log.Fatal(err)
}

// PeerConnection에 트랙 추가
sender, err := pc.AddTrack(videoTrack)
if err != nil {
    log.Fatal(err)
}

// RTP 패킷 전송
err = videoTrack.WriteRTP(&rtp.Packet{
    Header: rtp.Header{
        Version:        2,
        PayloadType:    96,
        SequenceNumber: seq,
        Timestamp:      ts,
        SSRC:           ssrc,
    },
    Payload: videoData,
})
```

### TrackLocalStaticSample - 샘플 단위 전송

인코딩된 미디어 프레임(샘플)을 전달하면 Pion이 RTP 패킷화를 자동으로 처리한다. 파일에서 미디어를 읽어 전송할 때 가장 편리하다.

```go
import "github.com/pion/webrtc/v4/pkg/media"

// Opus 오디오 트랙 생성
audioTrack, err := webrtc.NewTrackLocalStaticSample(
    webrtc.RTPCodecCapability{MimeType: webrtc.MimeTypeOpus},
    "audio",
    "audio-stream",
)

// PeerConnection에 추가
pc.AddTrack(audioTrack)

// 샘플 전송 (Pion이 RTP 패킷화를 자동 처리)
err = audioTrack.WriteSample(media.Sample{
    Data:     opusFrame,          // 인코딩된 Opus 프레임
    Duration: 20 * time.Millisecond, // 프레임 길이
})
```

### TrackRemote - 원격 미디어 수신

상대 피어가 보낸 미디어를 수신한다.

```go
pc.OnTrack(func(remoteTrack *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
    log.Printf("Track received: kind=%s, codec=%s, ssrc=%d",
        remoteTrack.Kind(),             // audio 또는 video
        remoteTrack.Codec().MimeType,   // audio/opus, video/VP8 등
        remoteTrack.SSRC(),
    )

    // 방법 1: RTP 패킷 단위 읽기
    for {
        rtpPacket, _, err := remoteTrack.ReadRTP()
        if err != nil {
            return
        }
        // rtpPacket.Payload에 미디어 데이터
        // rtpPacket.Header에 타임스탬프, 시퀀스 번호 등
        processRTPPacket(rtpPacket)
    }

    // 방법 2: 바이트 버퍼로 읽기
    buf := make([]byte, 1500)
    for {
        n, _, err := remoteTrack.Read(buf)
        if err != nil {
            return
        }
        rawRTP := buf[:n]
        // ...
    }
})
```

### 지원 코덱

| 타입 | 코덱 | MimeType 상수 |
|------|------|---------------|
| Audio | Opus | `webrtc.MimeTypeOpus` |
| Audio | G722 | `webrtc.MimeTypeG722` |
| Audio | PCMU | `webrtc.MimeTypePCMU` |
| Audio | PCMA | `webrtc.MimeTypePCMA` |
| Video | VP8 | `webrtc.MimeTypeVP8` |
| Video | VP9 | `webrtc.MimeTypeVP9` |
| Video | H264 | `webrtc.MimeTypeH264` |
| Video | AV1 | `webrtc.MimeTypeAV1` |

## 3.3 DataChannel - 데이터 전송

DataChannel은 임의의 데이터를 P2P로 전송하는 채널이다.

### 생성 측 (Offerer)

```go
// 채널 생성 (Offer 전에 호출)
ordered := true
dc, err := pc.CreateDataChannel("chat", &webrtc.DataChannelInit{
    Ordered: &ordered,
})
if err != nil {
    log.Fatal(err)
}

// 채널이 열리면 호출
dc.OnOpen(func() {
    log.Printf("DataChannel '%s' opened", dc.Label())

    // 텍스트 전송
    dc.SendText("Hello from Go!")

    // 바이너리 전송
    dc.Send([]byte{0x01, 0x02, 0x03})
})

// 메시지 수신
dc.OnMessage(func(msg webrtc.DataChannelMessage) {
    if msg.IsText {
        log.Printf("Text message: %s", string(msg.Data))
    } else {
        log.Printf("Binary message: %d bytes", len(msg.Data))
    }
})

// 채널 닫힘
dc.OnClose(func() {
    log.Println("DataChannel closed")
})

// 에러
dc.OnError(func(err error) {
    log.Printf("DataChannel error: %v", err)
})
```

### 수신 측 (Answerer)

```go
// 원격에서 DataChannel이 생성되면 호출
pc.OnDataChannel(func(dc *webrtc.DataChannel) {
    log.Printf("DataChannel received: label='%s', id=%d", dc.Label(), *dc.ID())

    dc.OnOpen(func() {
        log.Println("DataChannel opened")
    })

    dc.OnMessage(func(msg webrtc.DataChannelMessage) {
        log.Printf("Received: %s", string(msg.Data))
        // 에코
        dc.SendText("Echo: " + string(msg.Data))
    })
})
```

### DataChannel 옵션

```go
ordered := true
maxRetransmits := uint16(3)
maxPacketLifeTime := uint16(1000) // ms

// 신뢰성 + 순서 보장 (기본값, TCP와 유사)
dc1, _ := pc.CreateDataChannel("reliable", &webrtc.DataChannelInit{
    Ordered: &ordered,
})

// 제한된 재전송 (최대 3회 재시도)
dc2, _ := pc.CreateDataChannel("partial", &webrtc.DataChannelInit{
    Ordered:        &ordered,
    MaxRetransmits: &maxRetransmits,
})

// 시간 제한 (1초 내 미도착 시 포기)
dc3, _ := pc.CreateDataChannel("timed", &webrtc.DataChannelInit{
    MaxPacketLifeTime: &maxPacketLifeTime,
})

// 비순서 + 비신뢰 (UDP와 유사)
unordered := false
zero := uint16(0)
dc4, _ := pc.CreateDataChannel("unreliable", &webrtc.DataChannelInit{
    Ordered:        &unordered,
    MaxRetransmits: &zero,
})
```

## 3.4 RTPSender / RTPReceiver / RTPTransceiver

저수준 미디어 제어가 필요할 때 사용하는 컴포넌트이다.

```
[RTPTransceiver 구조]

  RTPTransceiver
  ├── Sender() → *RTPSender
  │   ├── Track() → TrackLocal (로컬 트랙)
  │   ├── ReplaceTrack()  (트랙 교체)
  │   └── ReadRTCP()      (RTCP 피드백 읽기: NACK, PLI 등)
  │
  ├── Receiver() → *RTPReceiver
  │   ├── Track() → *TrackRemote (원격 트랙)
  │   └── ReadRTCP()      (RTCP 피드백 읽기)
  │
  ├── Direction() → RTPTransceiverDirection
  │   (SendRecv, SendOnly, RecvOnly, Inactive)
  │
  └── Mid() → string (SDP의 mid 값)
```

```go
// RTCP 패킷 읽기 (NACK, PLI 등 피드백 수신)
go func() {
    sender, _ := pc.AddTrack(videoTrack)
    for {
        rtcpPackets, _, err := sender.ReadRTCP()
        if err != nil {
            return
        }
        for _, pkt := range rtcpPackets {
            switch pkt.(type) {
            case *rtcp.PictureLossIndication:
                log.Println("PLI received: 키프레임 요청")
                // 키프레임 전송 로직
            case *rtcp.ReceiverEstimatedMaximumBitrate:
                log.Println("REMB received: 비트레이트 조절 요청")
            }
        }
    }
}()
```

# 4. 브라우저 WebRTC API와의 비교

Pion은 브라우저 API를 Go로 옮긴 것이므로, 대부분의 개념이 1:1로 대응된다. 주요 차이점을 정리한다.

## 4.1 API 대응표

| 브라우저 (JavaScript) | Pion (Go) | 차이점 |
|----------------------|-----------|--------|
| `new RTCPeerConnection(config)` | `webrtc.NewPeerConnection(config)` | Go는 에러 반환 |
| `pc.createOffer()` | `pc.CreateOffer(nil)` | Promise → (값, error) |
| `pc.createAnswer()` | `pc.CreateAnswer(nil)` | Promise → (값, error) |
| `pc.setLocalDescription(sdp)` | `pc.SetLocalDescription(sdp)` | 동일 |
| `pc.setRemoteDescription(sdp)` | `pc.SetRemoteDescription(sdp)` | 동일 |
| `pc.addIceCandidate(c)` | `pc.AddICECandidate(c)` | 동일 |
| `pc.addTrack(track, stream)` | `pc.AddTrack(track)` | Go는 stream 인자 없음 |
| `pc.createDataChannel(label, opts)` | `pc.CreateDataChannel(label, opts)` | 동일 |
| `pc.ontrack = fn` | `pc.OnTrack(fn)` | 이벤트 → 콜백 등록 메서드 |
| `pc.onicecandidate = fn` | `pc.OnICECandidate(fn)` | 동일 패턴 |
| `pc.ondatachannel = fn` | `pc.OnDataChannel(fn)` | 동일 패턴 |
| `pc.getStats()` | `pc.GetStats()` | Promise → 직접 반환 |
| `pc.close()` | `pc.Close()` | 동일 |

## 4.2 핵심 차이점

### getUserMedia가 없다

브라우저에서는 `navigator.mediaDevices.getUserMedia()`로 카메라/마이크에 접근하지만, Pion 코어에는 이 기능이 없다. Go 서버는 보통 카메라가 없기 때문이다.

```
[미디어 소스 차이]

  브라우저:
  getUserMedia() → MediaStream → addTrack()
  (카메라/마이크에서 직접 캡처)

  Pion:
  파일/네트워크에서 읽기 → TrackLocalStaticSample → AddTrack()
  (미디어 소스를 직접 제어)
```

미디어 소스가 필요한 경우의 선택지는 다음과 같다.

| 소스 | 방법 |
|------|------|
| 파일 (IVF, Ogg) | Pion 예제의 `play-from-disk` 패턴 |
| 카메라/마이크 | `github.com/pion/mediadevices` 별도 라이브러리 |
| FFmpeg | FFmpeg → RTP → Pion (`rtp-to-webrtc` 패턴) |
| GStreamer | GStreamer → RTP → Pion |
| 다른 피어 | `OnTrack`으로 수신 → 다른 PC에 `AddTrack` (SFU 패턴) |

### 에러 처리 패턴

JavaScript는 Promise/async-await, Go는 (값, error) 패턴을 사용한다.

```javascript
// JavaScript
try {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
} catch (err) {
  console.error(err);
}
```

```go
// Go
offer, err := pc.CreateOffer(nil)
if err != nil {
    log.Fatal(err)
}
if err = pc.SetLocalDescription(offer); err != nil {
    log.Fatal(err)
}
```

### 이벤트 핸들링 패턴

JavaScript는 이벤트 프로퍼티 할당, Go는 콜백 등록 메서드를 사용한다.

```javascript
// JavaScript - 이벤트 프로퍼티
pc.ontrack = (event) => { ... };
pc.onicecandidate = (event) => { ... };
```

```go
// Go - 콜백 등록 메서드
pc.OnTrack(func(track *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
    // ...
})
pc.OnICECandidate(func(candidate *webrtc.ICECandidate) {
    // ...
})
```

### 동시성 모델

브라우저는 단일 스레드(이벤트 루프)이지만, Go는 고루틴을 사용한다. `OnTrack` 콜백 내에서 무한 루프로 RTP 패킷을 읽는 패턴은 Go에서만 가능하다.

```go
pc.OnTrack(func(track *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
    // 이 콜백은 고루틴에서 실행된다.
    // 무한 루프로 패킷을 계속 읽을 수 있다.
    for {
        rtpPacket, _, err := track.ReadRTP()
        if err != nil {
            return // 트랙 종료
        }
        processPacket(rtpPacket)
    }
})
```

## 4.3 Pion만의 기능

브라우저 API에는 없지만 Pion에서만 제공하는 기능이 있다.

### SettingEngine - 저수준 설정

```go
se := webrtc.SettingEngine{}

// ICE 포트 범위 제한 (방화벽 설정에 유용)
se.SetEphemeralUDPPortRange(50000, 60000)

// ICE Lite 모드 (서버가 공인 IP를 가진 경우)
se.SetLite(true)

// NAT 1:1 매핑 (공인 IP를 직접 지정)
se.SetNAT1To1IPs([]string{"203.0.113.5"}, webrtc.ICECandidateTypeHost)

// 네트워크 인터페이스 필터링
se.SetInterfaceFilter(func(iface string) bool {
    return iface == "eth0" // eth0만 사용
})

// API 객체로 PeerConnection 생성
api := webrtc.NewAPI(webrtc.WithSettingEngine(se))
pc, err := api.NewPeerConnection(config)
```

### Interceptor - RTP/RTCP 미들웨어

```go
import "github.com/pion/interceptor"
import "github.com/pion/interceptor/pkg/nack"

// NACK 인터셉터 등록 (패킷 손실 시 자동 재전송)
m := &webrtc.MediaEngine{}
m.RegisterDefaultCodecs()

i := &interceptor.Registry{}
if err := webrtc.RegisterDefaultInterceptors(m, i); err != nil {
    log.Fatal(err)
}

api := webrtc.NewAPI(
    webrtc.WithMediaEngine(m),
    webrtc.WithInterceptorRegistry(i),
)
pc, err := api.NewPeerConnection(config)
```

### MediaEngine - 코덱 커스터마이징

```go
m := &webrtc.MediaEngine{}

// 특정 코덱만 등록
m.RegisterCodec(webrtc.RTPCodecParameters{
    RTPCodecCapability: webrtc.RTPCodecCapability{
        MimeType:    webrtc.MimeTypeOpus,
        ClockRate:   48000,
        Channels:    2,
        SDPFmtpLine: "minptime=10;useinbandfec=1",
    },
    PayloadType: 111,
}, webrtc.RTPCodecTypeAudio)

m.RegisterCodec(webrtc.RTPCodecParameters{
    RTPCodecCapability: webrtc.RTPCodecCapability{
        MimeType:  webrtc.MimeTypeVP8,
        ClockRate: 90000,
    },
    PayloadType: 96,
}, webrtc.RTPCodecTypeVideo)

api := webrtc.NewAPI(webrtc.WithMediaEngine(m))
pc, err := api.NewPeerConnection(config)
```

# 5. 개발 환경 세팅

## 5.1 프로젝트 초기화

```bash
mkdir webrtc-demo && cd webrtc-demo
go mod init webrtc-demo
go get github.com/pion/webrtc/v4
```

## 5.2 최소 동작 코드

아래는 DataChannel로 메시지를 주고받는 **가장 단순한 Pion 예제**이다. 두 개의 PeerConnection을 같은 프로세스 내에서 직접 연결한다 (시그널링 서버 없이).

```go
package main

import (
	"fmt"
	"log"
	"time"

	"github.com/pion/webrtc/v4"
)

func main() {
	// ──── 1. 양쪽 PeerConnection 생성 ────
	config := webrtc.Configuration{}

	pcOffer, err := webrtc.NewPeerConnection(config)
	if err != nil {
		log.Fatal(err)
	}
	defer pcOffer.Close()

	pcAnswer, err := webrtc.NewPeerConnection(config)
	if err != nil {
		log.Fatal(err)
	}
	defer pcAnswer.Close()

	// ──── 2. ICE Candidate 교환 (직접 연결) ────
	pcOffer.OnICECandidate(func(c *webrtc.ICECandidate) {
		if c != nil {
			pcAnswer.AddICECandidate(c.ToJSON())
		}
	})
	pcAnswer.OnICECandidate(func(c *webrtc.ICECandidate) {
		if c != nil {
			pcOffer.AddICECandidate(c.ToJSON())
		}
	})

	// ──── 3. DataChannel 생성 (Offer 측) ────
	dc, err := pcOffer.CreateDataChannel("chat", nil)
	if err != nil {
		log.Fatal(err)
	}

	dc.OnOpen(func() {
		fmt.Println("[Offer] DataChannel opened")
		for i := 0; i < 5; i++ {
			msg := fmt.Sprintf("Hello #%d", i)
			dc.SendText(msg)
			fmt.Printf("[Offer] Sent: %s\n", msg)
			time.Sleep(1 * time.Second)
		}
		dc.Close()
	})

	dc.OnClose(func() {
		fmt.Println("[Offer] DataChannel closed")
	})

	// ──── 4. DataChannel 수신 (Answer 측) ────
	done := make(chan struct{})

	pcAnswer.OnDataChannel(func(dc *webrtc.DataChannel) {
		fmt.Printf("[Answer] DataChannel received: '%s'\n", dc.Label())

		dc.OnMessage(func(msg webrtc.DataChannelMessage) {
			fmt.Printf("[Answer] Received: %s\n", string(msg.Data))
		})

		dc.OnClose(func() {
			fmt.Println("[Answer] DataChannel closed")
			close(done)
		})
	})

	// ──── 5. Offer/Answer 교환 ────
	offer, err := pcOffer.CreateOffer(nil)
	if err != nil {
		log.Fatal(err)
	}
	if err = pcOffer.SetLocalDescription(offer); err != nil {
		log.Fatal(err)
	}
	if err = pcAnswer.SetRemoteDescription(offer); err != nil {
		log.Fatal(err)
	}

	answer, err := pcAnswer.CreateAnswer(nil)
	if err != nil {
		log.Fatal(err)
	}
	if err = pcAnswer.SetLocalDescription(answer); err != nil {
		log.Fatal(err)
	}
	if err = pcOffer.SetRemoteDescription(answer); err != nil {
		log.Fatal(err)
	}

	// ──── 6. 완료 대기 ────
	<-done
	fmt.Println("Done!")
}
```

## 5.3 실행

```bash
go run main.go
```

```
[Answer] DataChannel received: 'chat'
[Offer] DataChannel opened
[Offer] Sent: Hello #0
[Answer] Received: Hello #0
[Offer] Sent: Hello #1
[Answer] Received: Hello #1
[Offer] Sent: Hello #2
[Answer] Received: Hello #2
[Offer] Sent: Hello #3
[Answer] Received: Hello #3
[Offer] Sent: Hello #4
[Answer] Received: Hello #4
[Offer] DataChannel closed
[Answer] DataChannel closed
Done!
```

시그널링 서버 없이 같은 프로세스 내에서 두 PeerConnection이 직접 SDP와 ICE 후보를 교환하여 연결되는 것을 확인할 수 있다.

# 6. Pion 공식 예제

Pion은 풍부한 예제를 제공한다. 용도별로 분류하면 다음과 같다.

## 6.1 미디어 예제

| 예제 | 설명 | 학습 포인트 |
|------|------|------------|
| **reflect** | 수신한 미디어를 그대로 돌려보냄 | OnTrack, AddTrack 기본 |
| **play-from-disk** | 파일에서 브라우저로 영상 전송 | TrackLocalStaticSample, IVF 파일 읽기 |
| **save-to-disk** | 브라우저 영상을 파일로 저장 | TrackRemote.ReadRTP, 파일 쓰기 |
| **broadcast** | 1:N 영상 브로드캐스트 | 한 트랙을 여러 PC에 AddTrack |
| **rtp-to-webrtc** | RTP 스트림을 WebRTC로 변환 | FFmpeg/GStreamer 연동 |
| **simulcast** | 다중 해상도 스트림 수신 | Simulcast, RID |

## 6.2 DataChannel 예제

| 예제 | 설명 | 학습 포인트 |
|------|------|------------|
| **data-channels** | 브라우저와 메시지 교환 | CreateDataChannel, OnDataChannel |
| **data-channels-detach** | 저수준 DataChannel 접근 | Detach(), io.ReadWriteCloser |
| **data-channels-flow-control** | 전송 흐름 제어 | BufferedAmount, OnBufferedAmountLow |
| **pion-to-pion** | 두 Go 프로세스 간 통신 | 시그널링 없이 직접 연결 |

## 6.3 연결 관련 예제

| 예제 | 설명 | 학습 포인트 |
|------|------|------------|
| **trickle-ice** | Trickle ICE 구현 | OnICECandidate, AddICECandidate 타이밍 |
| **ice-restart** | 네트워크 전환 시 복구 | CreateOffer({ICERestart: true}) |
| **ice-single-port** | 단일 포트 서빙 | SettingEngine, 서버 배포 |
| **ice-tcp** | TCP 기반 ICE | 방화벽 환경 |

## 6.4 학습 추천 순서

```
1단계: 기본 이해
  pion-to-pion → data-channels → reflect

2단계: 미디어 다루기
  play-from-disk → save-to-disk → rtp-to-webrtc

3단계: 실전 패턴
  broadcast → simulcast → ice-restart

4단계: 서버 배포
  ice-single-port → trickle-ice
```

# 7. 정리

| 항목 | 핵심 내용 |
|------|----------|
| **Pion이란** | Pure Go WebRTC 구현. Cgo 없음, 크로스 플랫폼, MIT 라이선스 |
| **모듈 구조** | `webrtc/v4`가 핵심. 저수준 제어 시 `rtp`, `rtcp` 등 개별 모듈 |
| **PeerConnection** | 최상위 객체. Offer/Answer/ICE/상태 관리 |
| **Track** | `TrackLocalStaticRTP` (패킷 단위), `TrackLocalStaticSample` (샘플 단위), `TrackRemote` (수신) |
| **DataChannel** | `CreateDataChannel` (생성), `OnDataChannel` (수신). 채널별 신뢰성 옵션 |
| **브라우저와의 차이** | getUserMedia 없음, (값, error) 패턴, 고루틴 기반 동시성, SettingEngine/Interceptor/MediaEngine 등 서버 전용 기능 |

```
[다음 편 미리보기: 브라우저 ↔ Pion 연결]

  브라우저 (JavaScript)                    Golang (Pion)
  ┌────────────────────┐                ┌────────────────────┐
  │  getUserMedia()    │                │                    │
  │  addTrack()        │                │  OnTrack()         │
  │  createOffer()     │  ← Signaling → │  SetRemoteDesc()   │
  │  setLocalDesc()    │    (5편 서버)   │  CreateAnswer()    │
  │                    │                │  SetLocalDesc()    │
  │  ontrack → <video> │                │  AddTrack()        │
  └────────────────────┘                └────────────────────┘

  5편의 Signaling 서버 + 6편의 Pion 지식
  → 7편에서 실제 브라우저 ↔ Golang 연결 구현
```

다음 편에서는 5편의 Signaling 서버와 이번 편의 Pion을 결합하여, **브라우저와 Golang 피어 간 실제 WebRTC 연결**을 수립하는 실습을 진행한다.

## 참고 자료

- [Pion WebRTC GitHub](https://github.com/pion/webrtc)
- [Pion WebRTC v4 패키지 문서](https://pkg.go.dev/github.com/pion/webrtc/v4)
- [Pion 공식 예제](https://github.com/pion/webrtc/tree/master/examples)
- [Pion mediadevices](https://github.com/pion/mediadevices)
- [awesome-pion](https://github.com/pion/awesome-pion)
