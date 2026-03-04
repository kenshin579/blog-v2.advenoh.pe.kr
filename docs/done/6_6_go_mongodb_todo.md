# Go에서 MongoDB 사용하기 - TODO

> PRD: `6_6_go_mongodb_prd.md`
> 구현 계획: `6_6_go_mongodb_implementation.md`

---

## 1단계: mongo-driver v2 샘플 코드 작성

- [x] go.mod 의존성 업데이트 (`go.mongodb.org/mongo-driver/v2 v2.5.0`)
- [x] `database/mongo/mongov2/mongo_test.go` 생성 (v2 기반 통합 테스트)
- [x] CRUD 테스트: InsertOne, InsertMany, Find, UpdateOne, DeleteOne, BsonM
- [x] flatbson 부분 업데이트 테스트
- [x] 전체 15개 테스트 통과 확인

---

## 2단계: 인덱스 + Aggregation 샘플 코드

### 인덱스 관리
- [x] 단일 인덱스 생성 테스트
- [x] 복합 인덱스 생성 테스트
- [x] 유니크 인덱스 테스트
- [x] 인덱스 목록 조회 테스트
- [x] 인덱스 삭제 테스트

### Aggregation Pipeline
- [x] `$group` + `$sum` 테스트
- [x] `$match` + `$sort` 테스트

---

## 3단계: 블로그 글 작성

- [x] `docs/start/go-mongodb-사용하기/index.md` 생성
- [x] 1. 들어가며
- [x] 2.1 mongo-driver v2 소개 (v1 → v2 변경사항)
- [x] 2.2 BSON과 모델 정의
- [x] 2.3.1 CRUD (Create, Read, Update, Delete)
- [x] 2.3.2 flatbson을 활용한 부분 업데이트
- [x] 2.4 인덱스 관리
- [x] 2.5 Aggregation Pipeline (기본)
- [x] 2.6 Repository 패턴
- [x] 2.7 테스트 전략 (Memongo)
- [x] 3. 마무리
- [x] 4. 참고 (링크 정리)

---

## 4단계: 최종 검증

- [x] 전체 테스트 통과 확인 (15개 PASS)
- [x] 블로그 글 내 코드 스니펫과 실제 코드 일치 확인
- [x] 블로그 글 인코딩 확인 (`file -I index.md` → utf-8 ✅)
- [ ] PR 생성
