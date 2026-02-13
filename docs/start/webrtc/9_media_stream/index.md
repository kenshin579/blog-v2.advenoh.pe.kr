---
title: "WebRTC 완벽 가이드 (9): Media 스트림 실습 - Golang에서 브라우저로 영상 전송"
description: "RTP/RTCP 프로토콜의 동작 원리를 이해하고, Golang/Pion에서 VP8 영상과 Opus 오디오를 브라우저로 실시간 스트리밍합니다. Track 생성, 코덱 설정, RTCP 피드백, 대역폭 제어까지 다룹니다."
date: 2026-02-07
update: 2026-02-07
tags:
  - WebRTC
  - RTP
  - RTCP
  - Pion
  - Golang
  - Media
  - VP8
  - Opus
  - 실습
series: "WebRTC 완벽 가이드"
---

8편에서 DataChannel을 심화 실습했다. 이번 편에서는 WebRTC의 핵심인 **미디어 스트리밍**을 다룬다. RTP/RTCP 프로토콜의 동작 원리를 이해하고, Golang/Pion에서 VP8 영상과 Opus 오디오 파일을 읽어 브라우저로 실시간 전송하는 과정을 구현한다.

# 1. Media Track 개념

## 1.1 Track이란

WebRTC에서 **Track**은 하나의 미디어 스트림(영상 또는 음성)을 나타내는 단위다. PeerConnection은 여러 Track을 동시에 전송/수신할 수 있다.

```
[PeerConnection과 Track의 관계]

  PeerConnection
  ├── Video Track (VP8)      → m=video 라인 (SDP)
  ├── Audio Track (Opus)     → m=audio 라인 (SDP)
  └── DataChannel (SCTP)     → m=application 라인 (SDP)
```

## 1.2 Local Track vs Remote Track

```
[Track 방향]

  Golang (송신 측)                          브라우저 (수신 측)
  ┌──────────────────┐                     ┌──────────────────┐
  │                  │                     │                  │
  │  TrackLocal      │ ═══ RTP ═══════════>│  TrackRemote     │
  │  (송신용)         │                     │  (수신용)         │
  │                  │                     │                  │
  │  ┌─────────────┐ │                     │  MediaStream     │
  │  │ WriteSample()│ │                     │  ├── video track │
  │  │ WriteRTP()  │ │                     │  └── audio track │
  │  └─────────────┘ │                     │       ↓          │
  │                  │                     │  <video> 요소     │
  └──────────────────┘                     └──────────────────┘
```

## 1.3 Pion의 Track 타입

Pion은 두 가지 Local Track 타입을 제공한다.

| 타입 | 입력 | 용도 |
|------|------|------|
| `TrackLocalStaticSample` | 미디어 샘플 (프레임 데이터 + 길이) | 파일 재생, 생성된 콘텐츠 |
| `TrackLocalStaticRTP` | 원시 RTP 패킷 | RTP 포워딩, SFU |

```
[두 Track 타입의 차이]

  TrackLocalStaticSample:
  ┌────────────┐    자동 처리    ┌───────────┐
  │ 프레임 데이터 │ ──────────────> │ RTP 패킷들 │ → 네트워크
  │ + Duration  │  타임스탬프,    │ (자동 분할) │
  └────────────┘  시퀀스 번호    └───────────┘

  TrackLocalStaticRTP:
  ┌────────────┐    그대로 전달   ┌───────────┐
  │ RTP 패킷    │ ──────────────> │ RTP 패킷   │ → 네트워크
  │ (이미 완성)  │               │            │
  └────────────┘               └───────────┘
```

대부분의 경우 `TrackLocalStaticSample`을 사용한다. RTP 패킷을 직접 제어해야 하는 SFU 같은 경우에만 `TrackLocalStaticRTP`를 사용한다.

# 2. RTP 프로토콜

## 2.1 RTP란

**RTP(Real-time Transport Protocol)** 는 실시간 미디어 데이터를 전송하는 프로토콜이다. UDP 위에서 동작하며, 미디어 패킷의 순서, 타이밍, 코덱 정보를 전달한다.

## 2.2 RTP 패킷 구조

```
[RTP 패킷 헤더 (12바이트 고정 + 확장)]

   0                   1                   2                   3
   0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  |V=2|P|X|  CC   |M|     PT      |       Sequence Number         |
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  |                           Timestamp                           |
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  |                             SSRC                              |
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  |                            Payload                            |
  |                             ...                               |
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

| 필드 | 크기 | 설명 |
|------|------|------|
| V (Version) | 2비트 | 항상 2 |
| P (Padding) | 1비트 | 패딩 여부 |
| X (Extension) | 1비트 | 헤더 확장 여부 |
| CC | 4비트 | CSRC 개수 |
| M (Marker) | 1비트 | 프레임 마지막 패킷 표시 |
| PT (Payload Type) | 7비트 | 코덱 식별 (VP8=96, Opus=111 등) |
| Sequence Number | 16비트 | 패킷 순서 (손실/재정렬 감지) |
| Timestamp | 32비트 | 샘플링 시각 (디코딩 타이밍) |
| SSRC | 32비트 | 스트림 식별자 |

## 2.3 RTP의 핵심 메커니즘

```
[Sequence Number로 패킷 손실 감지]

  송신: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
  수신: 1, 2, 3, _, 5, 6, _, 8, 9, 10
                  ↑              ↑
              4번 손실         7번 손실
              → NACK 전송     → NACK 전송

[Timestamp로 재생 타이밍 제어]

  비디오 (90kHz 클럭):
  프레임 1: ts=0        → 0ms
  프레임 2: ts=3000     → 33.3ms (30fps)
  프레임 3: ts=6000     → 66.7ms
  프레임 4: ts=9000     → 100ms

  오디오 (48kHz 클럭):
  패킷 1: ts=0          → 0ms
  패킷 2: ts=960        → 20ms (Opus 20ms 프레임)
  패킷 3: ts=1920       → 40ms
