# GORM으로 MySQL 다루기 - TODO

> PRD: `6_4_go_gorm_mysql_prd.md`
> 구현 문서: `6_4_go_gorm_mysql_implementation.md`

---

## Phase 1: 프로젝트 셋업

- [x] GORM v2 최신 버전으로 `go.mod` 업그레이드 (gorm v1.31.1, driver/mysql v1.6.0)
- [x] 기존 `database/mysql/` 코드 확인 (import 경로 이슈는 기존 문제, 신규 프로젝트 무관)
- [x] `database/gorm-mysql/` 디렉토리 생성
- [x] `docker-compose.yml` 작성 (MySQL 8.0, utf8mb4)
- [x] `scripts/init.sql` 작성 (DB 생성, 기본 설정)
- [x] `Makefile` 작성 (up, down, reset, test)
- [x] `docker compose up -d`로 MySQL 컨테이너 정상 기동 확인

## Phase 2: 설정 및 인프라

- [x] `config/config.yaml` 작성 (DSN, logLevel)
- [x] `config/config.go` 작성 (YAML 파싱, Config 구조체)
- [x] `internal/infrastructure/database/mysql.go` 작성 (GORM v2 초기화, 커넥션 풀)
- [x] AutoMigrate 함수 작성
- [x] DB 연결 테스트 (`go build` 성공)

## Phase 3: 도메인 모델

- [x] `internal/domain/user.go` 작성 (User, Profile 엔티티 + UserRepository 인터페이스)
- [x] `internal/domain/post.go` 작성 (Post 엔티티 + PostRepository 인터페이스)
- [x] `internal/domain/tag.go` 작성 (Tag 엔티티)
- [x] `go build ./database/gorm-mysql/...` 빌드 성공

## Phase 4: CRUD 구현

- [x] `internal/repository/user_repository.go` 작성
  - [x] Create (단건, 배치)
  - [x] FindByID (Preload Profile, Posts)
  - [x] FindByEmail
  - [x] FindAll (Offset, Limit, Order)
  - [x] Update (Save, Updates)
  - [x] Delete (Soft Delete, Hard Delete)
- [x] `internal/repository/user_repository_test.go` 작성 - CRUD 테스트
- [x] `internal/repository/post_repository.go` 작성
  - [x] Create
  - [x] FindByID, FindByUserID
  - [x] FindWithTags (Preload)
  - [x] Update, Delete
- [x] `internal/repository/post_repository_test.go` 작성

## Phase 5: 관계 매핑

- [x] 1:1 관계 테스트: User + Profile 생성/조회 (Preload)
- [x] 1:N 관계 테스트: User의 Post 생성/조회 (Preload)
- [x] N:M 관계 구현 및 테스트
  - [x] Post에 Tag 추가 (Association Append)
  - [x] Post에서 Tag 제거 (Association Clear)
  - [x] Tag로 Post 조회 (Preload)

## Phase 6: 트랜잭션과 고급 기능

- [x] 트랜잭션 구현: CreateWithProfile (자동 트랜잭션 `db.Transaction`)
- [x] 트랜잭션 롤백 테스트 (에러 발생 시 롤백 확인)
- [x] Raw SQL 예제 작성 (`db.Raw`, `db.Exec`)
- [x] Scopes 예제 작성 (Paginate, ByName)
- [x] Hook 예제 작성 (`BeforeCreate`)

## Phase 7: 통합 테스트

- [x] `main_test.go` 작성 (전체 시나리오 테스트)
- [x] `go test -v -count=1 -p 1 ./database/gorm-mysql/...` 전체 21개 테스트 PASS
- [x] 테스트 전 데이터 정리 (TRUNCATE TABLE)

## Phase 8: 블로그 글 작성

- [ ] `docs/start/go-gorm-mysql/index.md` 초안 작성
  - [ ] §1 들어가며 (GORM 소개, v2 vs v1, vs database/sql)
  - [ ] §2 환경 설정 (Docker Compose, DB 연결, Clean Architecture 구조)
  - [ ] §3 모델 정의와 마이그레이션
  - [ ] §4 CRUD 기본 조작 (Create/Read/Update/Delete)
  - [ ] §5 관계 매핑 (1:1, 1:N, N:M + Mermaid ER 다이어그램)
  - [ ] §6 트랜잭션과 고급 쿼리 (트랜잭션, Raw SQL, Scopes)
  - [ ] §7 실전 팁 (N+1, Hook, 에러 처리)
  - [ ] §8 마무리
  - [ ] §9 참고
- [ ] 코드 블록에 tutorials-go GitHub 링크 참조
- [ ] frontmatter 작성 (title, description, date, tags, series)
- [ ] `file -I` 로 UTF-8 인코딩 확인
