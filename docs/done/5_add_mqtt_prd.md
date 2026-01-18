# MQTT v5 실습 프로젝트 블로그 추가 작업

## 프로젝트 분석

### go-mqtt-dashboard 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 위치 | `/Users/user/GolandProjects/tutorials-go/message-queue/go-mqtt-dashboard` |
| 목적 | MQTT v5 프로토콜을 활용한 실시간 디바이스 모니터링 시스템 |
| 기술 스택 | Go (autopaho) + React (mqtt.js) + Mosquitto |

### 프로젝트 구조

```
go-mqtt-dashboard/
├── backend/
│   ├── cmd/main.go              # 진입점, 디바이스 상태 발행
│   └── internal/
│       ├── device/simulator.go  # 가상 디바이스 시뮬레이터
│       └── mqtt/client.go       # autopaho 클라이언트 래퍼
├── frontend/
│   └── src/
│       ├── hooks/useMqtt.ts     # MQTT 커스텀 훅 (mqtt.js)
│       └── components/DeviceStatus.tsx  # 대시보드 UI
├── mosquitto/config/mosquitto.conf  # Broker 설정 (TCP + WebSocket)
├── docker-compose.yml
├── Makefile
└── README.md
```

### 핵심 학습 포인트

1. **autopaho 실전 사용법** - Go 백엔드에서 자동 재연결 구현
2. **mqtt.js (브라우저)** - React에서 WebSocket으로 MQTT 사용
3. **토픽 설계 실습** - `device/1/state`, `device/1/command`
4. **QoS 선택 기준** - 상태(QoS 0) vs 명령(QoS 1)
5. **양방향 통신** - Backend → Frontend (상태), Frontend → Backend (명령)

---

## 추가 위치 분석

### MQTT v5 완벽 가이드 시리즈 구조

| 편 | 제목 | 주요 내용 |
|----|------|----------|
| 1편 | 개념과 아키텍처 이해하기 | MQTT 개요, Broker 구조, HTTP 비교 |
| 2편 | Topic 설계와 메시지 모델 | Topic 네이밍, Wildcard, User Properties |
| 3편 | QoS, Session, 재연결 전략 | QoS 동작 원리, Session 관리, Backoff |
| 4편 | 고급 기능과 보안 | Shared Subscription, TLS, ACL |
| 5편 | Go + Paho 실전 구현과 운영 | autopaho 사용법, 모니터링, 사용 판단 |

### 추천 추가 위치: **5편 (Go + Paho 실전 구현과 운영)**

**이유:**
1. 5편이 "실전 구현"을 다루는 편으로, 실습 프로젝트와 가장 적합
2. 이미 autopaho 코드 예제가 있어 자연스럽게 확장 가능
3. "부록: 실습 환경 설정" 섹션 다음에 "실전 프로젝트" 섹션 추가 적합
4. 프로젝트가 시리즈 전체 개념(Topic, QoS, 재연결)을 종합 적용한 예제

### 대안 위치

| 위치 | 장점 | 단점 |
|------|------|------|
| **5편 확장 (권장)** | 실전 구현 컨텍스트 일치 | 5편이 길어짐 |
| 별도 6편 신설 | 독립적 완결성 | 시리즈 구조 변경 필요 |
| 부록으로 추가 | 기존 구조 유지 | 가시성 낮음 |

---

## 작업 계획

### 1. 5편에 "실전 프로젝트" 섹션 추가

**추가 위치:** 5편 `index.md`의 "5. 부록" 앞 (4장과 5장 사이)

**추가할 섹션 구조:**

```markdown
# 4. 실전 프로젝트: 디바이스 대시보드

## 4.1 프로젝트 개요
- 아키텍처 다이어그램
- 기술 스택 설명

## 4.2 토픽 설계
- device/1/state (상태 발행)
- device/1/command (명령 수신)

## 4.3 Backend 구현 (Go + autopaho)
- client.go 분석
- simulator.go 분석
- main.go 흐름

## 4.4 Frontend 구현 (React + mqtt.js)
- useMqtt 훅 분석
- WebSocket 연결 설정

## 4.5 Broker 설정 (Mosquitto)
- TCP + WebSocket 리스너
- 설정 파일 분석

## 4.6 실행 및 테스트
- 실행 순서
- 동작 확인 방법
```

### 2. 필요한 작업 목록

- [ ] 5편 목차에 "4. 실전 프로젝트: 디바이스 대시보드" 추가
- [ ] 기존 4장 → 5장, 5장 → 6장, 6장 → 7장으로 번호 조정
- [ ] 새 4장 콘텐츠 작성
  - [ ] 프로젝트 개요 및 아키텍처
  - [ ] 토픽 설계 설명
  - [ ] Backend 코드 분석 (Go)
  - [ ] Frontend 코드 분석 (React)
  - [ ] Broker 설정 분석
  - [ ] 실행 가이드
- [ ] 프로젝트 GitHub 링크 추가
- [ ] 스크린샷 추가 (선택)

### 3. 예상 콘텐츠 분량

| 섹션 | 예상 분량 |
|------|----------|
| 4.1 프로젝트 개요 | 200자 |
| 4.2 토픽 설계 | 300자 |
| 4.3 Backend 구현 | 800자 + 코드 |
| 4.4 Frontend 구현 | 600자 + 코드 |
| 4.5 Broker 설정 | 200자 + 코드 |
| 4.6 실행 및 테스트 | 300자 |
| **총합** | **약 2,400자 + 코드** |

---

## 코드 하이라이트 포인트

### Backend (autopaho)

```go
// 자동 재연결 + OnConnectionUp에서 재구독
cfg := autopaho.ClientConfig{
    ServerUrls:                    []*url.URL{u},
    KeepAlive:                     30,
    CleanStartOnInitialConnection: false,
    SessionExpiryInterval:         60,
    OnConnectionUp: func(cm *autopaho.ConnectionManager, connAck *paho.Connack) {
        // 연결 시 구독 설정 (재연결 시에도 호출됨)
        cm.Subscribe(ctx, &paho.Subscribe{...})
    },
}
```

### Frontend (mqtt.js)

```typescript
// WebSocket + MQTT v5 + 자동 재연결
const mqttClient = mqtt.connect(brokerUrl, {
    protocolVersion: 5,
    reconnectPeriod: 1000,
});
```

### 토픽 설계

| 토픽 | Publisher | Subscriber | QoS | 용도 |
|------|-----------|------------|-----|------|
| `device/1/state` | Backend | Frontend | 0 | 상태 발행 (2초 주기) |
| `device/1/command` | Frontend | Backend | 1 | 명령 전송 (start/stop) |

---

## 참고 사항

- 프로젝트 소스: `/Users/user/GolandProjects/tutorials-go/message-queue/go-mqtt-dashboard`
- README.md에 상세 설명 이미 존재
- Makefile로 실행 방법 표준화됨
