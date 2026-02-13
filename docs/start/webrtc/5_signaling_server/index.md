---
title: "WebRTC 완벽 가이드 (5): Signaling Server 설계와 Golang 구현"
description: "WebRTC Signaling 서버의 역할과 설계 원칙을 이해하고, Golang + gorilla/websocket으로 Room 기반 Signaling 서버를 직접 구현합니다."
date: 2026-02-07
update: 2026-02-07
tags:
  - WebRTC
  - Signaling
  - WebSocket
  - Golang
  - gorilla/websocket
  - Room
  - SDP
  - ICE Candidate
series: "WebRTC 완벽 가이드"
---

4편까지 WebRTC의 개념을 모두 다루었다. 이번 편부터는 실제 구현에 들어간다. 첫 번째 구현 대상은 **Signaling 서버**이다. WebRTC에서 유일하게 개발자가 직접 구현해야 하는 부분이기도 하다.

이 글에서는 Signaling 서버의 역할과 설계 원칙을 정리한 뒤, Golang으로 Room 기반 WebSocket Signaling 서버를 처음부터 구현한다.

# 1. Signaling 서버가 필요한 이유

## 1.1 WebRTC 스펙에 포함되지 않는 이유

WebRTC 프로토콜은 미디어 전송(RTP/SRTP), 연결 수립(ICE), 보안(DTLS)을 모두 정의하지만, **Signaling만큼은 스펙에 포함하지 않는다**. 이것은 의도적인 설계이다.

```
[WebRTC가 정의하는 것 vs 정의하지 않는 것]

  WebRTC 스펙 내부 (IETF/W3C)           WebRTC 스펙 외부 (개발자 영역)
  ┌────────────────────────┐           ┌────────────────────────┐
  │  ICE (연결 경로 탐색)    │           │  Signaling 서버         │
  │  STUN/TURN (NAT 통과)  │           │  ├── 전송 방식 선택      │
  │  DTLS (보안)            │           │  ├── 메시지 형식 정의    │
  │  SRTP (미디어 암호화)    │           │  ├── Room/Peer 관리     │
  │  RTP/RTCP (미디어 전송)  │           │  └── 인증/권한 처리      │
  │  SCTP (데이터 채널)      │           │                        │
  │  SDP (세션 설명 형식)    │           │  SDP를 "어떻게 전달할지" │
  │                        │           │  는 자유                │
  └────────────────────────┘           └────────────────────────┘
```

Signaling을 스펙에서 분리한 이유는 다음과 같다.

| 이유 | 설명 |
|------|------|
| **기존 인프라 활용** | 이미 WebSocket, HTTP API, MQTT 등 검증된 메시지 전달 기술이 있다 |
| **유연성** | 서비스마다 인증, 과금, Room 관리 등 요구사항이 다르다 |
| **단순성** | Signaling은 텍스트 메시지 중계에 불과하므로 표준화할 필요가 적다 |

SDP는 **단순한 평문 텍스트**이다. 이 텍스트를 상대방에게 전달할 수만 있다면 편지를 보내든, SMS를 보내든, QR 코드를 찍든 상관없다.

## 1.2 Signaling 서버의 역할

Signaling 서버가 하는 일은 명확하다. **두 피어 사이에서 텍스트 메시지를 중계**하는 것이다.

```
[Signaling 서버가 중계하는 메시지]

  Peer A ────────> Signaling Server ────────> Peer B

  중계 대상:
  1. SDP Offer     (Peer A → Peer B)
  2. SDP Answer    (Peer B → Peer A)
  3. ICE Candidate (양방향, 여러 개)

  중계하지 않는 것:
  - 미디어 데이터 (RTP/SRTP)
  - DataChannel 메시지 (SCTP)
  → 이것들은 P2P 또는 SFU/TURN을 통해 직접 전달
```

Signaling 서버는 **미디어를 처리하지 않는다**. SDP와 ICE 후보라는 텍스트 메시지를 중계하는 것이 전부이므로, 서버 부하가 매우 적다.

# 2. Signaling 방식 비교

## 2.1 WebSocket

가장 일반적인 Signaling 방식이다. 양방향 실시간 통신이 가능하여 Trickle ICE에 적합하다.

```
[WebSocket 기반 Signaling]

  Peer A                    WS Server                    Peer B
       │                        │                           │
       │── ws:// 연결 ──────────>│<── ws:// 연결 ─────────────│
       │                        │                           │
       │── {"type":"offer"} ───>│── {"type":"offer"} ──────>│
       │                        │                           │
       │<── {"type":"answer"} ──│<── {"type":"answer"} ─────│
       │                        │                           │
       │── {"type":"candidate"}─>│── {"type":"candidate"} ──>│  × N
       │<── {"type":"candidate"}─│<── {"type":"candidate"} ──│  × N
       │                        │                           │

  장점: 양방향, 실시간, Trickle ICE 자연스러움
  단점: 상시 연결 유지 필요
```

