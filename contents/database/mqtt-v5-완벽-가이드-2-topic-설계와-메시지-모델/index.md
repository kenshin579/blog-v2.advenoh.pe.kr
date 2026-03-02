---
title: "MQTT v5 완벽 가이드 (2): Topic 설계와 메시지 모델"
description: "MQTT Topic 설계 Best Practice와 Wildcard 사용법, v5의 User Properties, Message Expiry 등 메시지 모델을 상세히 알아본다."
date: 2026-02-11
update: 2026-02-11
tags:
  - MQTT
  - MQTT v5
  - Topic
  - Wildcard
  - User Properties
  - Message Expiry
  - Payload
  - 메시지 설계
  - 토픽 설계
  - 메시지 브로커
  - 발행구독 패턴
series: "MQTT v5 완벽 가이드"
---

# 1. Topic 설계

<img src="thumbnail.png" alt="MQTT v5 Basic Architecture" width="50%" />

이 장에서는 Topic 네이밍 규칙, Wildcard 사용법, 그리고 실무에서 검증된 Best Practice를 다룬다. 이 내용을 숙지하면 수천 개의 디바이스가 연결된 시스템에서도 효율적으로 메시지를 관리할 수 있다.

## 1.1 Topic 구조와 규칙

### 1.1.1 계층적 네이밍

Topic은 슬래시(/)로 계층을 나눈다. 이 구조는 파일 시스템의 디렉터리 구조와 유사하다. 계층적 구조를 사용하면 Wildcard를 통해 특정 범위의 메시지만 구독할 수 있어 매우 유연한 메시지 필터링이 가능하다. 예를 들어, 3층의 모든 센서 데이터만 구독하거나, 특정 건물의 모든 온도 데이터만 구독하는 것이 가능하다.

```
# 좋은 예
company/building/floor/room/sensor_type

# 실제 예시
acme/hq/3f/meeting-room-a/temperature
acme/hq/3f/meeting-room-a/humidity
acme/hq/3f/meeting-room-b/temperature
```

### 1.1.2 네이밍 규칙

1. **소문자 사용 권장**
   ```
   home/temperature (O)
   Home/Temperature (비추천 - 대소문자 구분되어 혼란)
   ```

2. **공백 대신 하이픈 또는 언더스코어**
   ```
   meeting-room-a (O)
   meeting_room_a (O)
   meeting room a (X)
   ```

3. **의미 있는 순서**
   ```
   # 일반적인 순서: 큰 범위 → 작은 범위 → 타입
   지역/건물/층/방/센서종류
   ```

## 1.2 Wildcard

Wildcard는 **Subscribe할 때만** 사용할 수 있다. Publish할 때는 사용할 수 없다. Wildcard를 사용하면 여러 Topic을 한 번에 구독할 수 있어 코드가 간결해지고 관리가 용이하다. 하지만 과도한 Wildcard 사용은 불필요한 메시지를 수신하게 되어 성능 저하를 일으킬 수 있으므로 주의가 필요하다.

### 1.2.1 + (Single-Level Wildcard)

한 단계만 대체한다. 정확히 하나의 Topic 레벨을 대신하며, 빈 레벨은 매칭되지 않는다. 특정 위치의 값만 다른 여러 Topic을 구독할 때 유용한다.

```
구독: home/+/temperature

매칭됨:
  home/livingroom/temperature ✓
  home/bedroom/temperature ✓

매칭 안됨:
  home/floor1/room1/temperature ✗ (2단계)
  home/temperature ✗ (0단계)
```

### 1.2.2 # (Multi-Level Wildcard)

해당 위치부터 모든 하위 레벨을 대체한다.

```
구독: home/#

매칭됨:
  home/livingroom ✓
  home/livingroom/temperature ✓
  home/floor1/room1/sensor1 ✓

주의:
  # 는 반드시 마지막에만 올 수 있음
  home/#/temperature (X) - 잘못된 사용
```

## 1.3 Topic 설계 Best Practice

### 1.3.1 Command / Event / State 분리

메시지의 성격에 따라 Topic을 분리하는 게 좋다. 

