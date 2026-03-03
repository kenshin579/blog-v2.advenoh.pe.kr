# Mockery로 인터페이스 Mock 자동 생성하기 PRD

> 시리즈: Golang 블로그 주제 Phase 1 - 테스트 전략 (2/3)
> 참조: `6_golang_topic_prd.md` A-2

---

## 1. 개요

Go에서 인터페이스 기반 Mock을 자동 생성하는 `mockery v3` 도구와 `testify/mock` 패키지를 활용한 단위 테스트 작성법. 수동 Mock 구현과 자동 생성의 차이, `.mockery.yaml` 설정 파일 기반 생성, 다양한 Argument Matching 패턴을 다룬다.

**대상 독자**: Go 테스트 기초를 아는 개발자
**난이도**: 중급
**예제 코드**: `tutorials-go/go-unit-test/mockery/`
**mockery 버전**: v3 (v3.6.4 기준)

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

### 2.4 Mockery v3 도구로 자동 생성

#### 설치
```bash
# Homebrew (macOS 추천)
brew install mockery

# go install (특정 버전 고정 - @latest 비추천)
go install github.com/vektra/mockery/v3@v3.6.4
```

#### 기본 사용법
- `mockery` 명령어 실행 (`.mockery.yaml` 기반)
- `//go:generate mockery` 디렉티브 사용법
- 생성된 Mock 코드 구조 설명
- 참고 코드: `do_user/mocks/doer/Doer.go` (자동 생성된 Mock)

#### v2 → v3 주요 변경사항
| 항목 | v2 | v3 |
|------|----|----|
| Expecter (`EXPECT()`) | `with-expecter: true` 설정 필요 | **항상 생성** (설정 제거됨) |
| Mock 위치 기본값 | `mocks/` 별도 디렉토리 | **인터페이스 파일 옆** (`{{.InterfaceDir}}`) |
| `--all --keeptree` | CLI 플래그 사용 | `.mockery.yaml`의 `packages` + `all: true` 사용 |
| `inpackage` | 수동 설정 | **자동 감지** (설정 제거됨) |
| 설정 방식 | CLI 플래그 중심 | **`.mockery.yaml` 설정 파일 중심** |
| 마이그레이션 | - | `mockery migrate` 명령어 제공 |

### 2.5 `.mockery.yaml` 설정 파일

#### 초기화
```bash
mockery init github.com/your/module
```

#### 기본 설정 예시
```yaml
# .mockery.yaml
template: testify
formatter: goimports
dir: "{{.InterfaceDir}}"
filename: "mocks_test.go"
all: false

packages:
  # 특정 패키지의 모든 인터페이스 Mock 생성
  github.com/your/project/internal/service:
    config:
      all: true

  # 특정 인터페이스만 지정
  github.com/your/project/internal/repository:
    interfaces:
      UserRepository:
      OrderRepository:
```

#### 실전 설정 예시 (고급)
```yaml
# .mockery.yaml
_anchors:
  common: &common
    dir: "{{.InterfaceDir}}"
    filename: "mocks_test.go"

template: testify
formatter: goimports
force-file-write: true

template-data:
  unroll-variadic: true

packages:
  # Mock을 별도 디렉토리에 생성
  github.com/your/project/internal/repository:
    config:
      dir: "{{.InterfaceDir}}/mocks"
      filename: "mock_{{.InterfaceName}}.go"
    interfaces:
      UserRepository:
      OrderRepository:
        config:
          structname: "FakeOrderRepository"

  # 재귀적으로 하위 패키지 탐색
  github.com/your/project/pkg:
    config:
      recursive: true
      exclude-subpkg-regex:
        - "generated"
        - "testdata"
```

#### 주요 설정 옵션

| 옵션 | 기본값 | 설명 |
|------|--------|------|
| `template` | `""` | `testify` 또는 `matryer` |
| `dir` | `"{{.InterfaceDir}}"` | Mock 파일 출력 디렉토리 |
| `filename` | `"mocks_test.go"` | 출력 파일명 |
| `formatter` | `"goimports"` | 코드 포맷터 (`gofmt`, `goimports`, `noop`) |
| `all` | `false` | 패키지 내 모든 인터페이스 생성 |
| `recursive` | `false` | 하위 패키지 재귀 탐색 |
| `structname` | `"{{.Mock}}{{.InterfaceName}}"` | 생성될 Mock 구조체 이름 |
| `pkgname` | `"{{.SrcPackageName}}"` | 생성 파일의 패키지 이름 |

