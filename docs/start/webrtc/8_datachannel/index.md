---
title: "WebRTC 완벽 가이드 (8): DataChannel 실습 - Ping/Pong, JSON 메시지, 로봇 제어"
description: "WebRTC DataChannel의 내부 구조(SCTP/DCEP)를 이해하고, 4가지 전송 모드를 비교합니다. Ping/Pong RTT 측정, JSON 메시지 프로토콜, 로봇 제어 명령 전달까지 Golang/Pion과 브라우저로 구현합니다."
date: 2026-02-07
update: 2026-02-07
tags:
  - WebRTC
  - DataChannel
  - SCTP
  - Pion
  - Golang
  - 실습
series: "WebRTC 완벽 가이드"
---

7편에서 브라우저와 Golang 사이에 DataChannel Echo를 구현했다. 이번 편에서는 DataChannel을 더 깊이 다룬다. SCTP 프로토콜의 동작 원리, 4가지 전송 모드, 그리고 실전에서 자주 사용하는 3가지 패턴(Ping/Pong, JSON 메시지 교환, 로봇 제어 명령)을 구현한다.

# 1. DataChannel 내부 구조

## 1.1 프로토콜 스택

DataChannel은 브라우저의 WebSocket과 비슷한 API를 제공하지만, 내부 구조는 완전히 다르다.

```
[DataChannel 프로토콜 스택]

  ┌───────────────────────────┐
  │   DataChannel API         │  ← 애플리케이션이 사용하는 인터페이스
  │   (send, onmessage)       │
  ├───────────────────────────┤
  │   DCEP                    │  ← 채널 라벨, 옵션 협상
  │   (Data Channel           │
  │    Establishment Protocol)│
  ├───────────────────────────┤
  │   SCTP                    │  ← 스트림 제어, 신뢰성, 순서 보장
  │   (Stream Control         │
  │    Transmission Protocol) │
  ├───────────────────────────┤
  │   DTLS                    │  ← 암호화, 인증
  ├───────────────────────────┤
  │   ICE / UDP               │  ← 전송
  └───────────────────────────┘
```

각 계층의 역할을 정리하면 다음과 같다.

| 계층 | 프로토콜 | RFC | 역할 |
|------|----------|-----|------|
| 전송 | UDP/ICE | RFC 8445 | NAT 통과, 패킷 전달 |
| 보안 | DTLS | RFC 6347 | 암호화, 키 교환 |
| 스트림 제어 | SCTP | RFC 4960 | 신뢰성, 순서, 흐름 제어 |
| 채널 협상 | DCEP | RFC 8832 | 채널 라벨, 옵션 교환 |
| 애플리케이션 | DataChannel API | W3C | send(), onmessage |

## 1.2 SCTP가 하는 일

TCP와 UDP의 장점을 결합한 프로토콜이다. WebRTC에서 SCTP를 선택한 이유는 **채널별로 신뢰성과 순서를 독립 설정**할 수 있기 때문이다.

```
[TCP vs UDP vs SCTP 비교]

  TCP                 UDP                 SCTP
  ├── 신뢰성: ✅       ├── 신뢰성: ❌       ├── 신뢰성: 선택 가능
  ├── 순서: ✅         ├── 순서: ❌         ├── 순서: 선택 가능
  ├── 다중 스트림: ❌   ├── 다중 스트림: ❌   ├── 다중 스트림: ✅
  └── HOL 차단: ✅     └── HOL 차단: ❌     └── HOL 차단: 스트림별 독립
```

**HOL(Head-of-Line) 차단** 문제가 핵심이다. TCP는 하나의 패킷이 손실되면 뒤따르는 모든 패킷이 대기한다. SCTP는 스트림별로 독립적이므로 스트림 A의 패킷 손실이 스트림 B에 영향을 주지 않는다.

```
[HOL 차단 비교]

  TCP (단일 스트림):
  패킷 1 ── 패킷 2(손실!) ── 패킷 3 ── 패킷 4
                 ↑
            전체 대기 ⏸️ (패킷 3, 4 모두 대기)

  SCTP (다중 스트림):
  스트림 A: 패킷 1 ── 패킷 2(손실!) ── 패킷 3
                          ↑
                     A만 대기 ⏸️

  스트림 B: 패킷 1 ── 패킷 2 ── 패킷 3
                                     ↑
                                영향 없음 ✅ (즉시 전달)
```

## 1.3 SCTP 핵심 구성 요소

### 1.3.1 TSN (Transmission Sequence Number)

모든 DATA 청크에 부여되는 전역 시퀀스 번호다. 수신 측은 TSN으로 패킷 손실과 중복을 판단한다.

### 1.3.2 PPID (Payload Protocol Identifier)

데이터 타입을 구분하는 식별자다. DataChannel에서 사용하는 PPID는 다음과 같다.

| PPID | 값 | 의미 |
|------|-----|------|
| DCEP | 50 | 채널 협상 메시지 |
| String | 51 | 문자열 데이터 |
| Binary | 53 | 바이너리 데이터 |
| String Empty | 56 | 빈 문자열 |
| Binary Empty | 57 | 빈 바이너리 |

`SendText()`는 PPID=51, `Send([]byte)`는 PPID=53으로 전송된다. 수신 측은 `DataChannelMessage.IsString`으로 구분할 수 있다.

## 1.4 DCEP (Data Channel Establishment Protocol)

하나의 SCTP 연결 위에 여러 DataChannel을 열 때, 각 채널의 이름(label)과 옵션을 협상하는 프로토콜이다.

```
[DCEP 동작 흐름]

  Offerer (createDataChannel)              Answerer (OnDataChannel)
       │                                         │
       │── DATA_CHANNEL_OPEN ────────────────────>│
       │   {                                      │
       │     channelType: RELIABLE,               │ 채널 타입
       │     label: "chat",                       │ 채널 이름
       │     protocol: "",                        │ 서브프로토콜
       │     reliability: 0                       │ 재전송/시간 제한값
       │   }                                      │
       │                                          │
       │<── DATA_CHANNEL_ACK ─────────────────────│
       │                                          │
       │◄══ 양방향 데이터 교환 시작 ══════════════>│
```

