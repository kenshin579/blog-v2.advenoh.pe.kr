---
title: "MQTT v5 완벽 가이드 (5): Go + Paho 실전 구현과 운영"
description: "Go 언어로 MQTT v5 클라이언트를 구현하는 방법과 운영 모니터링, MQTT 사용 판단 기준을 다룹니다."
date: 2026-01-18
update: 2026-01-18
series: "MQTT v5 완벽 가이드"
tags:
  - MQTT
  - MQTT v5
  - Go
  - Golang
  - Paho
  - autopaho
  - Mosquitto
  - 모니터링
  - Prometheus
  - Grafana
---

# 1. Go + Paho (v5) 사용법

이 장에서는 Go 언어로 MQTT v5 클라이언트를 구현하는 방법을 다룹니다. Eclipse Paho 프로젝트에서 제공하는 `paho.golang` 패키지를 사용하며, 특히 자동 재연결을 지원하는 `autopaho` 패키지의 사용법을 중심으로 설명한다. 앞서 배운 개념들을 실제 코드로 구현하는 방법을 익히면 바로 프로덕션에 적용할 수 있다.

## 1.1 Paho v5 구조 이해

Go에서 MQTT v5를 사용하려면 `eclipse/paho.golang` 패키지를 사용한다. 이 패키지는 두 가지 레벨의 API를 제공한다. `paho` 패키지는 저수준 API로 세밀한 제어가 가능하고, `autopaho` 패키지는 자동 재연결 등 편의 기능이 포함된 고수준 API이다. 실무에서는 대부분 `autopaho`를 사용하는 것이 좋다.

### 1.1.1 주요 패키지

```go
import (
    "github.com/eclipse/paho.golang/paho"           // 기본 클라이언트
    "github.com/eclipse/paho.golang/autopaho"       // 자동 재연결
)
```

### 1.1.2 ClientConfig (autopaho)

```go
config := autopaho.ClientConfig{
    // Broker 주소
    BrokerUrls: []*url.URL{brokerURL},

    // Keep Alive 간격
    KeepAlive: 30,

    // 재연결 간격
    ConnectRetryDelay: 10 * time.Second,

    // 연결 성공 시 콜백
    OnConnectionUp: func(cm *autopaho.ConnectionManager, connAck *paho.Connack) {
        // 구독 설정
    },

    // 연결 끊김 시 콜백
    OnConnectError: func(err error) {
        log.Error("Connection error", err)
    },
}
```

### 1.1.3 ConnectionManager

```go
// 연결 시작
cm, err := autopaho.NewConnection(ctx, config)

// 연결 대기
err = cm.AwaitConnection(ctx)

// 연결 종료
err = cm.Disconnect(ctx)
```

### 1.1.4 Handler 구조

```go
// 메시지 수신 핸들러
func messageHandler(msg *paho.Publish) {
    fmt.Printf("Topic: %s, Payload: %s\n",
        msg.Topic, string(msg.Payload))
}

// Router 설정
router := paho.NewStandardRouter()
router.RegisterHandler("sensor/#", messageHandler)
```

## 1.2 기본 사용 흐름

### 1.2.1 Connect (연결)

```go
package main

import (
    "context"
    "log"
    "net/url"

    "github.com/eclipse/paho.golang/autopaho"
    "github.com/eclipse/paho.golang/paho"
)

func main() {
    ctx := context.Background()

    brokerURL, _ := url.Parse("mqtt://localhost:1883")

    config := autopaho.ClientConfig{
        BrokerUrls: []*url.URL{brokerURL},
        KeepAlive:  30,

        ConnectUsername: "user",
        ConnectPassword: []byte("password"),

        ClientConfig: paho.ClientConfig{
            ClientID: "my-client",
            Router:   paho.NewStandardRouter(),
        },
    }

    cm, err := autopaho.NewConnection(ctx, config)
    if err != nil {
        log.Fatal(err)
    }

    err = cm.AwaitConnection(ctx)
    if err != nil {
        log.Fatal(err)
    }

    log.Println("Connected!")
}
```

### 1.2.2 Subscribe (구독)

```go
func setupSubscription(cm *autopaho.ConnectionManager, router *paho.StandardRouter) {
    // 핸들러 등록
    router.RegisterHandler("sensor/+/temperature", func(msg *paho.Publish) {
        log.Printf("Temperature: %s", msg.Payload)
    })

    // 구독 요청
    cm.Subscribe(context.Background(), &paho.Subscribe{
        Subscriptions: []paho.SubscribeOptions{
            {Topic: "sensor/+/temperature", QoS: 1},
        },
    })
}
```