#### 인라인 디렉티브 (`//mockery:` 주석)
v3에서 추가된 기능으로, 인터페이스 주석에 YAML 설정을 직접 작성할 수 있다:
```go
// UserService handles user operations.
//
// mockery:
//   structname: FakeUserService
//   template: testify
type UserService interface {
    GetUser(ctx context.Context, id string) (*User, error)
}
```

### 2.6 Expecter 패턴 (v3 기본 제공)
v3에서는 타입 안전한 `.EXPECT()` 메서드가 항상 생성된다:
```go
// 기존 On().Return() 방식 (여전히 사용 가능)
mockSvc.On("GetUser", "123").Return(&User{Name: "Frank"}, nil)

// v3 Expecter 방식 (타입 안전, 자동완성 지원)
mockSvc.EXPECT().GetUser("123").Return(&User{Name: "Frank"}, nil)
mockSvc.EXPECT().GetUser(mock.Anything).Return(nil, errors.New("not found")).Once()
```

### 2.7 Argument Matching 패턴
- `mock.Anything` - 모든 값 매칭
- `mock.AnythingOfType("string")` - 타입 매칭
- `mock.MatchedBy(func)` - 커스텀 조건 매칭
- 호출 횟수 제어: `Once()`, `Twice()`, `Times(n)`
- 참고 코드: `do_user/user/user_test.go`

### 2.8 에러 시나리오 테스트
- 성공 경로 / 연결 실패 / 메시지 전송 실패 분리
- 각 시나리오별 Mock 설정과 검증
- 참고 코드: `mockdatabase/database_test.go`

### 2.9 실무에서 Mock 남용 주의

#### Mock을 쓰면 안 되는 경우
- **내부 구현 테스트**: 구현 세부사항을 Mock하면 리팩토링할 때마다 테스트가 깨진다
- **단순한 값 객체/유틸리티**: 로직이 단순한 함수는 실제 구현을 그대로 사용하는 것이 낫다
- **통합 테스트 영역**: DB 쿼리 정확성, API 응답 형식 등은 실제 의존성으로 검증해야 한다

#### Mock 남용의 위험 신호
- 테스트 코드가 프로덕션 코드보다 길다
- Mock 설정이 너무 복잡해서 테스트 의도를 파악하기 어렵다
- 리팩토링 시 프로덕션 코드보다 테스트 수정이 더 많다
- `On().Return()` 체인이 10줄 이상 이어진다

#### 올바른 Mock 사용 가이드라인
- **외부 시스템 경계에서만 Mock 사용**: DB, 외부 API, 메시지 큐 등
- **행위 검증보다 상태 검증 우선**: `AssertCalled`보다 반환값/결과 검증이 더 유지보수하기 쉽다
- **테스트 더블 종류 구분**: Stub(반환값만), Mock(행위 검증), Fake(간소화된 구현) 중 적절한 것을 선택
- **통합 테스트와 병행**: Mock 단위 테스트만으로는 실제 동작을 보장할 수 없다 (testcontainers 등 활용)

```
❌ 나쁜 예: 내부 구현까지 Mock
func TestService_Bad(t *testing.T) {
    mockRepo.EXPECT().FindByID("1").Return(&User{}, nil)
    mockRepo.EXPECT().Validate(&User{}).Return(nil)     // 내부 로직까지 Mock
    mockRepo.EXPECT().Transform(&User{}).Return(&DTO{}) // 구현 세부사항 노출
    ...
}

✅ 좋은 예: 외부 경계만 Mock
func TestService_Good(t *testing.T) {
    mockRepo.EXPECT().FindByID("1").Return(&User{Name: "Frank"}, nil)
    result, err := service.GetUser("1")
    assert.Equal(t, "Frank", result.Name) // 결과(상태) 검증에 집중
}
```

---

## 3. 샘플 코드 참조

| 파일 | 내용 |
|------|------|
| `go-unit-test/mockery/mockdatabase/` | 수동 Mock 3가지 시나리오 |
| `go-unit-test/mockery/do_user/` | mockery 자동 생성 + Argument Matching |
| `go-unit-test/mockery/message/` | MessageService Mock 패턴 |
| `go-unit-test/mockery/downcaser/` | 인라인 Mock 생성 (go:generate) |
| `go-unit-test/mockery/mockery_test.go` | MatchedBy 패턴 예제 |
| `go-unit-test/mockery/.mockery.yaml` | v3 설정 파일 예시 (추가 필요) |

---

## 4. 논의 사항

- [x] ~~mockery v2 vs v3 중 어느 버전 기준으로 작성할지~~ → **v3 기준으로 작성**
- [x] ~~`.mockery.yaml` 설정 파일 기반 생성 방식도 다룰지~~ → **포함 (2.5 섹션)**
- [x] ~~실무에서 Mock 남용 주의점~~ → **포함 (2.9 섹션)**