## 1.5 최대 채널 수

하나의 PeerConnection에서 이론적으로 **최대 65,534개**의 DataChannel을 열 수 있다. 각 채널은 독립적인 SCTP 스트림으로 동작하므로, 용도별로 채널을 분리하는 것이 자연스럽다.

```
[다중 채널 예시]

  PeerConnection
  ├── DataChannel "control"  (ordered, reliable)     → 제어 명령
  ├── DataChannel "telemetry" (unordered, unreliable) → 센서 데이터
  ├── DataChannel "chat"     (ordered, reliable)      → 텍스트 채팅
  └── DataChannel "file"     (ordered, reliable)      → 파일 전송
```

# 2. DataChannel vs WebSocket

## 2.1 구조적 차이

```
[WebSocket]

  Client A ──── WebSocket ────> Server ──── WebSocket ────> Client B
                                  │
                            모든 데이터가
                            서버를 경유

[DataChannel]

  Client A ◄════ DataChannel (P2P) ════► Client B
                    │
              서버 경유 없음
              (Signaling만 서버 사용)
```

## 2.2 상세 비교

| 항목 | WebSocket | DataChannel |
|------|-----------|-------------|
| **전송 경로** | 항상 서버 경유 | P2P 직접 통신 |
| **프로토콜** | TCP | SCTP over DTLS over UDP |
| **암호화** | TLS (선택) | DTLS (의무) |
| **지연** | 서버 왕복 포함 | P2P이므로 최소 |
| **순서 보장** | 항상 보장 (TCP) | 선택 가능 |
| **신뢰성** | 항상 보장 (TCP) | 선택 가능 |
| **서버 비용** | 트래픽에 비례 | Signaling만 부담 |
| **NAT 통과** | 불필요 (서버 연결) | ICE/STUN/TURN 필요 |
| **최대 메시지 크기** | 프레임 분할 가능 | SCTP 분할 (약 256KB 권장) |
| **연결 수립** | HTTP Upgrade (빠름) | Signaling+ICE+DTLS (느림) |
| **다중 스트림** | 연결 별도 | 하나의 연결에 다중 채널 |

## 2.3 언제 어떤 것을 사용하는가

```
[선택 기준]

  WebSocket이 적합한 경우:
  ├── 서버가 중앙 허브 역할 (채팅방 관리, 인증)
  ├── 1:N 브로드캐스트
  ├── 서버 측 로직이 필요한 경우
  └── 빠른 연결 수립이 중요한 경우

  DataChannel이 적합한 경우:
  ├── 1:1 실시간 통신 (P2P)
  ├── 서버 부하를 줄여야 하는 경우
  ├── 초저지연이 필요한 경우 (게임, 원격 제어)
  ├── 비순서/비신뢰 전송이 유리한 경우 (센서 데이터)
  └── 이미 WebRTC 연결이 있는 경우 (미디어 + 데이터)
```

# 3. DataChannel 4가지 전송 모드

DataChannel의 가장 강력한 기능은 **채널별로 신뢰성과 순서를 독립 설정**할 수 있다는 점이다.

## 3.1 모드 정리

| 모드 | ordered | maxRetransmits | maxPacketLifeTime | 설명 |
|------|---------|----------------|-------------------|------|
| **Reliable Ordered** | true | null | null | TCP와 동일. 기본값 |
| **Reliable Unordered** | false | null | null | 신뢰성은 보장하지만 순서 무관 |
| **Partial Reliable (횟수)** | true/false | N | null | 최대 N번 재전송 후 포기 |
| **Partial Reliable (시간)** | true/false | null | T(ms) | T밀리초 동안만 재전송 시도 |

> `maxRetransmits`와 `maxPacketLifeTime`은 **동시에 설정할 수 없다**. 둘 다 null이면 무한 재전송(Reliable)이다.

## 3.2 모드별 사용 시나리오

```
[모드 선택 가이드]

  Reliable + Ordered (기본값)
  ├── 파일 전송
  ├── 텍스트 채팅
  └── 제어 명령 (순서가 중요한 경우)

  Reliable + Unordered
  ├── 채팅 메시지 (독립적 메시지)
  ├── 이벤트 알림
  └── 제어 명령 (순서 무관, 빠른 전달 우선)

  Partial Reliable + maxRetransmits
  ├── 게임 상태 동기화 (최신 상태만 중요)
  ├── 센서 데이터 (재전송 1~2회면 충분)
  └── 음성 메시지 (약간의 손실 허용)

  Partial Reliable + maxPacketLifeTime
  ├── 실시간 텔레메트리 (100ms 이내만 의미 있음)
  ├── 라이브 자막
  └── 위치 데이터 (오래된 위치는 필요 없음)
```

## 3.3 Golang/Pion에서 4가지 모드 생성

```go
// ① Reliable Ordered (기본값) - 파일 전송, 채팅
dcReliable, _ := pc.CreateDataChannel("reliable", nil)

// ② Reliable Unordered - 이벤트 알림
ordered := false
dcUnordered, _ := pc.CreateDataChannel("unordered", &webrtc.DataChannelInit{
    Ordered: &ordered,
})

// ③ Partial Reliable (최대 재전송 2회) - 게임 상태
maxRetransmits := uint16(2)
dcPartialRetransmit, _ := pc.CreateDataChannel("partial-retransmit", &webrtc.DataChannelInit{
    Ordered:        &ordered,
    MaxRetransmits: &maxRetransmits,
})

// ④ Partial Reliable (최대 500ms) - 텔레메트리
maxPacketLifeTime := uint16(500)
dcPartialTimed, _ := pc.CreateDataChannel("partial-timed", &webrtc.DataChannelInit{
    MaxPacketLifeTime: &maxPacketLifeTime,
})
```

## 3.4 JavaScript에서 4가지 모드 생성

```javascript
// ① Reliable Ordered (기본값)
const dcReliable = pc.createDataChannel("reliable");

// ② Reliable Unordered
const dcUnordered = pc.createDataChannel("unordered", {
  ordered: false
});

// ③ Partial Reliable (최대 재전송 2회)
const dcPartialRetransmit = pc.createDataChannel("partial-retransmit", {
  ordered: false,
  maxRetransmits: 2
});

// ④ Partial Reliable (최대 500ms)
const dcPartialTimed = pc.createDataChannel("partial-timed", {
  maxPacketLifeTime: 500
});
```