```

# 3. RTCP 프로토콜

## 3.1 RTCP란

**RTCP(RTP Control Protocol)** 는 미디어 전송에 대한 **메타데이터와 피드백**을 교환하는 프로토콜이다. RTP가 데이터를 전달한다면, RTCP는 전송 품질을 관리한다.

## 3.2 주요 RTCP 패킷 타입

| 타입 | 코드 | 설명 |
|------|------|------|
| **SR** (Sender Report) | 200 | 송신 통계 (전송 패킷 수, 바이트 수, 타임스탬프) |
| **RR** (Receiver Report) | 201 | 수신 통계 (손실률, 지터, 마지막 SR 이후 지연) |
| **NACK** | 205 | 특정 패킷 재전송 요청 |
| **PLI** (Picture Loss Indication) | 206 | 키프레임 재전송 요청 (패킷 손실로 디코딩 불가 시) |
| **FIR** (Full INTRA-frame Request) | 192 | 키프레임 요청 (새 참가자 합류 등) |
| **REMB** | 206 | 수신 측 추정 최대 비트레이트 |

## 3.3 RTCP 피드백 흐름

```
[PLI/NACK 동작 흐름]

  송신 측 (Golang)                          수신 측 (브라우저)
       │                                       │
       │── RTP 패킷 1 ────────────────────────>│
       │── RTP 패킷 2 ────────────────────────>│
       │── RTP 패킷 3 ──── ✕ (손실) ─────────>│
       │── RTP 패킷 4 ────────────────────────>│
       │                                       │
       │                          패킷 3 누락 감지
       │                                       │
       │<──────────── NACK (seq=3) ────────────│  패킷 3 재전송 요청
       │── RTP 패킷 3 (재전송) ───────────────>│
       │                                       │
       │                          디코딩 실패 발생
       │                                       │
       │<──────────── PLI ─────────────────────│  키프레임 요청
       │── 키프레임 (IDR) ────────────────────>│  전체 화면 다시 전송
       │                                       │

[Sender/Receiver Report]

  송신 측                                   수신 측
       │── SR ─────────────────────────────>│
       │   {                                │
       │     ntp_timestamp,                 │  NTP 시각
       │     rtp_timestamp,                 │  RTP 타임스탬프
       │     sender_packet_count: 1000,     │  누적 전송 패킷
       │     sender_octet_count: 150000     │  누적 전송 바이트
       │   }                                │
       │                                    │
       │<── RR ─────────────────────────────│
       │   {                                │
       │     fraction_lost: 0.02,           │  최근 손실률 2%
       │     cumulative_lost: 20,           │  누적 손실 패킷
       │     highest_seq: 1000,             │  최고 시퀀스 번호
       │     jitter: 5,                     │  지터 (타임스탬프 단위)
       │     last_sr: ...,                  │  마지막 SR 타임스탬프
       │     delay_since_last_sr: ...       │  마지막 SR 이후 경과 시간
       │   }                                │
       │                                    │
       │  RTT = now - last_sr - dlsr        │  왕복 시간 계산
```

# 4. 코덱

## 4.1 WebRTC 필수 코덱

WebRTC 표준에서 반드시 지원해야 하는 코덱이 정의되어 있다.

| 종류 | 코덱 | 클럭 레이트 | 특징 |
|------|------|------------|------|
| 영상 | VP8 | 90kHz | WebRTC 필수, 구글 개발, 무료 |
| 영상 | VP9 | 90kHz | VP8 후속, SVC 지원 |
| 영상 | H.264 | 90kHz | 광범위한 하드웨어 지원 |
| 영상 | AV1 | 90kHz | 최신, 최고 압축률 |
| 음성 | Opus | 48kHz | WebRTC 필수, 가변 비트레이트, 6~510kbps |

## 4.2 키프레임(IDR)과 인터프레임

```
[비디오 프레임 타입]

  ┌─── I-Frame (키프레임, IDR) ───────────────────────────┐
  │  전체 화면 정보를 독립적으로 포함                         │
  │  크기가 크지만, 이 프레임만으로 디코딩 가능                │
  │  주기적으로 전송 (보통 2~5초 간격)                       │
  └───────────────────────────────────────────────────────┘

  ┌─── P-Frame (인터프레임) ──────────────────────────────┐
  │  이전 프레임과의 차이만 포함                              │
  │  크기가 작지만, 이전 프레임이 있어야 디코딩 가능           │
  │  I-Frame이 손실되면 이후 P-Frame도 모두 디코딩 불가        │
  └───────────────────────────────────────────────────────┘

  시간축:
  I ── P ── P ── P ── P ── I ── P ── P ── P ── P ── I ── ...
  ↑                        ↑                        ↑
  키프레임                  키프레임                  키프레임
  (GOP 시작)               (GOP 시작)               (GOP 시작)

  GOP (Group of Pictures) = I-Frame 간격
```

**PLI가 중요한 이유**: P-Frame만 수신하면 디코딩이 불가능하다. 중간에 패킷 손실이 발생하면 수신 측은 PLI를 보내 키프레임을 요청한다.

## 4.3 Pion 코덱 상수

```go
// Pion에서 제공하는 코덱 MIME 타입 상수
webrtc.MimeTypeVP8   // "video/VP8"
webrtc.MimeTypeVP9   // "video/VP9"
webrtc.MimeTypeH264  // "video/H264"
webrtc.MimeTypeAV1   // "video/AV1"
webrtc.MimeTypeOpus  // "audio/opus"
webrtc.MimeTypeG722  // "audio/G722"
webrtc.MimeTypePCMU  // "audio/PCMU"
webrtc.MimeTypePCMA  // "audio/PCMA"
```

# 5. 미디어 파일 형식

## 5.1 IVF (Indeo Video Format)

VP8/VP9/AV1 원시 프레임을 담는 컨테이너다. 구조가 단순하여 WebRTC 테스트에 자주 사용된다.

```
[IVF 파일 구조]

  ┌─────────────────────┐
  │  IVF File Header    │  32바이트
  │  ├── FourCC: "VP80" │  코덱 식별
  │  ├── Width/Height   │  해상도
  │  └── Timebase       │  프레임 레이트 (분자/분모)
  ├─────────────────────┤
  │  Frame Header 1     │  12바이트
  │  ├── Frame Size     │
  │  └── Timestamp      │
  │  Frame Data 1       │  가변 (VP8 인코딩 데이터)
  ├─────────────────────┤
  │  Frame Header 2     │
  │  Frame Data 2       │
  ├─────────────────────┤
  │  ...                │
  └─────────────────────┘
```

## 5.2 OGG (Ogg 컨테이너)

Opus 오디오를 담는 컨테이너다.

```
[OGG 파일 구조]

  ┌─────────────────────┐
  │  OGG Page Header    │
  │  ├── GranulePosition│  샘플 위치 (Duration 계산용)
  │  └── Page Data      │  Opus 인코딩 데이터
  ├─────────────────────┤
  │  OGG Page 2         │
  ├─────────────────────┤
  │  ...                │
  └─────────────────────┘