### 왜 WebSocket이 가장 적합한가

| 요구사항 | WebSocket 지원 |
|----------|---------------|
| 양방향 메시지 전달 | O (서버 → 클라이언트 푸시 가능) |
| 실시간성 | O (연결 유지, 즉시 전달) |
| Trickle ICE | O (후보를 즉시 푸시) |
| 구현 난이도 | 중 (대부분의 언어에 라이브러리 존재) |

## 2.2 HTTP REST API

HTTP 폴링 또는 Long Polling을 사용하는 방식이다.

```
[HTTP 기반 Signaling]

  Peer A                   HTTP Server                    Peer B
       │                        │                           │
       │── POST /offer ────────>│                           │
       │<── 200 OK ─────────────│                           │
       │                        │                           │
       │                        │<── GET /offer ────────────│
       │                        │── 200 {offer} ───────────>│
       │                        │                           │
       │                        │<── POST /answer ──────────│
       │<── GET /answer ────────│                           │
       │── 200 {answer} ───────>│                           │
       │                        │                           │
       │── POST /candidate ────>│                           │  폴링 필요
       │                        │<── GET /candidates ───────│
       │                        │── 200 [candidates] ──────>│

  장점: 구현 간단, 기존 HTTP 인프라 활용
  단점: 실시간성 떨어짐, 폴링 오버헤드
```

| 적합한 경우 | 부적합한 경우 |
|------------|-------------|
| 1:1 단순 연결 | 다자간 회의 |
| 프로토타입 | Trickle ICE 필요 시 |
| 서버리스 환경 | 빈번한 재협상 |

## 2.3 MQTT

IoT/로봇 시스템에서 이미 MQTT 인프라가 있다면 Signaling에도 활용할 수 있다.

```
[MQTT 기반 Signaling]

  Peer A                   MQTT Broker                    Peer B
       │                        │                           │
       │── SUB webrtc/room123/  │                           │
       │       peer-a/inbox     │                           │
       │                        │── SUB webrtc/room123/ ────│
       │                        │       peer-b/inbox        │
       │                        │                           │
       │── PUB webrtc/room123/  │                           │
       │       peer-b/inbox     │── 메시지 전달 ────────────>│
       │   {type: "offer"}      │                           │
       │                        │                           │
       │                        │<── PUB webrtc/room123/ ───│
       │<── 메시지 전달 ─────────│       peer-a/inbox        │
       │                        │   {type: "answer"}        │

  Topic 구조: webrtc/{room-id}/{peer-id}/inbox
```

| 적합한 경우 | 부적합한 경우 |
|------------|-------------|
| 이미 MQTT 브로커가 있는 IoT 환경 | 브라우저 기반 서비스 |
| 로봇 원격 제어 시스템 | MQTT 인프라가 없는 환경 |
| 디바이스가 MQTT로 이미 연결된 경우 | 대규모 화상회의 |

## 2.4 방식별 비교 요약

| 항목 | WebSocket | HTTP REST | MQTT |
|------|-----------|-----------|------|
| 방향 | 양방향 | 단방향 (폴링 필요) | 양방향 (Pub/Sub) |
| 실시간성 | 높음 | 낮음~중간 | 높음 |
| Trickle ICE | 자연스러움 | 불편 (폴링) | 자연스러움 |
| 구현 난이도 | 중 | 낮음 | 중 |
| 추가 인프라 | 없음 | 없음 | MQTT Broker 필요 |
| 브라우저 지원 | 네이티브 | 네이티브 | 라이브러리 필요 |
| **추천 용도** | **범용 (기본 선택)** | 프로토타입 | IoT/로봇 |

이 글에서는 가장 범용적인 **WebSocket** 방식으로 구현한다.

# 3. Signaling 서버 설계

## 3.1 메시지 프로토콜 설계

Signaling 서버가 처리해야 하는 메시지 타입을 정의한다.

```
[메시지 타입]

  클라이언트 → 서버:
  ┌──────────────────────────────────────────┐
  │  join        방 참여 요청                  │
  │  leave       방 퇴장                      │
  │  offer       SDP Offer 전달               │
  │  answer      SDP Answer 전달              │
  │  candidate   ICE Candidate 전달           │
  └──────────────────────────────────────────┘

  서버 → 클라이언트:
  ┌──────────────────────────────────────────┐
  │  peer-joined     새 피어 입장 알림         │
  │  peer-left       피어 퇴장 알림            │
  │  offer           SDP Offer 중계           │
  │  answer          SDP Answer 중계          │
  │  candidate       ICE Candidate 중계       │
  │  error           에러 알림                 │
  └──────────────────────────────────────────┘
```

