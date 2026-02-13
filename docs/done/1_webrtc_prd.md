# WebRTC 스터디 PRD (블로그 시리즈 기획)

## 1. 목표

WebRTC(Web Real-Time Communication)를 체계적으로 학습하고, 학습한 내용을 **블로그 시리즈**로 정리한다. 개념 이해에서 시작해 Golang(Pion) 기반 실습까지 다루며, 최종적으로 실무에서 활용 가능한 수준까지 도달하는 것을 목표로 한다.

## 2. 배경

- WebRTC는 브라우저 및 모바일 앱에서 **플러그인 없이** 실시간 음성/영상/데이터 통신을 가능하게 하는 개방형 표준이다
- HTTP/WebSocket과 달리 **P2P 연결**을 기본으로 하여 1초 미만의 초저지연 통신이 가능하다
- 화상회의, 실시간 스트리밍, 로봇/원격 제어 등 다양한 분야에서 활용된다
- 개념 → 신호 흐름 → 실제 구현 순서로 학습하지 않으면 헷갈리기 쉬운 기술이다

## 3. 블로그 시리즈 구성

### 3.1 편 1: WebRTC 개요 - 왜 필요한가?

**다루는 내용:**
- WebRTC란 무엇인가 (API이자 프로토콜)
- 왜 WebRTC를 쓰는가
  - HTTP / WebSocket과의 차이점
  - 개방형 표준, 의무적 암호화, NAT 우회, 초저지연
- WebRTC가 해결하려는 문제
  - 실시간성 (1초 미만 지연)
  - NAT / 방화벽 통과
- 대표적인 사용 사례
  - 화상회의 (Google Meet, Zoom)
  - 실시간 스트리밍
  - 로봇/원격 제어
  - P2P 파일 전송

**참고 자료:**
- https://webrtcforthecurious.com/ko/docs/01-what-why-and-how/

### 3.2 편 2: WebRTC 전체 구조 한 눈에 보기

**다루는 내용:**
- WebRTC 4단계 프로토콜 구조
  - 시그널링 (Signaling)
  - 연결 (Connecting)
  - 보안 (Securing)
  - 통신 (Communicating)
- WebRTC 구성 요소
  - Media (음성/영상)
  - Transport (전송 계층)
  - Signaling (WebRTC 스펙 외부)
- Peer-to-Peer 구조 이해
  - Client ↔ Client (P2P)
  - Client ↔ Server (SFU/MCU)

### 3.3 편 3: 핵심 개념 정리 - SDP, ICE, STUN, TURN

**다루는 내용:**
- SDP (Session Description Protocol)
  - Offer / Answer 모델
  - Codec, bitrate, media 정보가 담긴 평문 텍스트 프로토콜
- ICE (Interactive Connectivity Establishment)
  - 후보(Candidate)란?
  - 연결 우선순위 (Host → Server Reflexive → Relay)
- STUN (Session Traversal Utilities for NAT)
  - 내 공인 IP를 알아내는 역할
- TURN (Traversal Using Relays around NAT)
  - TURN이 필요한 경우 (대칭 NAT 등)
  - TURN 비용이 비싼 이유 (모든 트래픽이 서버 경유)
- NAT / Firewall 개념 정리
- 보안: DTLS 키 교환 + SRTP 미디어 암호화

### 3.4 편 4: WebRTC 연결 흐름 (Step-by-Step)

**다루는 내용:**
- 연결 수립 6단계
  1. Signaling 서버 연결
  2. Offer 생성 (`createOffer` → `setLocalDescription`)
  3. Answer 생성 (`createAnswer` → `setRemoteDescription`)
  4. ICE Candidate 교환 (`addIceCandidate`)
  5. PeerConnection 연결 완료
  6. Media/Data 전송 시작
- 전체 흐름 시퀀스 다이어그램
- 주요 API 메서드 정리
  - `RTCPeerConnection`, `addTrack`, `createOffer`, `setLocalDescription`, `setRemoteDescription`, `addIceCandidate`

### 3.5 편 5: Signaling Server 설계

**다루는 내용:**
- WebRTC에서 Signaling이 필요한 이유 (WebRTC 스펙에 포함되지 않음)
- Signaling 방식 비교
  - WebSocket (가장 일반적)
  - HTTP API (폴링)
  - MQTT (IoT/로봇 시스템 관점)
- Signaling 서버 최소 요구사항
  - Room 관리
  - Peer 관리
  - Offer / Answer 전달
  - ICE Candidate 전달
