# WebRTC 블로그 그룹 구성 PRD (v2)

## 1. 목표

기존 13편의 WebRTC 블로그 시리즈를 **4개 그룹**으로 재구성한다. 각 그룹은 하나의 `index.md`로 통합하며, 실습 코드(`tutorials-go/webrtc`)의 3개 프로젝트와 직접 매핑한다.

## 2. 기존 시리즈 → 그룹 매핑

| 기존 편 | 제목 | 그룹 |
|---------|------|------|
| 편1 | WebRTC 개요 | **그룹1: 기초** |
| 편2 | 전체 구조 한 눈에 보기 | **그룹1: 기초** |
| 편3 | 핵심 개념 (SDP, ICE, STUN, TURN) | **그룹1: 기초** |
| 편4 | 연결 흐름 Step-by-Step | **그룹1: 기초** |
| 편5 | Signaling Server 설계 | **그룹2: P2P 영상통화** |
| 편7 | 첫 WebRTC 연결 실습 | **그룹2: P2P 영상통화** |
| 편8 | DataChannel 실습 | **그룹2: P2P 영상통화** |
| 편9 | Media 스트림 실습 | **그룹2: P2P 영상통화** |
| 편6 | Pion WebRTC 라이브러리 | **그룹3: SFU 다자간 회의** |
| 편11 | SFU와 MCU 확장 구조 | **그룹3: SFU 다자간 회의** |
| 편12 | 보안과 운영 | **그룹3: SFU 다자간 회의** |
| 편10 | 네트워크 이슈와 트러블슈팅 | **그룹4: 운영과 기술 선택** |
| 편13 | 기술 선택 가이드 | **그룹4: 운영과 기술 선택** |

## 3. 실습 코드 매핑

```
tutorials-go/webrtc/
├── simple-p2p/                  → 그룹2에서 참조
├── multi-users-sfu-pion/        → 그룹3에서 참조
└── multi-users-sfu-livekit/     → 그룹3에서 참조
```

| 실습 코드 | 그룹 | 역할 |
|----------|------|------|
| `simple-p2p` | 그룹2: P2P 영상통화 | Signaling 릴레이 + 브라우저 P2P 연결 |
| `multi-users-sfu-pion` | 그룹3: SFU 다자간 회의 | Pion으로 SFU 직접 구현 |
| `multi-users-sfu-livekit` | 그룹3: SFU 다자간 회의 | LiveKit으로 프로덕션 SFU 구현 |

## 4. 디렉토리 구조

```
docs/start/webrtc/
├── 1_webrtc_prd.md                  ← 기존 PRD (보존)
├── 2_webrtc_prd.md                  ← 본 문서 (그룹 구성 PRD)
│
├── basics/index.md                  ← 그룹1: WebRTC 기초
├── p2p/index.md                     ← 그룹2: 1:1 P2P 영상통화
├── sfu/index.md                     ← 그룹3: 다자간 SFU 회의
└── ops/index.md                     ← 그룹4: 운영과 기술 선택
```

기존 13편 디렉토리(`1_overview/`, `2_architecture/` 등)는 그룹 작성 완료 후 삭제한다.

## 5. 그룹별 상세 구성

각 그룹의 `index.md`는 아래 흐름을 따른다:

```
1. 기본 내용 (개념/이론)
2. 기능 (무엇을 할 수 있는가)
3. 아키텍처 (내부 동작 원리)
4. 실습 코드 (tutorials-go/webrtc 참조)
```

---

### 5.1 그룹1: WebRTC 기초 (`basics/index.md`)

**출처:** 편1 (개요) + 편2 (구조) + 편3 (핵심개념) + 편4 (연결흐름)

**실습 코드:** 없음 (이론 전용)

**목차 구성:**