모든 메시지는 **JSON 형식**으로 통일한다.

```json
{
  "type": "offer",
  "from": "peer-a",
  "to": "peer-b",
  "room": "room-123",
  "payload": { ... }
}
```

## 3.2 데이터 구조 설계

```
[서버 내부 데이터 구조]

  Server
  ├── rooms: map[roomID]*Room
  │   ├── "room-123"
  │   │   ├── id: "room-123"
  │   │   └── peers: map[peerID]*Peer
  │   │       ├── "peer-a"
  │   │       │   ├── id: "peer-a"
  │   │       │   ├── conn: *websocket.Conn
  │   │       │   └── room: "room-123"
  │   │       └── "peer-b"
  │   │           ├── id: "peer-b"
  │   │           ├── conn: *websocket.Conn
  │   │           └── room: "room-123"
  │   └── "room-456"
  │       └── ...
  └── mutex: sync.RWMutex  (동시성 보호)
```

## 3.3 메시지 흐름 설계

### Join 흐름

```
  Peer A                     Server                       Peer B
       │                        │                            │
       │── join(room-123) ─────>│                            │
       │                        │  Room 생성 또는 참여        │
       │                        │  Peer A 등록               │
       │                        │                            │
       │                        │── peer-joined(peer-a) ────>│
       │                        │   (기존 피어들에게 알림)      │
       │                        │                            │
       │<── room-info ──────────│                            │
       │   (현재 방의 피어 목록)   │                            │
       │                        │                            │
```

### Offer/Answer/Candidate 중계 흐름

```
  Peer A                     Server                       Peer B
       │                        │                            │
       │── offer ──────────────>│  to 필드로 대상 피어 식별     │
       │   {to: "peer-b"}      │                            │
       │                        │── offer ──────────────────>│
       │                        │   {from: "peer-a"}         │
       │                        │                            │
       │                        │<── answer ─────────────────│
       │                        │   {to: "peer-a"}           │
       │<── answer ─────────────│                            │
       │   {from: "peer-b"}    │                            │
       │                        │                            │
       │── candidate ──────────>│── candidate ──────────────>│
       │<── candidate ──────────│<── candidate ──────────────│
       │                        │                            │
```

핵심은 단순하다. 서버는 `to` 필드를 보고 **해당 피어에게 메시지를 그대로 전달**할 뿐이다.

# 4. Golang 구현

## 4.1 프로젝트 구조

```
signaling-server/
├── main.go           # 서버 진입점
├── server.go         # SignalingServer 핵심 로직
├── room.go           # Room 관리
├── peer.go           # Peer 관리 (WebSocket 연결)
├── message.go        # 메시지 타입 정의
├── go.mod
└── go.sum
```

## 4.2 메시지 타입 정의

```go
// message.go
package main

import "encoding/json"

// 메시지 타입 상수
const (
	TypeJoin      = "join"
	TypeLeave     = "leave"
	TypeOffer     = "offer"
	TypeAnswer    = "answer"
	TypeCandidate = "candidate"

	// 서버 → 클라이언트
	TypePeerJoined = "peer-joined"
	TypePeerLeft   = "peer-left"
	TypeRoomInfo   = "room-info"
	TypeError      = "error"
)

// Message는 클라이언트와 서버 간 교환되는 메시지이다.
type Message struct {
	Type    string          `json:"type"`
	From    string          `json:"from,omitempty"`
	To      string          `json:"to,omitempty"`
	Room    string          `json:"room,omitempty"`
	Payload json.RawMessage `json:"payload,omitempty"`
}

// RoomInfoPayload는 방 정보 응답이다.
type RoomInfoPayload struct {
	RoomID  string   `json:"roomId"`
	PeerIDs []string `json:"peerIds"`
}

// ErrorPayload는 에러 응답이다.
type ErrorPayload struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}
```

`Payload`를 `json.RawMessage`로 선언한 이유는, 서버가 SDP나 ICE Candidate의 **내용을 파싱할 필요가 없기** 때문이다. 받은 그대로 상대 피어에게 전달하면 된다.

## 4.3 Peer 구현

