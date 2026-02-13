---
title: "WebRTC 완벽 가이드 (12): 보안과 운영"
description: "DTLS 핸드셰이크와 SRTP 키 도출 과정을 상세히 분석하고, Signaling 단계의 인증 설계, TURN 서버(coturn) 운영 실무, Prometheus 모니터링까지 다룹니다."
date: 2026-02-07
update: 2026-02-07
tags:
  - WebRTC
  - DTLS
  - SRTP
  - 보안
  - TURN
  - coturn
  - 모니터링
  - 운영
series: "WebRTC 완벽 가이드"
---

11편에서 SFU/MCU 확장 구조를 다루었다. 이번 편에서는 WebRTC의 **보안 메커니즘**과 **운영 실무**를 다룬다. DTLS/SRTP가 실제로 어떻게 동작하는지, Signaling 단계에서 어떻게 인증을 설계하는지, TURN 서버를 프로덕션 환경에서 어떻게 운영하는지를 정리한다.

# 1. WebRTC 보안 아키텍처

## 1.1 의무적 암호화

WebRTC는 **모든 통신을 암호화**한다. 선택이 아니라 필수다.

```
[WebRTC 보안 계층]

  ┌──────────────────────────────────────┐
  │  Signaling (애플리케이션 책임)         │
  │  ├── WSS (WebSocket Secure)          │  ← TLS 1.2+
  │  └── HTTPS                           │
  ├──────────────────────────────────────┤
  │  미디어/데이터 (WebRTC 내장)           │
  │  ├── DTLS (키 교환, 인증)             │  ← 의무
  │  ├── SRTP (미디어 암호화)             │  ← 의무
  │  └── SCTP over DTLS (DataChannel)    │  ← 의무
  ├──────────────────────────────────────┤
  │  전송                                │
  │  └── ICE / UDP                       │
  └──────────────────────────────────────┘

  WebRTC가 보장하는 것:
  ├── ✅ 미디어/데이터 암호화 (DTLS + SRTP)
  ├── ✅ 피어 인증 (DTLS 인증서 fingerprint)
  └── ✅ 동의 기반 전송 (ICE consent)

  애플리케이션이 책임져야 하는 것:
  ├── ⚠️ Signaling 채널 암호화 (WSS/HTTPS)
  ├── ⚠️ 사용자 인증 (JWT, OAuth 등)
  └── ⚠️ 권한 제어 (Room 접근, 미디어 권한)
```

## 1.2 보안 위협과 대응

| 위협 | 공격 방법 | 영향 | 대응 |
|------|----------|------|------|
| **Signaling MitM** | Signaling 채널 가로채기 | SDP/ICE 후보 변조, 세션 탈취 | WSS/HTTPS 사용 |
| **IP 주소 노출** | P2P 연결 시 IP 노출 | 위치 추적, 네트워크 정찰 | TURN 강제, mDNS 후보 |
| **미인가 참여** | Room에 무단 접속 | 도청, 프라이버시 침해 | JWT 토큰 인증 |
| **SRTP 헤더 노출** | RTP 헤더 분석 | 음성 활동 패턴 감지 | 프로토콜 한계 (완화 어려움) |
| **Mixed Content** | HTTP 페이지에서 WebRTC | JS 주입, 인증정보 탈취 | HTTPS 필수 |

# 2. DTLS 핸드셰이크 심화

## 2.1 DTLS란

**DTLS(Datagram Transport Layer Security)** 는 UDP 위에서 TLS와 동일한 보안을 제공하는 프로토콜이다. TCP 기반인 TLS를 UDP 환경에 맞게 수정한 것이다.

```
[TLS vs DTLS]

  TLS (TCP 위):
  ├── 순서 보장 → 핸드셰이크 메시지 순서 자동
  ├── 신뢰성 보장 → 재전송 자동
  └── 스트림 기반

  DTLS (UDP 위):
  ├── 순서 미보장 → message_seq로 순서 관리
  ├── 신뢰성 미보장 → 자체 재전송 타이머
  ├── 패킷 손실 → fragment_offset으로 분할 관리
  └── 데이터그램 기반
```