# 4. 실습 1: Ping/Pong RTT 측정

7편의 Echo 실습을 확장하여, DataChannel을 통한 **왕복 지연 시간(RTT)** 을 측정한다.

## 4.1 실습 구조

```
[Ping/Pong 흐름]

  브라우저                                Golang Server
     │                                       │
     │── ping { id: 1, ts: 1707300000 } ──>  │
     │                                       │  ts를 그대로 복사
     │<── pong { id: 1, ts: 1707300000 } ──  │
     │                                       │
     │  RTT = Date.now() - ts                │
     │  = 2ms                                │
```

## 4.2 메시지 프로토콜

```go
// 공통 메시지 포맷 (JSON)
type Message struct {
    Type string          `json:"type"`
    Data json.RawMessage `json:"data"`
}

// Ping/Pong 페이로드
type PingPong struct {
    ID        int   `json:"id"`
    Timestamp int64 `json:"ts"`
}
```

## 4.3 Golang 서버 (main.go)

```go
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v4"
)

// ──── 메시지 타입 ────

type SignalingMessage struct {
	Type          string  `json:"type"`
	SDP           string  `json:"sdp,omitempty"`
	Candidate     string  `json:"candidate,omitempty"`
	SDPMLineIndex *uint16 `json:"sdpMLineIndex,omitempty"`
	SDPMid        string  `json:"sdpMid,omitempty"`
}

type DCMessage struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data"`
}

type PingPong struct {
	ID        int   `json:"id"`
	Timestamp int64 `json:"ts"`
}

