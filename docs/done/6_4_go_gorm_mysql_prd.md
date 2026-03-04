# GORM으로 MySQL 다루기 PRD

> 시리즈: Golang 블로그 주제 Phase 2 - 데이터베이스 (1/3)
> 참조: `6_golang_topic_prd.md` B-1

---

## 1. 개요

Go에서 가장 널리 사용되는 ORM인 GORM(v2)을 활용한 MySQL 연동. Docker Compose로 로컬 환경을 구성하고, Clean Architecture 기반으로 CRUD, 관계 매핑, 트랜잭션, Raw SQL까지 실무에서 바로 쓸 수 있는 패턴을 다룬다.

**대상 독자**: Go 기초 문법을 아는 백엔드 개발자
**난이도**: 초중급
**예제 코드**: `tutorials-go/database/gorm-mysql/`
**GORM 버전**: v2 (gorm.io/gorm)

---

## 2. 블로그 목차

### # 1. 들어가며
- GORM이란? (Go ORM 생태계에서의 위치)
- GORM v2 vs v1 주요 차이점 (import 경로, 드라이버 분리, Context 지원 등)
- GORM vs database/sql 직접 사용 비교
- 설치: `go get gorm.io/gorm`, `go get gorm.io/driver/mysql`

### # 2. 환경 설정
- #### 2.1 로컬 환경 구성 (Docker Compose)
  - `docker-compose.yml`: MySQL 8.0 컨테이너 설정
  - 환경 변수: `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`
  - 초기화 스크립트 마운트 (`./scripts/init.sql:/docker-entrypoint-initdb.d/`)
  - 실행: `docker compose up -d`, 종료: `docker compose down -v`
- #### 2.2 DB 연결 및 설정
  - DSN 구성: `user:password@tcp(host:port)/dbname?parseTime=true&charset=utf8mb4`
  - 설정 파일 관리 (`config.yaml` → `config.go`)
  - 커넥션 풀: `SetMaxOpenConns`, `SetMaxIdleConns`, `SetConnMaxLifetime`
  - 로깅 설정: `logger.Default.LogMode(logger.Info)`
- #### 2.3 프로젝트 구조 (Clean Architecture)

```
gorm-mysql/
├── docker-compose.yml
├── config/
│   ├── config.go
│   └── config.yaml
├── internal/
│   ├── domain/           # 엔티티 (순수 Go 구조체)
│   │   ├── user.go
│   │   ├── post.go
│   │   └── tag.go
│   ├── repository/       # 데이터 접근 계층 (GORM 의존)
│   │   ├── user_repository.go
│   │   └── post_repository.go
│   └── infrastructure/   # DB 연결, 외부 인프라
│       └── database/
│           └── mysql.go
├── scripts/
│   └── init.sql
└── main_test.go          # 통합 테스트
```

  - 계층별 역할과 의존성 방향 (Domain ← Repository ← Infrastructure)
  - Repository 인터페이스 정의와 GORM 구현 분리

### # 3. 모델 정의와 마이그레이션
- 기본 모델 (`gorm.Model` - ID, CreatedAt, UpdatedAt, DeletedAt)
- 구조체 태그: `gorm:"column:name;type:varchar(100);not null;uniqueIndex"`
- 커스텀 테이블명: `TableName()` 메서드
- Auto Migration: `db.AutoMigrate(&User{}, &Post{}, &Tag{})`
- 예제 모델: `User`, `Post`, `Tag` (블로그 도메인)

### # 4. CRUD 기본 조작
- #### 4.1 Create
  - 단건 생성: `db.Create(&user)`
  - 배치 생성: `db.Create(&users)`
- #### 4.2 Read
  - `db.First()`, `db.Find()`, `db.Where()`
  - `db.Order()`, `db.Limit()`, `db.Offset()`
- #### 4.3 Update
  - `db.Save()`, `db.Updates()`, `db.Update()` (단일 컬럼)
- #### 4.4 Delete
  - Soft Delete: `db.Delete()`
  - Hard Delete: `db.Unscoped().Delete()`

