---
title: "WebRTC 완벽 가이드 (7): 실습 - 브라우저 ↔ Golang 첫 WebRTC 연결"
description: "브라우저(Offerer)와 Golang/Pion(Answerer) 간 WebRTC 연결을 처음부터 구현합니다. WebSocket Signaling, SDP 교환, ICE Candidate 처리, DataChannel 통신까지 동작하는 전체 코드를 다룹니다."
date: 2026-02-07
update: 2026-02-07
tags:
  - WebRTC
  - Pion
  - Golang
  - Signaling
  - DataChannel
  - 실습
series: "WebRTC 완벽 가이드"
---

6편까지 WebRTC의 개념과 Pion 라이브러리를 다루었다. 이번 편에서는 5편의 Signaling 서버와 6편의 Pion 지식을 결합하여, **브라우저와 Golang 피어 간 실제 WebRTC 연결을 처음부터 구현**한다.

시나리오는 가장 단순한 형태이다: 브라우저가 Offer를 보내고, Golang 서버가 Answer를 반환하여 DataChannel로 메시지를 주고받는다.

# 1. 실습 목표와 구조

## 1.1 무엇을 만드는가

브라우저에서 텍스트를 입력하면 Golang 서버가 에코(echo)를 돌려주는 WebRTC DataChannel 기반 통신이다.

```
[실습 시나리오]

  브라우저 (Offerer)                         Golang (Answerer)
  ┌──────────────────┐                     ┌──────────────────┐
  │                  │                     │                  │
  │  [텍스트 입력]    │ ── DataChannel ──>  │  수신 + Echo 처리 │
  │                  │                     │                  │
  │  [Echo 표시]     │ <── DataChannel ──  │  "Echo: " + 원문  │
  │                  │                     │                  │
  └──────────────────┘                     └──────────────────┘
         │                                         │
         │            WebSocket Signaling           │
         └─────────────────┬───────────────────────┘
                           │
                    ┌──────┴──────┐
                    │  Golang     │
                    │  HTTP +     │
                    │  WebSocket  │
                    │  Server     │
                    └─────────────┘
```

## 1.2 이 실습에서 미디어(영상/음성)를 사용하지 않는 이유

첫 연결 실습에서 가장 중요한 것은 **Signaling → ICE → DTLS → 연결 완료**라는 흐름을 체험하는 것이다. 미디어를 추가하면 코덱, 카메라 권한, 인코딩 등 부가 복잡도가 늘어난다. DataChannel만으로 연결 흐름을 깔끔하게 확인한 뒤, 8편과 9편에서 DataChannel 심화와 미디어를 다룬다.

## 1.3 프로젝트 구조

```
webrtc-first-connection/
├── main.go              # Golang 서버 (Signaling + WebRTC 피어)
├── web/
│   └── index.html       # 브라우저 클라이언트 (HTML + JS)
├── go.mod
└── go.sum
```

이번 실습에서는 **Signaling 서버와 WebRTC 피어를 하나의 Golang 프로세스**에 합친다. 5편에서는 Signaling 서버를 독립적으로 구현했지만, 첫 실습에서는 구조를 단순화하기 위해 합친다.

```
[5편 구조 vs 이번 실습 구조]

  5편: Signaling만 담당              이번 실습: Signaling + WebRTC 피어
  ┌───────────────┐                 ┌───────────────────────────┐
  │  Signaling    │                 │  Golang Server            │
  │  Server       │                 │  ├── Signaling (WebSocket)│
  │  (메시지 중계만)│                 │  └── WebRTC Peer (Pion)   │
  └───────────────┘                 └───────────────────────────┘
       │      │                              │
  Peer A    Peer B                      브라우저 (Peer)
  (브라우저) (브라우저)
```

# 2. Signaling 메시지 프로토콜

브라우저와 Golang 서버 간 WebSocket으로 교환하는 메시지를 정의한다.

```go
// 메시지 타입
const (
    TypeOffer     = "offer"
    TypeAnswer    = "answer"
    TypeCandidate = "candidate"
)
```

