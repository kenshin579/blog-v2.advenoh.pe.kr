---
title: "MQTT v5 완벽 가이드 (3): QoS, Session, 재연결 전략"
description: "MQTT의 핵심인 QoS 동작 원리, Session 관리, 그리고 실무에서 가장 중요한 재연결 전략을 상세히 다룹니다."
date: 2026-01-18
update: 2026-01-18
series: "MQTT v5 완벽 가이드"
tags:
  - MQTT
  - MQTT v5
  - QoS
  - Session
  - Clean Start
  - Keep Alive
  - Retained Message
  - 재연결
  - Backoff
  - Idempotent
---

# 1. QoS 완전 정복

QoS(Quality of Service)는 메시지 **전달 보장 수준**이다. MQTT에서 가장 중요한 개념 중 하나로, 네트워크 상황과 메시지의 중요도에 따라 적절한 QoS를 선택해야 한다. QoS 선택은 시스템의 신뢰성과 성능 사이의 트레이드오프이다. 높은 QoS는 더 많은 네트워크 오버헤드와 지연을 발생시키지만, 메시지 전달을 더 강력하게 보장한다.

이 장에서는 각 QoS 레벨의 동작 원리를 상세히 설명하고, 실무에서 어떤 상황에 어떤 QoS를 선택해야 하는지 알아봅니다. 특히 QoS 1에서 발생할 수 있는 중복 메시지 처리 방법도 다룹니다.

## 1.1 QoS 0 / 1 / 2 동작 원리

### 1.1.1 QoS 0: At Most Once (최대 한 번)

"보내고 잊어버린다" 방식이다. 메시지를 한 번 전송하고 응답을 기다리지 않는다. 네트워크 문제로 메시지가 유실되어도 재전송하지 않는다. 가장 빠르고 가벼운 방식이지만, 메시지 전달을 보장하지 않는다.

```
[Publisher] ──PUBLISH──> [Broker] ──PUBLISH──> [Subscriber]
             (끝)                    (끝)
```

**특징:**
- 가장 빠름
- 메시지 유실 가능
- ACK 없음

**비유**: 엽서 보내기 - 보냈는지 확인 안 함

### 1.1.2 QoS 1: At Least Once (최소 한 번)

"받았다고 확인할 때까지 재전송" 방식이다.

```
[Publisher] ──PUBLISH──> [Broker]
[Publisher] <──PUBACK─── [Broker]  # ACK 받으면 끝

[Broker] ──PUBLISH──> [Subscriber]
[Broker] <──PUBACK─── [Subscriber]  # ACK 받으면 끝
```

**특징:**
- 메시지 전달 보장
- 중복 가능 (ACK 유실 시 재전송)
- 가장 많이 사용됨

**비유**: 등기 우편 - 받았다는 확인 필요

### 1.1.3 QoS 2: Exactly Once (정확히 한 번)

"중복 없이 정확히 한 번 전달" 방식이다.

```
[Publisher] ──PUBLISH──> [Broker]
[Publisher] <──PUBREC─── [Broker]  # 받았음
[Publisher] ──PUBREL──> [Broker]   # 삭제해도 됨
[Publisher] <──PUBCOMP── [Broker]  # 완료

# Broker → Subscriber도 동일한 4단계
```

**특징:**
- 중복 없음 보장
- 가장 느림 (4번의 핸드셰이크)
- 거의 사용되지 않음

**비유**: 은행 송금 - 정확히 한 번만 실행되어야 함

### 1.1.4 한눈에 비교

| QoS | 이름 | 전달 보장 | 중복 가능 | 속도 |
|-----|------|-----------|-----------|------|
| 0 | At Most Once | X | X | 빠름 |
| 1 | At Least Once | O | O | 보통 |
| 2 | Exactly Once | O | X | 느림 |

## 1.2 QoS 선택 기준

### 1.2.1 상태 보고: QoS 0 또는 1

