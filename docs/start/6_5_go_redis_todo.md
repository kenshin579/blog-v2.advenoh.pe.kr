# Go에서 Redis 활용하기 - TODO

> PRD: `6_5_go_redis_prd.md`
> 구현 계획: `6_5_go_redis_implementation.md`

---

## 1단계: 샘플 코드 작성

### Pub/Sub 예제
- [x] `database/redis/redis/pubsub_test.go` 생성
- [x] `Test_PubSub_Basic` - 기본 발행/구독 테스트
- [x] `Test_PubSub_PatternSubscribe` - 패턴 구독 (PSubscribe) 테스트
- [x] `Test_PubSub_MultiChannel` - 다중 채널 구독 테스트
- [x] 테스트 실행 확인 (`go test -v -run PubSub`)

### Redis Stream 예제
- [x] `database/redis/redis/stream_test.go` 생성
- [x] `Test_Stream_XAdd_XRead` - 기본 메시지 추가/읽기
- [x] `Test_Stream_ConsumerGroup` - Consumer Group 패턴 (XGroupCreate, XReadGroup, XAck)
- [x] `Test_Stream_XRange` - 범위 조회
- [x] 테스트 실행 확인 (`go test -v -run Stream`)

### miniredis 예제
- [x] `database/redis/redis/miniredis_test.go` 생성
- [x] `Test_Miniredis_Basic` - 기본 Set/Get (Docker 없이)
- [x] `Test_Miniredis_TTL` - TTL + FastForward 시간 조작
- [x] `Test_Miniredis_SortedSet` - Sorted Set 동작 확인
- [x] `Test_Miniredis_PubSub` - Pub/Sub 동작 확인
- [x] 테스트 실행 확인 (`go test -v -run Miniredis`)

---

## 2단계: 기존 코드 점검

- [x] 기존 테스트 전체 실행 확인 (기존 테스트는 localhost Redis 필요 - 기존 동작 그대로)
- [x] 신규 테스트 10개 전부 PASS (miniredis 기반, Docker 불필요)
- [ ] 분산 락 테스트 확인 (`go test ./golang/concurrency/waitgroup/...`) - Docker API 버전 이슈
- [x] `go mod tidy` 불필요 (의존성 이미 존재)

---

## 3단계: 블로그 글 작성

- [x] `docs/start/go-redis-활용하기/index.md` 생성
- [x] 1. 들어가며 - Redis 소개, Go + Redis 조합의 장점
- [x] 2.1 go-redis 설치 및 연결
- [x] 2.2 기본 데이터 조작 (String, Struct, TTL)
- [x] 2.3 Sorted Set 활용 (리더보드 예제)
- [x] 2.4 Pub/Sub 패턴 (발행/구독, 패턴 구독)
- [x] 2.5 Redis Stream (XADD/XREAD, Consumer Group, Pub/Sub과 비교표)
- [x] 2.6 성능 특성과 동시성 (파이프라인, 벤치마크)
- [x] 2.7 Redis Cluster 모드
- [x] 2.8 분산 락 (redsync 중심, Redlock 알고리즘)
- [x] 2.9 miniredis를 활용한 테스트 (Docker 없이 테스트)
- [x] 3. 마무리
- [x] 4. 참고 (링크 정리)

---

## 4단계: 최종 검증

- [x] 전체 테스트 통과 확인 (10개 PASS)
- [x] 블로그 글 내 코드 스니펫과 실제 코드 일치 확인
- [x] 블로그 글 인코딩 확인 (`file -I index.md` → utf-8 ✅)
- [ ] PR 생성
