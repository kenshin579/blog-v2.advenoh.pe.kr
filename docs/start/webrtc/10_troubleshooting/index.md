---
title: "WebRTC 완벽 가이드 (10): 네트워크 이슈와 트러블슈팅"
description: "WebRTC 연결이 안 될 때 체계적으로 원인을 찾는 방법을 다룹니다. ICE 상태 머신 분석, Candidate 로그 해석, STUN/TURN 점검, 환경별(로컬/사내망/클라우드) 차이, 자주 보는 에러 패턴과 해결법을 정리합니다."
date: 2026-02-07
update: 2026-02-07
tags:
  - WebRTC
  - ICE
  - STUN
  - TURN
  - NAT
  - 트러블슈팅
  - 디버깅
series: "WebRTC 완벽 가이드"
---

9편까지 DataChannel과 Media 스트리밍을 실습했다. 로컬 환경에서는 잘 동작하지만, 실제 네트워크에 배포하면 연결이 안 되거나 끊기는 상황을 만나게 된다. 이번 편에서는 WebRTC 연결 문제를 **체계적으로 진단하고 해결하는 방법**을 다룬다.

# 1. 디버깅 체계: 실패 유형 5가지

WebRTC 문제는 크게 5가지 유형으로 분류할 수 있다. 문제를 만났을 때 가장 먼저 할 일은 **어떤 유형에 해당하는지 판별**하는 것이다.

```
[WebRTC 실패 유형 분류]

  ① Signaling 실패
  │  WebSocket 연결 안 됨, Offer/Answer 교환 실패
  │
  ② Networking 실패
  │  ICE 연결 안 됨, NAT 통과 실패, 방화벽 차단
  │
  ③ Security 실패
  │  DTLS 핸드셰이크 실패, 인증서 문제
  │
  ④ Media 실패
  │  영상/음성 안 나옴, 코덱 불일치, 프레임 깨짐
  │
  ⑤ Data 실패
     DataChannel 안 열림, 메시지 전달 안 됨
```

## 1.1 빠른 판별 흐름도

```
[문제 진단 흐름도]

  WebSocket 연결이 되는가?
  ├── NO → ① Signaling 실패
  │         → 서버 주소, 포트, CORS, TLS 확인
  │
  └── YES
       │
  Offer/Answer 교환이 되는가?
  ├── NO → ① Signaling 실패
  │         → 메시지 포맷, SDP 파싱 에러 확인
  │
  └── YES
       │
  ICE connectionState가 connected인가?
  ├── NO → ② Networking 실패
  │         → ICE Candidate, STUN/TURN, NAT, 방화벽 확인
  │
  └── YES
       │
  connectionState가 connected인가?
  ├── NO → ③ Security 실패
  │         → DTLS 핸드셰이크, fingerprint 확인
  │
  └── YES
       │
  DataChannel이 열리는가? / 영상이 나오는가?
  ├── DataChannel 안 열림 → ⑤ Data 실패
  └── 영상 안 나옴 → ④ Media 실패
```

# 2. 연결 상태 머신

## 2.1 두 가지 상태: iceConnectionState vs connectionState

WebRTC에는 두 가지 연결 상태가 있다. 각각 다른 계층을 모니터링한다.

```
[두 상태의 관계]

  connectionState (상위 레벨)
  ├── ICE 전송 상태
  ├── DTLS 핸드셰이크 상태
  └── 전체 연결 상태를 종합

  iceConnectionState (하위 레벨)
  └── ICE 에이전트의 연결 상태만 추적
```

| 구분 | connectionState | iceConnectionState |
|------|----------------|-------------------|
| **범위** | 전체 연결 (ICE+DTLS) | ICE 에이전트만 |
| **용도** | 애플리케이션 로직 | 상세 진단 |
| **권장** | UI 상태 표시에 사용 | 디버깅 시 확인 |

## 2.2 ICE 연결 상태 전이

```
[iceConnectionState 전이 다이어그램]

                ┌──────────┐
                │   new    │
                └────┬─────┘
                     │  ICE 후보쌍 검사 시작
                     ▼
                ┌──────────┐
           ┌───>│ checking │<──── ICE restart
           │    └────┬─────┘
           │         │  유효한 후보쌍 발견
           │         ▼
           │    ┌──────────┐
           │    │connected │◄──── 일시 복구
           │    └────┬─────┘
           │         │  모든 후보쌍 검사 완료
           │         ▼
           │    ┌──────────┐
           │    │completed │
           │    └────┬─────┘
           │         │
           │    ┌────┴────────┐
           │    ▼             ▼
      ┌────────────┐   ┌──────────┐
      │disconnected│   │  failed  │
      └────────────┘   └──────────┘
           │                │
           │  타임아웃       │  close() 호출
           ▼                ▼
      ┌──────────┐    ┌──────────┐
      │  failed  │    │  closed  │
      └──────────┘    └──────────┘
```

## 2.3 각 상태별 의미와 대응

| 상태 | 의미 | 대응 |
|------|------|------|
| `new` | ICE 에이전트 초기화됨 | 정상. Offer/Answer 교환 대기 중 |
| `checking` | 후보쌍 연결성 검사 중 | 정상. STUN/TURN 응답 대기 중 |
| `connected` | 유효한 후보쌍 발견, 통신 가능 | 정상. 미디어/데이터 전송 가능 |
| `completed` | 모든 후보쌍 검사 완료 | 정상. 최적 경로 확정 |
| `disconnected` | 연결 일시 끊김 | **자동 복구 가능**. 네트워크 변경 시 발생 |
| `failed` | 연결 실패. 모든 후보쌍 불가 | **ICE restart 또는 TURN 필요** |
| `closed` | PeerConnection 닫힘 | 정리 완료 |

