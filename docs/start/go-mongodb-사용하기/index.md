---
title: "Go에서 MongoDB 사용하기: mongo-driver v2로 배우는 실전 패턴"
description: "mongo-driver v2를 사용하여 BSON 모델 정의, CRUD, flatbson 부분 업데이트, 인덱스 관리, Aggregation Pipeline, Repository 패턴, 그리고 Memongo 테스트 전략을 다룬다."
date: 2026-03-04
update: 2026-03-04
tags:
  - Go
  - Golang
  - MongoDB
  - mongo-driver
  - BSON
  - CRUD
  - flatbson
  - Aggregation
  - Memongo
  - Repository 패턴
---

# 1. 들어가며

MongoDB는 문서(Document) 지향 NoSQL 데이터베이스로, 유연한 스키마와 JSON 형태의 데이터 저장이 가능하여 Go 백엔드에서 널리 사용된다. Go 공식 MongoDB 드라이버인 `mongo-driver`는 2024년 v2가 릴리즈되면서 API가 대폭 개선되었다.

이 글에서는 mongo-driver v2를 기준으로 BSON 모델 정의, CRUD 조작, flatbson을 활용한 부분 업데이트, 인덱스 관리, Aggregation Pipeline, Repository 패턴, 그리고 Memongo를 활용한 테스트 전략까지 실무에서 자주 사용하는 패턴을 다룬다.

# 2. Go에서 MongoDB 사용하기

## 2.1 mongo-driver v2 소개

mongo-driver v2를 설치한다.

```bash
go get go.mongodb.org/mongo-driver/v2
```

기본 연결은 `mongo.Connect()`로 생성한다.

```go
import (
    "go.mongodb.org/mongo-driver/v2/mongo"
    "go.mongodb.org/mongo-driver/v2/mongo/options"
)

client, err := mongo.Connect(options.Client().ApplyURI("mongodb://localhost:27017"))
if err != nil {
    log.Fatal(err)
}
defer client.Disconnect(context.Background())

db := client.Database("mydb")
collection := db.Collection("trainers")
```

> **v1 vs v2 주요 변경사항**: v2에서는 `mongo.Connect()`의 시그니처가 변경되어 `context` 파라미터가 제거되었다. import 경로도 `go.mongodb.org/mongo-driver/mongo`에서 `go.mongodb.org/mongo-driver/v2/mongo`로 변경되었다.

v1과 v2의 주요 차이점을 정리하면 다음과 같다.

| 항목 | v1 | v2 |
|------|----|----|
| import 경로 | `go.mongodb.org/mongo-driver/mongo` | `go.mongodb.org/mongo-driver/v2/mongo` |
| `mongo.Connect()` | `mongo.Connect(ctx, opts)` | `mongo.Connect(opts)` |
| `Cursor.All()` | `cursor.All(ctx, &results)` | `cursor.All(ctx, &results)` (동일) |
| `Indexes().DropOne()` | `(string, error)` 반환 | `error`만 반환 |

## 2.2 BSON과 모델 정의

MongoDB는 데이터를 BSON(Binary JSON) 형식으로 저장한다. Go에서는 구조체에 `bson` 태그를 지정하여 BSON 필드와 매핑한다.

```go
// domain/trainer.go
type Trainer struct {
    ID   string `bson:"_id" json:"id"`
    Name string `bson:"name" json:"name"`
    Age  int    `bson:"age" json:"age"`
    City string `bson:"city" json:"city"`
}
```

mongo-driver v2는 세 가지 BSON 타입을 제공한다.

| 타입 | 설명 | 사용 예 |
|------|------|---------|
| `bson.D` | 순서가 보장되는 Document | `bson.D{{Key: "name", Value: 1}}` |
| `bson.M` | 순서가 없는 Map | `bson.M{"name": "Ash"}` |
| `bson.A` | Array | `bson.A{bson.D{...}, bson.D{...}}` |

`bson.D`는 필드 순서가 중요한 경우(인덱스 정의, Aggregation Pipeline 등)에 사용하고, `bson.M`은 간단한 필터 조건에 사용한다.