// ──── WebSocket 설정 ────

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func main() {
	http.Handle("/", http.FileServer(http.Dir("web")))
	http.HandleFunc("/ws", handleWebSocket)

	addr := ":8080"
	log.Printf("Server starting at http://localhost%s", addr)
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

	// PeerConnection 생성
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

	var wsMu sync.Mutex
	sendJSON := func(msg SignalingMessage) {
		wsMu.Lock()
		defer wsMu.Unlock()
		conn.WriteJSON(msg)
	}

	// ICE Candidate
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

	pc.OnConnectionStateChange(func(state webrtc.PeerConnectionState) {
		log.Printf("Connection state: %s", state.String())
	})

	// ──── DataChannel 수신 처리 ────
	pc.OnDataChannel(func(dc *webrtc.DataChannel) {
		log.Printf("DataChannel '%s' opened (ordered=%v)", dc.Label(), dc.Ordered())

		dc.OnOpen(func() {
			log.Printf("DataChannel '%s' ready", dc.Label())
		})

		dc.OnMessage(func(msg webrtc.DataChannelMessage) {
			var dcMsg DCMessage
			if err := json.Unmarshal(msg.Data, &dcMsg); err != nil {
				log.Printf("JSON parse error: %v", err)
				return
			}

			switch dcMsg.Type {
			case "ping":
				// Ping → Pong (타임스탬프 그대로 반환)
				var pp PingPong
				json.Unmarshal(dcMsg.Data, &pp)
				log.Printf("Ping received: id=%d", pp.ID)

				pongData, _ := json.Marshal(pp)
				reply, _ := json.Marshal(DCMessage{Type: "pong", Data: pongData})
				dc.SendText(string(reply))

			case "echo":
				// 단순 Echo
				var text string
				json.Unmarshal(dcMsg.Data, &text)
				log.Printf("Echo: %s", text)

				replyData, _ := json.Marshal(fmt.Sprintf("Echo: %s", text))
				reply, _ := json.Marshal(DCMessage{Type: "echo", Data: replyData})
				dc.SendText(string(reply))

			case "command":
				// 로봇 제어 명령
				handleRobotCommand(dc, dcMsg.Data)

			default:
				log.Printf("Unknown message type: %s", dcMsg.Type)
			}
		})
	})

	// ──── Signaling 루프 ────
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

// ──── 로봇 제어 명령 처리 ────

type RobotCommand struct {
	Action string             `json:"action"`
	Params map[string]float64 `json:"params,omitempty"`
}

type RobotResponse struct {
	Status    string `json:"status"`
	Action    string `json:"action"`
	Message   string `json:"message"`
	Timestamp int64  `json:"timestamp"`
}

func handleRobotCommand(dc *webrtc.DataChannel, data json.RawMessage) {
	var cmd RobotCommand
	if err := json.Unmarshal(data, &cmd); err != nil {
		log.Printf("Command parse error: %v", err)
		return
	}

	log.Printf("Robot command: action=%s params=%v", cmd.Action, cmd.Params)

	// 명령 실행 시뮬레이션
	var message string
	switch cmd.Action {
	case "move":
		speed := cmd.Params["speed"]
		direction := cmd.Params["direction"]
		message = fmt.Sprintf("Moving at speed=%.1f direction=%.0f°", speed, direction)
	case "rotate":
		angle := cmd.Params["angle"]
		message = fmt.Sprintf("Rotating %.0f°", angle)
	case "stop":
		message = "Stopped"
	case "grab":
		message = "Gripper activated"
	case "release":
		message = "Gripper released"
	default:
		message = fmt.Sprintf("Unknown action: %s", cmd.Action)
	}

	resp := RobotResponse{
		Status:    "ok",
		Action:    cmd.Action,
		Message:   message,
		Timestamp: time.Now().UnixMilli(),
	}

	respData, _ := json.Marshal(resp)
	reply, _ := json.Marshal(DCMessage{Type: "command-result", Data: respData})
	dc.SendText(string(reply))
}
```

## 4.4 코드 해설: 메시지 라우팅

서버는 모든 DataChannel 메시지를 **공통 JSON 포맷**으로 수신하고, `type` 필드로 라우팅한다.

```
[메시지 라우팅 구조]

  DataChannel.OnMessage
       │
       ├── type: "ping"     → PingPong 처리 (타임스탬프 반환)
       │
       ├── type: "echo"     → 단순 에코
       │
       ├── type: "command"  → 로봇 제어 명령 처리
       │
       └── type: (기타)      → 로그 출력
```

이 패턴의 장점은 **하나의 DataChannel로 여러 종류의 메시지를 처리**할 수 있다는 점이다. 물론 용도별로 채널을 분리하는 방법도 있다. 두 접근의 차이는 다음과 같다.

```
[접근 1: 단일 채널 + type 필드 라우팅]
  DataChannel "main"
  ├── { type: "ping", data: {...} }
  ├── { type: "echo", data: "hello" }
  └── { type: "command", data: {...} }

  장점: 채널 관리 단순
  단점: 모든 메시지가 같은 순서/신뢰성 설정

[접근 2: 용도별 채널 분리]
  DataChannel "control"   (ordered, reliable)
  DataChannel "telemetry" (unordered, maxPacketLifeTime=100)
  DataChannel "chat"      (ordered, reliable)

  장점: 채널별 최적 전송 모드
  단점: 채널 수 관리 필요
```

# 5. 브라우저 클라이언트 구현

## 5.1 전체 코드 (web/index.html)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>WebRTC DataChannel Lab</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: monospace; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    h1 { margin-bottom: 8px; font-size: 1.4em; }
    h2 { margin-top: 24px; margin-bottom: 8px; font-size: 1.1em; color: #555; }

    .status {
      padding: 8px 12px; border-radius: 4px;
      margin-bottom: 16px; font-size: 0.9em;
    }
    .status.connecting { background: #fff3cd; }
    .status.connected { background: #d4edda; }
    .status.failed { background: #f8d7da; }

    .section { margin-bottom: 16px; padding: 12px; border: 1px solid #ddd; border-radius: 4px; }

    .controls { display: flex; gap: 8px; margin-bottom: 8px; }
    .controls input {
      flex: 1; padding: 8px; border: 1px solid #ccc;
      border-radius: 4px; font-family: monospace;
    }
    button {
      padding: 8px 16px; border: none; border-radius: 4px;
      cursor: pointer; font-family: monospace; color: white;
    }
    button:disabled { background: #ccc !important; cursor: not-allowed; }
    .btn-blue { background: #007bff; }
    .btn-green { background: #28a745; }
    .btn-orange { background: #fd7e14; }
    .btn-red { background: #dc3545; }

    .rtt-display {
      font-size: 2em; font-weight: bold; text-align: center;
      padding: 16px; background: #f8f9fa; border-radius: 4px;
      margin-bottom: 8px;
    }
    .rtt-stats { font-size: 0.85em; color: #666; text-align: center; }

    .robot-controls { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .robot-controls button { padding: 12px; font-size: 1em; }

    #log {
      background: #1e1e1e; color: #d4d4d4; padding: 16px;
      border-radius: 4px; height: 300px; overflow-y: auto;
      font-size: 0.85em; line-height: 1.6;
    }
    .log-send { color: #569cd6; }
    .log-recv { color: #4ec9b0; }
    .log-info { color: #9cdcfe; }
    .log-error { color: #f44747; }
    .log-rtt { color: #dcdcaa; }
  </style>
</head>
<body>
  <h1>WebRTC DataChannel Lab</h1>
  <div id="status" class="status connecting">Disconnected</div>

  <div class="controls">
    <button id="connectBtn" class="btn-blue" onclick="connect()">Connect</button>
  </div>

  <!-- Ping/Pong 섹션 -->
  <h2>1. Ping/Pong RTT</h2>
  <div class="section">
    <div class="rtt-display" id="rttDisplay">- ms</div>
    <div class="rtt-stats" id="rttStats">min: - / avg: - / max: - (0 samples)</div>
    <div class="controls">
      <button class="btn-orange" onclick="sendPing()" disabled id="pingBtn">Ping</button>
      <button class="btn-orange" onclick="startPingLoop()" disabled id="pingLoopBtn">Auto Ping (1s)</button>
      <button class="btn-red" onclick="stopPingLoop()" disabled id="pingStopBtn">Stop</button>
    </div>
  </div>

  <!-- Echo 섹션 -->
  <h2>2. JSON Echo</h2>
  <div class="section">
    <div class="controls">
      <input id="msgInput" type="text" placeholder="메시지 입력..." disabled
             onkeydown="if(event.key==='Enter') sendEcho()">
      <button class="btn-green" onclick="sendEcho()" disabled id="sendBtn">Send</button>
    </div>
  </div>

  <!-- 로봇 제어 섹션 -->
  <h2>3. Robot Control</h2>
  <div class="section">
    <div class="robot-controls">
      <button class="btn-blue" onclick="sendCommand('rotate', {angle: -90})" disabled>↶ Left</button>
      <button class="btn-blue" onclick="sendCommand('move', {speed: 1.0, direction: 0})" disabled>↑ Forward</button>
      <button class="btn-blue" onclick="sendCommand('rotate', {angle: 90})" disabled>↷ Right</button>
      <button class="btn-blue" onclick="sendCommand('grab')" disabled>✊ Grab</button>
      <button class="btn-red" onclick="sendCommand('stop')" disabled>⏹ Stop</button>
      <button class="btn-blue" onclick="sendCommand('release')" disabled>✋ Release</button>
    </div>
    <div class="controls" style="margin-top: 8px;">
      <label style="display: flex; align-items: center; gap: 4px; font-size: 0.85em;">
        Speed:
        <input type="range" id="speedSlider" min="0.1" max="3.0" step="0.1" value="1.0" style="flex:1">
        <span id="speedValue">1.0</span>
      </label>
    </div>
  </div>

  <!-- 로그 -->
  <h2>Log</h2>
  <div id="log"></div>

  <script>
    let pc = null, dc = null, ws = null;
    let pingId = 0, pingInterval = null;
    let rttSamples = [];

    // ──── 유틸 ────
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

    function enableControls(enabled) {
      document.querySelectorAll('button:not(#connectBtn)').forEach(b => b.disabled = !enabled);
      document.getElementById('msgInput').disabled = !enabled;
      if (enabled) document.getElementById('pingStopBtn').disabled = true;
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
        enableControls(false);
      };
    }

    async function startWebRTC() {
      pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

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
          setStatus('Connected (P2P)', 'connected');
        }
      };

      // DataChannel 생성
      dc = pc.createDataChannel('main');

      dc.onopen = () => {
        appendLog('DataChannel opened', 'log-info');
        enableControls(true);
        document.getElementById('msgInput').focus();
      };

      dc.onmessage = (e) => handleDCMessage(JSON.parse(e.data));

      dc.onclose = () => {
        appendLog('DataChannel closed', 'log-info');
        enableControls(false);
      };

      // Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      ws.send(JSON.stringify({ type: 'offer', sdp: pc.localDescription.sdp }));
      appendLog('Offer sent', 'log-info');
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

    // ──── DataChannel 메시지 수신 ────
    function handleDCMessage(msg) {
      switch (msg.type) {
        case 'pong':
          handlePong(msg.data);
          break;
        case 'echo':
          appendLog(`← ${msg.data}`, 'log-recv');
          break;
        case 'command-result':
          handleCommandResult(msg.data);
          break;
        default:
          appendLog(`← Unknown: ${JSON.stringify(msg)}`, 'log-recv');
      }
    }

    // ──── 1. Ping/Pong ────
    function sendPing() {
      if (!dc || dc.readyState !== 'open') return;

      pingId++;
      const payload = { id: pingId, ts: Date.now() };
      const msg = JSON.stringify({ type: 'ping', data: payload });
      dc.send(msg);
      appendLog(`→ Ping #${pingId}`, 'log-send');
    }

    function handlePong(data) {
      const rtt = Date.now() - data.ts;
      rttSamples.push(rtt);

      // 최근 100개만 유지
      if (rttSamples.length > 100) rttSamples.shift();

      const min = Math.min(...rttSamples);
      const max = Math.max(...rttSamples);
      const avg = (rttSamples.reduce((a, b) => a + b, 0) / rttSamples.length).toFixed(1);

      document.getElementById('rttDisplay').textContent = `${rtt} ms`;
      document.getElementById('rttStats').textContent =
        `min: ${min}ms / avg: ${avg}ms / max: ${max}ms (${rttSamples.length} samples)`;
      appendLog(`← Pong #${data.id} RTT=${rtt}ms`, 'log-rtt');
    }

    function startPingLoop() {
      if (pingInterval) return;
      document.getElementById('pingLoopBtn').disabled = true;
      document.getElementById('pingStopBtn').disabled = false;
      pingInterval = setInterval(sendPing, 1000);
      sendPing();
      appendLog('Auto ping started (1s interval)', 'log-info');
    }

    function stopPingLoop() {
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }
      document.getElementById('pingLoopBtn').disabled = false;
      document.getElementById('pingStopBtn').disabled = true;
      appendLog('Auto ping stopped', 'log-info');
    }

    // ──── 2. JSON Echo ────
    function sendEcho() {
      const input = document.getElementById('msgInput');
      const text = input.value.trim();
      if (!text || !dc || dc.readyState !== 'open') return;

      const msg = JSON.stringify({ type: 'echo', data: text });
      dc.send(msg);
      appendLog(`→ ${text}`, 'log-send');
      input.value = '';
    }

    // ──── 3. 로봇 제어 ────
    function sendCommand(action, params) {
      if (!dc || dc.readyState !== 'open') return;

      // Speed 슬라이더 값 반영
      if (action === 'move') {
        params = params || {};
        params.speed = parseFloat(document.getElementById('speedSlider').value);
      }

      const cmd = { action, params: params || {} };
      const msg = JSON.stringify({ type: 'command', data: cmd });
      dc.send(msg);
      appendLog(`→ Command: ${action} ${JSON.stringify(params || {})}`, 'log-send');
    }

    function handleCommandResult(data) {
      appendLog(`← [${data.status}] ${data.action}: ${data.message}`, 'log-recv');
    }

    // Speed 슬라이더 값 표시
    document.getElementById('speedSlider').addEventListener('input', (e) => {
      document.getElementById('speedValue').textContent = e.target.value;
    });
  </script>