### # 5. 관계 매핑
- #### 5.1 1:1 관계 (Has One / Belongs To)
  - `User` ↔ `Profile` 예제
  - 구조체 정의: `gorm:"foreignKey:UserID"`
  - Preload: `db.Preload("Profile").Find(&users)`
- #### 5.2 1:N 관계 (Has Many)
  - `User` ↔ `Post` 예제
  - 부모-자식 관계 생성/조회
  - Preload: `db.Preload("Posts").Find(&user)`
- #### 5.3 N:M 관계 (Many To Many)
  - `Post` ↔ `Tag` 예제 (중간 테이블 `post_tags`)
  - `gorm:"many2many:post_tags"`
  - Association: `db.Model(&post).Association("Tags").Append(&tag)`
  - Preload: `db.Preload("Tags").Find(&posts)`

### # 6. 트랜잭션과 고급 쿼리
- #### 6.1 트랜잭션
  - 자동 트랜잭션: `db.Transaction(func(tx *gorm.DB) error { ... })`
  - 수동 트랜잭션: `db.Begin()`, `tx.Commit()`, `tx.Rollback()`
  - 실전 예제: 사용자 생성 + 프로필 생성을 하나의 트랜잭션으로 처리
- #### 6.2 Raw SQL
  - `db.Raw().Scan()` - 복잡한 SELECT
  - `db.Exec()` - DDL, 벌크 INSERT
  - Named Argument: `db.Where("name = @name", sql.Named("name", "frank"))`
- #### 6.3 Scopes
  - 재사용 가능한 쿼리 조건 분리

### # 7. 실전 팁
- N+1 문제와 해결: `Preload` vs `Joins`
- Hook 활용: `BeforeCreate`, `AfterUpdate`
- 에러 처리: `errors.Is(result.Error, gorm.ErrRecordNotFound)`

### # 8. 마무리

### # 9. 참고

---

## 3. 샘플 코드 참조

| 파일 | 내용 |
|------|------|
| `gorm-mysql/docker-compose.yml` | MySQL 8.0 로컬 환경 |
| `gorm-mysql/config/` | 설정 파일 관리 |
| `gorm-mysql/internal/domain/` | 엔티티 모델 (User, Post, Tag) |
| `gorm-mysql/internal/repository/` | Repository 구현 (CRUD, 관계 매핑) |
| `gorm-mysql/internal/infrastructure/` | DB 연결 설정 |
| `gorm-mysql/scripts/init.sql` | DB 초기화 스크립트 |
| `gorm-mysql/main_test.go` | 통합 테스트 |

> **참고**: 기존 `database/mysql/` 예제 (Spatial, N-gram) 는 별도로 유지. 이 글에서는 새로운 `database/gorm-mysql/` 프로젝트를 작성한다.

---

## 4. 논의 사항 (결정됨)

- [x] 일반 CRUD 예제 추가 → User/Post/Tag 블로그 도메인으로 새로 작성 (§4)
- [x] GORM v2 기준으로 작성 (v1 차이점은 §1 들어가며에서 간단히 언급)
- [x] 관계 매핑 예제 추가 → §5에서 1:1, 1:N, N:M 각각 다룸
- [x] Clean Architecture 구조 → §2.3에서 domain/repository/infrastructure 분리
- [x] Docker Compose → §2.1에 MySQL 8.0 컨테이너 포함

---

## 5. 기존 예제(Spatial/N-gram)와의 관계

기존 `database/mysql/`의 Spatial 쿼리, N-gram 전문 검색 예제는 이 글의 범위에 포함하지 않는다. 추후 별도 고급 편에서 다룰 수 있다.

| 기존 코드 | 용도 | 상태 |
|---|---|---|
| `database/mysql/` | Spatial, N-gram 특화 예제 (GORM v1) | 유지 |
| `database/gorm-mysql/` | 이 글의 예제 (GORM v2, Clean Architecture) | 신규 작성 |