## 2.4 상태 모니터링 코드

```javascript
// 브라우저: 두 상태 모두 모니터링
pc.oniceconnectionstatechange = () => {
  console.log('ICE:', pc.iceConnectionState);

  switch (pc.iceConnectionState) {
    case 'disconnected':
      console.warn('ICE disconnected - 네트워크 변경? 자동 복구 대기 중');
      break;
    case 'failed':
      console.error('ICE failed - ICE restart 시도');
      pc.restartIce();
      break;
  }
};

pc.onconnectionstatechange = () => {
  console.log('Connection:', pc.connectionState);

  if (pc.connectionState === 'failed') {
    // DTLS 또는 ICE 완전 실패
    // 새 PeerConnection으로 재연결 필요
  }
};
```

```go
// Golang/Pion: 상태 모니터링
pc.OnICEConnectionStateChange(func(state webrtc.ICEConnectionState) {
    log.Printf("ICE state: %s", state.String())
})

pc.OnConnectionStateChange(func(state webrtc.PeerConnectionState) {
    log.Printf("Connection state: %s", state.String())

    switch state {
    case webrtc.PeerConnectionStateDisconnected:
        log.Println("Disconnected - 자동 복구 대기")
    case webrtc.PeerConnectionStateFailed:
        log.Println("Failed - 재연결 필요")
        pc.Close()
    }
})
```

# 3. 연결 안 될 때 체크리스트

## 3.1 단계 1: Signaling 확인

```
[체크리스트]

  □ WebSocket 서버가 실행 중인가?
    → lsof -i :8080 (포트 확인)
    → 서버 로그에 "Server starting" 출력되는지

  □ 브라우저에서 WebSocket 연결이 되는가?
    → 개발자 도구 > Console에 에러 없는지
    → Network 탭에서 WebSocket 연결 확인

  □ Offer/Answer가 정상 교환되는가?
    → 서버 로그에 "Offer received", "Answer sent" 출력
    → SDP 내용이 비어있지 않은지

  □ HTTPS/WSS 환경인가?
    → 프로덕션에서는 WSS 필수
    → 자체 서명 인증서 사용 시 브라우저 경고 확인
```

## 3.2 단계 2: ICE Candidate 확인

```
[체크리스트]

  □ ICE Candidate가 생성되는가?
    → 브라우저: onicecandidate 이벤트 발생 확인
    → 서버: OnICECandidate 콜백 호출 확인

  □ ICE Candidate가 교환되는가?
    → WebSocket으로 candidate 메시지 송수신 로그 확인
    → 양쪽 모두 addIceCandidate 호출 확인

  □ Host Candidate가 있는가?
    → chrome://webrtc-internals → ICE candidates 확인
    → 로컬 IP 주소가 보이는지

  □ Server Reflexive Candidate가 있는가?
    → STUN 서버 응답이 오는지
    → srflx 타입 후보가 있는지
    → 없으면: STUN 서버 접근 불가 (UDP 차단 가능성)

  □ Relay Candidate가 있는가? (TURN 사용 시)
    → relay 타입 후보가 있는지
    → TURN 인증 정보가 올바른지
```

## 3.3 단계 3: STUN/TURN 서버 점검

```
[체크리스트]

  □ STUN 서버 접근 가능한가?
    → 테스트 명령 (아래 참조)

  □ TURN 서버 접근 가능한가?
    → TURN 인증 정보 (username, credential) 확인
    → TURN 서버 포트 (TCP 3478, UDP 3478, TLS 5349) 확인

  □ TURN 서버가 필요한 환경인가?
    → 대칭 NAT 뒤에 있는지
    → 기업 방화벽이 UDP를 차단하는지
```

## 3.4 단계 4: 네트워크/방화벽 확인

```
[체크리스트]

  □ UDP 트래픽이 허용되는가?
    → WebRTC는 기본적으로 UDP 사용
    → 기업 네트워크에서 UDP 차단 흔함

  □ 관련 포트가 열려있는가?
    → STUN/TURN: 3478 (UDP/TCP), 5349 (TLS)
    → 미디어: 동적 UDP 포트 (보통 49152-65535)

  □ DPI(Deep Packet Inspection)가 있는가?
    → 일부 방화벽은 알 수 없는 UDP 패킷 차단
    → TURN over TLS (443 포트) 사용 검토

  □ VPN을 사용 중인가?
    → VPN이 UDP를 터널링하지 않을 수 있음
    → Split tunneling 설정 확인
```

# 4. ICE Candidate 분석

## 4.1 Candidate 문자열 해석

ICE Candidate 문자열에는 연결 경로에 대한 모든 정보가 담겨 있다.