</body>
</html>
```

## 5.2 UI 구성

```
[브라우저 화면 구성]

  ┌─────────────────────────────────────────┐
  │  WebRTC DataChannel Lab                 │
  │  ┌─────────────────────────────────┐    │
  │  │  Connected (P2P)                │    │ ← 연결 상태
  │  └─────────────────────────────────┘    │
  │  [Connect]                              │
  │                                         │
  │  1. Ping/Pong RTT                       │
  │  ┌─────────────────────────────────┐    │
  │  │          2 ms                   │    │ ← 실시간 RTT
  │  │  min: 1ms / avg: 2ms / max: 5ms│    │ ← 통계
  │  │  [Ping] [Auto Ping] [Stop]     │    │
  │  └─────────────────────────────────┘    │
  │                                         │
  │  2. JSON Echo                           │
  │  ┌─────────────────────────────────┐    │
  │  │  [메시지 입력...         ] [Send]│    │
  │  └─────────────────────────────────┘    │
  │                                         │
  │  3. Robot Control                       │
  │  ┌─────────────────────────────────┐    │
  │  │  [↶ Left] [↑ Forward] [↷ Right]│    │ ← 방향 제어
  │  │  [✊ Grab] [⏹ Stop] [✋ Release]│    │ ← 동작 제어
  │  │  Speed: ═══════●═══ 1.0        │    │ ← 속도 슬라이더
  │  └─────────────────────────────────┘    │
  │                                         │
  │  Log                                    │
  │  ┌─────────────────────────────────┐    │
  │  │ [12:00:01] Offer sent           │    │
  │  │ [12:00:01] Answer received      │    │
  │  │ [12:00:01] DataChannel opened   │    │
  │  │ [12:00:02] → Ping #1           │    │
  │  │ [12:00:02] ← Pong #1 RTT=2ms   │    │
  │  └─────────────────────────────────┘    │
  └─────────────────────────────────────────┘
