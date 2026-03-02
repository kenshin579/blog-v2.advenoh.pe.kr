# Go에서 MongoDB 사용하기 PRD

> 시리즈: Golang 블로그 주제 Phase 2 - 데이터베이스 (3/3)
> 참조: `6_golang_topic_prd.md` B-3

---

## 1. 개요

Go 공식 MongoDB 드라이버(`mongo-driver`)를 활용한 MongoDB 연동. BSON 직렬화, CRUD 조작, Aggregation Pipeline, 그리고 테스트 전략(Memongo)을 다룬다.

**대상 독자**: MongoDB 기본 개념을 아는 Go 개발자
**난이도**: 초중급
**예제 코드**: `tutorials-go/database/mongo/`

---

## 2. 블로그 구조

### 2.1 mongo-driver 소개
- 설치: `go get go.mongodb.org/mongo-driver`
- 연결 설정: `mongo.Connect()` + URI
- Database/Collection 접근: `client.Database().Collection()`
- 참고 코드: `adapter/mongodb/mongodb.go`

### 2.2 BSON과 모델 정의
- BSON이란? (Binary JSON)
- 구조체 태그: `bson:"field_name"`
- `bson.M` (Map), `bson.D` (Ordered), `bson.A` (Array)
- 참고 코드: `domain/trainer.go`

### 2.3 CRUD 조작
- **Create**: `InsertOne()`, `InsertMany()` (벌크 삽입)
- **Read**: `FindOne()`, `Find()` + Cursor 순회, `FindOptions` (Limit, Skip)
- **Update**: `UpdateOne()` + `$set`, `$inc` 연산자
- **Delete**: `DeleteOne()`, `DeleteMany()`
- 참고 코드: `trainer/store/mongo/mongo.go`, `mongo_test.go`

### 2.4 Aggregation Pipeline
- `$group`, `$sum`, `$avg`, `$min`, `$max`
- `$push`, `$addToSet`
- `$unwind` - 배열 필드 펼치기
- 참고 코드: `study/academy_3t/aggregate/`

### 2.5 Repository 패턴
- 도메인 인터페이스 정의
- MongoDB 구현체
- Clean Architecture에서의 위치
- 참고 코드: `trainer/store/mongo/` (Store 패턴)

### 2.6 테스트 전략
- Memongo: 인메모리 MongoDB로 단위 테스트
- Testcontainers: 실제 MongoDB 통합 테스트 (이전 글 참조)
- Suite 패턴으로 SetupSuite/TearDown 관리
- 참고 코드: `test/memongo/`, `study/trainer_test.go`

---

## 3. 샘플 코드 참조

| 파일 | 내용 |
|------|------|
| `database/mongo/adapter/mongodb/` | MongoDB 연결 관리 |
| `database/mongo/domain/` | 도메인 모델, Collection 상수 |
| `database/mongo/trainer/store/mongo/` | CRUD 구현 + 테스트 |
| `database/mongo/study/trainer_test.go` | Suite 기반 테스트 |
| `database/mongo/test/memongo/` | 인메모리 MongoDB 테스트 |
| `database/mongo/study/academy_3t/aggregate/` | Aggregation 예제 스크립트 |
| `database/mongo/marshal/main.go` | BSON 직렬화 예제 |
| `database/mongo/script/mongo_init.js` | 초기화 스크립트 (종합 튜토리얼) |

---

## 4. 논의 사항

- [ ] Aggregation Pipeline을 이 글에서 상세히 다룰지, 별도 글로 뺄지
- [ ] mongo-driver v1 vs v2 어느 버전 기준으로 작성할지
- [ ] flatbson 라이브러리 (부분 업데이트용) 소개 여부
- [ ] 인덱스 관리 (CreateIndex) 포함 여부
- [ ] `mongo_init.js` 스크립트의 내용을 Go 코드로 변환하여 추가할지