## 2.2 핸드셰이크 전체 흐름

DTLS 핸드셰이크는 6단계(Flight)로 구성된다.

```
[DTLS 핸드셰이크 시퀀스]

  Client (active)                                Server (passive)
       │                                              │
       │  ──── Flight 1 ──────────────────────────>   │
       │  ClientHello                                  │
       │  {                                            │
       │    client_random (32 bytes),                  │
       │    cipher_suites: [                           │
       │      TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256│
       │    ],                                         │
       │    dtls_version: 1.2                          │
       │  }                                            │
       │                                              │
       │  <──── Flight 2 ────────────────────────── │
       │  HelloVerifyRequest                           │
       │  { cookie (DoS 방지) }                        │
       │                                              │
       │  ──── Flight 3 ──────────────────────────>   │
       │  ClientHello + cookie                         │
       │                                              │
       │  <──── Flight 4 ────────────────────────── │
       │  ServerHello                                  │
       │  { server_random, chosen_cipher_suite }       │
       │  Certificate                                  │
       │  { X.509 인증서 (자체 서명) }                   │
       │  ServerKeyExchange                            │
       │  { ECDH 공개키 }                               │
       │  CertificateRequest                           │
       │  ServerHelloDone                              │
       │                                              │
       │  ──── Flight 5 ──────────────────────────>   │
       │  Certificate                                  │
       │  { 클라이언트 X.509 인증서 }                    │
       │  ClientKeyExchange                            │
       │  { ECDH 공개키 }                               │
       │  CertificateVerify                            │
       │  { 핸드셰이크 서명 }                            │
       │  ChangeCipherSpec                             │
       │  Finished (암호화됨)                           │
       │                                              │
       │  <──── Flight 6 ────────────────────────── │
       │  ChangeCipherSpec                             │
       │  Finished (암호화됨)                           │
       │                                              │
       │◄═══ 양방향 암호화 통신 시작 ══════════════════>│
```

## 2.3 핵심 단계별 해설

### 2.3.1 HelloVerifyRequest (DoS 방지)

```
[Cookie 검증 메커니즘]

  공격자가 위조된 IP로 ClientHello를 대량 전송
       │
       ▼
  서버: HelloVerifyRequest { cookie } 응답
       │
  공격자: cookie를 포함한 재전송 불가 (위조 IP로 수신 불가)
       │
  정상 클라이언트: cookie를 포함한 ClientHello 재전송
       │
       ▼
  서버: 이제서야 리소스 할당 시작

  → 서버가 상태를 유지하지 않으므로 메모리 기반 DoS 방지
```

### 2.3.2 인증서와 Fingerprint 검증

WebRTC는 **자체 서명(self-signed) 인증서**를 사용한다. CA(인증 기관) 검증 대신 **SDP에 포함된 fingerprint**로 인증한다.

```
[Fingerprint 검증 흐름]

  1. SDP 교환 (Signaling 채널)
     Offer: a=fingerprint:sha-256 AA:BB:CC:DD:...
     Answer: a=fingerprint:sha-256 EE:FF:00:11:...

  2. DTLS 핸드셰이크 (미디어 채널)
     양쪽이 인증서를 교환

  3. Fingerprint 비교
     수신한 인증서의 SHA-256 해시 계산
     ↕ SDP에서 받은 fingerprint와 비교

  4. 일치하면 → 연결 허용
     불일치하면 → 연결 거부 (MitM 가능성)
```

> **중요**: Signaling 채널이 탈취되면 fingerprint도 변조 가능하다. 이것이 **Signaling 채널을 WSS/HTTPS로 보호해야 하는 이유**다.

### 2.3.3 DTLS 역할 결정 (SDP setup 속성)

```
[DTLS 역할 협상]

  SDP에서 결정:
  ├── Offer:  a=setup:actpass  (클라이언트/서버 모두 가능)
  ├── Answer: a=setup:active   (DTLS 클라이언트 역할, 권장)
  └── Answer: a=setup:passive  (DTLS 서버 역할)

  active 역할이 ClientHello를 먼저 보냄
  → Answer에서 active를 선택하면 DTLS 핸드셰이크가
    Answer 전송과 병렬로 시작 가능 → 지연 감소
```