```
# 1. WebRTC란 무엇인가
  ## 1.1 왜 WebRTC인가
    - HTTP/WebSocket과의 차이점
    - 개방형 표준, 의무적 암호화, NAT 우회, 초저지연
  ## 1.2 대표적인 사용 사례
    - 화상회의, 실시간 스트리밍, 원격 제어, P2P 파일 전송

# 2. 전체 구조
  ## 2.1 프로토콜 스택
    - Signaling → Connecting → Securing → Communicating
  ## 2.2 구성 요소
    - Media (음성/영상), Transport (전송), Signaling (외부)
  ## 2.3 P2P vs SFU vs MCU
    - 토폴로지 개요 (상세는 그룹3에서)

# 3. 핵심 개념
  ## 3.1 SDP (Session Description Protocol)
    - Offer/Answer 모델, 실제 SDP 예시 분석
  ## 3.2 ICE (Interactive Connectivity Establishment)
    - Candidate 유형 (Host, Server Reflexive, Relay)
    - 연결 우선순위
  ## 3.3 STUN과 TURN
    - STUN: 공인 IP 확인
    - TURN: 릴레이 서버, 비용 문제
  ## 3.4 NAT 유형과 통과 전략
    - Full Cone, Restricted, Port Restricted, Symmetric
  ## 3.5 보안: DTLS + SRTP
    - 키 교환 흐름 (상세는 그룹3에서)

# 4. 연결 흐름 Step-by-Step
  ## 4.1 연결 수립 6단계
    1. Signaling 서버 연결
    2. Offer 생성 (createOffer → setLocalDescription)
    3. Answer 생성 (createAnswer → setRemoteDescription)
    4. ICE Candidate 교환 (addIceCandidate)
    5. PeerConnection 연결 완료
    6. Media/Data 전송 시작
  ## 4.2 전체 시퀀스 다이어그램
  ## 4.3 주요 API 메서드 정리
    - RTCPeerConnection, addTrack, createOffer/Answer, setLocal/RemoteDescription
```

---

### 5.2 그룹2: 1:1 P2P 영상통화 (`p2p/index.md`)

**출처:** 편5 (Signaling) + 편7 (첫 연결) + 편8 (DataChannel) + 편9 (Media)

**실습 코드:** `tutorials-go/webrtc/simple-p2p/`

**코드 구조:**

```
simple-p2p/
├── backend/
│   ├── main.go                    # Echo 서버 (:8080)
│   ├── handler/signaling.go       # WebSocket Signaling 릴레이
│   └── room/manager.go            # Room 관리 (2명 제한)
├── frontend/
│   ├── src/App.tsx                # 메인 UI (입장 + 통화 화면)
│   ├── src/hooks/useSignaling.ts  # WebSocket 연결 훅
│   ├── src/hooks/useWebRTC.ts     # PeerConnection + DataChannel + Media
│   ├── src/components/VideoPanel.tsx  # 로컬/리모트 영상
│   └── src/components/ChatPanel.tsx   # DataChannel 채팅
└── Makefile
```

**목차 구성:**

```
# 1. Signaling Server
  ## 1.1 왜 Signaling이 필요한가
    - WebRTC 스펙에 포함되지 않는 이유
  ## 1.2 Signaling 방식 비교
    - WebSocket vs HTTP vs MQTT
  ## 1.3 Signaling 메시지 구조
    - type: offer | answer | ice
  ## 1.4 아키텍처
    - 브라우저 A ↔ WebSocket ↔ Go 서버 ↔ WebSocket ↔ 브라우저 B
  ## 1.5 실습 코드
    - backend/handler/signaling.go: 메시지 릴레이 루프
    - backend/room/manager.go: Join/Leave/GetPeer

# 2. 첫 WebRTC 연결
  ## 2.1 PeerConnection 생성
  ## 2.2 Offer/Answer 교환
  ## 2.3 ICE Candidate 처리
  ## 2.4 연결 상태 모니터링
  ## 2.5 실습 코드
    - frontend/hooks/useWebRTC.ts: startCall(), createOffer()
    - frontend/hooks/useSignaling.ts: WebSocket 메시지 관리

# 3. DataChannel
  ## 3.1 DataChannel 개념
    - SCTP 기반, WebSocket과 비교
  ## 3.2 DataChannel 기능
    - 순서 보장/비보장, 신뢰/비신뢰 전송 모드
  ## 3.3 실습 코드
    - useWebRTC.ts: setupDataChannel(), sendChat()
    - ChatPanel.tsx: 채팅 UI

# 4. Media 스트림
  ## 4.1 Track 개념
    - Audio/Video Track, MediaStream
  ## 4.2 RTP / RTCP
    - RTP 패킷 구조, RTCP 피드백 메커니즘
  ## 4.3 코덱
    - VP8/VP9/H.264, Opus
  ## 4.4 실습 코드
    - useWebRTC.ts: getUserMedia(), addTrack(), ontrack
    - VideoPanel.tsx: 로컬/리모트 영상 표시

# 5. 실행 방법
  ## 5.1 사전 준비
  ## 5.2 백엔드 실행
  ## 5.3 프론트엔드 실행
  ## 5.4 동작 확인
```

---

### 5.3 그룹3: 다자간 SFU 회의 (`sfu/index.md`)