```
# Command: 명령 (누군가가 해야 할 일)
device/light-001/cmd/turn_on
device/light-001/cmd/set_brightness

# Event: 이벤트 (발생한 일)
device/light-001/event/button_pressed
device/light-001/event/error_occurred

# State: 상태 (현재 상태)
device/light-001/state/power
device/light-001/state/brightness
```

**왜 분리해야 할까요?**

메시지 성격에 따라 `QoS`와 Retain 전략을 다르게 설정할 수 있기 때문에 분리하는 것이 좋다.

- Command는 반드시 처리되어야 함 → `QoS` 1 이상
- Event는 놓쳐도 될 수 있음 → `QoS` 0 가능
- State는 최신 값만 중요 → Retained Message 사용

### 1.3.2 버전 관리 전략

API처럼 Topic에도 버전을 넣을 수 있다. 버전을 명시하면 Payload 구조나 의미가 바뀌는 Breaking change가 발생해도 기존 Subscriber에 영향을 주지 않고 점진적으로 마이그레이션할 수 있다.

```
# 버전 포함
v1/device/sensor-001/temperature
v2/device/sensor-001/temperature

# 또는 시스템 수준에서
mycompany/v1/device/sensor-001/temperature
```

### 1.3.3 과도한 Wildcard의 문제

```
# 위험한 구독
구독: #

# 이러면 Broker의 모든 메시지를 받음
# - 부하 증가
# - 보안 문제
# - 처리할 수 없는 양의 데이터
```

**원칙**: 필요한 만큼만 구독하세요.

```
# 나쁜 예: 너무 넓은 구독
home/#

# 좋은 예: 필요한 것만 구독
home/livingroom/temperature
home/livingroom/humidity
```

---

# 2. MQTT v5 메시지 모델

`MQTT` 메시지는 단순히 데이터만 담는 것이 아니다. v5에서는 Payload 외에도 User Properties, Message Expiry Interval 등 다양한 메타데이터를 함께 전송할 수 있다. 이 장에서는 메시지를 구성하는 요소들과 각각의 활용 방법을 알아본다. 올바른 메시지 모델링은 시스템의 확장성과 유지보수성에 큰 영향을 미친다.

## 2.1 Payload

Payload는 메시지의 **본문**이다. 실제 데이터가 들어가며, `MQTT` 프로토콜은 Payload의 형식을 강제하지 않는다. `JSON`, `XML`, Binary, 심지어 단순 문자열도 가능한다. 이러한 유연성은 장점이자 단점이다. 형식의 자유도가 높은 만큼 Publisher와 Subscriber 간의 명확한 약속이 필요한다.

### 2.1.1 JSON 형식

가장 많이 사용되는 형식이다. 대부분의 프로그래밍 언어에서 `JSON` 파싱 라이브러리를 제공하므로 구현이 쉽고, 사람이 읽을 수 있어 디버깅에 유리한다.

```json
{
  "temperature": 25.5,
  "humidity": 60,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**장점:**
- 사람이 읽기 쉬움
- 디버깅 용이
- 유연한 구조

**단점:**
- 크기가 큼
- 파싱 비용

### 2.1.2 Binary 형식

배터리로 동작하는 소형 IoT 기기에서 사용한다.

```
// 예: 온도 25.5를 2바이트로 표현
[0x00, 0xFF] // 255 = 25.5 * 10
```

**장점:**
- 크기가 작음
- 파싱 빠름

**단점:**
- 사람이 읽기 어려움
- 스키마 관리 필요

### 2.1.3 Schema 없는 통신의 책임

`MQTT`는 Payload의 형식을 강제하지 않는다.

```
// Broker 입장에서 이 둘은 동일하게 처리됨
{"temp": 25}
hello world
0x00 0x01 0x02
```

**따라서 개발자가 책임져야 할 것들:**
1. Publisher와 Subscriber가 같은 형식 사용
2. 버전 관리
3. 유효성 검증
4. 문서화

## 2.2 User Properties

v5에서 추가된 기능으로, 메시지에 **메타데이터**를 추가할 수 있다.

### 2.2.1 메타데이터 전달

Payload를 건드리지 않고 추가 정보를 전달할 수 있다.

```
Payload: {"temperature": 25}

User Properties:
  content-type: application/json
  device-id: sensor-001
  firmware-version: 1.2.3
