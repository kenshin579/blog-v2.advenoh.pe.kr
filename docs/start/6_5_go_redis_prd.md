# Go에서 Redis 활용하기 PRD

> 시리즈: Golang 블로그 주제 Phase 2 - 데이터베이스 (2/3)
> 참조: `6_golang_topic_prd.md` B-2

---

## 1. 개요

Go에서 Redis를 활용하는 다양한 패턴. 기본 String 조작부터 Sorted Set, Pub/Sub, 클러스터 모드, 그리고 분산 락까지 실무에서 자주 사용하는 Redis 패턴을 다룬다.

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

### 2.4 성능 특성과 동시성
- Redis 싱글 스레드 특성과 Go 동시성
- 동시 읽기/쓰기 패턴 (`sync.WaitGroup`)
- 파이프라인으로 RTT 최소화
- 참고 코드: `redis/redis_performance_test.go` (50K 레코드 벤치마크)

### 2.5 Redis Cluster 모드
- 클러스터 연결: `redis.NewClusterClient()`
- `ForEachShard` - 모든 샤드 순회
- 클러스터 환경에서의 키 분배
- 참고 코드: `cluster/config/` (클러스터 설정)

### 2.6 분산 락 (Distributed Lock)
- Redis 기반 분산 락의 필요성
- Redlock 알고리즘 개요
- Go에서의 구현 패턴
- 참고 코드: `golang/concurrency/` (Redis 기반 락)

### 2.7 실전 아키텍처 예제
- Blackboard 앱: Clean Architecture + Redis
- Repository 패턴으로 Redis 추상화
- 참고 코드: `redis/blackboard/` (Echo + Redis + Clean Arch)

---

## 3. 샘플 코드 참조

| 파일 | 내용 |
|------|------|
| `database/redis/redis/redis_test.go` | 기본 String/Struct 조작 |
| `database/redis/redis/redis_performance_test.go` | 성능/동시성 테스트 |
| `database/redis/cluster/` | Redis Cluster 설정/테스트 |
| `database/redis/blackboard/` | Clean Arch + Redis 앱 |
| `database/redis/docker-compose.yml` | Redis 로컬 환경 |
| `golang/concurrency/` | 분산 락 구현 |

---

## 4. 논의 사항

- [ ] Pub/Sub 패턴은 별도 예제 추가가 필요한지
- [ ] Redis Stream (이벤트 기반) 소개 여부
- [ ] 분산 락 내용을 이 글에 포함할지, 별도 글로 뺄지
- [ ] Blackboard 앱 예제를 상세히 다룰지, 참조만 할지
- [ ] miniredis (테스트용 인메모리 Redis) 도 소개할지