- Golang으로 WebSocket 기반 Signaling 서버 구현

### 3.6 편 6: Golang WebRTC 라이브러리 - Pion

**다루는 내용:**
- Pion WebRTC 개요 및 선택 이유
- Pion의 주요 컴포넌트
  - PeerConnection
  - Track (Audio/Video)
  - DataChannel
- 브라우저 WebRTC API와의 차이점
- 개발 환경 세팅

### 3.7 편 7: 실습 - 가장 단순한 WebRTC 연결

**다루는 내용:**
- 브라우저 ↔ Golang Peer 연결
- 시나리오: 브라우저(Offerer) → Golang(Answerer)
- 최소 코드 구성
  - WebSocket 기반 Signaling
  - PeerConnection 생성
  - ICE Candidate 처리
- 동작 확인 및 디버깅

### 3.8 편 8: 실습 - DataChannel 사용하기

**다루는 내용:**
- DataChannel 개념 (SCTP 기반)
- DataChannel vs WebSocket 비교
  - P2P 직접 통신 vs 서버 경유
  - 순서 보장/비보장 선택 가능
- 실습
  - Ping/Pong 메시지
  - JSON 메시지 교환
  - 로봇 제어 명령 전달 예제

### 3.9 편 9: 실습 - Media 스트림 다루기

**다루는 내용:**
- Video/Audio Track 개념
- RTP / RTCP 기본 개념
- 실습 시나리오
  - Golang → 브라우저 Video 스트리밍
  - 테스트 영상으로 대체 가능

### 3.10 편 10: 네트워크 이슈와 트러블슈팅

**다루는 내용:**
- 연결이 안 될 때 체크리스트
  - ICE 연결 상태 확인
  - Candidate 로그 분석
  - STUN/TURN 설정 점검
- 자주 보는 에러 패턴
- 환경별 차이
  - 로컬 (localhost)
  - 사내망 (NAT 뒤)
  - 클라우드 (공인 IP)

### 3.11 편 11: 확장 구조 - SFU와 MCU

**다루는 내용:**
- P2P 구조의 한계 (참가자 수 증가 시 대역폭 문제)
- SFU (Selective Forwarding Unit) 개념
- MCU (Multipoint Control Unit) 개념
- 대표적인 SFU 서버
  - Janus
  - mediasoup
- Golang에서의 확장 전략

### 3.12 편 12: 보안과 운영

**다루는 내용:**
- DTLS / SRTP 개념 심화
- 인증 처리 위치 (Signaling 단계)
- TURN 서버 운영 시 고려사항
- 로그 / 모니터링 포인트

### 3.13 편 13: WebRTC를 언제 쓰면 안 되는가

**다루는 내용:**
- WebRTC가 과한 경우
- 대안 기술 비교
  - WebSocket: 양방향이지만 서버 경유
  - RTMP: 스트리밍 전용
  - HLS/DASH: 준실시간 대규모 배포
- 실시간 vs 준실시간 판단 기준

## 4. 추천 학습 순서

```
1단계: 개념 잡기
  편 1 (개요) → 편 2 (전체 구조) → 편 3 (핵심 개념) → 편 4 (연결 흐름)
  * 이 단계에서 시퀀스 다이어그램을 그릴 수 있어야 한다

2단계: 직접 구현
  편 5 (Signaling 서버) → 편 6 (Pion 소개) → 편 7 (첫 연결 실습)

3단계: 기능 확장
  편 8 (DataChannel) → 편 9 (Media 스트림)

4단계: 운영 수준
  편 10 (트러블슈팅) → 편 11 (SFU/MCU) → 편 12 (보안/운영)

5단계: 판단력
  편 13 (언제 쓰면 안 되는가)
```

## 5. 기술 스택

| 항목 | 기술 |
|------|------|
| 언어 | Golang |
| WebRTC 라이브러리 | Pion WebRTC |
| Signaling | WebSocket (gorilla/websocket 또는 nhooyr/websocket) |
| 프론트엔드 | 브라우저 내장 WebRTC API (JavaScript) |
| STUN 서버 | Google Public STUN (`stun:stun.l.google.com:19302`) |
| TURN 서버 | coturn (필요 시) |

## 6. 참고 자료

- [WebRTC for the Curious (한국어)](https://webrtcforthecurious.com/ko/)
- [Pion WebRTC GitHub](https://github.com/pion/webrtc)
- [MDN WebRTC API](https://developer.mozilla.org/ko/docs/Web/API/WebRTC_API)
- [WebRTC 공식 사이트](https://webrtc.org/)
