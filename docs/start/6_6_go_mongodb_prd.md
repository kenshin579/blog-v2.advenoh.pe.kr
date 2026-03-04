# Go에서 MongoDB 사용하기 PRD

> 시리즈: Golang 블로그 주제 Phase 2 - 데이터베이스 (3/3)
> 참조: `6_golang_topic_prd.md` B-3

---

## 1. 개요

Go 공식 MongoDB 드라이버(`mongo-driver v2`)를 활용한 MongoDB 연동. BSON 직렬화, CRUD 조작, 인덱스 관리, Aggregation Pipeline, flatbson 활용, 그리고 테스트 전략(Memongo)을 다룬다.

**대상 독자**: MongoDB 기본 개념을 아는 Go 개발자
**난이도**: 초중급
**예제 코드**: `tutorials-go/database/mongo/`

---

## 2. 블로그 구조

### 2.1 mongo-driver v2 소개
- 설치: `go get go.mongodb.org/mongo-driver/v2`
- v1 → v2 주요 변경사항:
  - `mongo.Connect()` 시그니처 변경 (context 불필요)
  - `bson.D` → 일반 구조체로 직접 사용 가능
  - `FindOptions` → `options.Find().SetLimit()` 체이닝
  - `Cursor.All()` 사용 간소화
- 연결 설정: `mongo.Connect()` + URI
- Database/Collection 접근: `client.Database().Collection()`
- 참고 코드: `adapter/mongodb/mongodb.go`

### 2.2 BSON과 모델 정의
- BSON이란? (Binary JSON)
- 구조체 태그: `bson:"field_name"`
- `bson.M` (Map), `bson.D` (Ordered), `bson.A` (Array)
- 참고 코드: `domain/trainer.go`

### 2.3 데이터 조작

#### 2.3.1 CRUD
- **Create**: `InsertOne()`, `InsertMany()` (벌크 삽입)
- **Read**: `FindOne()`, `Find()` + Cursor 순회, `FindOptions` (Limit, Skip)
- **Update**: `UpdateOne()` + `$set`, `$inc` 연산자
- **Delete**: `DeleteOne()`, `DeleteMany()`
- 참고 코드: `trainer/store/mongo/mongo.go`, `mongo_test.go`

#### 2.3.2 flatbson을 활용한 부분 업데이트
- 문제: 구조체의 일부 필드만 업데이트할 때 zero value로 덮어쓰는 문제
- flatbson 소개: 구조체를 `$set` 연산자에 적합한 flat map으로 변환
- `flatbson.Flatten(struct)` → nested 필드도 자동으로 dot notation 변환
- 사용 예: `FindOneAndUpdate()` + `bson.D{{Key: "$set", Value: flatbson.Flatten(trainer)}}`
- 참고 코드: `study/trainer_test.go` (updateTrainer 함수)

### 2.4 인덱스 관리
- 인덱스의 필요성: 쿼리 성능 최적화
- `CreateIndex()`: 단일/복합 인덱스 생성
  - `mongo.IndexModel{Keys: bson.D{{Key: "name", Value: 1}}}` (오름차순)
  - 복합 인덱스: `bson.D{{Key: "name", Value: 1}, {Key: "age", Value: -1}}`
- 유니크 인덱스: `options.Index().SetUnique(true)`
- `Indexes().List()`: 인덱스 목록 조회
- `Indexes().DropOne()`: 인덱스 삭제

### 2.5 Aggregation Pipeline (기본)
- Aggregation 개념: 데이터 변환/집계 파이프라인
- 간단한 예제 중심:
  - `$match` - 조건 필터링
  - `$group` + `$sum` - 그룹별 카운트/합계
  - `$sort` - 결과 정렬
- Go에서의 사용: `collection.Aggregate(ctx, pipeline)`
- 참고 코드: `study/academy_3t/aggregate/`

### 2.6 Repository 패턴
- 도메인 인터페이스 정의
- MongoDB 구현체
- Clean Architecture에서의 위치
- 참고 코드: `trainer/store/mongo/` (Store 패턴)

### 2.7 테스트 전략
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
| `database/mongo/study/trainer_test.go` | Suite 기반 테스트 + flatbson 활용 |
| `database/mongo/test/memongo/` | 인메모리 MongoDB 테스트 |
| `database/mongo/study/academy_3t/aggregate/` | Aggregation 예제 스크립트 |
| `database/mongo/marshal/main.go` | BSON 직렬화 예제 |

---

## 4. 논의 사항 (결정 완료)

- [x] Aggregation Pipeline → 간단한 수준으로만 다룸 ($match, $group, $sum, $sort)
- [x] mongo-driver → v2 기준으로 작성 (기존 코드 v1 → v2 마이그레이션 필요)
- [x] flatbson → CRUD 조작의 부분 업데이트로 통합 (2.3절)
- [x] 인덱스 관리 → 포함 (2.4절)
- [x] `mongo_init.js` → 테스트용 스크립트이므로 블로그에서 다루지 않음 (샘플 코드 참조에서도 제거)