```

### 2.2.2 Correlation 정보

Request / Response 패턴에서 요청과 응답을 매칭할 때 사용한다.

```
# Request
User Properties:
  correlation-id: req-12345

# Response
User Properties:
  correlation-id: req-12345  # 같은 ID로 매칭
```

### 2.2.3 Trace ID 전달 패턴

분산 시스템에서 로그 추적에 유용한다.

```
# 모든 메시지에 Trace ID 포함
User Properties:
  trace-id: abc-xyz-123
  span-id: span-456

# 로그에서 이 ID로 전체 흐름 추적 가능
[sensor] trace-id=abc-xyz-123 -> Published temperature
[broker] trace-id=abc-xyz-123 -> Routing to 3 subscribers
[server] trace-id=abc-xyz-123 -> Received and processed
```

## 2.3 Message Expiry Interval

메시지의 **유효 시간(`TTL`)**을 설정한다.

### 2.3.1 TTL 개념

```
PUBLISH
  topic: alert/fire
  payload: "Fire detected!"
  message_expiry_interval: 60  # 60초 후 만료
```

**동작 방식:**
1. Publisher가 메시지 발행 시 `TTL` 설정
2. Broker가 메시지를 저장할 때 타이머 시작
3. `TTL` 내에 전달되지 않으면 메시지 삭제
4. Subscriber가 받을 때 남은 시간 확인 가능

### 2.3.2 늦게 도착한 메시지 처리 전략

```
# 상황: Subscriber가 오프라인이었다가 연결됨
# 5분 전 메시지가 저장되어 있음

# 옵션 1: TTL로 자동 만료
message_expiry_interval: 300  # 5분

# 옵션 2: Subscriber에서 판단
if (now - message.timestamp) > threshold:
    discard(message)

# 옵션 3: 항상 최신 값만 사용 (Retained)
# 이전 메시지 무시하고 마지막 값만 사용
```

# 3. FAQ

### Q: Wildcard로 구독했을 때 실제 매칭된 Topic을 알 수 있나요?

**A: 네, 알 수 있다. 메시지에 항상 실제 Topic이 포함되어 전달된다.**

Wildcard로 구독하더라도 메시지를 받을 때는 정확한 Topic 정보가 함께 온다.

```
# 구독
SUBSCRIBE topic: home/+/temperature

# 메시지 수신 시
Message 1:
  topic: home/livingroom/temperature  ← 실제 Topic
  payload: 25

Message 2:
  topic: home/bedroom/temperature     ← 실제 Topic
  payload: 22
```

**Go Paho 예시:**

```go
router.RegisterHandler("home/+/temperature", func(msg *paho.Publish) {
    // msg.Topic에 실제 매칭된 Topic이 들어있음
    fmt.Printf("Topic: %s, Payload: %s\n", msg.Topic, msg.Payload)
    // 출력: Topic: home/livingroom/temperature, Payload: 25
    // 출력: Topic: home/bedroom/temperature, Payload: 22
})
```

이를 활용하면 Topic에서 방 이름 등을 파싱하여 처리할 수 있다. 


# 4. 마무리

이번 글에서는 `MQTT` 시스템의 핵심인 **Topic 설계**와 **메시지 모델**을 살펴보았다.

Topic은 슬래시(/)로 계층을 구분하고, Wildcard(`+`, `#`)를 활용해 유연하게 구독할 수 있다. 메시지 성격에 따라 Command/Event/State를 분리하고, 필요한 범위만 구독하는 것이 중요하다.

v5에서는 User Properties로 메타데이터를 전달하고, Message Expiry로 오래된 메시지를 자동 만료시킬 수 있다. Payload 형식은 `MQTT`가 강제하지 않으므로 개발자 간 명확한 약속이 필요하다.

Topic 설계는 운영 후 변경이 어렵기 때문에 초기 단계에서 충분히 검토하길 바란다.

> **다음 편 안내**: [MQTT v5 완벽 가이드 (3): QoS, Session, 재연결 전략](/database/mqtt-v5-완벽-가이드-3-qos-session-재연결-전략)에서는 `QoS` 동작 원리, 세션 관리, 그리고 실무에서 가장 중요한 재연결 전략을 다룬다.


# 5. 참고

- [MQTT v5 스펙](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html)
- [EMQX Topic 설계 가이드](https://www.emqx.io/docs)