## 2.4 Epoch와 시퀀스 번호

```
[DTLS Record Layer]

  Epoch 0 (평문):
  ├── ClientHello        seq=0
  ├── ServerHello        seq=0
  ├── Certificate        seq=1
  ├── ...
  └── ChangeCipherSpec   (epoch 전환 신호)

  Epoch 1 (암호화):
  ├── Finished           seq=0  ← 시퀀스 번호 리셋
  ├── Application Data   seq=1
  ├── Application Data   seq=2
  └── ...

  Epoch가 바뀌면 시퀀스 번호가 0으로 리셋된다.
  수신 측은 epoch + seq로 패킷을 구분하고
  MAC 검증에 사용한다.
```

# 3. SRTP 키 도출

## 3.1 DTLS에서 SRTP로의 키 전달

SRTP는 자체 키 교환 메커니즘이 없다. DTLS 핸드셰이크가 완료되면 **DTLS 세션에서 키를 추출**하여 SRTP에 사용한다.

```
[키 도출 전체 흐름]

  DTLS 핸드셰이크 완료
       │
       ▼
  Master Secret 생성
  = PRF(pre_master_secret,
        "master secret",
        client_random + server_random)
       │
       ▼
  TLS Exporter로 SRTP 키 추출
  = TLS-Exporter("EXTRACTOR-dtls_srtp",
                  "",
                  2 × (master_key_len + master_salt_len))
       │
       ▼
  키 분배:
  ├── client_write_SRTP_master_key   (16 bytes)
  ├── server_write_SRTP_master_key   (16 bytes)
  ├── client_write_SRTP_master_salt  (14 bytes)
  └── server_write_SRTP_master_salt  (14 bytes)
       │
       ▼
  SRTP 세션 키 도출 (AES-CM PRF)
  └── 각 SSRC별로 세션 키 생성
```

## 3.2 SRTP Protection Profile

WebRTC에서 필수로 지원해야 하는 SRTP 프로파일이다.

| 프로파일 | 암호화 | 키 길이 | Salt 길이 | 인증 태그 |
|---------|--------|---------|----------|----------|
| **SRTP_AES128_CM_HMAC_SHA1_80** (필수) | AES-128 CTR | 16 bytes | 14 bytes | 80 bits |
| SRTP_AES128_CM_HMAC_SHA1_32 | AES-128 CTR | 16 bytes | 14 bytes | 32 bits |
| SRTP_AEAD_AES_128_GCM | AES-128 GCM | 16 bytes | 12 bytes | 128 bits |

## 3.3 SRTP 패킷 구조

```
[SRTP 패킷]

  ┌──────────────────────────────────┐
  │  RTP 헤더 (12+ bytes)           │ ← 암호화되지 않음 ⚠️
  │  ├── Version, PT, Seq, TS, SSRC │
  ├──────────────────────────────────┤
  │  RTP 페이로드                    │ ← AES-128로 암호화 ✅
  │  (미디어 데이터)                  │
  ├──────────────────────────────────┤
  │  SRTP Auth Tag (10 bytes)       │ ← HMAC-SHA1 인증 ✅
  │  (헤더 + 페이로드 무결성 검증)    │
  └──────────────────────────────────┘

  암호화되는 것: 페이로드 (미디어 콘텐츠)
  인증되는 것: 헤더 + 페이로드 (변조 감지)
  암호화되지 않는 것: RTP 헤더 (라우팅에 필요)
```

> **RTP 헤더가 평문인 이유**: SFU가 트랜스코딩 없이 패킷을 라우팅하려면 SSRC, Payload Type 등을 읽어야 한다. 이것이 SRTP의 설계 트레이드오프다.

# 4. Signaling 보안과 인증

## 4.1 Signaling 채널 보호