```
# 예: 온도 센서가 1초마다 값 전송
topic: sensor/temp
payload: 25.5
qos: 0  # 하나쯤 놓쳐도 다음 값이 옴
```

**판단 기준:**
- 주기적으로 전송됨 → QoS 0
- 가끔 전송되고 중요함 → QoS 1

### 1.2.2 이벤트: QoS 1

```
# 예: 문 열림 이벤트
topic: door/event/opened
payload: {"time": "10:30:00"}
qos: 1  # 이벤트는 놓치면 안 됨
```

이벤트는 보통 한 번 발생하면 끝이므로 놓치면 복구가 어렵다.

### 1.2.3 명령: QoS 1 또는 2

```
# 예: 조명 끄기 명령
topic: light/cmd/off
payload: {}
qos: 1  # 반드시 전달되어야 함
```

**중복 실행이 문제가 되는 경우:**
```
# 예: 결제 요청
topic: payment/process
payload: {"amount": 10000}
qos: 2  # 정확히 한 번만 실행
# 또는 QoS 1 + Idempotent 처리
```

## 1.3 QoS와 중복 처리

### 1.3.1 At-Least-Once의 현실

QoS 1을 사용하면 중복이 발생할 수 있다.

```
# 시나리오
1. Publisher가 메시지 전송
2. Broker가 받고 저장
3. Broker가 PUBACK 전송
4. 네트워크 문제로 PUBACK 유실
5. Publisher가 메시지 재전송 (타임아웃)
6. Broker가 같은 메시지를 또 받음 → 중복!
```

### 1.3.2 Idempotent Consumer 설계

중복 메시지를 받아도 문제없게 설계하는 것이 **멱등성(Idempotency)**이다.

**방법 1: 메시지 ID로 중복 체크**
```go
func handleMessage(msg Message) {
    // 이미 처리한 메시지인지 확인
    if processed[msg.ID] {
        return  // 무시
    }

    processMessage(msg)
    processed[msg.ID] = true
}
```

**방법 2: 상태 기반 처리**
```go
// 나쁜 예: 잔액 증가 (중복되면 문제)
balance += amount

// 좋은 예: 상태 설정 (중복되어도 같은 결과)
balance = newBalance
status = "completed"
```

**방법 3: 타임스탬프 활용**
```go
func handleState(msg StateMessage) {
    // 오래된 메시지는 무시
    if msg.Timestamp < lastTimestamp {
        return
    }

    updateState(msg)
    lastTimestamp = msg.Timestamp
}
```

---

# 2. Session & 연결 관리

MQTT에서 세션(Session)은 단순히 TCP 연결을 넘어서는 개념이다. 세션에는 구독 정보, 전달되지 않은 메시지, QoS 흐름 상태 등이 포함된다. 올바른 세션 관리는 네트워크가 불안정한 환경에서 메시지 손실을 방지하는 핵심이다. 이 장에서는 세션의 생명주기와 Keep Alive 메커니즘, 그리고 Retained Message 활용법을 다룹니다.

## 2.1 Session Expiry Interval

세션은 Client와 Broker 간의 **연결 상태 정보**이다. v5에서는 Session Expiry Interval을 통해 연결이 끊어진 후에도 세션을 얼마나 유지할지 세밀하게 제어할 수 있다. 이 기능은 모바일 앱처럼 연결이 자주 끊어지는 환경에서 특히 유용한다.

### 2.1.1 Clean Start vs Session 유지

Clean Start 플래그는 연결 시 이전 세션을 어떻게 처리할지 결정한다. 이 설정은 시스템의 동작 방식에 큰 영향을 미치므로 신중하게 선택해야 한다.

**Clean Start = true (새 세션)**
```
연결 시:
  - 이전 세션 정보 삭제
  - 구독 정보 초기화
  - 저장된 메시지 삭제

사용 케이스:
  - 임시 연결
  - 상태가 필요 없는 Publisher
```