```

## 5.3 테스트 파일 생성 (ffmpeg)

```bash
# VP8 비디오 생성 (IVF)
ffmpeg -i input.mp4 -c:v libvpx -g 30 -b:v 2M output.ivf

# VP9 비디오 생성 (IVF)
ffmpeg -i input.mp4 -c:v libvpx-vp9 -g 30 -b:v 2M output.ivf

# H.264 비디오 생성 (Annex-B)
ffmpeg -i input.mp4 -an -c:v libx264 -bsf:v h264_mp4toannexb \
       -b:v 2M -max_delay 0 -bf 0 output.h264

# Opus 오디오 생성 (OGG)
ffmpeg -i input.mp4 -c:a libopus -page_duration 20000 -vn output.ogg

# 테스트 패턴 영상 생성 (입력 파일 없이)
ffmpeg -f lavfi -i testsrc=duration=30:size=640x480:rate=30 \
       -c:v libvpx -g 30 -b:v 1M test.ivf

# 테스트 사인파 오디오 생성
ffmpeg -f lavfi -i sine=frequency=440:duration=30 \
       -c:a libopus -page_duration 20000 test.ogg
```

# 6. 실습: Golang → 브라우저 비디오/오디오 스트리밍

## 6.1 실습 구조

```
[실습 시나리오]

  Golang Server                              브라우저
  ┌─────────────────────┐                  ┌────────────────┐
  │                     │                  │                │
  │  test.ivf (VP8)     │                  │                │
  │  ├── IVF Reader     │                  │  ┌──────────┐  │
  │  └── WriteSample()──│── Video Track ──>│  │ <video>  │  │
  │                     │   (RTP)          │  │  요소     │  │
  │  test.ogg (Opus)    │                  │  └──────────┘  │
  │  ├── OGG Reader     │                  │                │
  │  └── WriteSample()──│── Audio Track ──>│  스피커 출력    │
  │                     │   (RTP)          │                │
  │  WebSocket Server───│── Signaling ────>│  WebSocket     │
  │                     │                  │                │
  └─────────────────────┘                  └────────────────┘

  프로젝트 구조:
  webrtc-media-stream/
  ├── main.go           # Golang 서버
  ├── media/
  │   ├── test.ivf      # VP8 테스트 영상
  │   └── test.ogg      # Opus 테스트 오디오
  ├── web/
  │   └── index.html    # 브라우저 클라이언트
  ├── go.mod
  └── go.sum
```

## 6.2 Golang 서버 (main.go)

```go
package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v4"
	"github.com/pion/webrtc/v4/pkg/media"
	"github.com/pion/webrtc/v4/pkg/media/ivfreader"
	"github.com/pion/webrtc/v4/pkg/media/oggreader"
)

const (
	videoFileName = "media/test.ivf"
	audioFileName = "media/test.ogg"
	oggPageDuration = 20 * time.Millisecond // Opus 20ms 프레임
)

// ──── Signaling 메시지 ────

type SignalingMessage struct {
	Type          string  `json:"type"`
	SDP           string  `json:"sdp,omitempty"`
	Candidate     string  `json:"candidate,omitempty"`
	SDPMLineIndex *uint16 `json:"sdpMLineIndex,omitempty"`
	SDPMid        string  `json:"sdpMid,omitempty"`
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func main() {
	// 미디어 파일 존재 확인
	if _, err := os.Stat(videoFileName); os.IsNotExist(err) {
		log.Fatalf("Video file not found: %s\n"+
			"Generate with: ffmpeg -f lavfi -i testsrc=duration=30:size=640x480:rate=30 "+
			"-c:v libvpx -g 30 -b:v 1M %s", videoFileName, videoFileName)
	}
	if _, err := os.Stat(audioFileName); os.IsNotExist(err) {
		log.Fatalf("Audio file not found: %s\n"+
			"Generate with: ffmpeg -f lavfi -i sine=frequency=440:duration=30 "+
			"-c:a libopus -page_duration 20000 %s", audioFileName, audioFileName)
	}

	http.Handle("/", http.FileServer(http.Dir("web")))
	http.HandleFunc("/ws", handleWebSocket)

	addr := ":8080"
	log.Printf("Server starting at http://localhost%s", addr)
	log.Printf("Video: %s, Audio: %s", videoFileName, audioFileName)
	log.Fatal(http.ListenAndServe(addr, nil))
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	log.Println("Browser connected via WebSocket")

	// ──── 1. PeerConnection 생성 ────
	pc, err := webrtc.NewPeerConnection(webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{URLs: []string{"stun:stun.l.google.com:19302"}},
		},
	})
	if err != nil {
		log.Printf("PeerConnection error: %v", err)
		return
	}
	defer pc.Close()

	// ICE 연결 완료 시그널
	iceConnectedCtx, iceConnectedCancel := context.WithCancel(context.Background())

	// ──── 2. Video Track 생성 ────
	videoTrack, err := webrtc.NewTrackLocalStaticSample(
		webrtc.RTPCodecCapability{MimeType: webrtc.MimeTypeVP8},
		"video",  // Track ID
		"pion",   // Stream ID
	)
	if err != nil {
		log.Printf("Video track error: %v", err)
		return
	}

	videoSender, err := pc.AddTrack(videoTrack)
	if err != nil {
		log.Printf("AddTrack(video) error: %v", err)
		return
	}

	// RTCP 패킷 읽기 (PLI, NACK 등 피드백 처리에 필수)
	go readRTCP(videoSender, "video")

	// ──── 3. Audio Track 생성 ────
	audioTrack, err := webrtc.NewTrackLocalStaticSample(
		webrtc.RTPCodecCapability{MimeType: webrtc.MimeTypeOpus},
		"audio",
		"pion",
	)
	if err != nil {
		log.Printf("Audio track error: %v", err)
		return
	}

	audioSender, err := pc.AddTrack(audioTrack)
	if err != nil {
		log.Printf("AddTrack(audio) error: %v", err)
		return
	}

	go readRTCP(audioSender, "audio")

	// ──── 4. 연결 상태 모니터링 ────
	pc.OnICEConnectionStateChange(func(state webrtc.ICEConnectionState) {
		log.Printf("ICE connection state: %s", state.String())
		if state == webrtc.ICEConnectionStateConnected {
			iceConnectedCancel()
		}
	})

	pc.OnConnectionStateChange(func(state webrtc.PeerConnectionState) {
		log.Printf("Connection state: %s", state.String())
		if state == webrtc.PeerConnectionStateFailed ||
			state == webrtc.PeerConnectionStateClosed {
			pc.Close()
		}
	})

	// ──── 5. WebSocket Signaling ────
	var wsMu sync.Mutex
	sendJSON := func(msg SignalingMessage) {
		wsMu.Lock()
		defer wsMu.Unlock()
		conn.WriteJSON(msg)
	}

	pc.OnICECandidate(func(c *webrtc.ICECandidate) {
		if c == nil {
			return
		}
		j := c.ToJSON()
		sendJSON(SignalingMessage{
			Type:          "candidate",
			Candidate:     j.Candidate,
			SDPMLineIndex: j.SDPMLineIndex,
			SDPMid:        *j.SDPMid,
		})
	})

	// ──── 6. 미디어 전송 고루틴 시작 ────
	go sendVideo(iceConnectedCtx, videoTrack)
	go sendAudio(iceConnectedCtx, audioTrack)

	// ──── 7. Signaling 메시지 처리 루프 ────
	for {
		var msg SignalingMessage
		if err := conn.ReadJSON(&msg); err != nil {
			if websocket.IsUnexpectedCloseError(err,
				websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				log.Printf("WebSocket read error: %v", err)
			}
			return
		}

		switch msg.Type {
		case "offer":
			log.Println("Offer received")

			pc.SetRemoteDescription(webrtc.SessionDescription{
				Type: webrtc.SDPTypeOffer, SDP: msg.SDP,
			})

			answer, _ := pc.CreateAnswer(nil)
			pc.SetLocalDescription(answer)

			sendJSON(SignalingMessage{
				Type: "answer",
				SDP:  pc.LocalDescription().SDP,
			})
			log.Println("Answer sent")

		case "candidate":
			pc.AddICECandidate(webrtc.ICECandidateInit{
				Candidate:     msg.Candidate,
				SDPMLineIndex: msg.SDPMLineIndex,
				SDPMid:        &msg.SDPMid,
			})
		}
	}
}