```go
// bson.D: 순서가 보장됨
filter := bson.D{{Key: "_id", Value: "t1"}}

// bson.M: Map 형태로 간결함
filter := bson.M{"name": "Misty"}
```

## 2.3 데이터 조작

### 2.3.1 CRUD

#### InsertOne / InsertMany

```go
// mongov2/mongo_test.go
func (s *mongoTestSuite) TestInsertOne_FindOne() {
    trainer := Trainer{ID: "t1", Name: "Ash", Age: 10, City: "Pallet Town"}

    // InsertOne
    result, err := s.collection.InsertOne(s.ctx, trainer)
    s.NoError(err)
    s.Equal("t1", result.InsertedID)
}
```

여러 문서를 한 번에 삽입할 때는 `InsertMany()`를 사용한다.

```go
// mongov2/mongo_test.go
trainers := []interface{}{
    Trainer{ID: "t1", Name: "Ash", Age: 10, City: "Pallet Town"},
    Trainer{ID: "t2", Name: "Misty", Age: 12, City: "Cerulean City"},
    Trainer{ID: "t3", Name: "Brock", Age: 15, City: "Pewter City"},
}

result, err := s.collection.InsertMany(s.ctx, trainers)
s.Len(result.InsertedIDs, 3)
```

#### FindOne / Find

단일 문서 조회는 `FindOne()`, 여러 문서 조회는 `Find()`를 사용한다.

```go
// mongov2/mongo_test.go
// 단일 조회
var found Trainer
err := s.collection.FindOne(s.ctx, bson.D{{Key: "_id", Value: "t1"}}).Decode(&found)

// 전체 조회
cursor, err := s.collection.Find(s.ctx, bson.D{})
var results []Trainer
err = cursor.All(s.ctx, &results)
```

`Find()`에 옵션을 추가하여 정렬, 제한 등을 설정할 수 있다.

```go
// mongov2/mongo_test.go
// Limit + Sort: 나이 내림차순으로 3명만 조회
opts := options.Find().SetLimit(3).SetSort(bson.D{{Key: "age", Value: -1}})
cursor, err := s.collection.Find(s.ctx, bson.D{}, opts)
```

#### UpdateOne

`$set` 연산자로 특정 필드를 업데이트하거나, `$inc` 연산자로 값을 증가시킬 수 있다.

```go
// mongov2/mongo_test.go
// $set: 특정 필드 값 변경
_, err := s.collection.UpdateOne(s.ctx,
    bson.D{{Key: "_id", Value: "t1"}},
    bson.D{{Key: "$set", Value: bson.D{{Key: "age", Value: 11}}}},
)

// $inc: 기존 값에서 증가
_, err = s.collection.UpdateOne(s.ctx,
    bson.D{{Key: "_id", Value: "t1"}},
    bson.D{{Key: "$inc", Value: bson.D{{Key: "age", Value: 5}}}},
)
```

#### DeleteOne

```go
// mongov2/mongo_test.go
result, err := s.collection.DeleteOne(s.ctx, bson.D{{Key: "_id", Value: "t1"}})
s.Equal(int64(1), result.DeletedCount)

// 삭제 확인
err = s.collection.FindOne(s.ctx, bson.D{{Key: "_id", Value: "t1"}}).Decode(&Trainer{})
s.ErrorIs(err, mongo.ErrNoDocuments)
```

### 2.3.2 flatbson을 활용한 부분 업데이트

구조체의 일부 필드만 업데이트할 때, `$set`에 전체 구조체를 전달하면 zero value(`""`, `0`)로 다른 필드가 덮어씌워지는 문제가 발생한다.

```go
// 문제: Name만 변경하고 싶지만 Age=0, City=""로 덮어씌워짐
update := Trainer{Name: "Ash Ketchum"}
collection.UpdateOne(ctx, filter, bson.D{{Key: "$set", Value: update}})
```