```json
// Offer (브라우저 → 서버)
{ "type": "offer", "sdp": "v=0\r\no=- ..." }

// Answer (서버 → 브라우저)
{ "type": "answer", "sdp": "v=0\r\no=- ..." }

// ICE Candidate (양방향)
{ "type": "candidate", "candidate": "candidate:..." , "sdpMLineIndex": 0, "sdpMid": "0" }
```

# 3. Golang 서버 구현

## 3.1 전체 코드 (main.go)

```go
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v4"
)

// ──── 메시지 타입 ────

type SignalingMessage struct {
	Type          string `json:"type"`
	SDP           string `json:"sdp,omitempty"`
	Candidate     string `json:"candidate,omitempty"`
	SDPMLineIndex *uint16 `json:"sdpMLineIndex,omitempty"`
	SDPMid        string `json:"sdpMid,omitempty"`
}

// ──── WebSocket 설정 ────

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func main() {
	// 정적 파일 서빙 (index.html)
	http.Handle("/", http.FileServer(http.Dir("web")))

	// WebSocket Signaling 엔드포인트
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

	// WebSocket 쓰기 동시성 보호
	var wsMu sync.Mutex
	sendJSON := func(msg SignalingMessage) {
		wsMu.Lock()
		defer wsMu.Unlock()
		if err := conn.WriteJSON(msg); err != nil {
			log.Printf("WebSocket send error: %v", err)
		}
	}

	// ──── 2. ICE Candidate 콜백 ────
	pc.OnICECandidate(func(c *webrtc.ICECandidate) {
		if c == nil {
			return
		}
		candidateJSON := c.ToJSON()
		sendJSON(SignalingMessage{
			Type:          "candidate",
			Candidate:     candidateJSON.Candidate,
			SDPMLineIndex: candidateJSON.SDPMLineIndex,
			SDPMid:        *candidateJSON.SDPMid,
		})
		log.Printf("ICE candidate sent: %s", c.Typ.String())
	})

	// ──── 3. 연결 상태 모니터링 ────
	pc.OnConnectionStateChange(func(state webrtc.PeerConnectionState) {
		log.Printf("Connection state: %s", state.String())
		if state == webrtc.PeerConnectionStateFailed {
			pc.Close()
		}
	})

	pc.OnICEConnectionStateChange(func(state webrtc.ICEConnectionState) {
		log.Printf("ICE connection state: %s", state.String())
	})

	// ──── 4. DataChannel 수신 처리 ────
	pc.OnDataChannel(func(dc *webrtc.DataChannel) {
		log.Printf("DataChannel received: label='%s'", dc.Label())

		dc.OnOpen(func() {
			log.Printf("DataChannel '%s' opened", dc.Label())
			dc.SendText("Connected to Go server!")
		})

		dc.OnMessage(func(msg webrtc.DataChannelMessage) {
			text := string(msg.Data)
			log.Printf("Received: %s", text)

			// Echo 응답
			reply := fmt.Sprintf("Echo: %s", text)
			if err := dc.SendText(reply); err != nil {
				log.Printf("Send error: %v", err)
			}
		})

		dc.OnClose(func() {
			log.Printf("DataChannel '%s' closed", dc.Label())
		})
	})

	// ──── 5. Signaling 메시지 처리 루프 ────
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

			// Remote Description 설정
			err := pc.SetRemoteDescription(webrtc.SessionDescription{
				Type: webrtc.SDPTypeOffer,
				SDP:  msg.SDP,
			})
			if err != nil {
				log.Printf("SetRemoteDescription error: %v", err)
				continue
			}

			// Answer 생성
			answer, err := pc.CreateAnswer(nil)
			if err != nil {
				log.Printf("CreateAnswer error: %v", err)
				continue
			}

			// Local Description 설정 → ICE 수집 시작
			if err = pc.SetLocalDescription(answer); err != nil {
				log.Printf("SetLocalDescription error: %v", err)
				continue
			}

			// Answer 전달
			sendJSON(SignalingMessage{
				Type: "answer",
				SDP:  pc.LocalDescription().SDP,
			})
			log.Println("Answer sent")

		case "candidate":
			log.Printf("ICE candidate received")

			candidateInit := webrtc.ICECandidateInit{
				Candidate:     msg.Candidate,
				SDPMLineIndex: msg.SDPMLineIndex,
				SDPMid:        &msg.SDPMid,
			}

			if err := pc.AddICECandidate(candidateInit); err != nil {
				log.Printf("AddICECandidate error: %v", err)
			}

		default:
			log.Printf("Unknown message type: %s", msg.Type)
		}
	}
}
```