```
[Signaling 보안 계층]

  ① 전송 암호화
  ├── WebSocket → WSS (TLS 1.2+)
  └── HTTP → HTTPS

  ② 인증 (사용자 식별)
  ├── JWT 토큰
  ├── OAuth 2.0
  └── API Key + Secret

  ③ 인가 (권한 확인)
  ├── Room 접근 권한
  ├── 미디어 발행/구독 권한
  └── 관리자 권한
```

## 4.2 JWT 기반 인증 설계

가장 일반적인 WebRTC 인증 방식이다. LiveKit, Twilio 등 주요 서비스가 이 패턴을 사용한다.

```
[JWT 인증 흐름]

  클라이언트              애플리케이션 서버           WebRTC 서버 (SFU)
       │                       │                       │
       │── 로그인 ────────────>│                       │
       │                       │  사용자 인증            │
       │                       │  JWT 생성:             │
       │                       │  {                     │
       │                       │    sub: "user-123",    │
       │                       │    room: "meeting-1",  │
       │                       │    canPublish: true,   │
       │                       │    canSubscribe: true, │
       │                       │    exp: 1707400000     │
       │                       │  }                     │
       │<── JWT 토큰 ──────────│                       │
       │                       │                       │
       │── WSS 연결 + JWT ─────│──────────────────────>│
       │                       │                       │  JWT 검증
       │                       │                       │  (서명, 만료, 권한)
       │                       │                       │
       │<── WebRTC 연결 ───────│───────────────────────│
       │                       │                       │
```

## 4.3 JWT 토큰 구현

### 4.3.1 Golang 서버에서 토큰 발급

```go
import (
    "time"
    "github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte("your-secret-key-at-least-32-bytes!")

type RoomClaims struct {
    Room         string `json:"room"`
    CanPublish   bool   `json:"canPublish"`
    CanSubscribe bool   `json:"canSubscribe"`
    jwt.RegisteredClaims
}

func generateToken(userID, room string, canPublish, canSubscribe bool) (string, error) {
    claims := RoomClaims{
        Room:         room,
        CanPublish:   canPublish,
        CanSubscribe: canSubscribe,
        RegisteredClaims: jwt.RegisteredClaims{
            Subject:   userID,
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
        },
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(jwtSecret)
}

func validateToken(tokenString string) (*RoomClaims, error) {
    token, err := jwt.ParseWithClaims(tokenString, &RoomClaims{},
        func(token *jwt.Token) (interface{}, error) {
            return jwtSecret, nil
        },
    )
    if err != nil {
        return nil, err
    }

    claims, ok := token.Claims.(*RoomClaims)
    if !ok || !token.Valid {
        return nil, fmt.Errorf("invalid token")
    }

    return claims, nil
}
```

### 4.3.2 WebSocket 연결 시 검증

```go
func handleWebSocket(w http.ResponseWriter, r *http.Request) {
    // ① URL 파라미터 또는 헤더에서 토큰 추출
    tokenStr := r.URL.Query().Get("token")
    if tokenStr == "" {
        http.Error(w, "token required", http.StatusUnauthorized)
        return
    }

    // ② 토큰 검증
    claims, err := validateToken(tokenStr)
    if err != nil {
        http.Error(w, "invalid token", http.StatusUnauthorized)
        return
    }

    // ③ 권한 확인
    log.Printf("User %s joined room %s (publish=%v, subscribe=%v)",
        claims.Subject, claims.Room, claims.CanPublish, claims.CanSubscribe)

    // ④ WebSocket 업그레이드
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        return
    }
    defer conn.Close()

    // ⑤ 인증된 사용자로 WebRTC 연결 진행
    handleAuthenticatedPeer(conn, claims)
}
```

### 4.3.3 브라우저에서 토큰 전달