[flatbson](https://github.com/chidiwilliams/flatbson) 라이브러리는 구조체에서 zero value가 아닌 필드만 추출하여 flat map으로 변환해준다.

```bash
go get github.com/chidiwilliams/flatbson
```

```go
// study/trainer_test.go
func (suite *trainerTestSuite) updateTrainer(ctx context.Context, trainer domain.Trainer) (domain.Trainer, error) {
    // zero value가 아닌 필드만 추출
    updateFields, err := flatbson.Flatten(trainer)
    if err != nil {
        return domain.Trainer{}, err
    }

    // Name만 포함된 map이 $set에 전달됨
    err = suite.db.Collection(suite.collection).FindOneAndUpdate(ctx,
        bson.D{{Key: "_id", Value: trainer.ID}},
        bson.D{{Key: "$set", Value: updateFields}}).Err()

    return suite.getTrainer(ctx, trainer.ID)
}
```

이렇게 하면 `Name`만 업데이트되고 나머지 필드(`Age`, `City`)는 기존 값이 유지된다.

```go
// mongov2/mongo_test.go
func (s *mongoTestSuite) TestPartialUpdate_WithFlatbson() {
    s.collection.InsertOne(s.ctx, Trainer{ID: "t1", Name: "Ash", Age: 10, City: "Pallet Town"})

    // 이름만 업데이트
    _, err := s.collection.UpdateOne(s.ctx,
        bson.D{{Key: "_id", Value: "t1"}},
        bson.D{{Key: "$set", Value: bson.D{{Key: "name", Value: "Ash Ketchum"}}}},
    )

    var updated Trainer
    s.collection.FindOne(s.ctx, bson.D{{Key: "_id", Value: "t1"}}).Decode(&updated)
    s.Equal("Ash Ketchum", updated.Name)
    s.Equal(10, updated.Age)           // 유지
    s.Equal("Pallet Town", updated.City) // 유지
}
```

## 2.4 인덱스 관리

인덱스는 쿼리 성능을 최적화하는 핵심 요소다. MongoDB는 기본적으로 `_id` 필드에 인덱스를 생성하며, 추가 인덱스를 직접 관리할 수 있다.

### 2.4.1 단일 인덱스

```go
// mongov2/mongo_test.go
indexModel := mongo.IndexModel{
    Keys: bson.D{{Key: "name", Value: 1}}, // 1: 오름차순, -1: 내림차순
}

indexName, err := s.collection.Indexes().CreateOne(s.ctx, indexModel)
// indexName: "name_1"
```

### 2.4.2 복합 인덱스

여러 필드를 조합한 인덱스를 생성할 수 있다.

```go
// mongov2/mongo_test.go
indexModel := mongo.IndexModel{
    Keys: bson.D{
        {Key: "name", Value: 1},
        {Key: "age", Value: -1},
    },
}

indexName, err := s.collection.Indexes().CreateOne(s.ctx, indexModel)
```

### 2.4.3 유니크 인덱스

중복 값을 허용하지 않는 유니크 인덱스를 설정할 수 있다.

```go
// mongov2/mongo_test.go
indexModel := mongo.IndexModel{
    Keys:    bson.D{{Key: "name", Value: 1}},
    Options: options.Index().SetUnique(true),
}

s.collection.Indexes().CreateOne(s.ctx, indexModel)

// 같은 name으로 두 번 삽입하면 duplicate key error 발생
s.collection.InsertOne(s.ctx, Trainer{ID: "t1", Name: "Ash", Age: 10})
_, err := s.collection.InsertOne(s.ctx, Trainer{ID: "t2", Name: "Ash", Age: 15})
s.Error(err) // duplicate key error
```

### 2.4.4 인덱스 조회 및 삭제

```go
// mongov2/mongo_test.go
// 인덱스 목록 조회
cursor, err := s.collection.Indexes().List(s.ctx)
var indexes []bson.M
cursor.All(s.ctx, &indexes)
// indexes에는 _id 기본 인덱스 + 추가 인덱스가 포함됨

// 인덱스 삭제 (인덱스 이름으로 삭제)
err := s.collection.Indexes().DropOne(s.ctx, "city_1")
```

## 2.5 Aggregation Pipeline

Aggregation Pipeline은 데이터를 단계별로 변환하고 집계하는 기능이다. `$match`, `$group`, `$sort` 등의 스테이지를 파이프라인으로 연결한다.

### 2.5.1 $group + $sum

도시별 트레이너 수를 집계하는 예제다.

```go
// mongov2/mongo_test.go
pipeline := bson.A{
    bson.D{{Key: "$group", Value: bson.D{
        {Key: "_id", Value: "$city"},
        {Key: "count", Value: bson.D{{Key: "$sum", Value: 1}}},
    }}},
    bson.D{{Key: "$sort", Value: bson.D{{Key: "count", Value: -1}}}},
}

cursor, err := s.collection.Aggregate(s.ctx, pipeline)

var results []bson.M
cursor.All(s.ctx, &results)
// results: [{_id: "Pallet Town", count: 2}, {_id: "Cerulean City", count: 2}, ...]
```

### 2.5.2 $match + $sort

조건 필터링 후 정렬하는 예제다.

```go
// mongov2/mongo_test.go
// 나이 12 이상, 나이 내림차순 정렬
pipeline := bson.A{
    bson.D{{Key: "$match", Value: bson.D{
        {Key: "age", Value: bson.D{{Key: "$gte", Value: 12}}},
    }}},
    bson.D{{Key: "$sort", Value: bson.D{{Key: "age", Value: -1}}}},
}

cursor, err := s.collection.Aggregate(s.ctx, pipeline)

var results []Trainer
cursor.All(s.ctx, &results)
// results: [Erika(18), Brock(15), Misty(12)]
```

## 2.6 Repository 패턴

실무에서는 MongoDB 접근 로직을 Repository(Store) 패턴으로 분리하여 도메인 로직과 데이터 접근 로직을 격리한다.

```go
// trainer/store/mongo/mongo.go
type mongoStore struct {
    db *mongo.Database
}

func NewMongoStore(db *mongodb.Mongodb) *mongoStore {
    return &mongoStore{db: db.DB}
}

func (m *mongoStore) Insert(ctx context.Context, trainer domain.Trainer) error {
    dbCollection := m.db.Collection(domain.CollectionName)
    result, err := dbCollection.InsertOne(ctx, trainer)
    if err != nil {
        return err
    }
    fmt.Println("Inserted a single document: ", result.InsertedID)
    return nil
}

func (m *mongoStore) FindOne(ctx context.Context, filter interface{}) (domain.Trainer, error) {
    dbCollection := m.db.Collection(domain.CollectionName)
    var result domain.Trainer
    err := dbCollection.FindOne(ctx, filter).Decode(&result)
    if err != nil {
        return result, err
    }
    return result, nil
}
```

이 패턴의 장점은 다음과 같다.

- **테스트 용이성**: Store 인터페이스를 모킹하여 비즈니스 로직만 단위 테스트 가능
- **교체 용이성**: MongoDB 외 다른 저장소로 교체할 때 Store 구현체만 변경
- **관심사 분리**: HTTP 핸들러 → UseCase → Store 계층으로 책임 분리

## 2.7 테스트 전략

### 2.7.1 Memongo (인메모리 MongoDB)

[Memongo](https://github.com/tryvium-travels/memongo)는 인메모리 MongoDB 서버를 제공하여 실제 MongoDB 없이 테스트할 수 있다.

```go
// trainer/store/mongo/mongo_test.go
func TestMain(m *testing.M) {
    mongoServer, err := memongo.Start("4.0.5")
    clientOpts := options.Client().ApplyURI(mongoServer.URI())
    client, err := mongo.Connect(context.Background(), clientOpts)
    randomDB := client.Database(memongo.RandomDatabase())

    store = NewMongoStore(&mongodb.Mongodb{
        Client: client,
        DB:     randomDB,
    })

    defer mongoServer.Stop()
    os.Exit(m.Run())
}
```

> **Memongo 주의사항**: Memongo는 mongod 바이너리를 다운로드하여 실행하므로, 환경에 따라 바이너리를 찾지 못할 수 있다. 이 경우 Docker로 MongoDB를 실행하는 방식을 fallback으로 사용한다.

### 2.7.2 Suite 패턴

Testify의 Suite 패턴을 사용하면 SetupSuite/TearDown으로 테스트 환경을 체계적으로 관리할 수 있다.

```go
// mongov2/mongo_test.go
type mongoTestSuite struct {
    suite.Suite
    client     *mongo.Client
    db         *mongo.Database
    collection *mongo.Collection
    ctx        context.Context
    server     *memongo.Server
}

func TestMongoSuite(t *testing.T) {
    suite.Run(t, new(mongoTestSuite))
}

func (s *mongoTestSuite) SetupSuite() {
    s.ctx = context.Background()

    // memongo 시도, 실패 시 로컬 MongoDB fallback
    server, err := memongo.Start("6.0.0")
    if err != nil {
        uri := os.Getenv("MONGODB_URI")
        if uri == "" {
            uri = "mongodb://localhost:27017"
        }
        client, err := mongo.Connect(options.Client().ApplyURI(uri))
        s.Require().NoError(err)
        s.client = client
        s.db = client.Database("test_mongov2")
    } else {
        s.server = server
        client, err := mongo.Connect(options.Client().ApplyURI(server.URI()))
        s.Require().NoError(err)
        s.client = client
        s.db = client.Database(memongo.RandomDatabase())
    }

    s.collection = s.db.Collection("trainers")
}

func (s *mongoTestSuite) TearDownTest() {
    s.collection.Drop(s.ctx) // 각 테스트 후 컬렉션 초기화
}

func (s *mongoTestSuite) TearDownSuite() {
    if s.client != nil {
        s.client.Disconnect(s.ctx)
    }
    if s.server != nil {
        s.server.Stop()
    }
}
```

이 패턴은 `SetupSuite()`에서 한 번 연결하고, `TearDownTest()`에서 매 테스트마다 컬렉션을 초기화하여 테스트 간 데이터 격리를 보장한다.

# 3. 마무리

이 글에서는 Go에서 MongoDB를 활용하는 다양한 패턴을 살펴봤다.

- **BSON 모델**: 구조체 태그로 BSON 필드 매핑, `bson.D`와 `bson.M` 활용
- **CRUD**: InsertOne/Many, FindOne/Find, UpdateOne, DeleteOne
- **부분 업데이트**: flatbson으로 zero value 문제 해결
- **인덱스 관리**: 단일/복합/유니크 인덱스 생성, 조회, 삭제
- **Aggregation**: `$group`+`$sum`, `$match`+`$sort` 파이프라인
- **Repository 패턴**: 도메인과 데이터 접근 로직 분리
- **테스트 전략**: Memongo + Suite 패턴으로 테스트 환경 관리

mongo-driver v2는 v1 대비 API가 간결해지고 사용성이 개선되었다. 특히 `Connect()` 시그니처 변경과 옵션 체이닝 방식의 개선이 눈에 띈다.

## 3.1 프로젝트 소스

전체 소스 코드는 GitHub에서 확인할 수 있다:
- https://github.com/kenshin579/tutorials-go/tree/master/database/mongo

# 4. 참고

- [mongo-driver v2 공식 문서](https://www.mongodb.com/docs/drivers/go/current/)
- [mongo-driver GitHub](https://github.com/mongodb/mongo-go-driver)
- [mongo-driver v2 마이그레이션 가이드](https://www.mongodb.com/docs/drivers/go/current/migration/)
- [MongoDB Aggregation Pipeline](https://www.mongodb.com/docs/manual/core/aggregation-pipeline/)
- [flatbson GitHub](https://github.com/chidiwilliams/flatbson)
- [Memongo GitHub](https://github.com/tryvium-travels/memongo)
- [Testify Suite](https://pkg.go.dev/github.com/stretchr/testify/suite)