```
[ICE Candidate 문자열 구조]

  candidate:842163049 1 udp 2122260223 192.168.1.100 54321 typ host
  │         │         │ │   │          │              │     │   │
  │         │         │ │   │          │              │     │   └── 후보 타입
  │         │         │ │   │          │              │     └── 포트
  │         │         │ │   │          │              └── IP 주소
  │         │         │ │   │          └── 우선순위
  │         │         │ │   └── 프로토콜 (udp/tcp)
  │         │         │ └── 컴포넌트 ID (1=RTP, 2=RTCP)
  │         │         └── foundation
  │         └── candidate ID
  └── 접두사
```

## 4.2 후보 타입별 의미

```
[ICE Candidate 타입]

  ┌─────────────────────────────────────────────────────────────┐
  │                                                             │
  │  host (로컬 주소)                                           │
  │  candidate:... 192.168.1.100 54321 typ host                │
  │  → 로컬 네트워크 인터페이스의 IP                              │
  │  → 같은 네트워크 내에서 직접 연결 가능                        │
  │  → 우선순위 가장 높음                                        │
  │                                                             │
  ├─────────────────────────────────────────────────────────────┤
  │                                                             │
  │  srflx (Server Reflexive, STUN 응답)                        │
  │  candidate:... 203.0.113.50 12345 typ srflx                │
  │    raddr 192.168.1.100 rport 54321                         │
  │  → STUN 서버가 알려준 NAT 외부 주소                          │
  │  → 다른 네트워크의 피어와 연결 가능 (NAT 타입에 따라)          │
  │  → raddr/rport = 원래 로컬 주소                             │
  │                                                             │
  ├─────────────────────────────────────────────────────────────┤
  │                                                             │
  │  prflx (Peer Reflexive, ICE 검사 중 발견)                    │
  │  candidate:... 203.0.113.51 23456 typ prflx                │
  │  → 연결성 검사 중 발견된 NAT 외부 주소                        │
  │  → STUN 응답과 다른 매핑일 수 있음                           │
  │                                                             │
  ├─────────────────────────────────────────────────────────────┤
  │                                                             │
  │  relay (TURN 릴레이)                                        │
  │  candidate:... 198.51.100.10 56789 typ relay               │
  │    raddr 203.0.113.50 rport 12345                          │
  │  → TURN 서버가 할당한 릴레이 주소                             │
  │  → 모든 트래픽이 TURN 서버를 경유                             │
  │  → 우선순위 가장 낮음 (비용 높음)                             │
  │  → 마지막 수단 (다른 후보로 연결 불가할 때)                    │
  │                                                             │
  └─────────────────────────────────────────────────────────────┘
```

## 4.3 후보가 없을 때 원인

```
[후보 타입별 미생성 원인]

  host 후보가 없음:
  ├── 원인: 네트워크 인터페이스 없음 (드문 경우)
  └── 확인: ifconfig / ip addr

  srflx 후보가 없음:
  ├── 원인 1: STUN 서버 접근 불가 (UDP 차단)
  ├── 원인 2: STUN 서버 주소 오류
  ├── 원인 3: DNS 해석 실패
  └── 확인: STUN 서버 테스트 (아래 참조)

  relay 후보가 없음:
  ├── 원인 1: TURN 서버 미설정
  ├── 원인 2: TURN 인증 실패 (username/credential)
  ├── 원인 3: TURN 서버 접근 불가
  └── 확인: TURN 서버 테스트 (아래 참조)
```

## 4.4 우선순위와 연결 경로 선택

ICE는 후보쌍을 우선순위 순으로 검사한다. 높은 우선순위부터 시도하여 처음 성공한 쌍을 사용한다.

```
[우선순위 순서 (높음 → 낮음)]

  1순위: host ↔ host        (같은 네트워크, 직접 연결)
  2순위: host ↔ srflx       (한쪽이 NAT 뒤)
  3순위: srflx ↔ srflx      (양쪽 NAT 뒤, NAT 타입에 따라)
  4순위: host ↔ relay       (한쪽이 TURN 경유)
  5순위: srflx ↔ relay      (한쪽 NAT + 한쪽 TURN)
  6순위: relay ↔ relay      (양쪽 TURN 경유, 최후 수단)
```

# 5. STUN/TURN 서버 점검

## 5.1 STUN 서버 테스트

### 5.1.1 netcat으로 수동 테스트

```bash
# STUN Binding Request 전송 (20바이트)
# 00 01 = Binding Request
# 00 00 = 데이터 길이 0
# 21 12 a4 42 = Magic Cookie
# 나머지 12바이트 = Transaction ID
echo -ne "\x00\x01\x00\x00\x21\x12\xA4\x42TESTTESTTEST" | \
  nc -u -w 3 stun.l.google.com 19302 | hexdump -C

# 응답이 오면 STUN 서버 정상
# 응답이 없으면 UDP 차단 또는 서버 문제
```

### 5.1.2 tcpdump로 패킷 캡처

```bash
# STUN 패킷 캡처
sudo tcpdump -i any 'udp port 19302' -vv

# 파일로 저장 (Wireshark에서 분석)
sudo tcpdump -i any 'udp port 19302' -w stun_debug.pcap
```

### 5.1.3 브라우저에서 STUN 테스트

```javascript
// 브라우저 콘솔에서 실행
async function testSTUN() {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  pc.createDataChannel('test');

  pc.onicecandidate = (e) => {
    if (e.candidate) {
      console.log('Candidate:', e.candidate.candidate);
      const type = e.candidate.type;
      if (type === 'srflx') {
        console.log('STUN OK - 공인 IP:', e.candidate.address);
      }
    } else {
      console.log('ICE gathering complete');
      pc.close();
    }
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
}

testSTUN();
```