// ──── RTCP 피드백 읽기 ────

func readRTCP(sender *webrtc.RTPSender, label string) {
	rtcpBuf := make([]byte, 1500)
	for {
		n, _, err := sender.Read(rtcpBuf)
		if err != nil {
			return
		}
		log.Printf("RTCP [%s]: %d bytes received", label, n)
	}
}

// ──── VP8 비디오 전송 ────

func sendVideo(ctx context.Context, track *webrtc.TrackLocalStaticSample) {
	// ICE 연결 대기
	<-ctx.Done()
	log.Println("Starting video stream...")

	file, err := os.Open(videoFileName)
	if err != nil {
		log.Printf("Video file open error: %v", err)
		return
	}
	defer file.Close()

	ivf, header, err := ivfreader.NewWith(file)
	if err != nil {
		log.Printf("IVF reader error: %v", err)
		return
	}

	// IVF 헤더에서 프레임 간격 계산
	// TimebaseNumerator / TimebaseDenominator = 초 단위 프레임 간격
	frameDuration := time.Millisecond * time.Duration(
		float32(header.TimebaseNumerator)/float32(header.TimebaseDenominator)*1000,
	)
	log.Printf("Video: %s %dx%d, frame duration: %v",
		header.FourCC, header.Width, header.Height, frameDuration)

	ticker := time.NewTicker(frameDuration)
	defer ticker.Stop()

	frameCount := 0
	for ; true; <-ticker.C {
		frame, _, err := ivf.ParseNextFrame()
		if errors.Is(err, io.EOF) {
			log.Printf("Video stream ended (%d frames sent)", frameCount)
			return
		}
		if err != nil {
			log.Printf("IVF parse error: %v", err)
			return
		}

		if err = track.WriteSample(media.Sample{
			Data:     frame,
			Duration: frameDuration,
		}); err != nil {
			if errors.Is(err, io.ErrClosedPipe) {
				log.Println("Video track closed")
				return
			}
			log.Printf("Video write error: %v", err)
		}

		frameCount++
		if frameCount%100 == 0 {
			log.Printf("Video: %d frames sent", frameCount)
		}
	}
}

// ──── Opus 오디오 전송 ────

func sendAudio(ctx context.Context, track *webrtc.TrackLocalStaticSample) {
	// ICE 연결 대기
	<-ctx.Done()
	log.Println("Starting audio stream...")

	file, err := os.Open(audioFileName)
	if err != nil {
		log.Printf("Audio file open error: %v", err)
		return
	}
	defer file.Close()

	ogg, _, err := oggreader.NewWith(file)
	if err != nil {
		log.Printf("OGG reader error: %v", err)
		return
	}

	ticker := time.NewTicker(oggPageDuration)
	defer ticker.Stop()

	var lastGranule uint64
	pageCount := 0

	for ; true; <-ticker.C {
		pageData, pageHeader, err := ogg.ParseNextPage()
		if errors.Is(err, io.EOF) {
			log.Printf("Audio stream ended (%d pages sent)", pageCount)
			return
		}
		if err != nil {
			log.Printf("OGG parse error: %v", err)
			return
		}

		// Granule Position으로 샘플 Duration 계산
		sampleCount := float64(pageHeader.GranulePosition - lastGranule)
		lastGranule = pageHeader.GranulePosition
		sampleDuration := time.Duration(sampleCount/48000*1000) * time.Millisecond

		if err = track.WriteSample(media.Sample{
			Data:     pageData,
			Duration: sampleDuration,
		}); err != nil {
			if errors.Is(err, io.ErrClosedPipe) {
				log.Println("Audio track closed")
				return
			}
			log.Printf("Audio write error: %v", err)
		}

		pageCount++
	}
}
```

## 6.3 코드 흐름 해설

```
[Golang 서버 동작 흐름]

  브라우저 WebSocket 연결
       │
       ▼
  PeerConnection 생성
       │
       ├── Video Track 생성 (VP8)
       │   └── AddTrack → RTPSender
       │       └── goroutine: RTCP 읽기 (PLI/NACK 처리)
       │
       ├── Audio Track 생성 (Opus)
       │   └── AddTrack → RTPSender
       │       └── goroutine: RTCP 읽기
       │
       ├── goroutine: sendVideo()
       │   └── ICE 연결 대기 → IVF 파일 읽기 → WriteSample (프레임 단위)
       │
       ├── goroutine: sendAudio()
       │   └── ICE 연결 대기 → OGG 파일 읽기 → WriteSample (페이지 단위)
       │
       └── Signaling 루프
           ├── Offer → Answer
           └── ICE Candidate 교환