```go
// peer.go
package main

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/gorilla/websocket"
)

// Peer는 하나의 WebSocket 연결을 나타낸다.
type Peer struct {
	id     string
	conn   *websocket.Conn
	roomID string
	mu     sync.Mutex // 쓰기 동시성 보호
}

// NewPeer는 새 Peer를 생성한다.
func NewPeer(id string, conn *websocket.Conn) *Peer {
	return &Peer{
		id:   id,
		conn: conn,
	}
}

// Send는 피어에게 메시지를 전송한다.
func (p *Peer) Send(msg *Message) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.conn.WriteJSON(msg)
}

// SendError는 에러 메시지를 전송한다.
func (p *Peer) SendError(code, message string) {
	payload, _ := json.Marshal(ErrorPayload{
		Code:    code,
		Message: message,
	})
	p.Send(&Message{
		Type:    TypeError,
		Payload: payload,
	})
}

// ReadLoop는 피어로부터 메시지를 읽는 루프이다.
// 메시지를 수신하면 handler를 호출한다.
func (p *Peer) ReadLoop(handler func(*Peer, *Message)) {
	defer p.conn.Close()

	for {
		var msg Message
		if err := p.conn.ReadJSON(&msg); err != nil {
			if websocket.IsUnexpectedCloseError(err,
				websocket.CloseGoingAway,
				websocket.CloseNormalClosure,
			) {
				log.Printf("peer %s: read error: %v", p.id, err)
			}
			return
		}
		msg.From = p.id // 발신자를 서버에서 설정 (클라이언트 위변조 방지)
		handler(p, &msg)
	}
}
```

`msg.From = p.id`를 서버에서 설정하는 것에 주목하자. 클라이언트가 `from` 필드를 임의로 조작하는 것을 방지하기 위해, **서버가 인증된 피어 ID를 강제로 설정**한다.

## 4.4 Room 구현

```go
// room.go
package main

import (
	"encoding/json"
	"log"
	"sync"
)

// Room은 하나의 통화방을 나타낸다.
type Room struct {
	id    string
	peers map[string]*Peer
	mu    sync.RWMutex
}

// NewRoom은 새 Room을 생성한다.
func NewRoom(id string) *Room {
	return &Room{
		id:    id,
		peers: make(map[string]*Peer),
	}
}

// AddPeer는 방에 피어를 추가한다.
func (r *Room) AddPeer(peer *Peer) {
	r.mu.Lock()
	defer r.mu.Unlock()

	peer.roomID = r.id
	r.peers[peer.id] = peer

	log.Printf("room %s: peer %s joined (total: %d)", r.id, peer.id, len(r.peers))
}

// RemovePeer는 방에서 피어를 제거한다.
func (r *Room) RemovePeer(peerID string) {
	r.mu.Lock()
	defer r.mu.Unlock()

	delete(r.peers, peerID)

	log.Printf("room %s: peer %s left (total: %d)", r.id, peerID, len(r.peers))
}

// GetPeer는 특정 피어를 반환한다.
func (r *Room) GetPeer(peerID string) *Peer {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return r.peers[peerID]
}

// PeerIDs는 현재 방의 피어 ID 목록을 반환한다.
func (r *Room) PeerIDs() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	ids := make([]string, 0, len(r.peers))
	for id := range r.peers {
		ids = append(ids, id)
	}
	return ids
}

// Broadcast는 특정 피어를 제외한 모든 피어에게 메시지를 전송한다.
func (r *Room) Broadcast(msg *Message, excludePeerID string) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for id, peer := range r.peers {
		if id == excludePeerID {
			continue
		}
		if err := peer.Send(msg); err != nil {
			log.Printf("room %s: failed to send to peer %s: %v", r.id, id, err)
		}
	}
}

// SendTo는 특정 피어에게 메시지를 전송한다.
func (r *Room) SendTo(peerID string, msg *Message) bool {
	r.mu.RLock()
	defer r.mu.RUnlock()

	peer, ok := r.peers[peerID]
	if !ok {
		return false
	}
	if err := peer.Send(msg); err != nil {
		log.Printf("room %s: failed to send to peer %s: %v", r.id, peerID, err)
		return false
	}
	return true
}

// IsEmpty는 방이 비어있는지 확인한다.
func (r *Room) IsEmpty() bool {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return len(r.peers) == 0
}

// NotifyPeerJoined는 기존 피어들에게 새 피어 입장을 알린다.
func (r *Room) NotifyPeerJoined(newPeerID string) {
	payload, _ := json.Marshal(map[string]string{"peerId": newPeerID})
	r.Broadcast(&Message{
		Type:    TypePeerJoined,
		Payload: payload,
	}, newPeerID)
}

// NotifyPeerLeft는 남은 피어들에게 퇴장을 알린다.
func (r *Room) NotifyPeerLeft(leftPeerID string) {
	payload, _ := json.Marshal(map[string]string{"peerId": leftPeerID})
	r.Broadcast(&Message{
		Type:    TypePeerLeft,
		Payload: payload,
	}, leftPeerID)
}
```