## 5.2 TURN 서버 테스트

### 5.2.1 브라우저에서 TURN 테스트

```javascript
async function testTURN() {
  const pc = new RTCPeerConnection({
    iceServers: [{
      urls: 'turn:turn.example.com:3478',
      username: 'user',
      credential: 'pass'
    }],
    iceTransportPolicy: 'relay'  // relay 후보만 수집
  });

  pc.createDataChannel('test');

  pc.onicecandidate = (e) => {
    if (e.candidate) {
      console.log('Candidate:', e.candidate.candidate);
      if (e.candidate.type === 'relay') {
        console.log('TURN OK - 릴레이 주소:', e.candidate.address);
      }
    } else {
      console.log('ICE gathering complete');
      // relay 후보가 없으면 TURN 서버 문제
      pc.close();
    }
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
}

testTURN();
```

### 5.2.2 turnutils_uclient로 테스트

```bash
# coturn 패키지에 포함된 TURN 테스트 도구
turnutils_uclient -t -u user -w pass turn.example.com

# 성공 시: "Total transmit" 메시지 출력
# 실패 시: 타임아웃 또는 인증 에러
```

## 5.3 TURN 서버 설정 (coturn)

TURN이 필요한 환경에서 coturn을 설치하는 기본 설정이다.

```bash
# 설치 (Ubuntu)
sudo apt install coturn

# /etc/turnserver.conf 주요 설정
listening-port=3478
tls-listening-port=5349
realm=example.com
server-name=example.com
lt-cred-mech
user=webrtc:password123
fingerprint
no-stdout-log
log-file=/var/log/turnserver.log

# TURN over TLS (443 포트, 방화벽 우회)
alt-tls-listening-port=443
cert=/etc/letsencrypt/live/example.com/fullchain.pem
pkey=/etc/letsencrypt/live/example.com/privkey.pem
```

```go
// Golang에서 TURN 서버 설정
pc, _ := webrtc.NewPeerConnection(webrtc.Configuration{
    ICEServers: []webrtc.ICEServer{
        {URLs: []string{"stun:stun.l.google.com:19302"}},
        {
            URLs:       []string{
                "turn:turn.example.com:3478",
                "turns:turn.example.com:5349",  // TLS
            },
            Username:   "webrtc",
            Credential: "password123",
        },
    },
})
```

# 6. 환경별 차이

## 6.1 로컬 환경 (localhost)

```
[로컬 환경 특성]

  네트워크 구조:
  ┌──────────────────────────────┐
  │  같은 머신                    │
  │  브라우저 ◄──── Golang 서버   │
  │  127.0.0.1    127.0.0.1     │
  └──────────────────────────────┘

  후보 타입: host (127.0.0.1, 192.168.x.x)
  연결 경로: host ↔ host (직접 연결)
  NAT:      없음
  STUN:     불필요 (있어도 무방)
  TURN:     불필요
  지연:     ~1ms

  주의 사항:
  ├── 가장 단순한 환경, 대부분 문제 없음
  ├── srflx 후보도 생성되지만 사용되지 않음
  └── 이 환경에서 되는데 다른 환경에서 안 되면
      → NAT/방화벽 문제
```

## 6.2 같은 네트워크 (LAN)

```
[LAN 환경 특성]

  네트워크 구조:
  ┌──────────────────────────────┐
  │  같은 서브넷 (192.168.1.x)   │
  │                              │
  │  PC A ◄──────────► PC B     │
  │  192.168.1.100   192.168.1.101│
  └──────────────────────────────┘

  후보 타입: host (192.168.1.x)
  연결 경로: host ↔ host
  NAT:      없음 (같은 서브넷)
  STUN:     불필요
  TURN:     불필요
  지연:     ~1-5ms

  주의 사항:
  ├── IP 주소가 정확한지 확인
  ├── 방화벽(OS 레벨)이 UDP를 차단하지 않는지
  └── mDNS candidate가 사용될 수 있음 (개인정보 보호)
```

## 6.3 사내망 (NAT 뒤)

```
[사내망 환경 특성]

  네트워크 구조:
  ┌─────────────────────┐          ┌──────────────────────┐
  │  사내망 A             │          │  사내망 B              │
  │  192.168.1.x         │          │  10.0.0.x             │
  │                      │          │                       │
  │  PC A                │          │  PC B                 │
  │  192.168.1.100       │          │  10.0.0.50            │
  └──────────┬───────────┘          └──────────┬────────────┘
             │ NAT                              │ NAT
             │ 203.0.113.10                     │ 198.51.100.20
             │                                  │
        ─────┴──────────── 인터넷 ──────────────┴─────

  후보 타입: host + srflx (STUN 필요)
  연결 경로: srflx ↔ srflx (NAT 타입에 따라)
             또는 relay ↔ relay (대칭 NAT이면)
  NAT:      있음 (타입에 따라 TURN 필요)
  STUN:     필수
  TURN:     대칭 NAT이면 필수
  지연:     ~10-100ms

  자주 발생하는 문제:
  ├── UDP 차단: 기업 방화벽이 UDP를 차단
  │   → 해결: TURN over TCP/TLS (443 포트)
  │
  ├── 대칭 NAT: srflx 후보로 연결 불가
  │   → 해결: TURN 서버 필수
  │
  ├── DPI(심층 패킷 검사): 알 수 없는 UDP 패킷 차단
  │   → 해결: TURN over TLS (443 포트, HTTPS로 위장)
  │
  └── 프록시: HTTP 프록시만 허용
      → 해결: TURN over TCP via 프록시
```