```

# 6. 실습 2: JSON 메시지 교환 상세

## 6.1 메시지 프로토콜 설계

실전에서는 단순 문자열이 아니라 **구조화된 JSON 메시지**를 교환한다. 이 실습에서 사용하는 프로토콜의 구조는 다음과 같다.

```
[메시지 프로토콜]

  모든 메시지:
  {
    "type": "<메시지 타입>",
    "data": <타입별 페이로드>
  }

  type 목록:
  ┌──────────────────┬────────────┬──────────────────────┐
  │ type             │ 방향       │ data 형식             │
  ├──────────────────┼────────────┼──────────────────────┤
  │ "ping"           │ → 서버     │ { id, ts }           │
  │ "pong"           │ ← 서버     │ { id, ts }           │
  │ "echo"           │ → 서버     │ "텍스트"              │
  │ "echo"           │ ← 서버     │ "Echo: 텍스트"        │
  │ "command"        │ → 서버     │ { action, params }   │
  │ "command-result" │ ← 서버     │ { status, action,    │
  │                  │            │   message, timestamp }│
  └──────────────────┴────────────┴──────────────────────┘
```

## 6.2 타입 안전한 메시지 처리 (Golang)

Go에서 `json.RawMessage`를 사용하면 **먼저 type을 확인한 뒤, 적절한 구조체로 파싱**할 수 있다.

```go
type DCMessage struct {
    Type string          `json:"type"`
    Data json.RawMessage `json:"data"`  // 지연 파싱
}

// 수신 시
var dcMsg DCMessage
json.Unmarshal(msg.Data, &dcMsg)

switch dcMsg.Type {
case "ping":
    var pp PingPong
    json.Unmarshal(dcMsg.Data, &pp)  // 이 시점에 구체적 타입으로 파싱
    // ...
case "command":
    var cmd RobotCommand
    json.Unmarshal(dcMsg.Data, &cmd)
    // ...
}
```

`json.RawMessage`는 **바이트 슬라이스를 그대로 보관**하므로, 불필요한 파싱을 피하고 type에 따라 적절한 구조체로 지연 파싱할 수 있다.

## 6.3 타입 안전한 메시지 처리 (JavaScript)

```javascript
// 송신 헬퍼
function sendDCMessage(type, data) {
  if (!dc || dc.readyState !== 'open') return;
  dc.send(JSON.stringify({ type, data }));
}

// 수신 라우터
function handleDCMessage(msg) {
  const handlers = {
    'pong': handlePong,
    'echo': (data) => appendLog(`← ${data}`, 'log-recv'),
    'command-result': handleCommandResult,
  };

  const handler = handlers[msg.type];
  if (handler) {
    handler(msg.data);
  } else {
    appendLog(`← Unknown: ${JSON.stringify(msg)}`, 'log-recv');
  }
}
```

# 7. 실습 3: 로봇 제어 명령 전달

## 7.1 로봇 제어가 DataChannel에 적합한 이유

```
[로봇 원격 제어 요구사항]

  ┌─────────────────┬──────────────┬──────────────┐
  │ 요구사항         │ WebSocket    │ DataChannel  │
  ├─────────────────┼──────────────┼──────────────┤
  │ 제어 지연       │ 서버 경유     │ P2P 직접 ✅  │
  │ 센서 데이터     │ TCP 순서대기  │ 비순서 가능 ✅│
  │ 명령 신뢰성     │ 항상 보장     │ 선택 가능 ✅  │
  │ 카메라 영상     │ 별도 연결     │ 같은 연결 ✅  │
  │ 네트워크 비용   │ 서버 비용     │ P2P ✅       │
  └─────────────────┴──────────────┴──────────────┘
```

WebRTC의 진짜 장점은 **하나의 PeerConnection에서 제어 명령(DataChannel)과 카메라 영상(MediaTrack)을 동시에 처리**할 수 있다는 점이다.

## 7.2 명령 프로토콜

```
[로봇 제어 명령]

  → 브라우저에서 서버로:
  {
    "type": "command",
    "data": {
      "action": "move",          // 동작 종류
      "params": {                // 동작 파라미터
        "speed": 1.5,
        "direction": 0           // 0°=전진, 90°=우회전
      }
    }
  }

  ← 서버에서 브라우저로:
  {
    "type": "command-result",
    "data": {
      "status": "ok",
      "action": "move",
      "message": "Moving at speed=1.5 direction=0°",
      "timestamp": 1707300000000
    }
  }

  지원 명령:
  ├── move     { speed, direction }  전진/후진/방향 이동
  ├── rotate   { angle }             회전 (양수=시계, 음수=반시계)
  ├── stop     {}                    정지
  ├── grab     {}                    그리퍼 잡기
  └── release  {}                    그리퍼 놓기
```

## 7.3 실전 확장: 다중 채널 로봇 제어

실제 로봇 제어 시스템에서는 데이터 특성에 따라 **채널을 분리**하는 것이 효과적이다.

```go
// 실전 로봇 제어 - 다중 DataChannel 구성

// 제어 명령 채널 (순서 보장, 신뢰성 보장)
// - 이동, 정지, 그리퍼 등 명령은 순서와 전달이 보장되어야 함
controlDC, _ := pc.CreateDataChannel("control", nil)

// 텔레메트리 채널 (순서 무관, 최대 100ms)
// - 위치, 배터리, 센서값 등 최신 데이터만 의미 있음
ordered := false
maxLifeTime := uint16(100)
telemetryDC, _ := pc.CreateDataChannel("telemetry", &webrtc.DataChannelInit{
    Ordered:           &ordered,
    MaxPacketLifeTime: &maxLifeTime,
})

// 로그 채널 (순서 보장, 최대 재전송 3회)
// - 디버그 로그는 대부분 전달되면 좋지만 완벽할 필요 없음
maxRetransmits := uint16(3)
logDC, _ := pc.CreateDataChannel("log", &webrtc.DataChannelInit{
    MaxRetransmits: &maxRetransmits,
})
```

```
[다중 채널 로봇 제어 아키텍처]

  브라우저 (조종기)                            Golang (로봇)
  ┌──────────────────┐                     ┌──────────────────┐
  │                  │                     │                  │
  │  조이스틱 입력    │─── control ────────>│  모터 제어        │
  │  (move, rotate)  │  (reliable/ordered) │                  │
  │                  │                     │                  │
  │  대시보드 표시    │<── telemetry ───────│  센서 데이터      │
  │  (위치, 배터리)   │  (unreliable/100ms) │  (50Hz 전송)     │
  │                  │                     │                  │
  │  카메라 영상 ◄════╪═══ Video Track ════╪══ 카메라         │
  │                  │                     │                  │
  │  로그 뷰어       │<── log ─────────────│  디버그 로그      │
  │                  │  (maxRetransmits=3) │                  │
  └──────────────────┘                     └──────────────────┘
