# Go에서 MongoDB 사용하기 - 구현 계획

> PRD: `6_6_go_mongodb_prd.md`

---

## 1. 현황 분석

### 1.1 이미 구현된 것

| 항목 | 위치 | 상태 |
|------|------|------|
| MongoDB 연결 (v1) | `adapter/mongodb/mongodb.go` | ✅ v2 마이그레이션 필요 |
| 도메인 모델 (Trainer) | `domain/trainer.go` | ✅ 완료 |
| CRUD (InsertOne/Find/Update/Delete) | `trainer/store/mongo/mongo.go` | ✅ v2 마이그레이션 필요 |
| flatbson 부분 업데이트 | `study/trainer_test.go` | ✅ 완료 |
| Memongo 테스트 | `trainer/store/mongo/mongo_test.go` | ✅ 완료 |
| BSON 직렬화 예제 | `marshal/main.go` | ✅ 완료 |
| Aggregation (JS 스크립트) | `study/academy_3t/aggregate/` | ✅ Go 코드 추가 필요 |
| Docker Compose | 없음 | ❌ 추가 필요 |

### 1.2 신규 구현 필요

| 항목 | 위치 (예정) | 상태 |
|------|------------|------|
| mongo-driver v1 → v2 마이그레이션 | 기존 파일 수정 | ❌ |
| 인덱스 관리 예제 | `database/mongo/index_test.go` | ❌ |
| Aggregation Pipeline (Go 코드) | `database/mongo/aggregate_test.go` | ❌ |
| 블로그 글 (index.md) | `docs/start/go-mongodb-사용하기/index.md` | ❌ |

### 1.3 의존성 변경

현재: `go.mongodb.org/mongo-driver v1.9.1`
변경: `go.mongodb.org/mongo-driver/v2`

---

## 2. 샘플 코드 구현

### 2.1 mongo-driver v2 마이그레이션

주요 변경사항:
- import 경로: `go.mongodb.org/mongo-driver/mongo` → `go.mongodb.org/mongo-driver/v2/mongo`
- `mongo.Connect()`: context 파라미터 제거
- `options.Find()`: 체이닝 방식 변경
- `Cursor.All()`: 간소화

### 2.2 인덱스 관리 테스트

```go
Test_CreateIndex_Single()      // 단일 인덱스 생성
Test_CreateIndex_Compound()    // 복합 인덱스 생성
Test_CreateIndex_Unique()      // 유니크 인덱스
Test_ListIndexes()             // 인덱스 목록 조회
Test_DropIndex()               // 인덱스 삭제
```

### 2.3 Aggregation Pipeline 테스트

```go
Test_Aggregate_GroupSum()      // $group + $sum
Test_Aggregate_MatchSort()     // $match + $sort
```

---

## 3. 블로그 글 구조

### 3.1 파일 위치

`blog-v2.advenoh.pe.kr/docs/start/go-mongodb-사용하기/index.md`

### 3.2 글 구조

```
# 1. 들어가며
# 2. Go에서 MongoDB 사용하기
  ## 2.1 mongo-driver v2 소개
  ## 2.2 BSON과 모델 정의
  ## 2.3 데이터 조작
    ### 2.3.1 CRUD
    ### 2.3.2 flatbson을 활용한 부분 업데이트
  ## 2.4 인덱스 관리
  ## 2.5 Aggregation Pipeline
  ## 2.6 Repository 패턴
  ## 2.7 테스트 전략
# 3. 마무리
# 4. 참고
```

---

## 4. 기술적 고려사항

### 4.1 v2 마이그레이션 범위

- 기존 코드가 v1으로 되어 있으므로 v2로 마이그레이션 필요
- memongo가 v2를 지원하는지 확인 필요
- flatbson이 v2 BSON 타입과 호환되는지 확인 필요

### 4.2 테스트 인프라

- 기존: memongo (인메모리 MongoDB)
- v2 호환 여부에 따라 testcontainers로 전환 검토
