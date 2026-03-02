# Mockery로 인터페이스 Mock 자동 생성하기 PRD

> 시리즈: Golang 블로그 주제 Phase 1 - 테스트 전략 (2/3)
> 참조: `6_golang_topic_prd.md` A-2

---

## 1. 개요

Go에서 인터페이스 기반 Mock을 자동 생성하는 `mockery` 도구와 `testify/mock` 패키지를 활용한 단위 테스트 작성법. 수동 Mock 구현과 자동 생성의 차이, 다양한 Argument Matching 패턴을 다룬다.

**대상 독자**: Go 테스트 기초를 아는 개발자
**난이도**: 중급
**예제 코드**: `tutorials-go/go-unit-test/mockery/`

---

## 2. 블로그 구조

### 2.1 왜 Mock이 필요한가?
- 외부 의존성 격리 (DB, API, 파일시스템)
- 인터페이스 기반 설계와 테스트 용이성
- 수동 Mock vs 자동 Mock 장단점

### 2.2 수동 Mock 구현
- 인터페이스를 직접 구현하는 테스트용 구조체
- 참고 코드: `golang/testing/mailman_test.go` (EmailSender Mock)
- 참고 코드: `golang/testing/readn_test.go` (io.Reader Mock)
- 함수 변수를 이용한 Mock: `golang/testing/print_size_test.go`

### 2.3 testify/mock 패키지
- `mock.Mock` 임베딩 기본 구조
- `On().Return()` 패턴으로 기대 동작 설정
- `Called()` 메서드로 호출 기록
- `AssertExpectations(t)` 검증
- 참고 코드: `mockdatabase/database_test.go` (3가지 시나리오)

### 2.4 Mockery 도구로 자동 생성
- mockery 설치: `go install github.com/vektra/mockery/v2@latest`
- `//go:generate mockery` 디렉티브 사용법
- Makefile 기반 생성: `mockery --all --keeptree`
- 생성된 Mock 코드 구조 설명
- 참고 코드: `do_user/mocks/doer/Doer.go` (자동 생성된 Mock)

### 2.5 Argument Matching 패턴
- `mock.Anything` - 모든 값 매칭
- `mock.AnythingOfType("string")` - 타입 매칭
- `mock.MatchedBy(func)` - 커스텀 조건 매칭
- 호출 횟수 제어: `Once()`, `Twice()`, `Times(n)`
- 참고 코드: `do_user/user/user_test.go`

### 2.6 에러 시나리오 테스트
- 성공 경로 / 연결 실패 / 메시지 전송 실패 분리
- 각 시나리오별 Mock 설정과 검증
- 참고 코드: `mockdatabase/database_test.go`

---

## 3. 샘플 코드 참조

| 파일 | 내용 |
|------|------|
| `go-unit-test/mockery/mockdatabase/` | 수동 Mock 3가지 시나리오 |
| `go-unit-test/mockery/do_user/` | mockery 자동 생성 + Argument Matching |
| `go-unit-test/mockery/message/` | MessageService Mock 패턴 |
| `go-unit-test/mockery/downcaser/` | 인라인 Mock 생성 (go:generate) |
| `go-unit-test/mockery/mockery_test.go` | MatchedBy 패턴 예제 |

---

## 4. 논의 사항

- [ ] mockery v2 vs v3 중 어느 버전 기준으로 작성할지
- [ ] `.mockery.yaml` 설정 파일 기반 생성 방식도 다룰지
- [ ] httpmock과의 차이점/사용 시점 비교를 포함할지
- [ ] 실무에서 Mock 남용 주의점 (과도한 Mock은 테스트 의미 감소)