**출처:** 편6 (Pion) + 편11 (SFU/MCU) + 편12 (보안/운영)

**실습 코드:** `tutorials-go/webrtc/multi-users-sfu-pion/` + `tutorials-go/webrtc/multi-users-sfu-livekit/`

**코드 구조:**

```
multi-users-sfu-pion/                         multi-users-sfu-livekit/
├── backend/                                  ├── backend/
│   ├── main.go                               │   └── main.go (56줄, 토큰 발급만)
│   ├── handler/signaling.go (277줄)          │
│   │   ├── handleOffer/Answer/ICE            │
│   │   ├── setupTrackForwarding              │
│   │   ├── addExistingTracks                 │
│   │   └── renegotiate                       │
│   ├── room/manager.go (117줄)               │
│   │   ├── Join/Leave/Broadcast              │
│   │   └── GetRoom/GetOtherPeers             │
│   └── sfu/peer.go (123줄)                   │
│       ├── PeerConnection 래핑               │
│       ├── AddRemoteTrack/RemoveTrack        │
│       └── RTP 포워딩 관리                    │
├── frontend/                                 ├── frontend/
│   ├── src/hooks/useWebRTC.ts               │   ├── src/hooks/useRoom.ts (LiveKit SDK)
│   ├── src/hooks/useSignaling.ts            │   │
│   ├── src/components/VideoGrid.tsx         │   ├── src/components/VideoGrid.tsx
│   └── src/components/ChatPanel.tsx         │   └── src/components/ChatPanel.tsx
└── Makefile                                  └── Makefile + docker-compose.yml
```

**목차 구성:**

```
# 1. P2P의 한계
  ## 1.1 참가자 수 증가 시 문제
    - 연결 수: N×(N-1)/2, 대역폭 선형 증가
  ## 1.2 해결 방법: 서버 중계

# 2. SFU vs MCU
  ## 2.1 SFU (Selective Forwarding Unit)
    - 패킷 포워딩, 트랜스코딩 없음
  ## 2.2 MCU (Multipoint Control Unit)
    - 서버 믹싱, 높은 서버 부하
  ## 2.3 비교표
    - P2P / SFU / MCU 장단점

# 3. Pion WebRTC 라이브러리
  ## 3.1 Pion 개요
    - Pure Go, 표준 WebRTC API 매핑
  ## 3.2 핵심 컴포넌트
    - PeerConnection, Track, DataChannel, ICEServer
  ## 3.3 브라우저 API vs Pion API 비교

# 4. Pion SFU 아키텍처
  ## 4.1 전체 아키텍처
    - 브라우저 ↔ WebSocket ↔ Go SFU ↔ Pion PeerConnection
  ## 4.2 RTP 포워딩 핵심 로직
    - remoteTrack.Read() → localTrack.Write()
  ## 4.3 Renegotiation
    - 참가자 입장/퇴장 시 트랙 추가/제거 → 재협상
  ## 4.4 실습 코드: multi-users-sfu-pion
    - sfu/peer.go: Peer 구조체, AddRemoteTrack, RemoveTrack
    - handler/signaling.go: setupTrackForwarding, renegotiate
    - room/manager.go: Room 관리, Broadcast

# 5. LiveKit SFU
  ## 5.1 왜 LiveKit인가
    - Pion 직접 구현 vs 프로덕션 SFU
    - 코드량 비교: 545줄 → 56줄
  ## 5.2 LiveKit 아키텍처
    - Docker 컨테이너, JWT 토큰 인증
  ## 5.3 실습 코드: multi-users-sfu-livekit
    - backend/main.go: 토큰 발급 (auth.NewAccessToken)
    - frontend/hooks/useRoom.ts: LiveKit SDK Room 연결

# 6. 보안과 운영
  ## 6.1 DTLS 핸드셰이크
    - 6 Flight 과정, Fingerprint 검증
  ## 6.2 SRTP 키 도출
    - DTLS Master Secret → SRTP 키
  ## 6.3 인증 설계
    - JWT 기반 Signaling 인증, TURN REST API
  ## 6.4 TURN 서버 운영
    - coturn 설정, TLS, 방화벽
  ## 6.5 모니터링
    - Prometheus 메트릭, Grafana 대시보드

# 7. 실행 방법
  ## 7.1 Pion SFU 버전 실행
  ## 7.2 LiveKit 버전 실행
  ## 7.3 동작 비교
```

---

### 5.4 그룹4: 운영과 기술 선택 (`ops/index.md`)

**출처:** 편10 (트러블슈팅) + 편13 (기술 선택)