```javascript
// 애플리케이션 서버에서 토큰 받기
const response = await fetch('/api/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ room: 'meeting-1' }),
  credentials: 'include'  // 세션 쿠키 포함
});
const { token } = await response.json();

// WebSocket 연결 시 토큰 전달
const ws = new WebSocket(`wss://server.example.com/ws?token=${token}`);
```

## 4.4 TURN 인증: REST API 방식

TURN 서버에 접속할 때 **시간 제한 자격 증명(Time-Limited Credentials)** 을 사용하면 보안을 강화할 수 있다.

```
[TURN REST API 인증 흐름]

  브라우저                 애플리케이션 서버           TURN 서버
     │                          │                     │
     │── TURN 자격증명 요청 ────>│                     │
     │                          │                     │
     │                    shared_secret으로            │
     │                    임시 자격증명 생성:           │
     │                    username = timestamp:userID  │
     │                    password = HMAC-SHA1(        │
     │                      shared_secret, username)   │
     │                    TTL = 24시간                  │
     │                          │                     │
     │<── {username, password} ──│                     │
     │                          │                     │
     │── TURN Allocate ─────────│────────────────────>│
     │   (username, password)   │                     │
     │                          │           HMAC-SHA1 검증
     │                          │           timestamp 만료 확인
     │<── Allocate Success ─────│─────────────────────│
```

```go
// TURN 임시 자격증명 생성 (Golang)
import (
    "crypto/hmac"
    "crypto/sha1"
    "encoding/base64"
    "fmt"
    "time"
)

const turnSharedSecret = "MySharedSecret123"

func generateTURNCredentials(userID string, ttl time.Duration) (username, password string) {
    timestamp := time.Now().Add(ttl).Unix()
    username = fmt.Sprintf("%d:%s", timestamp, userID)

    mac := hmac.New(sha1.New, []byte(turnSharedSecret))
    mac.Write([]byte(username))
    password = base64.StdEncoding.EncodeToString(mac.Sum(nil))

    return username, password
}

// API 핸들러
func handleTURNCredentials(w http.ResponseWriter, r *http.Request) {
    // 사용자 인증 확인 (JWT 등)
    userID := getUserFromRequest(r)

    username, password := generateTURNCredentials(userID, 24*time.Hour)

    json.NewEncoder(w).Encode(map[string]interface{}{
        "username": username,
        "password": password,
        "ttl":      86400,
        "uris": []string{
            "turn:turn.example.com:3478?transport=udp",
            "turn:turn.example.com:3478?transport=tcp",
            "turns:turn.example.com:5349?transport=tcp",
        },
    })
}
```

# 5. TURN 서버 운영

## 5.1 coturn 설치와 설정

### 5.1.1 설치

```bash
# Ubuntu/Debian
sudo apt-get update && sudo apt-get install -y coturn

# 자동 시작 활성화
sudo sed -i 's/#TURNSERVER_ENABLED=1/TURNSERVER_ENABLED=1/' /etc/default/coturn
```

### 5.1.2 프로덕션 설정 (/etc/turnserver.conf)

```bash
# ──── 서버 ID ────
realm=turn.example.com
server-name=turn.example.com

# ──── 네트워크 ────
listening-ip=0.0.0.0
external-ip=203.0.113.50        # 공인 IP (클라우드에서 필수)
listening-port=3478
tls-listening-port=5349

# ──── 릴레이 포트 범위 ────
min-port=10000
max-port=20000

# ──── TLS 인증서 ────
cert=/etc/letsencrypt/live/turn.example.com/fullchain.pem
pkey=/etc/letsencrypt/live/turn.example.com/privkey.pem

# ──── 인증 ────
lt-cred-mech
use-auth-secret
static-auth-secret=MySharedSecret123    # REST API 방식

# 또는 정적 사용자 (테스트용)
# user=testuser:testpassword

# ──── 보안 ────
fingerprint
no-multicast-peers
no-loopback-peers
denied-peer-ip=0.0.0.0-0.255.255.255
denied-peer-ip=127.0.0.0-127.255.255.255
denied-peer-ip=::1

# ──── 로깅 ────
log-file=/var/log/turnserver/turnserver.log
verbose

# ──── 모니터링 ────
prometheus
prometheus-port=9641
```

### 5.1.3 TLS 인증서 (Let's Encrypt)

```bash
# certbot 설치
sudo apt-get install certbot

# 인증서 발급 (TCP 80 포트 필요)
sudo certbot certonly --standalone \
  --preferred-challenges http \
  -d turn.example.com

