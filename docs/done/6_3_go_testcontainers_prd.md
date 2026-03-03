# Testcontainers로 실제 DB 통합 테스트하기 PRD

> 시리즈: Golang 블로그 주제 Phase 1 - 테스트 전략 (3/3)
> 참조: `6_golang_topic_prd.md` A-3

---

## 1. 개요

Docker 컨테이너를 활용한 통합 테스트 프레임워크 `testcontainers-go`. Mock 대신 실제 DB(Redis, MongoDB, MySQL)를 테스트 수명주기에 맞춰 자동으로 생성/삭제하여 프로덕션 환경에 가까운 테스트를 작성한다.

**대상 독자**: 단위 테스트 경험이 있고 통합 테스트를 도입하려는 개발자
**난이도**: 중급
**예제 코드**: `tutorials-go/go-unit-test/testcontainers/`
**전제 조건**: Docker 설치 필요

---

## 2. 블로그 구조

### 2.1 통합 테스트가 필요한 이유
- 단위 테스트(Mock)의 한계: 실제 DB 동작과 차이 발생
- 통합 테스트 vs E2E 테스트 차이
- Testcontainers 접근법: 테스트별 격리된 실제 DB

### 2.2 Testcontainers 기본 개념
- 설치: `go get github.com/testcontainers/testcontainers-go`
- `ContainerRequest` 구조: Image, ExposedPorts, WaitingFor
- `GenericContainer` 생성과 시작
- 엔드포인트 추출: `container.Endpoint(ctx, "")`
- 컨테이너 정리: `container.Terminate(ctx)`

### 2.3 Redis 통합 테스트
- Redis 컨테이너 설정: `redis:6` 이미지, `6379/tcp`
- Wait 전략: `wait.ForLog("Ready to accept connections")`
- go-redis 클라이언트 연결
- 테스트: SET/GET, FlushAll
- Suite 패턴으로 컨테이너 수명주기 관리 (SetupSuite/TearDownTest)
- 참고 코드: `redis.go`, `redis_test.go`

### 2.4 MongoDB 통합 테스트
- MongoDB 컨테이너 설정: `mongo:4.4.4-bionic`
- 인증 설정: `MONGO_INITDB_ROOT_USERNAME/PASSWORD`
- mongo-driver 연결
- CRUD 테스트 작성
- 참고 코드: `mongo.go`, `mongo_test.go`

### 2.5 MySQL 통합 테스트
- MySQL 컨테이너 설정: `mysql:8`, `3306/tcp`
- 환경변수: DB 이름, 루트 비밀번호
- GORM 연결 설정
- 참고 코드: `mysql.go`

### 2.6 실전 팁
- 컨테이너 재사용으로 테스트 속도 개선 (`Reuse: true`)
- CI 환경에서의 설정 (GitHub Actions + Docker)
- 테스트 태그로 통합 테스트 분리: `//go:build integration`
- Suite 단위 컨테이너 vs 테스트 단위 컨테이너 전략

---

## 3. 샘플 코드 참조

| 파일 | 내용 |
|------|------|
| `go-unit-test/testcontainers/redis.go` | Redis 컨테이너 설정 |
| `go-unit-test/testcontainers/redis_test.go` | Redis 통합 테스트 Suite |
| `go-unit-test/testcontainers/mongo.go` | MongoDB 컨테이너 설정 |
| `go-unit-test/testcontainers/mongo_test.go` | MongoDB 통합 테스트 |
| `go-unit-test/testcontainers/mysql.go` | MySQL 컨테이너 설정 (미완성) |

---

## 4. 논의 사항

- [ ] MySQL 테스트 코드가 미완성 → 보완 작성 필요
- [ ] testcontainers-go v0.20+ 모듈 방식 (`testcontainers.NewRedisContainer()`) 소개할지
- [ ] 컨테이너 재사용(`Reuse`) 패턴을 상세히 다룰지
- [ ] Testcontainers Cloud (원격 Docker) 언급할지
- [ ] 이전 글(Mockery)과의 연계: "언제 Mock, 언제 통합 테스트?" 가이드