## 6.4 클라우드 (공인 IP)

```
[클라우드 환경 특성]

  네트워크 구조:
  ┌─────────────────────┐
  │  AWS/GCP/Azure      │
  │                     │
  │  서버               │
  │  private: 10.0.1.5  │
  │  public: 54.x.x.x  │  ← Elastic IP / 공인 IP
  └─────────┬───────────┘
            │
       ─────┴─────── 인터넷 ────────┬──────
                                     │
                              ┌──────┴──────┐
                              │  브라우저    │
                              │  (NAT 뒤)   │
                              └─────────────┘

  주의 사항:
  ├── 클라우드 VM은 보통 private IP만 알고 있음
  │   → Pion이 host 후보로 10.0.1.5를 사용
  │   → 브라우저에서 접근 불가!
  │
  ├── 해결 방법 1: NAT 1:1 매핑 설정
  │   Pion SettingEngine에서 NAT 매핑 설정
  │
  ├── 해결 방법 2: STUN으로 공인 IP 발견
  │   srflx 후보로 연결 (보통 동작)
  │
  └── 해결 방법 3: 보안 그룹에서 UDP 포트 열기
      AWS: 인바운드 UDP 3478, 49152-65535
```

### 6.4.1 Pion NAT 1:1 매핑 설정

```go
// 클라우드 환경에서 공인 IP를 직접 지정
settingEngine := webrtc.SettingEngine{}

// NAT 1:1 매핑: private IP → public IP
settingEngine.SetNAT1To1IPs(
    []string{"54.x.x.x"},     // 공인 IP
    webrtc.ICECandidateTypeHost,
)

// UDP 포트 범위 제한 (보안 그룹 설정에 맞춤)
settingEngine.SetEphemeralUDPPortRange(50000, 50100)

api := webrtc.NewAPI(webrtc.WithSettingEngine(settingEngine))
pc, _ := api.NewPeerConnection(webrtc.Configuration{
    ICEServers: []webrtc.ICEServer{
        {URLs: []string{"stun:stun.l.google.com:19302"}},
    },
})
```

## 6.5 모바일 네트워크

```
[모바일 환경 특성]

  네트워크 구조:
  ┌──────────────┐     ┌────────────────┐
  │  모바일 기기   │     │  캐리어 NAT     │
  │  (4G/5G)     │────>│  (CGNAT)       │───> 인터넷
  │              │     │  대칭 NAT 가능   │
  └──────────────┘     └────────────────┘

  특징:
  ├── CGNAT (Carrier-Grade NAT) 사용 → 대칭 NAT 가능
  ├── 네트워크 전환 빈번 (WiFi ↔ LTE)
  │   → disconnected 상태 자주 발생
  │   → ICE restart 필요
  ├── 대역폭 변동 큼
  └── TURN 서버가 높은 확률로 필요

  권장 설정:
  ├── STUN + TURN 모두 설정
  ├── disconnected 상태에서 ICE restart 로직
  └── 적응형 비트레이트 (대역폭에 따라 품질 조절)
```

## 6.6 환경별 요약

| 환경 | STUN | TURN | 예상 후보 | 주요 이슈 |
|------|------|------|----------|----------|
| 로컬 | 불필요 | 불필요 | host | 거의 없음 |
| LAN | 불필요 | 불필요 | host | OS 방화벽 |
| 사내망 | 필수 | 자주 필요 | host+srflx+relay | UDP 차단, 대칭 NAT |
| 클라우드 | 필수 | 가끔 필요 | host+srflx | private IP, 보안 그룹 |
| 모바일 | 필수 | 높은 확률 | host+srflx+relay | CGNAT, 네트워크 전환 |

# 7. 자주 보는 에러 패턴

## 7.1 ICE failed

**증상**: `iceConnectionState`가 `checking` → `failed`로 전이

```
[원인과 해결]

  원인 1: 모든 후보쌍에서 연결 불가
  ├── 진단: chrome://webrtc-internals → ICE candidates 확인
  ├── srflx 후보 없음 → STUN 서버 접근 불가 (UDP 차단)
  ├── relay 후보 없음 → TURN 미설정 또는 인증 실패
  └── 해결: TURN 서버 추가, 방화벽 규칙 확인

  원인 2: ICE Candidate 교환 타이밍 문제
  ├── 진단: Answer 설정 전에 Candidate 도착
  ├── 에러: "cannot add ICE candidate before RemoteDescription"
  └── 해결: Candidate 큐 사용 (7편 참조)

  원인 3: ICE ufrag/pwd 불일치
  ├── 진단: Offer/Answer의 ice-ufrag가 다른지 확인
  └── 해결: SDP 교환 과정 점검

  원인 4: 양쪽 모두 대칭 NAT
  ├── 진단: srflx 후보는 있지만 연결 불가
  └── 해결: 최소 한쪽에 TURN 필요
```

## 7.2 DTLS 핸드셰이크 실패

**증상**: ICE는 connected인데 `connectionState`가 `failed`