```

## 6.4 핵심 포인트: time.Ticker 사용

미디어 전송에서 **페이싱(pacing)** 이 중요하다. `time.Sleep` 대신 `time.Ticker`를 사용해야 한다.

```
[time.Sleep vs time.Ticker]

  time.Sleep (잘못된 방법):
  ┌──────┐   33ms    ┌─────┐  2ms  ┌──────┐   33ms    ┌─────┐
  │처리  │ ← sleep → │처리 │←처리→│ 처리  │ ← sleep → │처리 │
  └──────┘           └─────┘      └──────┘           └─────┘
  실제 간격: 35ms         35ms         35ms
  → 누적 오차 발생 (30초 후 수초 밀림)

  time.Ticker (올바른 방법):
  ┌──────┐    ┌─────┐    ┌──────┐    ┌─────┐
  │처리  │    │처리 │    │ 처리  │    │처리 │
  └──────┘    └─────┘    └──────┘    └─────┘
  ↑  33ms  ↑  33ms  ↑  33ms  ↑  33ms  ↑
  → 일정한 간격 유지 (시스템 클럭 기준)
```

## 6.5 핵심 포인트: RTCP 읽기가 필수인 이유

```go
go readRTCP(videoSender, "video")
```

이 고루틴을 빠뜨리면 **PLI와 NACK가 처리되지 않는다**. Pion은 RTPSender.Read()를 호출해야 수신된 RTCP 패킷을 내부적으로 처리한다. 이 호출이 없으면 다음과 같은 문제가 발생한다.

```
[RTCP 읽기 미수행 시 발생하는 문제]

  브라우저: "PLI 보냄 (키프레임 요청)"
       │
       ▼
  Pion 내부 버퍼에 RTCP 패킷 쌓임
       │
  Read() 호출이 없으므로 처리 불가
       │
       ▼
  결과: 패킷 손실 시 화면 깨짐, 복구 불가
```

# 7. 브라우저 클라이언트

## 7.1 전체 코드 (web/index.html)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>WebRTC Media Stream</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: monospace; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    h1 { margin-bottom: 8px; font-size: 1.4em; }

    .status {
      padding: 8px 12px; border-radius: 4px;
      margin-bottom: 16px; font-size: 0.9em;
    }
    .status.connecting { background: #fff3cd; }
    .status.connected { background: #d4edda; }
    .status.failed { background: #f8d7da; }

    .video-container {
      background: #000; border-radius: 4px;
      margin-bottom: 16px; position: relative;
    }
    video {
      width: 100%; display: block; border-radius: 4px;
    }
    .video-overlay {
      position: absolute; bottom: 8px; left: 8px;
      color: #fff; font-size: 0.75em;
      background: rgba(0,0,0,0.6); padding: 4px 8px;
      border-radius: 2px;
    }

    .controls { display: flex; gap: 8px; margin-bottom: 16px; }
    button {
      padding: 8px 16px; border: none; border-radius: 4px;
      cursor: pointer; font-family: monospace; color: white;
    }
    button:disabled { background: #ccc !important; cursor: not-allowed; }
    .btn-blue { background: #007bff; }
    .btn-green { background: #28a745; }
    .btn-red { background: #dc3545; }

    .stats {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 8px; margin-bottom: 16px;
    }
    .stat-card {
      background: #f8f9fa; padding: 12px;
      border-radius: 4px; text-align: center;
    }
    .stat-value { font-size: 1.5em; font-weight: bold; }
    .stat-label { font-size: 0.75em; color: #666; margin-top: 4px; }

    #log {
      background: #1e1e1e; color: #d4d4d4; padding: 16px;
      border-radius: 4px; height: 200px; overflow-y: auto;
      font-size: 0.85em; line-height: 1.6;
    }
    .log-info { color: #9cdcfe; }
    .log-track { color: #4ec9b0; }
    .log-error { color: #f44747; }
    .log-stat { color: #dcdcaa; }
  </style>
</head>
<body>
  <h1>WebRTC Media Stream (Golang → Browser)</h1>
  <div id="status" class="status connecting">Disconnected</div>

  <!-- 비디오 영역 -->
  <div class="video-container">
    <video id="remoteVideo" autoplay playsinline></video>
    <div class="video-overlay" id="videoInfo">-</div>
  </div>

  <!-- 컨트롤 -->
  <div class="controls">
    <button id="connectBtn" class="btn-blue" onclick="connect()">Connect</button>
    <button class="btn-green" onclick="toggleMute()" disabled id="muteBtn">Mute</button>
    <button class="btn-red" onclick="disconnect()" disabled id="disconnectBtn">Disconnect</button>
  </div>

  <!-- 통계 -->
  <div class="stats">
    <div class="stat-card">
      <div class="stat-value" id="statBitrate">-</div>
      <div class="stat-label">Video Bitrate</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" id="statFps">-</div>
      <div class="stat-label">Frames/sec</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" id="statPacketLoss">-</div>
      <div class="stat-label">Packet Loss</div>
    </div>
  </div>

  <!-- 로그 -->
  <div id="log"></div>

  <script>
    let pc = null, ws = null;
    let statsInterval = null;
    let prevStats = {};
    let muted = false;

    function appendLog(text, cls) {
      const el = document.getElementById('log');
      const line = document.createElement('div');
      line.className = cls || '';
      line.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
      el.appendChild(line);
      el.scrollTop = el.scrollHeight;
    }

    function setStatus(text, cls) {
      const el = document.getElementById('status');
      el.textContent = text;
      el.className = 'status ' + cls;
    }

    // ──── 연결 ────
    async function connect() {
      document.getElementById('connectBtn').disabled = true;
      setStatus('Connecting...', 'connecting');

      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${protocol}//${location.host}/ws`);

      ws.onopen = () => {
        appendLog('WebSocket connected', 'log-info');
        startWebRTC();
      };
      ws.onmessage = (e) => handleSignaling(JSON.parse(e.data));
      ws.onclose = () => {
        setStatus('Disconnected', 'failed');
        stopStats();
      };
    }

    async function startWebRTC() {
      pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      // ──── 수신 트랙 처리 ────
      pc.ontrack = (event) => {
        appendLog(`Track received: ${event.track.kind} (${event.track.id})`, 'log-track');

        if (event.track.kind === 'video') {
          const video = document.getElementById('remoteVideo');
          video.srcObject = event.streams[0];
          appendLog('Video stream attached to <video>', 'log-track');
        }

        if (event.track.kind === 'audio') {
          // 오디오는 같은 스트림에 포함되므로 비디오에 자동 연결
          appendLog('Audio track received', 'log-track');
        }

        // 트랙 종료 감지
        event.track.onended = () => {
          appendLog(`Track ended: ${event.track.kind}`, 'log-info');
        };
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          ws.send(JSON.stringify({
            type: 'candidate',
            candidate: e.candidate.candidate,
            sdpMLineIndex: e.candidate.sdpMLineIndex,
            sdpMid: e.candidate.sdpMid
          }));
        }
      };

      pc.onconnectionstatechange = () => {
        appendLog(`Connection: ${pc.connectionState}`, 'log-info');
        if (pc.connectionState === 'connected') {
          setStatus('Connected - Streaming', 'connected');
          document.getElementById('muteBtn').disabled = false;
          document.getElementById('disconnectBtn').disabled = false;
          startStats();
        } else if (pc.connectionState === 'failed') {
          setStatus('Connection Failed', 'failed');
        }
      };

      // 수신 전용이므로 Transceiver 추가
      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });

      // Offer 생성
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      ws.send(JSON.stringify({ type: 'offer', sdp: pc.localDescription.sdp }));
      appendLog('Offer sent (recvonly video + audio)', 'log-info');
    }

    async function handleSignaling(msg) {
      if (msg.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription({
          type: 'answer', sdp: msg.sdp
        }));
        appendLog('Answer received', 'log-info');
      } else if (msg.type === 'candidate') {
        await pc.addIceCandidate(new RTCIceCandidate({
          candidate: msg.candidate,
          sdpMLineIndex: msg.sdpMLineIndex,
          sdpMid: msg.sdpMid
        }));
      }
    }

    // ──── 통계 수집 ────
    function startStats() {
      statsInterval = setInterval(updateStats, 1000);
    }

    function stopStats() {
      if (statsInterval) {
        clearInterval(statsInterval);
        statsInterval = null;
      }
    }

    async function updateStats() {
      if (!pc) return;
      const stats = await pc.getStats();

      stats.forEach(report => {
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          // 비트레이트 계산
          if (prevStats.videoBytesReceived !== undefined) {
            const bytesDiff = report.bytesReceived - prevStats.videoBytesReceived;
            const bitrate = (bytesDiff * 8 / 1000).toFixed(0);
            document.getElementById('statBitrate').textContent = `${bitrate} kbps`;
          }
          prevStats.videoBytesReceived = report.bytesReceived;

          // FPS
          if (prevStats.framesDecoded !== undefined) {
            const fpsDiff = report.framesDecoded - prevStats.framesDecoded;
            document.getElementById('statFps').textContent = `${fpsDiff}`;
          }
          prevStats.framesDecoded = report.framesDecoded;

          // 패킷 손실
          const lossRate = report.packetsReceived > 0
            ? ((report.packetsLost / (report.packetsReceived + report.packetsLost)) * 100).toFixed(1)
            : '0.0';
          document.getElementById('statPacketLoss').textContent = `${lossRate}%`;

          // 비디오 정보 오버레이
          const resolution = `${report.frameWidth || '?'}x${report.frameHeight || '?'}`;
          document.getElementById('videoInfo').textContent =
            `${resolution} | ${document.getElementById('statFps').textContent}fps | ${document.getElementById('statBitrate').textContent}`;
        }
      });
    }

    // ──── 컨트롤 ────
    function toggleMute() {
      const video = document.getElementById('remoteVideo');
      muted = !muted;
      video.muted = muted;
      document.getElementById('muteBtn').textContent = muted ? 'Unmute' : 'Mute';
      appendLog(muted ? 'Audio muted' : 'Audio unmuted', 'log-info');
    }

    function disconnect() {
      stopStats();
      if (pc) { pc.close(); pc = null; }
      if (ws) { ws.close(); ws = null; }
      setStatus('Disconnected', 'failed');
      document.getElementById('connectBtn').disabled = false;
      document.getElementById('muteBtn').disabled = true;
      document.getElementById('disconnectBtn').disabled = true;
      document.getElementById('remoteVideo').srcObject = null;
      appendLog('Disconnected', 'log-info');
    }
  </script>