# 갱신 자동화 (cron 또는 systemd timer)
sudo certbot renew --dry-run
```

### 5.1.4 방화벽 설정

```bash
# STUN/TURN
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp

# TURNS (TLS)
sudo ufw allow 5349/tcp
sudo ufw allow 5349/udp

# 대체 포트 (방화벽 우회)
sudo ufw allow 443/tcp

# 릴레이 포트 범위
sudo ufw allow 10000:20000/udp
```

## 5.2 클라우드 배포 시 주의사항

```
[클라우드 TURN 서버 설정]

  AWS EC2 / GCP Compute / Azure VM:
  ├── external-ip 설정 필수 (Elastic IP 또는 공인 IP)
  ├── 보안 그룹/방화벽에서 UDP 포트 열기
  ├── min-port ~ max-port 범위도 열기
  └── TCP 443 열기 (TURN over TLS, 방화벽 우회)

  설정 예:
  external-ip=54.180.x.x/10.0.1.5
  # 공인IP/사설IP 형식 (AWS에서 필수)
```

## 5.3 운영 규모 산정

| 항목 | 기준 | 설명 |
|------|------|------|
| **대역폭** | 영상 2~4 Mbps, 음성 50~100 Kbps | 릴레이하는 모든 트래픽이 서버 경유 |
| **CPU** | STUN: 수만 세션/코어 | TURN: 수천 세션/코어 |
| **메모리** | ~1~2 MB / 활성 할당 | 동시 사용자 × 2MB |
| **포트** | 할당당 1 릴레이 포트 | min-port~max-port 범위 내 |

```
[규모 산정 예시]

  동시 사용자: 500명
  TURN 사용률: 20% (100명이 TURN 경유)
  영상 통화: 평균 2 Mbps × 2방향 = 4 Mbps/세션

  필요 대역폭: 100 × 4 Mbps = 400 Mbps
  필요 포트: 100개 (min-port~max-port에 여유 확보)
  필요 메모리: 100 × 2 MB = 200 MB
  CPU: 4코어 정도면 충분
```

# 6. 로그와 모니터링

## 6.1 WebRTC 모니터링 포인트

```
[모니터링 계층별 지표]

  Signaling:
  ├── WebSocket 연결 수 (동시, 누적)
  ├── Offer/Answer 교환 성공률
  ├── 인증 실패 횟수
  └── 메시지 처리 지연

  ICE/연결:
  ├── ICE 연결 성공률
  ├── 연결 수립 시간 (Offer → connected)
  ├── 사용된 후보 타입 비율 (host/srflx/relay)
  ├── ICE restart 횟수
  └── disconnected/failed 발생 횟수

  미디어:
  ├── 비트레이트 (인바운드/아웃바운드)
  ├── 패킷 손실률
  ├── 지터
  ├── RTT
  ├── FPS
  ├── PLI/NACK 횟수
  └── 프레임 드롭 수

  TURN:
  ├── 활성 할당 수
  ├── 릴레이 대역폭
  ├── 인증 실패율
  └── 할당 실패율
```

## 6.2 Prometheus + Grafana 모니터링

### 6.2.1 coturn Prometheus 메트릭

```bash
# coturn 설정에서 활성화
prometheus
prometheus-port=9641

# 메트릭 확인
curl http://localhost:9641/metrics
```

주요 메트릭:

| 메트릭 | 설명 |
|--------|------|
| `turn_total_allocations` | 누적 할당 수 |
| `turn_active_allocations` | 현재 활성 할당 수 |
| `turn_total_traffic_rcvp` | 수신 패킷 수 |
| `turn_total_traffic_rcvb` | 수신 바이트 수 |
| `turn_total_traffic_sentp` | 전송 패킷 수 |
| `turn_total_traffic_sentb` | 전송 바이트 수 |

### 6.2.2 Golang SFU/서버 커스텀 메트릭

```go
import "github.com/prometheus/client_golang/prometheus"