**실습 코드:** 없음 (운영 지식)

**목차 구성:**

```
# 1. 네트워크 트러블슈팅
  ## 1.1 연결 실패 유형
    - Signaling 실패, ICE 실패, DTLS 실패, Media 없음, 연결 끊김
  ## 1.2 진단 체크리스트
    - ICE 상태 확인 → Candidate 분석 → STUN/TURN 점검
  ## 1.3 ICE 상태 머신
    - new → checking → connected → completed → failed/disconnected
  ## 1.4 환경별 대응
    - 로컬, 사내망, 기업 방화벽, 클라우드, 모바일
  ## 1.5 자주 보는 에러 패턴과 해결

# 2. WebRTC를 언제 쓰면 안 되는가
  ## 2.1 WebRTC가 과한 경우
    - 대규모 단방향 스트리밍, 텍스트 메시징, 서버→클라이언트 푸시
  ## 2.2 대안 기술 비교
    - WebSocket, SSE, HLS/DASH, LL-HLS, RTMP, WebTransport
  ## 2.3 프로토콜별 심층 비교
    - WebRTC vs WebSocket vs HLS vs RTMP vs SSE

# 3. 기술 선택 가이드
  ## 3.1 의사결정 트리
    - 통신 방향 → 지연 허용 범위 → 동시 사용자 수
  ## 3.2 실제 서비스 분석
    - Twitch (RTMP+LL-HLS), Google Meet (WebRTC+SFU), 하이브리드 패턴
  ## 3.3 선택 체크리스트

# 4. 새로운 표준
  ## 4.1 WHIP / WHEP
  ## 4.2 WebTransport
  ## 4.3 MoQ (Media over QUIC)
```

## 6. 코드 참조 방식

블로그에서 실습 코드를 참조할 때 아래 형식을 따른다.

### 6.1 GitHub 링크 + 핵심 발췌

```markdown
전체 코드: [`handler/signaling.go`](https://github.com/kenshin579/tutorials-go/blob/master/webrtc/simple-p2p/backend/handler/signaling.go)

핵심은 SDP/ICE 메시지를 상대 피어에게 릴레이하는 부분이다.

‍```go
// handler/signaling.go - 메시지 릴레이
peer := s.rm.GetPeer(roomID, ws)
if peer != nil {
    peer.WriteMessage(websocket.TextMessage, msg)
}
‍```
```

### 6.2 코드 발췌 기준

- **전체 파일을 인라인하지 않는다** — GitHub 링크로 대체
- **핵심 로직만 발췌** — 해당 섹션에서 설명하는 개념과 직결되는 코드 10~30줄
- **파일 경로를 명시** — 어떤 파일의 어떤 부분인지 코멘트로 표기

## 7. 작성 순서

```
1단계: 그룹1 (basics)     ← 이론, 코드 의존성 없음
2단계: 그룹2 (p2p)        ← simple-p2p 코드 참조
3단계: 그룹3 (sfu)        ← sfu-pion + sfu-livekit 코드 참조
4단계: 그룹4 (ops)        ← 이론, 코드 의존성 없음
```

## 8. 기술 스택 (업데이트)

| 항목 | simple-p2p | sfu-pion | sfu-livekit |
|------|-----------|----------|-------------|
| **언어** | Go + TypeScript | Go + TypeScript | Go + TypeScript |
| **백엔드 프레임워크** | Echo v4 | Echo v4 | Echo v4 |
| **WebSocket** | gorilla/websocket | gorilla/websocket | - (LiveKit 내장) |
| **WebRTC (서버)** | - (릴레이만) | Pion WebRTC v4 | LiveKit Server |
| **WebRTC (클라이언트)** | 브라우저 내장 API | 브라우저 내장 API | livekit-client SDK |
| **프론트엔드** | React 19 + Vite | React 18 + Vite | React 19 + Vite |
| **STUN** | Google STUN | Google STUN | LiveKit 내장 |
| **인증** | - | - | JWT (livekit/protocol/auth) |
| **인프라** | - | - | Docker (LiveKit Server) |

## 9. 참고 자료

- [WebRTC for the Curious (한국어)](https://webrtcforthecurious.com/ko/)
- [Pion WebRTC GitHub](https://github.com/pion/webrtc)
- [LiveKit 공식 문서](https://docs.livekit.io/)
- [MDN WebRTC API](https://developer.mozilla.org/ko/docs/Web/API/WebRTC_API)
- [WebRTC 공식 사이트](https://webrtc.org/)