</body>
</html>
```

## 7.2 핵심: ontrack 이벤트

브라우저에서 가장 중요한 부분은 `pc.ontrack` 핸들러다.

```
[ontrack 동작]

  서버에서 AddTrack(videoTrack) 호출
       │
  SDP Answer에 m=video 라인 포함
       │
  ICE 연결 완료 후 RTP 패킷 수신 시작
       │
       ▼
  pc.ontrack 이벤트 발생
  {
    track: MediaStreamTrack (kind: "video"),
    streams: [MediaStream],
    receiver: RTCRtpReceiver
  }
       │
       ▼
  video.srcObject = event.streams[0]
       │
       ▼
  <video> 요소에서 영상 재생 시작
```

## 7.3 핵심: addTransceiver와 방향

브라우저가 서버로부터 미디어를 수신만 할 때는 `recvonly` 방향으로 Transceiver를 추가한다.

```javascript
// 수신 전용 (서버 → 브라우저)
pc.addTransceiver('video', { direction: 'recvonly' });
pc.addTransceiver('audio', { direction: 'recvonly' });
```

이렇게 하면 Offer SDP에 `a=recvonly`가 포함되고, 서버의 Answer에 `a=sendonly`가 설정된다.

```
[Transceiver 방향]

  방향          Offer 측         Answer 측        용도
  ──────────────────────────────────────────────────────
  sendrecv      송수신            송수신           화상통화
  sendonly      송신만            수신만           방송
  recvonly      수신만            송신만           시청
  inactive      비활성            비활성           일시 중지
```

# 8. 통계 모니터링 (getStats)

## 8.1 주요 통계 항목

`pc.getStats()`에서 수집할 수 있는 미디어 관련 주요 항목이다.

```
[inbound-rtp (수신 측 통계)]

  report.type === 'inbound-rtp'
  ├── kind: "video" | "audio"
  ├── bytesReceived          → 누적 수신 바이트 (비트레이트 계산용)
  ├── packetsReceived        → 누적 수신 패킷
  ├── packetsLost            → 누적 손실 패킷
  ├── jitter                 → 지터 (초 단위)
  ├── framesDecoded          → 디코딩된 프레임 수 (FPS 계산용)
  ├── framesDropped          → 드롭된 프레임 수
  ├── frameWidth             → 영상 너비
  ├── frameHeight            → 영상 높이
  ├── nackCount              → NACK 전송 횟수
  └── pliCount               → PLI 전송 횟수