### 1.2.3 Publish (발행)

```go
func publishMessage(cm *autopaho.ConnectionManager) {
    msg := &paho.Publish{
        Topic:   "sensor/001/temperature",
        QoS:     1,
        Payload: []byte(`{"value": 25.5}`),
        Properties: &paho.PublishProperties{
            UserProperties: []paho.UserProperty{
                {Key: "device-id", Value: "sensor-001"},
            },
        },
    }

    _, err := cm.Publish(context.Background(), msg)
    if err != nil {
        log.Error("Publish failed", err)
    }
}
```

## 1.3 재연결 구현 방식

### 1.3.1 자동 재연결 설정

```go
config := autopaho.ClientConfig{
    // 재연결 간격
    ConnectRetryDelay: 10 * time.Second,

    // 최대 재연결 간격 (Backoff)
    // 기본적으로 Exponential Backoff 적용됨
}
```

### 1.3.2 OnConnectionUp

연결 성공 시 호출된다. 재구독에 사용한다.

```go
config.OnConnectionUp = func(cm *autopaho.ConnectionManager, connAck *paho.Connack) {
    log.Println("Connected!")

    // Session이 새로 시작되었는지 확인
    if !connAck.SessionPresent {
        log.Println("Session not present, resubscribing...")
        resubscribe(cm)
    }
}

func resubscribe(cm *autopaho.ConnectionManager) {
    topics := []paho.SubscribeOptions{
        {Topic: "sensor/+/temperature", QoS: 1},
        {Topic: "command/my-device/#", QoS: 1},
    }

    cm.Subscribe(context.Background(), &paho.Subscribe{
        Subscriptions: topics,
    })
}
```

### 1.3.3 OnServerDisconnect

Broker가 연결을 끊었을 때 호출된다.

```go
config.ClientConfig.OnServerDisconnect = func(d *paho.Disconnect) {
    if d.ReasonCode != 0 {
        log.Printf("Server disconnected: reason=%d", d.ReasonCode)
    }
}
```

### 1.3.4 OnClientError

클라이언트 에러 발생 시 호출된다.

```go
config.ClientConfig.OnClientError = func(err error) {
    log.Printf("Client error: %v", err)
}
```

## 1.4 안전한 Handler 설계

### 1.4.1 Blocking 금지

메시지 핸들러에서 오래 걸리는 작업을 하면 안 된다.

```go
// 나쁜 예: 핸들러에서 직접 처리
func badHandler(msg *paho.Publish) {
    result := heavyProcessing(msg.Payload)  // 10초 걸림
    saveToDatabase(result)                   // 1초 걸림
    // 이 동안 다른 메시지 처리 못함!
}

// 좋은 예: 채널로 전달하고 바로 리턴
func goodHandler(msg *paho.Publish) {
    messageQueue <- msg  // 즉시 리턴
}

// 별도 고루틴에서 처리
go func() {
    for msg := range messageQueue {
        result := heavyProcessing(msg.Payload)
        saveToDatabase(result)
    }
}()
```

### 1.4.2 Worker Pool 패턴

```go
type MessageProcessor struct {
    queue   chan *paho.Publish
    workers int
}

func NewMessageProcessor(workers, queueSize int) *MessageProcessor {
    mp := &MessageProcessor{
        queue:   make(chan *paho.Publish, queueSize),
        workers: workers,
    }

    // Worker 시작
    for i := 0; i < workers; i++ {
        go mp.worker(i)
    }

    return mp
}

func (mp *MessageProcessor) worker(id int) {
    for msg := range mp.queue {
        log.Printf("Worker %d processing: %s", id, msg.Topic)
        processMessage(msg)
    }
}

func (mp *MessageProcessor) Enqueue(msg *paho.Publish) {
    select {
    case mp.queue <- msg:
        // 큐에 추가됨
    default:
        log.Warn("Queue full, dropping message")
    }
}

// 핸들러에서 사용
func handler(msg *paho.Publish) {
    processor.Enqueue(msg)
}
```

---

# 2. 운영 관점 MQTT v5

