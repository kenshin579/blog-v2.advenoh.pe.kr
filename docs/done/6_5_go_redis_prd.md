# Go에서 Redis 활용하기 PRD

> 시리즈: Golang 블로그 주제 Phase 2 - 데이터베이스 (2/3)
> 참조: `6_golang_topic_prd.md` B-2

---

## 1. 개요

Go에서 Redis를 활용하는 다양한 패턴. 기본 데이터 조작부터 Pub/Sub, Stream, 클러스터 모드, 분산 락, 그리고 테스트까지 실무에서 자주 사용하는 Redis 패턴을 다룬다.

**대상 독자**: Redis 기본 개념을 아는 Go 개발자
**난이도**: 중급
**예제 코드**: `tutorials-go/database/redis/`

---

## 2. 블로그 구조

### 2.1 go-redis 라이브러리
- 설치: `go get github.com/redis/go-redis/v9`
- v8 vs v9 차이점 (context 필수화 등)
- 기본 연결: `redis.NewClient(&redis.Options{})`

### 2.2 기본 데이터 조작
- String: SET/GET (기본 타입, JSON 직렬화)
- 구조체 저장: JSON Marshal → SET → GET → Unmarshal
- TTL 설정: `Set(ctx, key, value, expiration)`
- 참고 코드: `redis/redis_test.go` (Ping, String, Struct)

### 2.3 Sorted Set 활용
- ZADD: 스코어 기반 데이터 추가
- ZRANGE: 범위 조회
- 활용 사례: 리더보드, 랭킹 시스템
- 참고 코드: `redis/redis_performance_test.go`

### 2.4 Pub/Sub 패턴
- Pub/Sub 개념: 발행-구독 메시징 모델
- `client.Subscribe(ctx, "channel")` - 채널 구독
- `client.Publish(ctx, "channel", message)` - 메시지 발행
- 패턴 구독: `client.PSubscribe(ctx, "news.*")` - 와일드카드 매칭
- 활용 사례: 실시간 알림, 채팅, 이벤트 브로드캐스트
- 주의사항: 메시지 영속성 없음 (구독자 없으면 메시지 유실)
- 참고 코드: `redis/pubsub_test.go`

### 2.5 Redis Stream
- Stream 개념: 로그 기반 데이터 구조 (Pub/Sub의 영속성 버전)
- Pub/Sub vs Stream 비교: 메시지 영속성, Consumer Group, 재처리 가능 여부
- `XADD` - 메시지 추가: `client.XAdd(ctx, &redis.XAddArgs{})`
- `XREAD` - 메시지 읽기: `client.XRead(ctx, &redis.XReadArgs{})`
- Consumer Group 패턴:
  - `XGROUP CREATE` - 소비자 그룹 생성
  - `XREADGROUP` - 그룹 내 소비자별 메시지 읽기
  - `XACK` - 메시지 처리 완료 확인
- 활용 사례: 이벤트 소싱, 작업 큐, 로그 수집
- 참고 코드: `redis/stream_test.go`

### 2.6 성능 특성과 동시성
- Redis 싱글 스레드 특성과 Go 동시성
- 동시 읽기/쓰기 패턴 (`sync.WaitGroup`)
- 파이프라인으로 RTT 최소화
- 참고 코드: `redis/redis_performance_test.go` (50K 레코드 벤치마크)

### 2.7 Redis Cluster 모드
- 클러스터 연결: `redis.NewClusterClient()`
- `ForEachShard` - 모든 샤드 순회
- 클러스터 환경에서의 키 분배
- 참고 코드: `cluster/config/` (클러스터 설정)

### 2.8 분산 락 (Distributed Lock)
- Redis 기반 분산 락의 필요성
  - 동시성 문제: 여러 서비스 인스턴스가 동일 리소스 접근 시
  - DB 락 vs Redis 락 비교
- Redlock 알고리즘 개요
  - 단일 인스턴스 락: `SET key value NX PX milliseconds`
  - 다중 인스턴스 Redlock: 과반수 노드에서 락 획득
- Go에서의 구현
  - `go-redsync/redsync` 라이브러리 활용
  - `redsync.New()` → `rs.NewMutex("lock-key")` → `mutex.Lock()` / `mutex.Unlock()`
  - 락 갱신 (Extend), 타임아웃, 재시도 설정
- 활용 사례: 중복 결제 방지, 스케줄러 단일 실행, 리소스 경쟁 제어
- 참고 코드: `golang/concurrency/` (Redis 기반 락)

### 2.9 miniredis를 활용한 테스트
- miniredis 개념: Go로 작성된 인메모리 Redis 서버
  - 설치: `go get github.com/alicebob/miniredis/v2`
  - 실제 Redis 없이 단위 테스트 가능
  - Docker/외부 의존성 제거로 CI 파이프라인 간소화
- 기본 사용법:
  - `miniredis.Run()` → 테스트용 서버 시작
  - `redis.NewClient(&redis.Options{Addr: s.Addr()})` → 연결
  - `defer s.Close()` → 테스트 종료 시 정리
- 지원 기능: String, Hash, List, Set, Sorted Set, Pub/Sub, Stream, TTL 등
- 시간 제어: `s.FastForward(time.Hour)` → TTL 테스트 시 시간 조작
- 제한사항: 클러스터 모드 미지원, Lua 스크립트 일부 미지원
- 참고 코드: `redis/miniredis_test.go`

---

## 3. 샘플 코드 참조

| 파일 | 내용 |
|------|------|
| `database/redis/redis/redis_test.go` | 기본 String/Struct 조작 |
| `database/redis/redis/redis_performance_test.go` | 성능/동시성 테스트 |
| `database/redis/redis/pubsub_test.go` | Pub/Sub 패턴 예제 |
| `database/redis/redis/stream_test.go` | Redis Stream + Consumer Group |
| `database/redis/redis/miniredis_test.go` | miniredis 단위 테스트 |
| `database/redis/cluster/` | Redis Cluster 설정/테스트 |
| `database/redis/docker-compose.yml` | Redis 로컬 환경 |
| `golang/concurrency/` | 분산 락 구현 (redsync) |

---

## 4. 논의 사항 (결정 완료)

- [x] Pub/Sub 패턴 → 예제 추가 (2.4절)
- [x] Redis Stream → 소개 포함 (2.5절)
- [x] 분산 락 → 이 글에 포함, 상세 설명 보강 (2.8절)
- [x] Blackboard 앱 → 다루지 않음 (제거)
- [x] miniredis → 테스트 섹션으로 소개 (2.9절)