## 3.2 코드 흐름 해설

```
[Golang 서버의 동작 흐름]

  브라우저 WebSocket 연결
       │
       ▼
  PeerConnection 생성 (STUN 서버 설정)
       │
       ├── OnICECandidate 등록: 후보 발견 시 브라우저에 전달
       ├── OnConnectionStateChange 등록: 상태 로깅
       └── OnDataChannel 등록: DC 수신 시 Echo 처리
       │
       ▼
  메시지 처리 루프 시작
       │
       ├── "offer" 수신
       │   ├── SetRemoteDescription(offer)
       │   ├── CreateAnswer()
       │   ├── SetLocalDescription(answer) → ICE 수집 시작 ⚡
       │   └── Answer를 WebSocket으로 전달
       │
       └── "candidate" 수신
           └── AddICECandidate()
```

# 4. 브라우저 클라이언트 구현

## 4.1 전체 코드 (web/index.html)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>WebRTC First Connection</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: monospace; max-width: 700px; margin: 40px auto; padding: 0 20px; }
    h1 { margin-bottom: 20px; font-size: 1.4em; }

    .status {
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 16px;
      font-size: 0.9em;
    }
    .status.connecting { background: #fff3cd; }
    .status.connected { background: #d4edda; }
    .status.failed { background: #f8d7da; }

    .controls {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    .controls input {
      flex: 1;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-family: monospace;
    }
    .controls button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-family: monospace;
    }
    #connectBtn { background: #007bff; color: white; }
    #connectBtn:disabled { background: #ccc; }
    #sendBtn { background: #28a745; color: white; }
    #sendBtn:disabled { background: #ccc; }

    #log {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 16px;
      border-radius: 4px;
      height: 400px;
      overflow-y: auto;
      font-size: 0.85em;
      line-height: 1.6;
    }
    .log-send { color: #569cd6; }
    .log-recv { color: #4ec9b0; }
    .log-info { color: #9cdcfe; }
    .log-error { color: #f44747; }
  </style>
</head>
<body>
  <h1>WebRTC First Connection (Browser ↔ Golang)</h1>

  <div id="status" class="status connecting">Disconnected</div>

  <div class="controls">
    <button id="connectBtn" onclick="connect()">Connect</button>
  </div>
  <div class="controls">
    <input id="msgInput" type="text" placeholder="메시지 입력..." disabled
           onkeydown="if(event.key==='Enter') sendMessage()">
    <button id="sendBtn" onclick="sendMessage()" disabled>Send</button>
  </div>

  <div id="log"></div>

  <script>
    let pc = null;
    let dc = null;
    let ws = null;

    // ──── 로그 유틸 ────
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

    // ──── 연결 시작 ────
    async function connect() {
      document.getElementById('connectBtn').disabled = true;
      setStatus('Connecting...', 'connecting');
      appendLog('Starting WebRTC connection...', 'log-info');

      // ① WebSocket Signaling 연결
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${protocol}//${location.host}/ws`);

      ws.onopen = async () => {
        appendLog('WebSocket connected', 'log-info');
        await startWebRTC();
      };

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);
        await handleSignalingMessage(msg);
      };

      ws.onclose = () => {
        appendLog('WebSocket disconnected', 'log-error');
        setStatus('Disconnected', 'failed');
      };
    }

    // ──── WebRTC 연결 수립 ────
    async function startWebRTC() {
      // ② PeerConnection 생성
      pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      // ③ 연결 상태 모니터링
      pc.oniceconnectionstatechange = () => {
        appendLog(`ICE connection state: ${pc.iceConnectionState}`, 'log-info');
      };

      pc.onconnectionstatechange = () => {
        appendLog(`Connection state: ${pc.connectionState}`, 'log-info');
        if (pc.connectionState === 'connected') {
          setStatus('Connected (P2P)', 'connected');
        } else if (pc.connectionState === 'failed') {
          setStatus('Connection Failed', 'failed');
        }
      };

      // ④ ICE Candidate → 서버로 전달
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          ws.send(JSON.stringify({
            type: 'candidate',
            candidate: event.candidate.candidate,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            sdpMid: event.candidate.sdpMid
          }));
          appendLog(`ICE candidate sent: ${event.candidate.type || 'unknown'}`, 'log-info');
        }
      };

      // ⑤ DataChannel 생성 (브라우저가 Offerer이므로 여기서 생성)
      dc = pc.createDataChannel('chat');

      dc.onopen = () => {
        appendLog('DataChannel opened!', 'log-info');
        document.getElementById('msgInput').disabled = false;
        document.getElementById('sendBtn').disabled = false;
        document.getElementById('msgInput').focus();
      };

      dc.onmessage = (event) => {
        appendLog(`← ${event.data}`, 'log-recv');
      };

      dc.onclose = () => {
        appendLog('DataChannel closed', 'log-info');
        document.getElementById('msgInput').disabled = true;
        document.getElementById('sendBtn').disabled = true;
      };

      // ⑥ Offer 생성 및 전달
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      ws.send(JSON.stringify({
        type: 'offer',
        sdp: pc.localDescription.sdp
      }));
      appendLog('Offer sent', 'log-info');
    }

    // ──── Signaling 메시지 수신 처리 ────
    async function handleSignalingMessage(msg) {
      switch (msg.type) {
        case 'answer':
          appendLog('Answer received', 'log-info');
          await pc.setRemoteDescription(new RTCSessionDescription({
            type: 'answer',
            sdp: msg.sdp
          }));
          break;

        case 'candidate':
          appendLog('ICE candidate received', 'log-info');
          await pc.addIceCandidate(new RTCIceCandidate({
            candidate: msg.candidate,
            sdpMLineIndex: msg.sdpMLineIndex,
            sdpMid: msg.sdpMid
          }));
          break;
      }
    }

    // ──── 메시지 전송 ────
    function sendMessage() {
      const input = document.getElementById('msgInput');
      const text = input.value.trim();
      if (!text || !dc || dc.readyState !== 'open') return;

      dc.send(text);
      appendLog(`→ ${text}`, 'log-send');
      input.value = '';
    }
  </script>
</body>
</html>
```

## 4.2 코드 흐름 해설

```
[브라우저의 동작 흐름]

  Connect 버튼 클릭
       │
       ▼
  ① WebSocket 연결 (ws://localhost:8080/ws)
       │
       ▼
  ② PeerConnection 생성 (STUN 서버 설정)
       │
       ├── onicecandidate: 후보 발견 시 서버에 전달
       ├── onconnectionstatechange: 상태 UI 업데이트
       │
       ▼
  ⑤ DataChannel 'chat' 생성
       │
       ├── onopen: 입력 UI 활성화
       ├── onmessage: 서버 Echo 표시
       │
       ▼
  ⑥ createOffer() → setLocalDescription() → Offer 전송
       │                                      │
       ▼                                      ▼
  ICE 수집 시작 ⚡                     서버가 Answer 반환
       │                                      │
       ▼                                      ▼
  ICE Candidate 전송 (× N)          setRemoteDescription(answer)
       │
       ▼
  P2P 연결 완료 → DataChannel 열림 → 메시지 교환
```

# 5. 실행 및 테스트

## 5.1 프로젝트 초기화 및 실행

```bash
# 디렉토리 생성
mkdir webrtc-first-connection && cd webrtc-first-connection
mkdir web

# Go 모듈 초기화 및 의존성 설치
go mod init webrtc-first-connection
go get github.com/pion/webrtc/v4
go get github.com/gorilla/websocket

# main.go와 web/index.html 생성 (위 코드 참조)

# 서버 실행
go run main.go
# Server starting at http://localhost:8080
```

## 5.2 브라우저에서 테스트

1. `http://localhost:8080` 접속
2. **Connect** 버튼 클릭
3. 로그에서 연결 과정 확인
4. 텍스트 입력 후 **Send** (또는 Enter)
5. 서버로부터 Echo 응답 수신 확인

## 5.3 정상 동작 시 예상 로그

### 브라우저 로그

```
[12:00:01] Starting WebRTC connection...
[12:00:01] WebSocket connected
[12:00:01] Offer sent
[12:00:01] Answer received
[12:00:01] ICE candidate sent: unknown
[12:00:01] ICE candidate sent: unknown
[12:00:01] ICE candidate received
[12:00:01] ICE candidate received
[12:00:01] ICE connection state: checking
[12:00:01] Connection state: connecting
[12:00:01] ICE connection state: connected
[12:00:01] Connection state: connected
[12:00:01] DataChannel opened!
[12:00:01] ← Connected to Go server!
[12:00:05] → Hello WebRTC!
[12:00:05] ← Echo: Hello WebRTC!
```

### Golang 서버 로그

```
Server starting at http://localhost:8080
Browser connected via WebSocket
Offer received
Answer sent
ICE candidate sent: host
ICE candidate sent: srflx
ICE candidate received
ICE candidate received
ICE connection state: checking
Connection state: connecting
ICE connection state: connected
Connection state: connected
DataChannel received: label='chat'
DataChannel 'chat' opened
Received: Hello WebRTC!
```

## 5.4 실행 시퀀스

```
  브라우저                    Golang Server
       │                          │
       │── WS 연결 ──────────────>│  "Browser connected"
       │                          │
       │  createOffer()           │
       │  setLocalDescription()   │
       │── Offer SDP ────────────>│  "Offer received"
       │                          │  SetRemoteDescription()
       │                          │  CreateAnswer()
       │                          │  SetLocalDescription()
       │<── Answer SDP ───────────│  "Answer sent"
       │  setRemoteDescription()  │
       │                          │
       │── ICE candidate ────────>│  AddICECandidate()
       │── ICE candidate ────────>│  AddICECandidate()
       │<── ICE candidate ────────│  OnICECandidate → send
       │<── ICE candidate ────────│  OnICECandidate → send
       │  addIceCandidate()       │
       │  addIceCandidate()       │
       │                          │
       │◄══ ICE 연결성 검사 ═════>│  checking → connected
       │◄══ DTLS 핸드셰이크 ═════>│
       │                          │
       │  DC 'chat' opened        │  "DataChannel 'chat' opened"
       │<── "Connected to Go..." ─│  SendText()
       │                          │
       │── "Hello WebRTC!" ──────>│  OnMessage: "Hello WebRTC!"
       │<── "Echo: Hello WebRTC!"─│  SendText("Echo: ...")
       │                          │
```

# 6. 동작 원리 상세 분석

## 6.1 Offer/Answer에서 실제로 합의되는 것

브라우저가 보내는 Offer SDP를 서버가 파싱하면, 양쪽이 합의하는 내용은 다음과 같다.

```
[합의 내용]

  ┌─────────────────────────────────────────────┐
  │  1. DataChannel 사용 (m=application)         │
  │  2. SCTP 프로토콜                             │
  │  3. ICE 인증 정보 (ufrag/pwd)                │
  │  4. DTLS fingerprint (인증서 해시)            │
  │  5. DTLS 역할 (브라우저: active, 서버: passive)│
  │  6. BUNDLE (하나의 포트 공유)                  │
  └─────────────────────────────────────────────┘

  이 실습에서는 미디어 트랙이 없으므로
  m=audio, m=video가 SDP에 포함되지 않는다.
  m=application (DataChannel)만 존재한다.
```

## 6.2 ICE 연결 경로

로컬 환경(localhost)에서는 보통 **Host 후보끼리 직접 연결**된다.

```
  브라우저 ICE 후보:
  ├── Host: 127.0.0.1:xxxxx
  ├── Host: 192.168.x.x:xxxxx
  └── Srflx: (STUN 응답, 공인 IP)

  Golang ICE 후보:
  ├── Host: 127.0.0.1:yyyyy
  ├── Host: 192.168.x.x:yyyyy
  └── Srflx: (STUN 응답, 공인 IP)

  로컬 테스트 시 선택되는 경로:
  → 127.0.0.1:xxxxx ↔ 127.0.0.1:yyyyy (Host ↔ Host)
```

## 6.3 DataChannel이 열리는 시점

```
  ICE connected
       │
  DTLS 핸드셰이크 완료
       │
  SCTP 연결 수립
       │
  DCEP (DataChannel Establishment Protocol)
  ├── DATA_CHANNEL_OPEN (브라우저 → 서버)
  │   label: "chat", ordered: true
  └── DATA_CHANNEL_ACK (서버 → 브라우저)
       │
  브라우저: dc.onopen 발생
  서버: pc.OnDataChannel 발생 → dc.OnOpen 발생
```

# 7. 트러블슈팅

## 7.1 자주 발생하는 문제

### ICE connection state: failed

```
[원인과 해결]

  원인 1: STUN 서버 접근 불가
  → 해결: 인터넷 연결 확인, 다른 STUN 서버 시도
     {URLs: []string{"stun:stun1.l.google.com:19302"}}

  원인 2: 방화벽이 UDP 차단
  → 해결: TURN 서버 추가
     {URLs: []string{"turn:turn.example.com:3478"},
      Username: "user", Credential: "pass"}

  원인 3: ICE Candidate 교환 타이밍 문제
  → 해결: Answer 전에 수신한 Candidate를 큐에 저장 후 처리
```

### DataChannel이 열리지 않음

```
  확인 1: connectionState가 "connected"인지 확인
  확인 2: DataChannel을 createOffer() 전에 생성했는지 확인
           (Offer 후 생성하면 SDP에 포함되지 않음)
  확인 3: 서버 측에서 OnDataChannel 핸들러가 등록되어 있는지 확인
```

### WebSocket 연결 실패

```
  확인 1: 서버가 실행 중인지 확인 (go run main.go)
  확인 2: 포트가 사용 중인지 확인 (lsof -i :8080)
  확인 3: 브라우저 콘솔에서 CORS 에러 확인
          → CheckOrigin 함수가 true를 반환하는지 확인
```

## 7.2 디버깅 도구

### 브라우저 (Chrome)

```
  chrome://webrtc-internals/

  이 페이지에서 확인할 수 있는 정보:
  ├── SDP Offer/Answer 전문
  ├── ICE 후보 목록 (로컬/원격)
  ├── 선택된 후보쌍
  ├── 연결 상태 변화 타임라인
  ├── DataChannel 상태
  └── RTP/RTCP 통계 (미디어 사용 시)
```

### Golang 서버

```go
// SDP 내용 확인
log.Printf("Offer SDP:\n%s", msg.SDP)
log.Printf("Answer SDP:\n%s", pc.LocalDescription().SDP)

// ICE 후보 상세 정보
pc.OnICECandidate(func(c *webrtc.ICECandidate) {
    if c == nil {
        log.Println("ICE gathering complete")
        return
    }
    log.Printf("ICE candidate: type=%s protocol=%s address=%s:%d",
        c.Typ.String(), c.Protocol.String(), c.Address, c.Port)
})

// 선택된 후보쌍 확인
pc.SCTP().Transport().ICETransport().OnSelectedCandidatePairChange(
    func(pair *webrtc.ICECandidatePair) {
        log.Printf("Selected pair: %s ↔ %s",
            pair.Local.String(), pair.Remote.String())
    },
)
```

## 7.3 ICE Candidate 순서 문제

Trickle ICE에서 자주 발생하는 문제가 있다. **Answer를 setRemoteDescription 하기 전에 ICE Candidate가 도착**하면 `addIceCandidate`가 실패한다.

```javascript
// ──── 해결: Candidate 큐 사용 ────
let pendingCandidates = [];
let remoteDescSet = false;

async function handleSignalingMessage(msg) {
  switch (msg.type) {
    case 'answer':
      await pc.setRemoteDescription(
        new RTCSessionDescription({ type: 'answer', sdp: msg.sdp })
      );
      remoteDescSet = true;

      // 큐에 쌓인 후보 처리
      for (const c of pendingCandidates) {
        await pc.addIceCandidate(c);
      }
      pendingCandidates = [];
      break;

    case 'candidate':
      const candidate = new RTCIceCandidate({
        candidate: msg.candidate,
        sdpMLineIndex: msg.sdpMLineIndex,
        sdpMid: msg.sdpMid
      });

      if (remoteDescSet) {
        await pc.addIceCandidate(candidate);
      } else {
        // RemoteDescription 설정 전이면 큐에 저장
        pendingCandidates.push(candidate);
      }
      break;
  }
}
```

# 8. 연습 과제

이 실습 코드를 기반으로 다음을 시도해보자.

### 과제 1: 양방향 메시지 타임스탬프

서버의 Echo 응답에 서버 시각을 포함하도록 수정한다.

```
입력: Hello
응답: [2026-02-07 12:00:05] Echo: Hello
```

### 과제 2: 연결 정보 표시

연결이 완료되면 선택된 ICE 후보쌍(로컬/원격 주소, 후보 타입)을 브라우저에 표시한다.

```javascript
// 힌트: pc.getStats()를 사용
const stats = await pc.getStats();
stats.forEach(report => {
  if (report.type === 'candidate-pair' && report.state === 'succeeded') {
    // report.localCandidateId, report.remoteCandidateId
  }
});
```

### 과제 3: 재연결 처리

브라우저에 Disconnect/Reconnect 버튼을 추가하고, PeerConnection을 닫은 뒤 새로 연결하는 기능을 구현한다.

# 9. 정리

이번 실습에서 구현한 것을 요약하면 다음과 같다.

| 구성 요소 | 구현 내용 |
|-----------|----------|
| **Signaling** | WebSocket 단일 엔드포인트 (`/ws`), Offer/Answer/Candidate JSON 교환 |
| **Golang 피어** | Pion PeerConnection (Answerer), OnDataChannel Echo 처리 |
| **브라우저 피어** | RTCPeerConnection (Offerer), DataChannel 생성, 메시지 송수신 UI |
| **연결 흐름** | 브라우저 Offer → 서버 Answer → ICE 교환 → DTLS → DataChannel 열림 |

```
[이 시리즈의 현재 위치]

  ✅ 1편: 개요
  ✅ 2편: 전체 구조
  ✅ 3편: 핵심 개념 (SDP, ICE, STUN, TURN)
  ✅ 4편: 연결 흐름 Step-by-Step
  ✅ 5편: Signaling Server (Golang)
  ✅ 6편: Pion WebRTC 라이브러리
  ✅ 7편: 첫 연결 실습 (이 글) ← 지금 여기
  ☐ 8편: DataChannel 심화
  ☐ 9편: Media 스트림
  ☐ 10편~: 트러블슈팅, 확장, 보안, 기술 선택
```

다음 편에서는 DataChannel을 더 깊이 다루며, JSON 메시지 교환, 바이너리 전송, 로봇 제어 명령 전달 등 실전 활용 패턴을 실습한다.

## 참고 자료

- [Pion WebRTC 공식 예제 - data-channels](https://github.com/pion/webrtc/tree/master/examples/data-channels)
- [Pion WebRTC v4 패키지 문서](https://pkg.go.dev/github.com/pion/webrtc/v4)
- [gorilla/websocket](https://github.com/gorilla/websocket)
- [Chrome WebRTC Internals](chrome://webrtc-internals/)
- [MDN - RTCPeerConnection](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection)