```

# 8. 바이너리 데이터 전송

## 8.1 텍스트 vs 바이너리

DataChannel은 텍스트(PPID=51)와 바이너리(PPID=53) 두 가지 형식을 지원한다.

```
[텍스트 전송]
  Go:     dc.SendText("hello")        → PPID=51
  JS:     dc.send("hello")            → PPID=51
  수신:   msg.IsString == true (Go)
          typeof event.data === 'string' (JS)

[바이너리 전송]
  Go:     dc.Send([]byte{0x01, 0x02}) → PPID=53
  JS:     dc.send(new ArrayBuffer(2)) → PPID=53
  수신:   msg.IsString == false (Go)
          event.data instanceof ArrayBuffer (JS)
```

## 8.2 Golang에서 바이너리 전송

```go
dc.OnMessage(func(msg webrtc.DataChannelMessage) {
    if msg.IsString {
        // 텍스트 메시지
        log.Printf("Text: %s", string(msg.Data))
    } else {
        // 바이너리 메시지
        log.Printf("Binary: %d bytes", len(msg.Data))
        // 바이너리 처리 (예: 이미지, protobuf, 센서 데이터)
    }
})

// 바이너리 전송
data := []byte{0x01, 0x02, 0x03, 0x04}
dc.Send(data)
```

## 8.3 JavaScript에서 바이너리 수신

```javascript
dc.binaryType = 'arraybuffer';  // 기본값

dc.onmessage = (event) => {
  if (typeof event.data === 'string') {
    // 텍스트 메시지
    console.log('Text:', event.data);
  } else {
    // ArrayBuffer (바이너리)
    const bytes = new Uint8Array(event.data);
    console.log('Binary:', bytes.length, 'bytes');
  }
};

// 바이너리 전송
const buffer = new ArrayBuffer(4);
const view = new Uint8Array(buffer);
view.set([0x01, 0x02, 0x03, 0x04]);
dc.send(buffer);
```

# 9. 흐름 제어 (Backpressure)

대량 데이터를 전송할 때 **송신 속도가 네트워크 대역폭을 초과**하면 버퍼가 누적된다. `bufferedAmount`와 `bufferedAmountLowThreshold`로 흐름을 제어한다.

## 9.1 문제 상황

```
[흐름 제어 없이 대량 전송]

  송신 측                                  네트워크
  ┌──────────────────┐
  │ send(data)       │──────>  ████████████████  ← 버퍼 누적
  │ send(data)       │──────>  ████████████████████
  │ send(data)       │──────>  ████████████████████████
  │ ...              │         ↑
  │                  │    버퍼 초과 → 에러 또는 메모리 폭주
  └──────────────────┘
```

## 9.2 Golang에서 흐름 제어

```go
const maxBufferedAmount = 1024 * 1024 // 1MB

dc.SetBufferedAmountLowThreshold(256 * 1024) // 256KB 이하면 알림

sendCh := make(chan []byte, 100)
canSend := make(chan struct{}, 1)

dc.OnBufferedAmountLow(func() {
    // 버퍼가 임계값 이하로 내려가면 전송 재개
    select {
    case canSend <- struct{}{}:
    default:
    }
})

// 전송 고루틴
go func() {
    for data := range sendCh {
        // 버퍼가 가득 차면 대기
        if dc.BufferedAmount() > maxBufferedAmount {
            <-canSend
        }
        dc.Send(data)
    }
}()
```

## 9.3 JavaScript에서 흐름 제어

```javascript
const MAX_BUFFERED = 1024 * 1024; // 1MB
const LOW_THRESHOLD = 256 * 1024;  // 256KB

dc.bufferedAmountLowThreshold = LOW_THRESHOLD;

let sendQueue = [];
let sending = false;

dc.onbufferedamountlow = () => {
  drainQueue();
};

function sendLargeData(data) {
  if (dc.bufferedAmount > MAX_BUFFERED) {
    // 큐에 저장하고 나중에 전송
    sendQueue.push(data);
    return;
  }
  dc.send(data);
}

function drainQueue() {
  while (sendQueue.length > 0 && dc.bufferedAmount <= MAX_BUFFERED) {
    dc.send(sendQueue.shift());
  }
}
```

# 10. 실행 및 테스트

## 10.1 프로젝트 구조

```
webrtc-datachannel-lab/
├── main.go              # Golang 서버 (Signaling + WebRTC 피어)
├── web/
│   └── index.html       # 브라우저 클라이언트
├── go.mod
└── go.sum
```

## 10.2 실행

```bash
mkdir webrtc-datachannel-lab && cd webrtc-datachannel-lab
mkdir web

go mod init webrtc-datachannel-lab
go get github.com/pion/webrtc/v4
go get github.com/gorilla/websocket

# main.go, web/index.html 생성 (위 코드 참조)