MQTT 시스템을 프로덕션에서 안정적으로 운영하려면 적절한 모니터링과 장애 대응 전략이 필요한다. 이 장에서는 반드시 모니터링해야 할 핵심 지표와 흔히 발생하는 장애 시나리오별 대응 방법을 다룹니다. 사전에 이러한 상황들을 준비해두면 장애 발생 시 빠르게 대응할 수 있다.

## 2.1 모니터링 포인트

MQTT 시스템의 건강 상태를 파악하기 위해 다음 지표들을 모니터링해야 한다. 대부분의 Broker가 이러한 메트릭을 제공하며, EMQX나 HiveMQ 같은 엔터프라이즈 Broker는 대시보드를 통해 시각화할 수 있다.

### 2.1.1 연결 수

연결 수는 시스템 부하를 가장 직접적으로 나타내는 지표이다. 갑작스러운 연결 수 변화는 네트워크 장애나 클라이언트 문제를 의미할 수 있다.

```
# 모니터링 항목
- 현재 활성 연결 수
- 연결/해제 비율 (churn rate)
- 연결 실패 수

# 경고 기준 예시
- 연결 수 급증: 1분 내 50% 이상 증가
- 연결 실패율: 1% 이상
```

### 2.1.2 메시지 처리율

```
# 모니터링 항목
- 초당 수신 메시지 수 (messages/sec)
- 초당 발송 메시지 수
- 평균 메시지 크기
- 대기 중인 메시지 수

# 경고 기준 예시
- 처리율 저하: 평소 대비 30% 이상 감소
- 대기열 증가: 1000개 이상
```

### 2.1.3 재연결 빈도

```
# 모니터링 항목
- 재연결 횟수 / 시간
- Client별 재연결 패턴
- 재연결 실패율

# 경고 기준 예시
- 특정 Client가 1분에 10회 이상 재연결
- 전체 재연결률 급증
```

## 2.2 장애 시나리오별 대응

### 2.2.1 Broker 재시작

```
# 현상
- 모든 Client 연결 끊김
- 동시 재연결 시도

# 대응
1. Client에 Exponential Backoff + Jitter 적용
2. Session Expiry 충분히 설정
3. Broker 클러스터링 고려
```

### 2.2.2 네트워크 Flap

```
# 현상
- 연결/끊김 반복
- 메시지 중복 발생

# 대응
1. 재연결 간격 조정
2. Idempotent 처리
3. 회로 차단기 패턴 적용
```

### 2.2.3 Client 폭증

```
# 현상
- 연결 수 급증
- Broker 응답 지연
- 메모리/CPU 급증

# 대응
1. 연결 속도 제한 (rate limiting)
2. Broker 스케일 아웃
3. 불필요한 연결 정리
```

## 2.3 Mosquitto 모니터링 도구

Mosquitto를 사용하는 경우 다양한 방법으로 Broker 상태를 모니터링할 수 있다. 환경과 규모에 따라 적합한 도구를 선택하세요.

### 2.3.1 $SYS Topic (내장 기능)

Mosquitto는 자체 상태 정보를 `$SYS/#` Topic으로 발행한다. 별도 설치 없이 바로 사용할 수 있어 빠른 상태 확인에 유용한다.

```bash
# 모든 시스템 메트릭 구독
mosquitto_sub -h localhost -t '$SYS/#' -v
```

**주요 메트릭:**

| Topic | 설명 |
|-------|------|
| `$SYS/broker/clients/connected` | 현재 연결된 클라이언트 수 |
| `$SYS/broker/clients/total` | 총 등록된 클라이언트 수 |
| `$SYS/broker/messages/received` | 수신한 총 메시지 수 |
| `$SYS/broker/messages/sent` | 발송한 총 메시지 수 |
| `$SYS/broker/load/messages/received/1min` | 1분간 수신 메시지 비율 |
| `$SYS/broker/load/publish/sent/1min` | 1분간 발송 메시지 비율 |
| `$SYS/broker/uptime` | Broker 가동 시간 (초) |
| `$SYS/broker/bytes/received` | 수신한 총 바이트 |
| `$SYS/broker/bytes/sent` | 발송한 총 바이트 |

**활성화 설정 (mosquitto.conf):**

```bash
# $SYS 메트릭 발행 간격 (초, 기본값 10)
sys_interval 10
```

### 2.3.2 MQTT Explorer (GUI 도구)

개발 및 테스트 환경에서 가장 쉽게 사용할 수 있는 데스크톱 앱이다.