```

## 8.2 비트레이트와 FPS 계산

```javascript
// 1초 간격으로 호출
let prevBytesReceived = 0;
let prevFramesDecoded = 0;

function calculateMetrics(report) {
  // 비트레이트 (kbps)
  const bitrate = (report.bytesReceived - prevBytesReceived) * 8 / 1000;
  prevBytesReceived = report.bytesReceived;

  // FPS
  const fps = report.framesDecoded - prevFramesDecoded;
  prevFramesDecoded = report.framesDecoded;

  return { bitrate, fps };
}
```

# 9. 실행 및 테스트

## 9.1 테스트 미디어 파일 생성

```bash
mkdir -p webrtc-media-stream/media webrtc-media-stream/web
cd webrtc-media-stream

# VP8 테스트 영상 (30초, 640x480, 30fps, 컬러바 패턴)
ffmpeg -f lavfi -i testsrc=duration=30:size=640x480:rate=30 \
       -c:v libvpx -g 30 -b:v 1M media/test.ivf

# Opus 테스트 오디오 (30초, 440Hz 사인파)
ffmpeg -f lavfi -i sine=frequency=440:duration=30 \
       -c:a libopus -page_duration 20000 media/test.ogg
```

## 9.2 프로젝트 초기화 및 실행

```bash
go mod init webrtc-media-stream
go get github.com/pion/webrtc/v4
go get github.com/gorilla/websocket

# main.go, web/index.html 생성 (위 코드 참조)

go run main.go
# Server starting at http://localhost:8080
# Video: media/test.ivf, Audio: media/test.ogg
```

## 9.3 브라우저에서 테스트

1. `http://localhost:8080` 접속
2. **Connect** 클릭
3. 영상과 오디오 재생 확인
4. 하단 통계(Bitrate, FPS, Packet Loss) 확인
5. **Mute** 로 오디오 토글
6. **Disconnect** 로 연결 종료

## 9.4 예상 로그

### 9.4.1 브라우저

```
[12:00:01] WebSocket connected
[12:00:01] Offer sent (recvonly video + audio)
[12:00:01] Answer received
[12:00:01] Connection: connected
[12:00:01] Track received: video (video)
[12:00:01] Video stream attached to <video>
[12:00:01] Track received: audio (audio)
[12:00:01] Audio track received
```

### 9.4.2 Golang 서버

```
Server starting at http://localhost:8080
Video: media/test.ivf, Audio: media/test.ogg
Browser connected via WebSocket
Offer received
Answer sent
ICE connection state: connected
Connection state: connected
Starting video stream...
Video: VP80 640x480, frame duration: 33ms
Starting audio stream...
Video: 100 frames sent
RTCP [video]: 52 bytes received
Video: 200 frames sent
```

## 9.5 전체 시퀀스

```
  브라우저                              Golang Server
     │                                      │
     │── WS 연결 ─────────────────────────>│
     │                                      │
     │  addTransceiver('video', recvonly)   │
     │  addTransceiver('audio', recvonly)   │
     │  createOffer()                       │
     │── Offer (recvonly) ────────────────>│
     │                                      │  SetRemoteDescription()
     │                                      │  CreateAnswer()  (sendonly)
     │<── Answer (sendonly) ───────────────│
     │                                      │
     │◄══ ICE + DTLS 연결 ════════════════>│
     │                                      │
     │                                      │  sendVideo() goroutine 시작
     │                                      │  sendAudio() goroutine 시작
     │                                      │
     │<══ RTP: VP8 Video Packets ═════════│  WriteSample(frame)
     │<══ RTP: Opus Audio Packets ════════│  WriteSample(page)
     │                                      │
     │  ontrack(video) → <video>.srcObject │
     │  ontrack(audio) → 자동 재생         │
     │                                      │
     │── RTCP: Receiver Report ──────────>│  readRTCP()
     │── RTCP: PLI (필요시) ──────────────>│  키프레임 재전송
     │                                      │
```

# 10. 트러블슈팅

## 10.1 자주 발생하는 문제

### 10.1.1 영상이 표시되지 않음

```
[확인 사항]

  1. autoplay 정책
     → <video autoplay playsinline> 속성 확인
     → Chrome: 음소거 상태에서만 자동 재생 허용
     → 해결: video.muted = true 후 play()

  2. ontrack에서 srcObject 미설정
     → event.streams[0]이 존재하는지 확인

  3. Transceiver 방향 불일치
     → 브라우저: recvonly, 서버: Track을 AddTrack()했는지 확인

  4. 코덱 불일치
     → 서버: VP8로 전송, 브라우저: VP8 지원하는지 확인
     → Chrome/Firefox/Safari 모두 VP8 지원
```

### 10.1.2 영상이 깨지거나 멈춤

```
[확인 사항]

  1. RTCP 읽기 고루틴 확인
     → readRTCP()가 실행 중인지 확인
     → 미실행 시 PLI 처리 불가 → 키프레임 재전송 안됨

  2. 프레임 전송 페이싱
     → time.Ticker 사용 여부 확인
     → 너무 빠르게 전송하면 버퍼 오버플로우

  3. IVF 파일의 GOP 설정
     → -g 30 (30프레임마다 키프레임) 확인
     → 키프레임 없으면 수신 측에서 디코딩 시작 불가
```

### 10.1.3 오디오가 들리지 않음

```
[확인 사항]

  1. 브라우저 자동 재생 정책
     → 사용자 인터랙션 후 재생 시작
     → video.play() 호출 필요

  2. OGG 파일의 page_duration
     → ffmpeg에서 -page_duration 20000 (20ms) 설정 확인

  3. Mute 상태
     → video.muted 속성 확인
```

## 10.2 디버깅 도구

### 10.2.1 chrome://webrtc-internals/

```
[확인할 수 있는 미디어 관련 정보]

  inbound-rtp:
  ├── bytesReceived / packetsReceived     → 수신량
  ├── packetsLost / fractionLost          → 손실 현황
  ├── framesDecoded / framesDropped       → 프레임 처리
  ├── frameWidth / frameHeight            → 해상도
  ├── jitter                              → 지터
  ├── nackCount / pliCount / firCount     → RTCP 피드백 횟수
  └── codec                               → 사용 중인 코덱
```

# 11. 심화: 대역폭 추정과 혼잡 제어

## 11.1 네트워크 혼잡 감지

실시간 미디어에서 네트워크 혼잡은 다음과 같이 감지된다.