## 4.5 Signaling Server 핵심 로직

```go
// server.go
package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // 개발 환경용. 프로덕션에서는 Origin 검증 필요
	},
}

// SignalingServer는 WebRTC Signaling 서버이다.
type SignalingServer struct {
	rooms map[string]*Room
	mu    sync.RWMutex
}

// NewSignalingServer는 새 Signaling 서버를 생성한다.
func NewSignalingServer() *SignalingServer {
	return &SignalingServer{
		rooms: make(map[string]*Room),
	}
}

// HandleWebSocket은 WebSocket 연결을 처리하는 HTTP 핸들러이다.
func (s *SignalingServer) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	// WebSocket으로 업그레이드
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("upgrade error: %v", err)
		return
	}

	// 쿼리 파라미터에서 Peer ID 추출
	peerID := r.URL.Query().Get("peerId")
	if peerID == "" {
		conn.WriteJSON(Message{Type: TypeError, Payload: marshalJSON(ErrorPayload{
			Code: "MISSING_PEER_ID", Message: "peerId is required",
		})})
		conn.Close()
		return
	}

	peer := NewPeer(peerID, conn)
	log.Printf("peer %s connected", peerID)

	// 연결 종료 시 정리
	defer s.handleDisconnect(peer)

	// 메시지 읽기 루프 시작
	peer.ReadLoop(s.handleMessage)
}

// handleMessage는 수신한 메시지를 타입별로 처리한다.
func (s *SignalingServer) handleMessage(peer *Peer, msg *Message) {
	switch msg.Type {
	case TypeJoin:
		s.handleJoin(peer, msg)
	case TypeLeave:
		s.handleLeave(peer)
	case TypeOffer, TypeAnswer, TypeCandidate:
		s.handleRelay(peer, msg)
	default:
		peer.SendError("UNKNOWN_TYPE", "unknown message type: "+msg.Type)
	}
}

// handleJoin은 방 참여를 처리한다.
func (s *SignalingServer) handleJoin(peer *Peer, msg *Message) {
	roomID := msg.Room
	if roomID == "" {
		peer.SendError("MISSING_ROOM", "room is required")
		return
	}

	// 이전 방에서 나가기
	if peer.roomID != "" {
		s.handleLeave(peer)
	}

	// 방 생성 또는 조회
	room := s.getOrCreateRoom(roomID)

	// 방에 피어 추가
	room.AddPeer(peer)

	// 기존 피어들에게 새 피어 입장 알림
	room.NotifyPeerJoined(peer.id)

	// 새 피어에게 현재 방 정보 전달
	payload, _ := json.Marshal(RoomInfoPayload{
		RoomID:  roomID,
		PeerIDs: room.PeerIDs(),
	})
	peer.Send(&Message{
		Type:    TypeRoomInfo,
		Payload: payload,
	})
}

// handleLeave는 방 퇴장을 처리한다.
func (s *SignalingServer) handleLeave(peer *Peer) {
	if peer.roomID == "" {
		return
	}

	s.mu.RLock()
	room, ok := s.rooms[peer.roomID]
	s.mu.RUnlock()

	if !ok {
		return
	}

	room.RemovePeer(peer.id)
	room.NotifyPeerLeft(peer.id)

	// 빈 방 정리
	if room.IsEmpty() {
		s.mu.Lock()
		delete(s.rooms, room.id)
		s.mu.Unlock()
		log.Printf("room %s removed (empty)", room.id)
	}

	peer.roomID = ""
}

// handleRelay는 Offer/Answer/Candidate를 대상 피어에게 중계한다.
func (s *SignalingServer) handleRelay(peer *Peer, msg *Message) {
	if peer.roomID == "" {
		peer.SendError("NOT_IN_ROOM", "join a room first")
		return
	}

	s.mu.RLock()
	room, ok := s.rooms[peer.roomID]
	s.mu.RUnlock()

	if !ok {
		peer.SendError("ROOM_NOT_FOUND", "room not found")
		return
	}

	if msg.To == "" {
		// to가 없으면 방의 모든 피어에게 브로드캐스트
		room.Broadcast(msg, peer.id)
		return
	}

	// 특정 피어에게 전달
	if !room.SendTo(msg.To, msg) {
		peer.SendError("PEER_NOT_FOUND", "peer not found: "+msg.To)
	}
}

// handleDisconnect는 WebSocket 연결 종료를 처리한다.
func (s *SignalingServer) handleDisconnect(peer *Peer) {
	log.Printf("peer %s disconnected", peer.id)
	s.handleLeave(peer)
}

// getOrCreateRoom은 방을 조회하거나 새로 생성한다.
func (s *SignalingServer) getOrCreateRoom(roomID string) *Room {
	s.mu.Lock()
	defer s.mu.Unlock()

	room, ok := s.rooms[roomID]
	if !ok {
		room = NewRoom(roomID)
		s.rooms[roomID] = room
		log.Printf("room %s created", roomID)
	}
	return room
}

func marshalJSON(v interface{}) json.RawMessage {
	data, _ := json.Marshal(v)
	return data
}
```