**Clean Start = false (세션 유지)**
```
연결 시:
  - 이전 세션 정보 복원
  - 구독 정보 유지
  - 오프라인 동안의 메시지 전달

사용 케이스:
  - 지속적인 구독자
  - 메시지를 놓치면 안 되는 경우
```

### 2.1.2 Session Expiry Interval

세션을 얼마나 유지할지 설정한다.

```go
// 세션 설정 예시
SessionExpiryInterval: 3600  // 1시간

// 동작
1. Client 연결 끊김
2. Broker가 1시간 동안 세션 유지
3. 1시간 내 재연결 → 세션 복원, 밀린 메시지 전달
4. 1시간 후 재연결 → 새 세션 시작
```

**권장 값:**
- 모바일 앱: 1-24시간
- IoT 기기: 필요에 따라 (분~일)
- 임시 연결: 0 (세션 유지 안 함)

### 2.1.3 오프라인 메시지

Session이 유지되는 동안 Broker가 메시지를 저장한다.

```
1. Subscriber가 오프라인
2. Publisher가 메시지 발행 (QoS 1)
3. Broker가 메시지 저장 (Subscriber 세션이 살아있으므로)
4. Subscriber가 재연결
5. Broker가 저장된 메시지 전달
```

**주의사항:**
- QoS 0 메시지는 저장되지 않음
- 저장 용량에 제한이 있을 수 있음
- Session Expiry 전에 재연결해야 함

## 2.2 Keep Alive

연결이 살아있는지 확인하는 메커니즘이다.

### 2.2.1 Ping 메커니즘

```
Keep Alive = 60초로 설정

[Client] ──PINGREQ──> [Broker]  # 60초 동안 통신 없으면
[Client] <──PINGRESP── [Broker]

# 응답 없으면 연결 끊김으로 판단
```

**동작 방식:**
1. Client가 Keep Alive 간격 설정 (예: 60초)
2. 해당 시간 동안 메시지가 없으면 PINGREQ 전송
3. Broker가 PINGRESP로 응답
4. Keep Alive * 1.5 시간 내 응답 없으면 연결 종료

### 2.2.2 네트워크 품질과의 관계

```
# 안정적인 네트워크
keep_alive: 60~120초

# 불안정한 네트워크 (모바일, IoT)
keep_alive: 15~30초
# 더 자주 체크하지만 오버헤드 증가

# 매우 안정적인 환경 (데이터센터 내)
keep_alive: 300초 이상
```

**Trade-off:**
- 짧은 Keep Alive: 빠른 끊김 감지, 높은 오버헤드
- 긴 Keep Alive: 낮은 오버헤드, 느린 끊김 감지

## 2.3 Retained Message

Topic에 **마지막 메시지를 저장**하는 기능이다.

### 2.3.1 Last Known State 패턴

```
# 온도 센서가 Retained 메시지 발행
PUBLISH
  topic: sensor/temperature
  payload: 25
  retain: true

# Broker가 이 메시지를 저장

# 나중에 새 Subscriber가 구독하면
SUBSCRIBE topic: sensor/temperature
# → 즉시 마지막 값(25)을 받음
```

**왜 유용한가:**
- 새로 연결한 Client도 현재 상태를 즉시 알 수 있음
- 센서가 자주 전송하지 않아도 됨
- "현재 상태가 뭐야?" 질문에 답할 수 있음

### 2.3.2 오용 사례

```
# 나쁜 사용: 이벤트에 Retain
PUBLISH
  topic: door/event/opened
  payload: {"time": "10:30:00"}
  retain: true  # 잘못됨!

# 문제: 새 구독자가 "문이 열렸다"는 과거 이벤트를 받음
# 현재 문 상태인지, 과거 이벤트인지 구분 불가
```

**Retain을 써야 하는 경우:**
- 상태 (온도, 습도, 전원 상태)
- 설정 값
- 현재 위치

**Retain을 쓰면 안 되는 경우:**
- 이벤트 (버튼 클릭, 문 열림)
- 명령
- 로그

---