var (
    activeConnections = prometheus.NewGauge(prometheus.GaugeOpts{
        Name: "webrtc_active_connections",
        Help: "Number of active WebRTC connections",
    })

    iceConnectionDuration = prometheus.NewHistogram(prometheus.HistogramOpts{
        Name:    "webrtc_ice_connection_duration_seconds",
        Help:    "Time from offer to ICE connected",
        Buckets: []float64{0.5, 1, 2, 5, 10, 30},
    })

    candidateTypeUsed = prometheus.NewCounterVec(prometheus.CounterOpts{
        Name: "webrtc_candidate_type_total",
        Help: "ICE candidate types used for connections",
    }, []string{"type"})  // host, srflx, relay

    authFailures = prometheus.NewCounter(prometheus.CounterOpts{
        Name: "webrtc_auth_failures_total",
        Help: "Number of authentication failures",
    })
)

func init() {
    prometheus.MustRegister(activeConnections)
    prometheus.MustRegister(iceConnectionDuration)
    prometheus.MustRegister(candidateTypeUsed)
    prometheus.MustRegister(authFailures)
}

// 사용 예
func onPeerConnected(candidateType string, duration time.Duration) {
    activeConnections.Inc()
    iceConnectionDuration.Observe(duration.Seconds())
    candidateTypeUsed.WithLabelValues(candidateType).Inc()
}

func onPeerDisconnected() {
    activeConnections.Dec()
}
```

### 6.2.3 브라우저 통계 수집

```javascript
// 1초마다 통계를 서버로 전송
async function collectStats() {
  if (!pc) return;

  const stats = await pc.getStats();
  const report = {};

  stats.forEach(s => {
    if (s.type === 'inbound-rtp') {
      report[`inbound_${s.kind}`] = {
        bytesReceived: s.bytesReceived,
        packetsLost: s.packetsLost,
        packetsReceived: s.packetsReceived,
        jitter: s.jitter,
        framesDecoded: s.framesDecoded,
        framesDropped: s.framesDropped,
        nackCount: s.nackCount,
        pliCount: s.pliCount,
      };
    }
    if (s.type === 'candidate-pair' && s.state === 'succeeded') {
      report.candidatePair = {
        localCandidateId: s.localCandidateId,
        remoteCandidateId: s.remoteCandidateId,
        currentRoundTripTime: s.currentRoundTripTime,
        availableOutgoingBitrate: s.availableOutgoingBitrate,
      };
    }
  });

  // 서버로 전송 (DataChannel 또는 HTTP)
  if (dc && dc.readyState === 'open') {
    dc.send(JSON.stringify({ type: 'stats', data: report }));
  }
}