```
[혼잡 감지 신호]

  신호               원인                     측정 방법
  ─────────────────────────────────────────────────────
  패킷 손실 증가     버퍼 오버플로우            RR.fraction_lost
  지터 증가          장비 과부하, 큐잉 지연     RR.jitter
  RTT 증가          경로 혼잡                  SR/RR 왕복 시간
```

## 11.2 혼잡 대응 전략

```
[데이터 vs 미디어의 혼잡 대응 차이]

  데이터 (TCP/DataChannel):
  ┌──────────────────────────┐
  │  전송 속도를 줄인다        │  → 지연 증가, 품질 유지
  │  (느리지만 완전한 전달)    │
  └──────────────────────────┘

  미디어 (RTP):
  ┌──────────────────────────┐
  │  품질을 낮춘다            │  → 비트레이트 감소, 해상도 축소
  │  (화질 저하, 실시간 유지)  │
  └──────────────────────────┘
```

미디어는 "늦게 도착하는 데이터는 의미 없다"는 원칙이 있다. 따라서 전송을 지연하는 대신 **인코딩 품질을 낮춰서** 대역폭에 맞춘다.

## 11.3 REMB와 TWCC

| 방법 | 설명 | 동작 위치 |
|------|------|----------|
| **REMB** | 수신 측이 추정한 최대 비트레이트를 송신 측에 알림 | 수신 측 추정 |
| **TWCC** | 패킷 도착 타이밍을 상세 보고, 송신 측에서 추정 | 송신 측 추정 |

```
[REMB 동작]

  송신 측                                  수신 측
     │                                       │
     │  비트레이트: 2Mbps 전송 중             │
     │── RTP ────────────────────────────>│
     │── RTP ────────────────────────────>│
     │                                       │  "네트워크 상태 분석..."
     │                                       │  "최대 1.2Mbps 가능"
     │<── REMB (max=1.2Mbps) ────────────│
     │                                       │
     │  인코더 비트레이트 1.2Mbps로 조정     │
     │── RTP (더 작은 프레임) ───────────>│
```

# 12. API 정리

## 12.1 Pion Track API

| API | 설명 |
|-----|------|
| `NewTrackLocalStaticSample(codec, id, streamID)` | 샘플 기반 Track 생성 |
| `NewTrackLocalStaticRTP(codec, id, streamID)` | RTP 기반 Track 생성 |
| `pc.AddTrack(track)` | PeerConnection에 Track 추가, RTPSender 반환 |
| `track.WriteSample(media.Sample{Data, Duration})` | 미디어 샘플 전송 |
| `track.WriteRTP(packet)` | RTP 패킷 직접 전송 |
| `sender.Read(buf)` | RTCP 피드백 읽기 (필수) |
| `pc.OnTrack(func(remote, receiver))` | 원격 Track 수신 이벤트 |
| `remote.ReadRTP()` | 수신된 RTP 패킷 읽기 |
| `remote.Read(buf)` | 수신된 RTP 페이로드 읽기 |

## 12.2 브라우저 Media API

| API | 설명 |
|-----|------|
| `pc.addTransceiver(kind, {direction})` | Transceiver 추가 (방향 설정) |
| `pc.ontrack` | 원격 Track 수신 이벤트 |
| `event.streams[0]` | 수신된 MediaStream |
| `video.srcObject = stream` | video 요소에 스트림 연결 |
| `pc.getStats()` | 연결 통계 (비트레이트, FPS, 손실률) |
| `track.enabled` | Track 활성화/비활성화 |
| `track.onended` | Track 종료 이벤트 |

## 12.3 미디어 파일 리더 (Pion)

| 리더 | 파일 형식 | 코덱 | 주요 메서드 |
|------|----------|------|------------|
| `ivfreader` | .ivf | VP8/VP9/AV1 | `ParseNextFrame()` → frame bytes |
| `oggreader` | .ogg | Opus | `ParseNextPage()` → page bytes, header |
| `h264reader` | .h264 | H.264 | `NextNAL()` → NAL unit |

# 13. 정리

이번 편에서 다룬 내용을 요약한다.

| 주제 | 핵심 내용 |
|------|----------|
| **Track** | Local(송신)/Remote(수신), StaticSample(프레임)/StaticRTP(패킷) |
| **RTP** | 실시간 미디어 전송, Sequence Number(손실), Timestamp(타이밍), SSRC(스트림) |
| **RTCP** | SR/RR(통계), PLI/FIR(키프레임), NACK(재전송), REMB(대역폭) |
| **코덱** | VP8(필수), VP9, H.264, AV1(영상) / Opus(필수, 음성) |
| **키프레임** | I-Frame(독립 디코딩), P-Frame(차이만), GOP, PLI 요청 |
| **파일 형식** | IVF(VP8/VP9), OGG(Opus), H.264 Annex-B |
| **실습** | Golang→브라우저 VP8+Opus 스트리밍, ffmpeg 테스트 파일 생성 |
| **핵심 패턴** | time.Ticker 페이싱, RTCP 읽기 필수, recvonly Transceiver |
| **통계** | getStats()로 비트레이트, FPS, 패킷 손실률 실시간 모니터링 |
| **혼잡 제어** | REMB(수신 추정), TWCC(송신 추정), 품질 vs 지연 트레이드오프 |

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
  ✅ 9편: Media 스트림 (이 글) ← 지금 여기
  ☐ 10편: 네트워크 이슈와 트러블슈팅
  ☐ 11편~: 확장 구조, 보안, 기술 선택
```

다음 편에서는 **네트워크 이슈와 트러블슈팅**을 다룬다. 연결이 안 될 때의 체크리스트, ICE 후보 분석, 환경별(로컬/사내망/클라우드) 차이를 정리한다.

## 참고 자료

- [WebRTC for the Curious - Media Communication](https://webrtcforthecurious.com/ko/docs/06-media-communication/)
- [WebRTC for the Curious - Real-time Networking](https://webrtcforthecurious.com/ko/docs/05-real-time-networking/)
- [Pion WebRTC - play-from-disk 예제](https://github.com/pion/webrtc/tree/master/examples/play-from-disk)
- [Pion TrackLocalStaticSample API](https://pkg.go.dev/github.com/pion/webrtc/v4#TrackLocalStaticSample)
- [RFC 3550 - RTP](https://tools.ietf.org/html/rfc3550)
- [RFC 4585 - Extended RTP Profile (RTCP Feedback)](https://tools.ietf.org/html/rfc4585)
- [MDN - RTCRtpReceiver](https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpReceiver)