# 3. 재연결(Reconnect) 전략

> 이 장은 실무에서 **가장 중요한** 부분이다.

많은 MQTT 튜토리얼이 연결과 메시지 전송만 다루지만, 실제 프로덕션 코드에서는 재연결 로직이 전체 코드의 상당 부분을 차지한다. 네트워크는 반드시 끊기며, 이에 대한 준비 없이는 안정적인 서비스를 운영할 수 없다. 이 장에서는 재연결이 필요한 이유, 재연결 시 발생하는 문제들, 그리고 검증된 재연결 전략을 상세히 다룹니다.

## 3.1 재연결이 반드시 필요한 이유

### 3.1.1 현실 세계의 네트워크

이상적인 세계에서는 한 번 연결하면 영원히 유지된다. 하지만 현실은 다릅니다. 네트워크 연결은 다양한 이유로 끊어질 수 있으며, 이는 버그가 아닌 정상적인 운영 환경의 일부이다. 따라서 재연결은 예외 처리가 아니라 핵심 기능으로 설계해야 한다.

```
# 네트워크 끊김 원인들
- Wi-Fi → LTE 전환 (모바일)
- 터널, 엘리베이터 (모바일)
- 라우터 재시작
- ISP 장애
- Broker 재시작
- 로드밸런서 타임아웃
- 메모리 부족으로 인한 강제 종료
```

### 3.1.2 환경별 특성

**모바일**
```
- 수시로 네트워크 전환
- 백그라운드 진입 시 OS가 연결 끊음
- 배터리 절약으로 인한 제한
```

**로봇/차량**
```
- 이동 중 기지국 전환
- 음영 지역 통과
- 하드웨어 재부팅
```

**IoT 센서**
```
- 전원 불안정
- 무선 간섭
- 펌웨어 업데이트로 재시작
```

### 3.1.3 Broker 장애

Broker도 죽을 수 있다:
```
- 메모리 부족
- 디스크 가득 참
- 업그레이드/패치
- 하드웨어 장애
```

**결론**: 재연결은 "만약"이 아니라 "언제" 발생하느냐의 문제이다.

## 3.2 재연결 시 발생하는 문제들

### 3.2.1 구독 유실

Clean Start 설정에 따라 구독이 사라질 수 있다.

```
# 시나리오
1. Client가 topic/a, topic/b 구독 중
2. 연결 끊김
3. Session Expiry 지남 또는 Clean Start=true로 재연결
4. 구독 정보 사라짐
5. 메시지를 못 받음!
```

### 3.2.2 중복 메시지

재연결 시점에 따라 같은 메시지를 여러 번 받을 수 있다.

```
# 시나리오
1. Broker가 메시지 전송
2. Client가 받았지만 ACK 전송 전 연결 끊김
3. 재연결
4. Broker가 ACK 못 받았으므로 재전송
5. 같은 메시지 2번 받음
```

### 3.2.3 메시지 순서 깨짐

```
# 시나리오
1. 메시지 A 전송됨
2. 연결 끊김
3. 메시지 B, C가 Broker에 저장됨
4. 재연결
5. 저장된 B, C가 먼저 옴
6. 순서: B → C → D (A는 이미 처리됨)

# 문제: A 처리 후 연결 끊기 전에 온 메시지는?
```

## 3.3 재연결 설계 전략

### 3.3.1 Auto Reconnect

대부분의 MQTT 클라이언트 라이브러리는 자동 재연결을 지원한다.

```go
// Paho v5 예시
config := autopaho.ClientConfig{
    ConnectRetryDelay: 10 * time.Second,  // 재시도 간격
    // ...
}
```

**자동 재연결이 하는 일:**
1. 연결 끊김 감지
2. 일정 시간 대기
3. 재연결 시도
4. 실패하면 다시 대기 후 재시도

### 3.3.2 Backoff 전략

재연결 실패 시 대기 시간을 점점 늘리는 전략이다.