go run main.go
# Server starting at http://localhost:8080
```

## 10.3 테스트 시나리오

### 10.3.1 Ping/Pong 테스트

1. Connect → DataChannel 열림 확인
2. **Ping** 클릭 → 단일 RTT 측정
3. **Auto Ping** 클릭 → 1초 간격 자동 측정
4. min/avg/max 통계 확인
5. **Stop**으로 중단

### 10.3.2 JSON Echo 테스트

1. 텍스트 입력 후 Send
2. 서버에서 `Echo: ` 접두사가 붙은 응답 확인
3. 한글, 특수문자, 긴 문자열 테스트

### 10.3.3 로봇 제어 테스트

1. **Forward** → 전진 명령 전송, 서버 응답 확인
2. **Speed** 슬라이더 조절 → 속도 변경 확인
3. **Grab** / **Release** → 그리퍼 명령 확인
4. **Stop** → 정지 명령 확인

## 10.4 예상 로그

```
[12:00:01] WebSocket connected
[12:00:01] Offer sent
[12:00:01] Answer received
[12:00:01] Connection: connected
[12:00:01] DataChannel opened
[12:00:03] → Ping #1
[12:00:03] ← Pong #1 RTT=2ms
[12:00:05] → Hello DataChannel!
[12:00:05] ← Echo: Hello DataChannel!
[12:00:07] → Command: move {"speed":1.5,"direction":0}
[12:00:07] ← [ok] move: Moving at speed=1.5 direction=0°
[12:00:08] → Command: stop {}
[12:00:08] ← [ok] stop: Stopped
```

# 11. DataChannel API 정리

## 11.1 Pion (Golang) API

| 메서드/속성 | 설명 |
|------------|------|
| `CreateDataChannel(label, opts)` | 채널 생성 |
| `OnDataChannel(func)` | 원격에서 생성된 채널 수신 |
| `dc.Send([]byte)` | 바이너리 전송 |
| `dc.SendText(string)` | 텍스트 전송 |
| `dc.OnOpen(func)` | 채널 열림 이벤트 |
| `dc.OnMessage(func)` | 메시지 수신 이벤트 |
| `dc.OnClose(func)` | 채널 닫힘 이벤트 |
| `dc.Close()` | 채널 닫기 |
| `dc.Label()` | 채널 이름 |
| `dc.ID()` | 채널 ID (SCTP 스트림 ID) |
| `dc.Ordered()` | 순서 보장 여부 |
| `dc.MaxRetransmits()` | 최대 재전송 횟수 |
| `dc.MaxPacketLifeTime()` | 최대 패킷 생존 시간 (ms) |
| `dc.ReadyState()` | 채널 상태 |
| `dc.BufferedAmount()` | 버퍼에 쌓인 바이트 수 |
| `dc.SetBufferedAmountLowThreshold(n)` | 낮은 버퍼 임계값 설정 |
| `dc.OnBufferedAmountLow(func)` | 버퍼가 임계값 이하일 때 |

## 11.2 브라우저 (JavaScript) API

| 메서드/속성 | 설명 |
|------------|------|
| `pc.createDataChannel(label, opts)` | 채널 생성 |
| `pc.ondatachannel` | 원격에서 생성된 채널 수신 |
| `dc.send(data)` | 텍스트 또는 바이너리 전송 |
| `dc.close()` | 채널 닫기 |
| `dc.onopen` | 채널 열림 이벤트 |
| `dc.onmessage` | 메시지 수신 이벤트 |
| `dc.onclose` | 채널 닫힘 이벤트 |
| `dc.onerror` | 에러 이벤트 |
| `dc.label` | 채널 이름 (읽기 전용) |
| `dc.id` | 채널 ID (읽기 전용) |
| `dc.ordered` | 순서 보장 여부 (읽기 전용) |
| `dc.maxRetransmits` | 최대 재전송 횟수 (읽기 전용) |
| `dc.maxPacketLifeTime` | 최대 패킷 생존 시간 (읽기 전용) |
| `dc.readyState` | 채널 상태 (읽기 전용) |
| `dc.bufferedAmount` | 버퍼에 쌓인 바이트 수 (읽기 전용) |
| `dc.bufferedAmountLowThreshold` | 낮은 버퍼 임계값 (읽기/쓰기) |
| `dc.binaryType` | 바이너리 수신 형식 (읽기/쓰기) |
| `dc.onbufferedamountlow` | 버퍼가 임계값 이하일 때 |

# 12. 정리

이번 편에서 다룬 내용을 요약한다.

| 주제 | 핵심 내용 |
|------|----------|
| **프로토콜 스택** | DataChannel = SCTP over DTLS over ICE/UDP |
| **SCTP** | 다중 스트림, 채널별 독립 신뢰성/순서, HOL 차단 방지 |
| **DCEP** | 채널 라벨과 옵션을 협상하는 경량 프로토콜 |
| **전송 모드** | Reliable Ordered, Reliable Unordered, Partial (횟수), Partial (시간) |
| **vs WebSocket** | P2P 직접 통신, 의무 암호화, 전송 모드 선택 가능 |
| **메시지 설계** | type + data 공통 포맷, json.RawMessage 지연 파싱 |
| **실습 1** | Ping/Pong RTT 측정 (min/avg/max 통계) |
| **실습 2** | JSON 메시지 프로토콜 설계 및 라우팅 |
| **실습 3** | 로봇 제어 명령 전달 (move, rotate, stop, grab, release) |
| **바이너리** | SendText (PPID=51) vs Send (PPID=53), binaryType |
| **흐름 제어** | bufferedAmount + bufferedAmountLowThreshold |

```
[이 시리즈의 현재 위치]

  ✅ 1편: 개요
  ✅ 2편: 전체 구조
  ✅ 3편: 핵심 개념 (SDP, ICE, STUN, TURN)
  ✅ 4편: 연결 흐름 Step-by-Step
  ✅ 5편: Signaling Server (Golang)
  ✅ 6편: Pion WebRTC 라이브러리
  ✅ 7편: 첫 연결 실습
  ✅ 8편: DataChannel 심화 (이 글) ← 지금 여기
  ☐ 9편: Media 스트림
  ☐ 10편~: 트러블슈팅, 확장, 보안, 기술 선택
```

다음 편에서는 **Media 스트림**을 다룬다. Golang에서 Video Track을 생성하여 브라우저로 전송하고, RTP/RTCP를 통한 미디어 통신을 실습한다.

## 참고 자료

- [WebRTC for the Curious - Data Communication](https://webrtcforthecurious.com/ko/docs/07-data-communication/)
- [Pion WebRTC DataChannel API](https://pkg.go.dev/github.com/pion/webrtc/v4#DataChannel)
- [MDN - RTCDataChannel](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel)
- [RFC 4960 - SCTP](https://tools.ietf.org/html/rfc4960)
- [RFC 8832 - DCEP](https://tools.ietf.org/html/rfc8832)
- [Pion DataChannel 예제](https://github.com/pion/webrtc/tree/master/examples/data-channels)