## 4.6 서버 진입점

```go
// main.go
package main

import (
	"log"
	"net/http"
)

func main() {
	server := NewSignalingServer()

	http.HandleFunc("/ws", server.HandleWebSocket)

	// 헬스체크 엔드포인트
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	addr := ":8080"
	log.Printf("Signaling server starting on %s", addr)
	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatal(err)
	}
}
```

## 4.7 실행 및 테스트

```bash
# 의존성 초기화
go mod init signaling-server
go get github.com/gorilla/websocket

# 서버 실행
go run .
# Signaling server starting on :8080
```

# 5. 클라이언트 연동

## 5.1 브라우저 JavaScript 클라이언트

서버와 연동하는 클라이언트 코드이다. 4편의 전체 흐름과 동일한 패턴을 따른다.

```javascript
class SignalingClient {
  constructor(serverUrl, peerId) {
    this.peerId = peerId;
    this.ws = new WebSocket(`${serverUrl}?peerId=${peerId}`);
    this.handlers = {};

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const handler = this.handlers[msg.type];
      if (handler) handler(msg);
    };

    this.ws.onclose = () => {
      console.log('Signaling connection closed');
    };
  }

  // 방 참여
  join(roomId) {
    this.send({ type: 'join', room: roomId });
  }

  // Offer 전달
  sendOffer(toPeerId, sdp) {
    this.send({ type: 'offer', to: toPeerId, payload: sdp });
  }

  // Answer 전달
  sendAnswer(toPeerId, sdp) {
    this.send({ type: 'answer', to: toPeerId, payload: sdp });
  }

  // ICE Candidate 전달
  sendCandidate(toPeerId, candidate) {
    this.send({ type: 'candidate', to: toPeerId, payload: candidate });
  }

  // 이벤트 핸들러 등록
  on(type, handler) {
    this.handlers[type] = handler;
  }

  send(msg) {
    this.ws.send(JSON.stringify(msg));
  }
}
```

## 5.2 WebRTC 연결과 통합

```javascript
// ──── 사용 예시 ────
const signaling = new SignalingClient('wss://signal.example.com/ws', 'peer-a');
let pc = null;

// 방 참여
signaling.join('room-123');

// 새 피어 입장 → Offer 시작
signaling.on('peer-joined', async (msg) => {
  const remotePeerId = msg.payload.peerId;
  pc = createPeerConnection(remotePeerId);

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
  stream.getTracks().forEach(track => pc.addTrack(track, stream));

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  signaling.sendOffer(remotePeerId, pc.localDescription);
});

// Offer 수신 → Answer 생성
signaling.on('offer', async (msg) => {
  pc = createPeerConnection(msg.from);

  await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
  stream.getTracks().forEach(track => pc.addTrack(track, stream));

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  signaling.sendAnswer(msg.from, pc.localDescription);
});

// Answer 수신
signaling.on('answer', async (msg) => {
  await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
});

// ICE Candidate 수신
signaling.on('candidate', async (msg) => {
  await pc.addIceCandidate(new RTCIceCandidate(msg.payload));
});

// PeerConnection 생성 헬퍼
function createPeerConnection(remotePeerId) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      signaling.sendCandidate(remotePeerId, event.candidate);
    }
  };

  pc.ontrack = (event) => {
    document.getElementById('remoteVideo').srcObject = event.streams[0];
  };

  return pc;
}
```

## 5.3 전체 동작 흐름

위 코드가 동작하는 전체 흐름을 시퀀스로 정리하면 다음과 같다.

