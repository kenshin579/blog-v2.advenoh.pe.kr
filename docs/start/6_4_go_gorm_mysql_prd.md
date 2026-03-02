# GORM으로 MySQL 다루기 PRD

> 시리즈: Golang 블로그 주제 Phase 2 - 데이터베이스 (1/3)
> 참조: `6_golang_topic_prd.md` B-1

---

## 1. 개요

Go에서 가장 널리 사용되는 ORM인 GORM을 활용한 MySQL 연동. CRUD 기본 조작, 마이그레이션, 관계 매핑, Raw SQL 실행까지 실무에서 바로 쓸 수 있는 패턴을 다룬다.

**대상 독자**: Go 기초 문법을 아는 백엔드 개발자
**난이도**: 초중급
**예제 코드**: `tutorials-go/database/mysql/`

---

## 2. 블로그 구조

### 2.1 GORM 소개
- GORM이란? (Go ORM 생태계에서의 위치)
- 설치: `go get gorm.io/gorm`, `go get gorm.io/driver/mysql`
- GORM vs database/sql 직접 사용 비교

### 2.2 연결 설정
- DSN 구성: `user:password@tcp(host:port)/dbname?parseTime=true`
- Viper 기반 설정 관리 (`config.yaml` → `config.go`)
- 커넥션 풀 설정: `SetMaxOpenConns`, `SetMaxIdleConns`, `SetConnMaxLifetime`
- 참고 코드: `common/database/mysql.go`, `config/config.go`

### 2.3 모델 정의
- 구조체 태그: `gorm:"column:name;type:varchar(100);primaryKey"`
- 기본 모델 (`gorm.Model` - ID, CreatedAt, UpdatedAt, DeletedAt)
- 커스텀 테이블명: `TableName()` 메서드
- 참고 코드: `model/locations.go`

### 2.4 CRUD 기본 조작
- Create: `db.Create(&entity)`
- Read: `db.First()`, `db.Find()`, `db.Where()`
- Update: `db.Save()`, `db.Updates()`
- Delete: `db.Delete()` (Soft Delete vs Hard Delete)

### 2.5 Raw SQL과 고급 쿼리
- `db.Exec()` - 벌크 INSERT, DDL
- `db.Raw().Scan()` - 복잡한 SELECT
- `db.ScanRows()` - 결과 행 순회
- Spatial 쿼리 예제 (ST_Distance, ST_GeomFromText)
- 참고 코드: `mysql_test.go` (Spatial 데이터 INSERT/SELECT)

### 2.6 마이그레이션
- Auto Migration: `db.AutoMigrate(&Model{})`
- SQL 스크립트 기반 마이그레이션 (`scripts/*.sql`)
- Liquibase 등 외부 도구 연동 참조

### 2.7 실전 팁
- 트랜잭션 처리: `db.Transaction(func(tx *gorm.DB) error {})`
- 로깅 설정: `logger.Default.LogMode(logger.Info)`
- N+1 문제와 Preload/Joins

---

## 3. 샘플 코드 참조

| 파일 | 내용 |
|------|------|
| `database/mysql/common/database/mysql.go` | DB 연결 설정 |
| `database/mysql/config/` | Viper 기반 설정 관리 |
| `database/mysql/model/locations.go` | 모델 정의 (Spatial) |
| `database/mysql/mysql_test.go` | Spatial CRUD 테스트 |
| `database/mysql/scripts/` | SQL 스크립트 (spatial, json, ngram) |

---

## 4. 논의 사항

- [ ] 기존 예제가 Spatial 쿼리 중심 → 일반 CRUD 예제를 추가 작성할지
- [ ] GORM v2 기준으로 작성 (v1과의 차이점 간단히 언급)
- [ ] 관계 매핑 (HasOne, HasMany, BelongsTo) 예제 추가 필요 여부
- [ ] Clean Architecture(project-layout)의 repository 패턴과 연계할지
- [ ] Docker Compose로 MySQL 로컬 환경 설정 포함할지