```
# Fixed Backoff (고정)
시도 1: 1초 대기
시도 2: 1초 대기
시도 3: 1초 대기
...

# Exponential Backoff (지수)
시도 1: 1초 대기
시도 2: 2초 대기
시도 3: 4초 대기
시도 4: 8초 대기
...

# Exponential Backoff with Jitter (+ 랜덤)
시도 1: 1초 + random(0~500ms)
시도 2: 2초 + random(0~500ms)
...
```

**왜 Jitter가 필요한가:**
```
# 시나리오: Broker 재시작
1. 1000개 Client가 동시에 끊김
2. 모두 1초 후 재연결 시도
3. Broker에 1000개 연결 요청 폭주
4. Broker 과부하

# Jitter 적용 시
1. 1000개 Client가 동시에 끊김
2. 각자 1초 + 랜덤 시간 후 재연결
3. 연결 요청이 분산됨
4. Broker 안정적 처리
```

### 3.3.3 Session 유지 vs 초기화

```go
// Session 유지 (권장)
CleanStart: false
SessionExpiryInterval: 3600  // 1시간

// 장점:
// - 구독 정보 유지
// - 오프라인 메시지 받음

// Session 초기화
CleanStart: true

// 필요한 경우:
// - 완전히 새로 시작해야 할 때
// - 문제가 발생해서 리셋할 때
```

## 3.4 재연결 후 처리 로직

### 3.4.1 재구독 전략

Session이 만료되었거나 Clean Start를 사용한 경우, 재구독이 필요한다.

```go
// 재연결 성공 시 콜백
func onConnect(client *paho.Client) {
    // 필요한 Topic들 재구독
    topics := []string{
        "device/+/state",
        "command/mydevice/#",
    }

    for _, topic := range topics {
        client.Subscribe(topic, qos)
    }
}
```

**Best Practice: 구독 목록 관리**
```go
type SubscriptionManager struct {
    subscriptions map[string]byte  // topic -> qos
}

func (sm *SubscriptionManager) Resubscribe(client *paho.Client) {
    for topic, qos := range sm.subscriptions {
        client.Subscribe(topic, qos)
    }
}
```

### 3.4.2 미처리 메시지 처리

재연결 후 밀린 메시지를 받을 때 고려사항:

```go
func onMessage(msg Message) {
    // 1. 메시지 나이 확인
    age := time.Since(msg.Timestamp)
    if age > maxMessageAge {
        log.Warn("Discarding old message", age)
        return
    }

    // 2. 중복 확인
    if isProcessed(msg.ID) {
        return
    }

    // 3. 처리
    processMessage(msg)
    markAsProcessed(msg.ID)
}
```

### 3.4.3 상태 동기화 패턴

재연결 후 현재 상태를 동기화하는 패턴이다.

**방법 1: Retained Message 활용**
```
# 구독하면 마지막 상태 즉시 수신
SUBSCRIBE topic: device/+/state
→ 각 디바이스의 마지막 상태 수신
```

**방법 2: 명시적 상태 요청**
```
# 재연결 후 상태 요청
PUBLISH topic: device/mydevice/cmd/get_state
→ 디바이스가 현재 상태 응답
```

**방법 3: 시퀀스 번호 기반**
```go
// 마지막 처리한 시퀀스 저장
lastSequence := loadLastSequence()

// 재연결 후
for _, msg := range messages {
    if msg.Sequence <= lastSequence {
        continue  // 이미 처리함
    }
    processMessage(msg)
    saveLastSequence(msg.Sequence)
}
```

---

> **다음 편 안내**: [MQTT v5 완벽 가이드 (4): 고급 기능과 보안](/database/mqtt-v5-guide-4-advanced-security)에서는 Shared Subscription, Request/Response 패턴, Reason Code, 그리고 TLS 보안 설정을 다룹니다.

---

# 4. 참고

- [MQTT v5 스펙](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html)
- [Eclipse Paho Go Client](https://github.com/eclipse/paho.golang)