```
  Peer A (브라우저)         Signaling Server         Peer B (브라우저)
       │                        │                        │
       │── join("room-123") ───>│                        │
       │<── room-info ──────────│                        │
       │   {peerIds: []}        │                        │
       │                        │                        │
       │                        │<── join("room-123") ───│
       │                        │── room-info ──────────>│
       │                        │   {peerIds: ["peer-a"]}│
       │                        │                        │
       │<── peer-joined ────────│                        │
       │   {peerId: "peer-b"}  │                        │
       │                        │                        │
       │ [Peer A가 Offerer 역할]│                        │
       │ getUserMedia()         │                        │
       │ addTrack()             │                        │
       │ createOffer()          │                        │
       │ setLocalDescription()  │                        │
       │                        │                        │
       │── offer ──────────────>│── offer ──────────────>│
       │   {to: "peer-b"}      │   {from: "peer-a"}     │
       │                        │                        │
       │                        │    setRemoteDescription()
       │                        │    getUserMedia()      │
       │                        │    addTrack()          │
       │                        │    createAnswer()      │
       │                        │    setLocalDescription()
       │                        │                        │
       │<── answer ─────────────│<── answer ─────────────│
       │   {from: "peer-b"}    │   {to: "peer-a"}       │
       │                        │                        │
       │ setRemoteDescription() │                        │
       │                        │                        │
       │── candidate ──────────>│── candidate ──────────>│
       │<── candidate ──────────│<── candidate ──────────│
       │── candidate ──────────>│── candidate ──────────>│
       │<── candidate ──────────│<── candidate ──────────│
       │                        │                        │
       │◄═══════════ P2P 연결 (ICE + DTLS) ════════════>│
       │◄═══════════ 미디어 전송 (SRTP) ═══════════════>│
       │                        │                        │
       │   (Signaling 서버는     │                        │
       │    더 이상 관여하지 않음) │                        │
       │                        │                        │
```

# 6. 프로덕션 고려사항

지금까지 구현한 서버는 **최소 기능 서버**이다. 프로덕션에서 사용하려면 추가로 고려해야 할 사항이 있다.

## 6.1 인증과 권한

```
[인증 흐름]

  Client                    Auth Server              Signaling Server
       │                        │                          │
       │── 로그인 ──────────────>│                          │
       │<── JWT 토큰 ────────────│                          │
       │                        │                          │
       │── WebSocket 연결 ──────────────────────────────────>│
       │   (Authorization: Bearer <token>)                  │
       │                        │                          │
       │                        │<── 토큰 검증 요청 ─────────│
       │                        │── 검증 결과 ──────────────>│
       │                        │                          │
       │<── 연결 허용 ──────────────────────────────────────│
```

```go
// 프로덕션용 WebSocket 핸들러 (인증 추가)
func (s *SignalingServer) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
    // JWT 토큰 검증
    token := r.URL.Query().Get("token")
    claims, err := validateJWT(token)
    if err != nil {
        http.Error(w, "unauthorized", http.StatusUnauthorized)
        return
    }

    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        return
    }

    peer := NewPeer(claims.UserID, conn)
    // ...
}
```

## 6.2 방 크기 제한

```go
const MaxPeersPerRoom = 10

func (s *SignalingServer) handleJoin(peer *Peer, msg *Message) {
    room := s.getOrCreateRoom(msg.Room)

    if len(room.PeerIDs()) >= MaxPeersPerRoom {
        peer.SendError("ROOM_FULL", "room is full")
        return
    }

    room.AddPeer(peer)
    // ...
}
```

## 6.3 Heartbeat (연결 유지 확인)

WebSocket 연결이 끊어졌는데 서버가 모르는 경우를 방지한다.

```go
const (
    PongTimeout = 60 * time.Second
    PingPeriod  = 50 * time.Second // PongTimeout보다 짧아야 함
)

func (p *Peer) ReadLoop(handler func(*Peer, *Message)) {
    defer p.conn.Close()

    p.conn.SetReadDeadline(time.Now().Add(PongTimeout))
    p.conn.SetPongHandler(func(string) error {
        p.conn.SetReadDeadline(time.Now().Add(PongTimeout))
        return nil
    })

    for {
        var msg Message
        if err := p.conn.ReadJSON(&msg); err != nil {
            return
        }
        msg.From = p.id
        handler(p, &msg)
    }
}

func (p *Peer) WritePump() {
    ticker := time.NewTicker(PingPeriod)
    defer ticker.Stop()

    for range ticker.C {
        p.mu.Lock()
        err := p.conn.WriteControl(
            websocket.PingMessage, nil, time.Now().Add(10*time.Second),
        )
        p.mu.Unlock()
        if err != nil {
            return
        }
    }
}
```

## 6.4 Graceful Shutdown

```go
func main() {
    server := NewSignalingServer()

    httpServer := &http.Server{Addr: ":8080"}
    http.HandleFunc("/ws", server.HandleWebSocket)

    // Graceful shutdown
    go func() {
        sigCh := make(chan os.Signal, 1)
        signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
        <-sigCh

        log.Println("Shutting down...")
        ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
        defer cancel()
        httpServer.Shutdown(ctx)
    }()

    log.Printf("Signaling server starting on :8080")
    if err := httpServer.ListenAndServe(); err != http.ErrServerClosed {
        log.Fatal(err)
    }
}
```