```
[원인과 해결]

  원인 1: SDP fingerprint 불일치
  ├── 진단: Answer의 a=fingerprint가 실제 인증서와 일치하는지
  └── 해결: SDP 변조 없이 원본 그대로 전달

  원인 2: DTLS 타임아웃
  ├── 진단: ICE connected 후 몇 초 뒤 failed
  ├── 원인: 방화벽이 DTLS 패킷을 차단 (특정 UDP 패턴 필터링)
  └── 해결: TURN over TLS 사용

  원인 3: Pion과 브라우저 간 DTLS 버전 불일치
  ├── 진단: Pion 버전 확인
  └── 해결: Pion WebRTC 최신 버전 사용
```

## 7.3 미디어 안 나옴

**증상**: 연결은 성공했지만 영상/음성이 재생되지 않음

```
[원인과 해결]

  원인 1: Transceiver 방향 불일치
  ├── 진단: SDP에서 a=sendrecv / a=recvonly / a=sendonly 확인
  ├── 서버가 Track을 AddTrack 했는데 브라우저가 recvonly 아님
  └── 해결: 브라우저에서 addTransceiver('video', {direction:'recvonly'})

  원인 2: 코덱 불일치
  ├── 진단: Offer/Answer의 m= 라인에서 공통 코덱 확인
  ├── 예: 서버는 VP8만, 브라우저는 H.264만 → 교집합 없음
  └── 해결: 양쪽 모두 지원하는 코덱 사용 (VP8 권장)

  원인 3: autoplay 정책
  ├── 진단: 콘솔에 "play() failed" 에러
  ├── Chrome은 음소거 없이 자동 재생 차단
  └── 해결: <video autoplay playsinline muted> + 사용자 인터랙션 후 unmute

  원인 4: RTCP 읽기 미수행 (Pion)
  ├── 진단: 영상이 몇 초 후 멈춤
  ├── PLI/NACK 처리 불가 → 키프레임 재전송 안 됨
  └── 해결: go readRTCP(sender) 고루틴 추가 (9편 참조)

  원인 5: 키프레임 간격 문제
  ├── 진단: 영상이 처음에 안 나오다가 몇 초 후 시작
  ├── 첫 프레임이 P-Frame이면 디코딩 불가
  └── 해결: ffmpeg에서 -g 30 (키프레임 간격 30프레임)
```

## 7.4 DataChannel 안 열림

```
[원인과 해결]

  원인 1: createOffer 전에 DataChannel 미생성
  ├── 진단: SDP에 m=application 라인이 없음
  ├── Offer 후 DataChannel 생성하면 SDP에 포함 안 됨
  └── 해결: createDataChannel()을 createOffer() 전에 호출

  원인 2: 서버에서 OnDataChannel 미등록
  ├── 진단: 서버 측 DataChannel 이벤트 로그 없음
  └── 해결: pc.OnDataChannel(func(dc *DataChannel){...}) 등록

  원인 3: SCTP 연결 실패
  ├── 진단: ICE+DTLS는 connected인데 DataChannel이 안 열림
  └── 해결: SCTP 설정 확인, Pion 버전 업데이트
```

## 7.5 연결이 자주 끊김

```
[원인과 해결]

  원인 1: NAT 매핑 타임아웃 (~5분)
  ├── 진단: 연결 후 일정 시간 뒤 disconnected
  ├── NAT이 미사용 매핑을 제거
  └── 해결: 주기적으로 데이터 전송 (keepalive)

  원인 2: 모바일 네트워크 전환
  ├── 진단: WiFi ↔ LTE 전환 시 disconnected
  └── 해결: ICE restart 로직 구현

  원인 3: 서버 측 타임아웃
  ├── 진단: 서버 로그에 WebSocket 닫힘
  └── 해결: WebSocket heartbeat (ping/pong) 구현
```

# 8. 디버깅 도구

## 8.1 chrome://webrtc-internals/

가장 강력한 WebRTC 디버깅 도구다. 연결에 관한 모든 정보를 실시간으로 확인할 수 있다.

```
[chrome://webrtc-internals/ 에서 확인 가능한 정보]

  ┌─────────────────────────────────────────┐
  │  PeerConnection 목록                     │
  │  ├── SDP (Offer/Answer 전문)            │
  │  ├── ICE Candidates                     │
  │  │   ├── Local candidates (타입, IP, 포트)│
  │  │   ├── Remote candidates              │
  │  │   └── Selected candidate pair        │
  │  ├── 연결 상태 변화 타임라인              │
  │  ├── 통계 그래프                         │
  │  │   ├── 비트레이트 (송신/수신)           │
  │  │   ├── 패킷 손실률                     │
  │  │   ├── 지터                           │
  │  │   ├── RTT                            │
  │  │   └── 프레임 레이트                   │
  │  └── RTCP 통계                          │
  │      ├── nackCount                      │
  │      ├── pliCount                       │
  │      └── firCount                       │
  └─────────────────────────────────────────┘

  사용법:
  1. chrome://webrtc-internals/ 탭 열기
  2. WebRTC 연결이 있는 페이지에서 연결 수행
  3. 자동으로 PeerConnection이 목록에 나타남
  4. 클릭하여 상세 정보 확인
```

## 8.2 Firefox about:webrtc

```
[Firefox 디버깅]

  about:webrtc
  ├── Session Statistics
  ├── ICE Statistics
  ├── RTP Statistics
  └── SDP (Offer/Answer)
```