setInterval(collectStats, 5000);
```

## 6.3 알림 설정 기준

| 지표 | 경고 | 위험 | 대응 |
|------|------|------|------|
| ICE 연결 실패율 | > 5% | > 15% | STUN/TURN 확인 |
| 패킷 손실률 | > 3% | > 10% | 네트워크/대역폭 확인 |
| RTT | > 200ms | > 500ms | TURN 서버 위치 최적화 |
| TURN 인증 실패율 | > 1% | > 5% | 자격증명 만료, 시크릿 확인 |
| TURN 할당 실패 | > 0.5% | > 2% | 포트 부족, 리소스 확인 |
| 서버 CPU | > 70% | > 90% | 스케일 아웃 |
| 연결 수립 시간 | > 3초 | > 10초 | STUN/TURN/네트워크 확인 |

# 7. 운영 체크리스트

## 7.1 배포 전 체크리스트

```
[프로덕션 배포 전 확인 사항]

  보안:
  ├── □ Signaling 채널: WSS/HTTPS 사용
  ├── □ JWT 또는 OAuth 인증 구현
  ├── □ TURN REST API 인증 (static-auth-secret)
  ├── □ CORS 설정 (허용 도메인 제한)
  ├── □ Rate limiting (DoS 방지)
  └── □ CSP 헤더 설정

  TURN:
  ├── □ TLS 인증서 설정 (Let's Encrypt)
  ├── □ external-ip 설정 (클라우드)
  ├── □ 방화벽 포트 개방 (UDP 3478, 5349, 10000-20000)
  ├── □ denied-peer-ip 설정 (루프백 차단)
  └── □ 로그 로테이션 설정

  모니터링:
  ├── □ Prometheus 메트릭 수집
  ├── □ Grafana 대시보드 구성
  ├── □ 알림 규칙 설정
  └── □ 로그 수집 (ELK 또는 CloudWatch)

  성능:
  ├── □ 커널 파라미터 튜닝 (rmem_max, wmem_max)
  ├── □ 파일 디스크립터 제한 확인 (ulimit)
  ├── □ 릴레이 포트 범위 충분한지
  └── □ 부하 테스트 수행
```

## 7.2 장애 대응 플레이북

```
[장애 시나리오별 대응]

  시나리오 1: TURN 서버 다운
  ├── 영향: relay 후보 필요한 사용자 연결 불가
  ├── 감지: 활성 할당 수 급감, 인증 실패 급증
  ├── 대응: TURN 서버 재시작, 백업 서버 전환
  └── 예방: TURN 서버 이중화

  시나리오 2: 인증서 만료
  ├── 영향: WSS/TURNS 연결 실패
  ├── 감지: TLS 핸드셰이크 실패 로그
  ├── 대응: 인증서 갱신 (certbot renew)
  └── 예방: 만료 30일 전 알림 설정

  시나리오 3: 포트 고갈
  ├── 영향: 새 TURN 할당 실패
  ├── 감지: 할당 실패율 증가
  ├── 대응: min-port~max-port 범위 확장
  └── 예방: 범위를 동시 사용자의 2배로 설정

  시나리오 4: 대역폭 초과
  ├── 영향: 패킷 손실 증가, 품질 저하
  ├── 감지: 트래픽 메트릭, 패킷 손실률
  ├── 대응: 비트레이트 제한, 사용자 분산
  └── 예방: 대역폭 모니터링, 자동 스케일링
```

# 8. 정리

| 주제 | 핵심 내용 |
|------|----------|
| **의무 암호화** | DTLS+SRTP 필수, Signaling은 애플리케이션 책임 (WSS/HTTPS) |
| **DTLS 핸드셰이크** | 6 Flight, HelloVerifyRequest(DoS 방지), 자체 서명 인증서 + fingerprint |
| **SRTP 키 도출** | DTLS Master Secret → TLS Exporter → SRTP 키 4개 (키+salt × 2) |
| **SRTP** | AES-128 CTR 암호화 + HMAC-SHA1 인증, 헤더는 평문 |
| **인증 설계** | JWT 토큰 (Room/권한), TURN REST API (HMAC-SHA1 임시 자격증명) |
| **coturn 운영** | external-ip, TLS 인증서, REST API 인증, 포트 범위, 보안 설정 |
| **모니터링** | Prometheus+Grafana, ICE 성공률/RTT/패킷 손실/TURN 할당 |
| **알림** | ICE 실패 >5%, 패킷 손실 >3%, RTT >200ms, CPU >70% |

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
  ✅ 11편: SFU/MCU 확장
  ✅ 12편: 보안과 운영 (이 글) ← 지금 여기
  ☐ 13편: 기술 선택 가이드
```

다음 마지막 편에서는 **기술 선택 가이드**를 다룬다. WebRTC를 쓰면 안 되는 경우, 대안 기술(WebSocket, RTMP, HLS/DASH)과의 비교, 실시간 vs 준실시간 판단 기준을 정리한다.

## 참고 자료

- [WebRTC for the Curious - Securing](https://webrtcforthecurious.com/ko/docs/04-securing/)
- [RFC 6347 - DTLS Version 1.2](https://tools.ietf.org/html/rfc6347)
- [RFC 5764 - DTLS Extension to Establish Keys for SRTP](https://tools.ietf.org/html/rfc5764)
- [RFC 3711 - SRTP](https://tools.ietf.org/html/rfc3711)
- [coturn - TURN Server](https://github.com/coturn/coturn)
- [WebRTC Security Architecture](https://www.w3.org/TR/webrtc/#security-considerations)
- [MDN - WebRTC Security](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Security)
- [LiveKit Authentication](https://docs.livekit.io/home/get-started/authentication/)