- **다운로드**: https://mqtt-explorer.com
- **주요 기능**:
  - Topic 트리 시각화
  - 실시간 메시지 모니터링
  - 메시지 발행/구독 테스트
  - Payload 히스토리 및 차트
  - Retained Message 관리

```
# 연결 설정 예시
Host: localhost
Port: 1883
Username: (선택)
Password: (선택)
```

### 2.3.3 Prometheus + Grafana

프로덕션 환경에서 권장하는 방식이다. 메트릭 수집, 저장, 시각화, 알림까지 통합 관리할 수 있다.

**mosquitto-exporter 사용:**

```yaml
# docker-compose.yml
version: '3'
services:
  mosquitto:
    image: eclipse-mosquitto:2
    ports:
      - "1883:1883"
    volumes:
      - ./mosquitto.conf:/mosquitto/config/mosquitto.conf

  mosquitto-exporter:
    image: sapcc/mosquitto-exporter
    ports:
      - "9234:9234"
    environment:
      - BROKER_ENDPOINT=tcp://mosquitto:1883
    depends_on:
      - mosquitto

  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

**prometheus.yml:**

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'mosquitto'
    static_configs:
      - targets: ['mosquitto-exporter:9234']
```

**Grafana 대시보드 설정:**
1. Grafana 접속 (http://localhost:3000)
2. Data Source에 Prometheus 추가
3. Dashboard Import에서 Mosquitto 템플릿 검색 또는 직접 생성

### 2.3.4 Cedalo Management Center

Mosquitto를 만든 Cedalo에서 제공하는 공식 상용 관리 도구이다.

- **사이트**: https://cedalo.com/mqtt-management-center
- **주요 기능**:
  - 웹 기반 대시보드
  - 실시간 클라이언트 관리
  - ACL 동적 관리 (GUI)
  - 클러스터 모니터링
  - 감사 로그

### 2.3.5 환경별 추천 도구

| 환경 | 추천 도구 | 이유 |
|------|----------|------|
| **개발/테스트** | MQTT Explorer | 설치 쉽고 직관적인 GUI |
| **소규모 프로덕션** | $SYS Topic + 스크립트 | 추가 인프라 불필요 |
| **중규모 프로덕션** | Prometheus + Grafana | 알림, 히스토리, 대시보드 |
| **대규모/엔터프라이즈** | Cedalo 또는 EMQX 전환 | 전문 지원, 클러스터링 |

**$SYS Topic 모니터링 스크립트 예시 (Go):**

```go
func monitorBroker(cm *autopaho.ConnectionManager) {
    topics := []string{
        "$SYS/broker/clients/connected",
        "$SYS/broker/messages/received",
        "$SYS/broker/load/messages/received/1min",
    }

    for _, topic := range topics {
        cm.Subscribe(context.Background(), &paho.Subscribe{
            Subscriptions: []paho.SubscribeOptions{
                {Topic: topic, QoS: 0},
            },
        })
    }
}

// 메시지 핸들러에서 메트릭 수집
func handleSysMessage(msg *paho.Publish) {
    switch msg.Topic {
    case "$SYS/broker/clients/connected":
        clientCount, _ := strconv.Atoi(string(msg.Payload))
        if clientCount > threshold {
            alertSlack("클라이언트 수 임계치 초과: " + string(msg.Payload))
        }
    }
}
```

---

# 3. MQTT v5 사용 판단 기준

모든 기술에는 적합한 사용처가 있다. MQTT는 강력한 프로토콜이지만, 모든 상황에 적합한 것은 아닙니다. 이 장에서는 MQTT를 선택해야 하는 상황과 다른 기술을 선택해야 하는 상황을 명확히 구분한다. 잘못된 기술 선택은 프로젝트 전체에 영향을 미치므로, 프로젝트 초기에 올바른 판단을 내리는 것이 중요한다.

## 3.1 MQTT를 써야 하는 경우

다음과 같은 요구사항이 있다면 MQTT가 좋은 선택이다. 하나 이상 해당된다면 MQTT를 검토해볼 가치가 있다.

1. **실시간 양방향 통신이 필요할 때**
   ```
   - 채팅
   - 실시간 알림
   - 원격 제어
   ```

2. **많은 디바이스가 연결될 때**
   ```
   - IoT 센서 네트워크
   - 스마트 홈
   - 차량 관제
   ```

3. **네트워크가 불안정할 때**
   ```
   - 모바일 환경
   - 저전력 무선
   - 원격지
   ```

4. **서버 → 클라이언트 Push가 필요할 때**
   ```
   - 상태 변경 알림
   - 명령 전달
   - 이벤트 브로드캐스트
   ```

## 3.2 MQTT를 쓰면 안 되는 경우

1. **단순 요청-응답만 필요할 때**
   ```
   → HTTP/REST 사용
   ```

2. **파일 전송이 필요할 때**
   ```
   → HTTP, FTP, S3 등 사용
   MQTT는 작은 메시지에 최적화됨
   ```

3. **강력한 트랜잭션이 필요할 때**
   ```
   → 메시지 큐 (RabbitMQ, Kafka) 사용
   MQTT는 메시지 순서 보장이 약함
   ```

4. **브라우저 직접 연결이 필요할 때**
   ```
   → WebSocket 직접 사용 또는 MQTT over WebSocket
   ```

## 3.3 HTTP / gRPC와의 경계

| 기준 | HTTP | gRPC | MQTT |
|------|------|------|------|
| 통신 패턴 | 요청-응답 | 요청-응답, 스트리밍 | Pub/Sub |
| 연결 | 단발성 | 지속 가능 | 지속 |
| 다수 수신자 | 어려움 | 어려움 | 쉬움 |
| 서버 Push | 폴링 필요 | 스트리밍 가능 | 기본 지원 |
| 적합한 곳 | 웹 API | 마이크로서비스 | IoT, 실시간 |

---

# 4. 스터디 마무리

이 스터디를 통해 MQTT v5의 핵심 개념부터 실무 적용까지 전체적인 그림을 그릴 수 있게 되었기를 바랍니다. 마지막으로 배운 내용을 정리하고, 실무에 적용하기 전에 확인해야 할 체크리스트를 제공한다.

## 4.1 핵심 요약

지금까지 배운 내용 중 가장 중요한 포인트들을 정리한다. 이 내용들은 MQTT 기반 시스템을 설계하고 구현할 때 항상 염두에 두어야 한다.

### 4.1.1 MQTT v5의 본질

1. **Pub/Sub 패턴**
   - Publisher와 Subscriber가 서로 몰라도 됨
   - Broker가 메시지를 중계
   - Topic으로 메시지 분류

2. **경량 프로토콜**
   - 작은 오버헤드
   - 불안정한 네트워크에 적합
   - 저사양 디바이스 지원

3. **v5의 개선점**
   - Reason Code로 디버깅 용이
   - User Properties로 확장성
   - Shared Subscription으로 로드 분산

### 4.1.2 신뢰성은 애플리케이션 책임

MQTT가 보장하는 것:
- QoS에 따른 전달 보장
- 세션 유지

MQTT가 보장하지 않는 것:
- 메시지 순서 (여러 Topic 간)
- 중복 방지 (QoS 1 사용 시)
- 비즈니스 로직 정합성

**따라서 애플리케이션에서:**
- Idempotent 처리 구현
- 타임스탬프/시퀀스 기반 정렬
- 재연결 후 상태 동기화

---

# 5. 부록: 실습 환경 설정

## 5.1 Mosquitto Broker 설치 (Docker)

```bash
# Mosquitto 실행
docker run -d --name mosquitto \
  -p 1883:1883 \
  -p 9001:9001 \
  eclipse-mosquitto

# 설정 파일 사용
docker run -d --name mosquitto \
  -p 1883:1883 \
  -v $(pwd)/mosquitto.conf:/mosquitto/config/mosquitto.conf \
  eclipse-mosquitto
```

## 5.2 기본 설정 파일 (mosquitto.conf)

```
listener 1883
allow_anonymous true
```

## 5.3 테스트 명령어

```bash
# 구독 (터미널 1)
mosquitto_sub -h localhost -t "test/#" -v

# 발행 (터미널 2)
mosquitto_pub -h localhost -t "test/hello" -m "Hello MQTT!"
```

## 5.4 Go 의존성

```bash
go get github.com/eclipse/paho.golang@latest
```

---

# 6. 참고

- [MQTT v5 스펙](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html)
- [Eclipse Paho Go Client](https://github.com/eclipse/paho.golang)
- [EMQX 문서](https://www.emqx.io/docs)
- [Mosquitto 문서](https://mosquitto.org/documentation/)

---

> 이 문서는 계속 업데이트된다.
> 질문이나 피드백은 이슈로 남겨주세요.