## 8.3 tcpdump / Wireshark

```bash
# WebRTC 관련 UDP 패킷 캡처
sudo tcpdump -i any udp -w webrtc_debug.pcap

# STUN 패킷만 캡처
sudo tcpdump -i any 'udp port 3478 or udp port 19302' -w stun.pcap

# 특정 IP로 필터링
sudo tcpdump -i any 'host 203.0.113.50 and udp' -w peer.pcap
```

Wireshark에서 pcap 파일을 열면 STUN, DTLS, RTP, RTCP 패킷을 프로토콜별로 해석해 준다.

```
[Wireshark 필터]

  stun          → STUN 패킷만
  dtls          → DTLS 핸드셰이크
  rtp           → RTP 미디어 패킷
  rtcp          → RTCP 제어 패킷
  udp.port==3478 → TURN 서버 통신
```

## 8.4 Golang/Pion 디버깅

### 8.4.1 SDP 내용 출력

```go
// Offer SDP 확인
pc.OnSignalingStateChange(func(state webrtc.SignalingState) {
    if state == webrtc.SignalingStateHaveRemoteOffer {
        log.Printf("Remote Offer SDP:\n%s", pc.RemoteDescription().SDP)
    }
})

// Answer SDP 확인
log.Printf("Local Answer SDP:\n%s", pc.LocalDescription().SDP)
```

### 8.4.2 ICE Candidate 상세 로그

```go
pc.OnICECandidate(func(c *webrtc.ICECandidate) {
    if c == nil {
        log.Println("ICE gathering complete")
        return
    }
    log.Printf("ICE candidate: type=%s protocol=%s address=%s:%d priority=%d",
        c.Typ.String(),
        c.Protocol.String(),
        c.Address,
        c.Port,
        c.Priority,
    )
})
```

### 8.4.3 선택된 후보쌍 확인

```go
pc.OnConnectionStateChange(func(state webrtc.PeerConnectionState) {
    if state == webrtc.PeerConnectionStateConnected {
        // 선택된 후보쌍 확인
        sctp := pc.SCTP()
        if sctp != nil {
            transport := sctp.Transport()
            if transport != nil {
                iceTransport := transport.ICETransport()
                pair, _ := iceTransport.GetSelectedCandidatePair()
                if pair != nil {
                    log.Printf("Selected pair:")
                    log.Printf("  Local:  %s %s:%d (%s)",
                        pair.Local.Protocol.String(),
                        pair.Local.Address, pair.Local.Port,
                        pair.Local.Typ.String())
                    log.Printf("  Remote: %s %s:%d (%s)",
                        pair.Remote.Protocol.String(),
                        pair.Remote.Address, pair.Remote.Port,
                        pair.Remote.Typ.String())
                }
            }
        }
    }
})
```

# 9. ICE Restart

## 9.1 언제 ICE Restart가 필요한가

```
[ICE Restart가 필요한 상황]

  1. iceConnectionState가 failed
     → 모든 후보쌍 연결 불가

  2. 네트워크 변경 (WiFi → LTE)
     → 기존 ICE 후보 무효화

  3. NAT 매핑 타임아웃
     → 기존 경로 사용 불가
```

## 9.2 브라우저에서 ICE Restart

```javascript
pc.oniceconnectionstatechange = () => {
  if (pc.iceConnectionState === 'failed') {
    // 방법 1: restartIce() (권장)
    pc.restartIce();

    // restartIce() 호출 후 자동으로 negotiationneeded 이벤트 발생
    // → onnegotiationneeded에서 새 Offer 생성
  }
};

pc.onnegotiationneeded = async () => {
  const offer = await pc.createOffer({ iceRestart: true });
  await pc.setLocalDescription(offer);
  // 새 Offer를 Signaling 서버로 전달
  ws.send(JSON.stringify({ type: 'offer', sdp: pc.localDescription.sdp }));
};
```

## 9.3 Golang/Pion에서 ICE Restart 처리

Pion에서는 서버가 Answerer일 때, 브라우저가 ICE restart Offer를 보내면 새 Answer를 반환하면 된다. 기존 Signaling 루프에서 자동으로 처리된다.

```go
// 서버 측에서 ICE Restart Offer를 받으면
// 기존 코드와 동일하게 Answer 생성
case "offer":
    pc.SetRemoteDescription(webrtc.SessionDescription{
        Type: webrtc.SDPTypeOffer, SDP: msg.SDP,
    })
    answer, _ := pc.CreateAnswer(nil)
    pc.SetLocalDescription(answer)
    // Answer 전달 → 새 ICE 후보 교환 시작
```

# 10. 성능 문제 진단

## 10.1 지연(Latency) 측정

```javascript
// DataChannel RTT 측정 (8편 Ping/Pong 패턴)
function measureRTT() {
  const start = performance.now();
  dc.send(JSON.stringify({ type: 'ping', ts: start }));
}

// 미디어 지연은 getStats()로 확인
async function measureMediaLatency() {
  const stats = await pc.getStats();
  stats.forEach(report => {
    if (report.type === 'inbound-rtp' && report.kind === 'video') {
      console.log('Jitter buffer delay:', report.jitterBufferDelay);
      console.log('Jitter buffer emitted:', report.jitterBufferEmittedCount);
      // 평균 버퍼 지연 = jitterBufferDelay / jitterBufferEmittedCount
    }
  });
}
```