## 6.5 프로덕션 체크리스트

| 항목 | 최소 서버 | 프로덕션 |
|------|----------|---------|
| 인증/권한 | X | JWT 또는 세션 기반 인증 |
| TLS (WSS) | X | 필수. Let's Encrypt 또는 리버스 프록시 |
| 방 크기 제한 | X | 서비스 요구사항에 맞게 |
| Heartbeat | X | Ping/Pong으로 좀비 연결 감지 |
| 재연결 처리 | X | 클라이언트 재연결 시 방 복귀 |
| 로깅/모니터링 | 기본 log | 구조화된 로깅 (JSON), 메트릭 수집 |
| 수평 확장 | 단일 인스턴스 | Redis Pub/Sub 또는 NATS로 인스턴스 간 메시지 동기화 |
| Rate Limiting | X | 피어당 메시지 빈도 제한 |
| Origin 검증 | 모든 Origin 허용 | 허용된 도메인만 |
| Graceful Shutdown | X | 시그널 핸들링 + 연결 정리 |

## 6.6 수평 확장

단일 서버 인스턴스로는 동시 접속자가 늘어났을 때 한계가 있다. 여러 인스턴스를 운영하려면 인스턴스 간 메시지 동기화가 필요하다.

```
[수평 확장 구조]

  Client A ──> Signaling #1 ──┐
                              ├── Redis Pub/Sub ──> 메시지 동기화
  Client B ──> Signaling #2 ──┘

  Client A가 #1에, Client B가 #2에 연결된 경우:
  1. Client A가 #1에 Offer 전송
  2. #1이 Redis에 Publish
  3. #2가 Redis에서 Subscribe하여 수신
  4. #2가 Client B에게 Offer 전달
```

```go
// Redis Pub/Sub 기반 인스턴스 간 동기화 (개념)
type ClusteredSignalingServer struct {
    local  *SignalingServer
    redis  *redis.Client
    nodeID string
}

func (c *ClusteredSignalingServer) handleRelay(peer *Peer, msg *Message) {
    // 로컬에서 대상 피어 찾기
    if c.local.sendToLocal(msg) {
        return // 같은 인스턴스에 있으면 직접 전달
    }

    // 없으면 Redis로 다른 인스턴스에 전파
    c.redis.Publish(ctx, "signaling:"+msg.Room, marshalMessage(msg))
}
```

# 7. 정리

| 항목 | 핵심 내용 |
|------|----------|
| **Signaling의 역할** | SDP와 ICE Candidate 텍스트 메시지 중계. 미디어는 처리하지 않음 |
| **스펙 외부인 이유** | 기존 인프라 활용, 서비스별 유연성, 단순 텍스트 중계 |
| **추천 방식** | WebSocket (양방향, 실시간, Trickle ICE 자연스러움) |
| **최소 기능** | Room 관리, Peer 관리, Offer/Answer 중계, ICE Candidate 중계 |
| **구현 핵심** | `from`은 서버에서 설정, `payload`는 파싱 없이 그대로 중계 |
| **프로덕션** | 인증, TLS, Heartbeat, 수평 확장(Redis Pub/Sub) 필요 |

```
[Signaling 서버의 위치]

  ┌───────────────────────────────────────────────────┐
  │                  WebRTC 통신                       │
  │                                                   │
  │  ┌─────────────┐    P2P 미디어     ┌─────────────┐│
  │  │   Peer A    │◄═══════════════►│   Peer B    ││
  │  └──────┬──────┘                 └──────┬──────┘│
  │         │                               │       │
  │         │    Signaling (SDP/ICE)         │       │
  │         │    ┌──────────────┐           │       │
  │         └───>│  Signaling   │<──────────┘       │
  │              │   Server     │                   │
  │              │  (이 편에서    │                   │
  │              │   구현한 것)   │                   │
  │              └──────────────┘                   │
  │                                                   │
  │  Signaling은 연결 수립 시에만 사용                   │
  │  연결 후 미디어는 P2P (또는 SFU/TURN)로 직접 전달     │
  └───────────────────────────────────────────────────┘
```

다음 편에서는 Golang WebRTC 라이브러리인 **Pion**을 소개하고, 이 Signaling 서버와 연동하여 브라우저 ↔ Golang 피어 간 실제 WebRTC 연결을 수립해본다.

## 참고 자료

- [WebRTC for the Curious - Signaling](https://webrtcforthecurious.com/ko/docs/02-signaling/)
- [gorilla/websocket GitHub](https://github.com/gorilla/websocket)
- [gorilla/websocket 패키지 문서](https://pkg.go.dev/github.com/gorilla/websocket)
- [MDN - WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