## 10.2 패킷 손실 진단

```javascript
let prevReport = {};

async function checkPacketLoss() {
  const stats = await pc.getStats();
  stats.forEach(report => {
    if (report.type === 'inbound-rtp') {
      const key = report.kind;

      if (prevReport[key]) {
        const packetsLost = report.packetsLost - prevReport[key].packetsLost;
        const packetsReceived = report.packetsReceived - prevReport[key].packetsReceived;
        const lossRate = packetsReceived > 0
          ? (packetsLost / (packetsReceived + packetsLost) * 100).toFixed(2)
          : 0;

        if (lossRate > 5) {
          console.warn(`${key} packet loss: ${lossRate}% - 네트워크 혼잡`);
        }

        console.log(`${key}: nackCount=${report.nackCount}, pliCount=${report.pliCount}`);
      }

      prevReport[key] = {
        packetsLost: report.packetsLost,
        packetsReceived: report.packetsReceived,
      };
    }
  });
}

// 1초마다 체크
setInterval(checkPacketLoss, 1000);
```

## 10.3 성능 문제 대응

```
[성능 문제 대응 가이드]

  패킷 손실 > 5%:
  ├── 원인: 네트워크 혼잡
  ├── 대응: 비트레이트 낮추기
  └── 코덱: 적응형 비트레이트 설정

  지터 > 30ms:
  ├── 원인: 네트워크 불안정
  ├── 대응: 지터 버퍼 크기 조정
  └── 확인: jitterBufferDelay 모니터링

  RTT > 300ms:
  ├── 원인: 경로가 길거나 TURN 경유
  ├── 대응: 더 가까운 TURN 서버 사용
  └── 확인: SR/RR로 RTT 계산

  FPS 드롭:
  ├── 원인: 인코더 과부하 또는 네트워크 제한
  ├── 대응: 해상도 낮추기 또는 프레임 레이트 제한
  └── 확인: framesDecoded vs framesDropped
```

# 11. 정리

## 11.1 트러블슈팅 요약 테이블

| 증상 | 가능한 원인 | 진단 방법 | 해결 |
|------|------------|----------|------|
| WebSocket 연결 실패 | 서버 미실행, CORS, TLS | 브라우저 콘솔 | 서버 확인, WSS 사용 |
| ICE checking에서 멈춤 | UDP 차단, STUN 응답 없음 | webrtc-internals | TURN 추가, 방화벽 확인 |
| ICE failed | 모든 후보 연결 불가 | Candidate 목록 확인 | TURN 서버, NAT 타입 확인 |
| ICE disconnected | NAT 타임아웃, 네트워크 변경 | 연결 시간 패턴 확인 | ICE restart, keepalive |
| DTLS 실패 | fingerprint 불일치, 타임아웃 | ICE connected 확인 | SDP 무변조 전달, TURN TLS |
| 영상 안 나옴 | 코덱 불일치, autoplay 정책 | SDP 코덱 확인 | VP8 사용, muted autoplay |
| 영상 깨짐 | RTCP 미처리, 키프레임 없음 | pliCount/nackCount | readRTCP(), -g 30 |
| DataChannel 안 열림 | 생성 순서, 핸들러 미등록 | SDP m=application 확인 | 순서 수정, 핸들러 등록 |
| 연결 자주 끊김 | NAT 타임아웃, 네트워크 불안정 | 끊김 시점 패턴 | keepalive, ICE restart |
| 높은 지연 | TURN 경유, 네트워크 혼잡 | RTT, jitter 측정 | TURN 서버 위치, 비트레이트 조절 |

## 11.2 환경별 필수 설정 요약

| 환경 | ICE 서버 설정 | Pion 추가 설정 |
|------|-------------|---------------|
| 로컬 | STUN만 (없어도 가능) | 없음 |
| LAN | STUN만 | 없음 |
| 사내망 | STUN + TURN (TCP/TLS) | 없음 |
| 클라우드 | STUN + (TURN) | SetNAT1To1IPs, SetEphemeralUDPPortRange |
| 모바일 | STUN + TURN | 없음 (브라우저 측 ICE restart) |

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
  ✅ 10편: 트러블슈팅 (이 글) ← 지금 여기
  ☐ 11편: 확장 구조 (SFU/MCU)
  ☐ 12편: 보안과 운영
  ☐ 13편: 기술 선택 가이드
```

다음 편에서는 **확장 구조**를 다룬다. P2P의 한계를 넘어 다자 통화를 가능하게 하는 SFU(Selective Forwarding Unit)와 MCU(Multipoint Control Unit) 아키텍처를 비교하고, 대표적인 오픈소스 SFU 서버를 소개한다.

## 참고 자료

- [WebRTC for the Curious - Debugging](https://webrtcforthecurious.com/ko/docs/08-debugging/)
- [WebRTC for the Curious - Connecting](https://webrtcforthecurious.com/ko/docs/03-connecting/)
- [MDN - RTCPeerConnection.iceConnectionState](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/iceConnectionState)
- [MDN - RTCPeerConnection.connectionState](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/connectionState)
- [Pion SettingEngine](https://pkg.go.dev/github.com/pion/webrtc/v4#SettingEngine)
- [coturn - TURN 서버](https://github.com/coturn/coturn)
- [Trickle ICE 테스트](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/)
