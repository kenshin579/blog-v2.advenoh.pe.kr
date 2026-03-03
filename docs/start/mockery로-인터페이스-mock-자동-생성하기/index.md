---
title: "Mockery로 인터페이스 Mock 자동 생성하기"
description: "Go에서 mockery v3와 testify/mock을 활용하여 인터페이스 기반 Mock을 자동 생성하고, 수동 Mock과의 차이, .mockery.yaml 설정, Expecter 패턴, Argument Matching 기법까지 실전 예제와 함께 정리합니다"
date: 2026-03-03
update: 2026-03-03
tags:
  - golang
  - go
  - test
  - mock
  - mockery
  - testify
  - unit test
  - interface
  - Expecter
---

> Go에서 단위 테스트를 작성하다 보면 외부 의존성을 격리하기 위해 Mock 객체가 필요하다. 이 글에서는 수동 Mock 구현부터 `mockery v3`를 이용한 자동 생성까지, 실전 예제와 함께 정리한다.

# 1. 왜 Mock이 필요한가?

단위 테스트의 핵심은 **테스트 대상 코드만 격리하여 검증**하는 것이다. 하지만 실제 코드는 데이터베이스, 외부 API, 파일시스템 등 다양한 외부 의존성과 연결되어 있다. Mock을 사용하면 이러한 외부 의존성을 가짜 객체로 대체하여, 테스트 대상 로직만 빠르게 검증할 수 있다.

```mermaid
flowchart LR
    A[테스트 코드] --> B[테스트 대상 함수]
    B --> C[Mock 객체]
    C -.->|"실제 환경에서는"| D[DB / API / 파일]
    style C fill:#f9f,stroke:#333
    style D fill:#ddd,stroke:#999,stroke-dasharray:5
```

Go에서는 **인터페이스**가 이 격리의 핵심 역할을 한다. 인터페이스를 매개변수로 받도록 설계하면, 테스트 시 실제 구현 대신 Mock 객체를 주입할 수 있다.

Mock을 만드는 방법은 크게 두 가지다:

| 방식 | 장점 | 단점 |
|------|------|------|
| **수동 Mock** | 간단, 외부 도구 불필요 | 인터페이스 변경 시 수동 업데이트 필요 |
| **자동 생성 (mockery)** | 인터페이스 변경 시 자동 반영, Expecter/Argument Matching 지원 | 도구 설치 필요 |

# 2. 수동 Mock 구현

가장 기본적인 Mock 방식은 테스트용 구조체를 직접 만드는 것이다. 외부 도구 없이도 인터페이스만 구현하면 된다.

## 2.1 인터페이스를 직접 구현하는 방식

`EmailSender` 인터페이스를 구현하는 테스트용 구조체를 만들어 Mock으로 사용한다.

```go
type EmailSender interface {
    Send(subject, body string, to ...*mail.Address)
}
```

테스트에서는 `testEmailSender` 구조체를 만들어 호출된 인자를 기록해두고 나중에 검증한다.

```go
type testEmailSender struct {
    lastSubject string
    lastBody    string
    lastTo      []*mail.Address
}

func (t *testEmailSender) Send(subject, body string, to ...*mail.Address) {
    t.lastSubject = subject
    t.lastBody = body
    t.lastTo = to
}

func TestSendWelcomeEmail(t *testing.T) {
    sender := &testEmailSender{}
    to := &mail.Address{Name: "Receiver", Address: "test@test.com"}

    SendWelcomeEmail(sender, to)

    if sender.lastSubject != "Welcome" {
        t.Error("Subject line was wrong")
    }
}
```

> 전체 코드: [mailman_test.go](https://github.com/kenshin579/tutorials-go/blob/master/golang/testing/mailman_test.go)

## 2.2 함수 변수를 이용한 Mock

인터페이스 없이도, 함수를 변수로 선언하면 테스트에서 해당 함수를 교체할 수 있다.

```go
var show = func(v ...interface{}) {
    log.Println(v...)
}

func printSize(n int) {
    if n < 10 {
        show("SMALL")
    } else {
        show("LARGE")
    }
}
```

테스트에서 `show` 변수를 교체하여 출력값을 캡처한다.

```go
func TestPrintSize(t *testing.T) {
    var got string
    oldShow := show
    show = func(v ...interface{}) {
        got = v[0].(string)
    }
    defer func() { show = oldShow }()

    printSize(2)
    if got != "SMALL" {
        t.Fatalf("expected 'SMALL', got '%s'", got)
    }
}
```

> 전체 코드: [print_size_test.go](https://github.com/kenshin579/tutorials-go/blob/master/golang/testing/print_size_test.go)

수동 Mock은 간단한 경우에 유용하지만, 인터페이스의 메서드가 많거나 인터페이스가 변경될 때마다 Mock 코드를 직접 수정해야 하는 부담이 있다.

# 3. testify/mock 패키지

[testify](https://github.com/stretchr/testify)의 `mock` 패키지를 사용하면 수동 Mock을 좀 더 체계적으로 작성할 수 있다. `mock.Mock`을 임베딩하면 기대 동작 설정, 호출 기록, 검증 기능을 편리하게 사용할 수 있다.

## 3.1 기본 구조

`Database` 인터페이스에 대한 Mock을 만들어보자.

```go
type Database interface {
    connect() error
    sendMessage(*string) error
}
```

`mock.Mock`을 임베딩한 `MockDatabase` 구조체를 만들고, 각 메서드에서 `Called()`로 호출을 기록하고 반환값을 돌려준다.

```go
type MockDatabase struct {
    mock.Mock
}

func (db *MockDatabase) connect() error {
    args := db.Called()
    return args.Error(0)
}

func (db *MockDatabase) sendMessage(message *string) error {
    args := db.Called(message)
    return args.Error(0)
}
```

## 3.2 On().Return() 패턴

`On()` 메서드로 특정 메서드 호출 시 반환값을 설정하고, `AssertExpectations()`으로 모든 기대가 충족되었는지 검증한다.

```go
func TestSuccess(t *testing.T) {
    db := new(MockDatabase)
    message := "Hello"

    db.On("connect").Return(nil)
    db.On("sendMessage", &message).Return(nil)

    err := Talk(db, &message)

    assert.NoError(t, err)
    db.AssertExpectations(t)
}
```

## 3.3 에러 시나리오 테스트

같은 인터페이스에 대해 다양한 에러 시나리오를 쉽게 테스트할 수 있다.

```go
// 연결 실패 시나리오
func TestErrorOnConnect(t *testing.T) {
    db := new(MockDatabase)
    db.On("connect").Return(errors.New("Some error"))

    message := "Hello"
    err := Talk(db, &message)

    assert.NotEqual(t, nil, err, "An error is thrown if connection fails")
    db.AssertExpectations(t)
}

// 메시지 전송 실패 시나리오
func TestErrorOnMessage(t *testing.T) {
    db := new(MockDatabase)
    message := "Hello"
    db.On("connect").Return(nil)
    db.On("sendMessage", &message).Return(errors.New("Some error"))

    err := Talk(db, &message)

    assert.NotEqual(t, nil, err, "An error is thrown if sendMessage fails")
    db.AssertExpectations(t)
}
```

> 전체 코드: [mockdatabase/database_test.go](https://github.com/kenshin579/tutorials-go/blob/master/go-unit-test/mockery/mockdatabase/database_test.go)

`testify/mock`은 편리하지만, 여전히 Mock 구조체와 메서드를 직접 작성해야 한다. 인터페이스가 변경되면 Mock도 수동으로 수정해야 하고, 메서드 이름을 문자열로 지정하기 때문에 오타 위험도 있다. 이 문제를 해결해주는 것이 `mockery`다.

# 4. Mockery v3 도구로 자동 생성

[mockery](https://github.com/vektra/mockery)는 Go 인터페이스를 읽어서 `testify/mock` 기반의 Mock 코드를 자동으로 생성해주는 도구다.

## 4.1 설치

```bash
# Homebrew (macOS)
brew install mockery

# go install (특정 버전 고정)
go install github.com/vektra/mockery/v3@v3.6.4
```

설치 확인:

```bash
$ mockery version
v3.6.4
```

## 4.2 기본 사용법

mockery v3은 `.mockery.yaml` 설정 파일 기반으로 동작한다. 프로젝트 루트에서 `mockery` 명령어 하나로 모든 Mock을 생성한다.

```bash
# 프로젝트 루트에서 실행
mockery
```

`//go:generate` 디렉티브를 사용하면 `go generate`로도 실행할 수 있다.

```go
//go:generate mockery
func TestMock(t *testing.T) {
    // ...
}
```

## 4.3 생성된 Mock 코드 구조

다음과 같은 `Doer` 인터페이스가 있다고 하자.

```go
package doer

type Doer interface {
    Do(int, string) error
}
```

mockery를 실행하면 아래와 같은 코드가 자동 생성된다.

```go
// Code generated by mockery; DO NOT EDIT.
package mocks

import mock "github.com/stretchr/testify/mock"

// MockDoer is an autogenerated mock type for the Doer type
type MockDoer struct {
    mock.Mock
}

// Do provides a mock function for the type MockDoer
func (_mock *MockDoer) Do(n int, s string) error {
    ret := _mock.Called(n, s)

    if len(ret) == 0 {
        panic("no return value specified for Do")
    }

    var r0 error
    if returnFunc, ok := ret.Get(0).(func(int, string) error); ok {
        r0 = returnFunc(n, s)
    } else {
        r0 = ret.Error(0)
    }
    return r0
}
```

v3가 자동 생성하는 Mock에는 다음이 포함된다:

- **Mock 구조체** (`MockDoer`): `mock.Mock` 임베딩
- **Constructor** (`NewMockDoer(t)`): 테스트 종료 시 자동으로 `AssertExpectations` 호출
- **Expecter** (`EXPECT()`): 타입 안전한 기대 설정 메서드
- **Call 타입** (`MockDoer_Do_Call`): `Run()`, `Return()`, `RunAndReturn()` 체이닝

> 전체 코드: [do_user/mocks/doer/mock_Doer.go](https://github.com/kenshin579/tutorials-go/blob/master/go-unit-test/mockery/do_user/mocks/doer/mock_Doer.go)

## 4.4 v2 vs v3 주요 변경사항

| 항목 | v2 | v3 |
|------|----|----|
| Expecter (`EXPECT()`) | `with-expecter: true` 설정 필요 | **항상 생성** (설정 제거됨) |
| Mock 위치 기본값 | `mocks/` 별도 디렉토리 | **인터페이스 파일 옆** (`{{.InterfaceDir}}`) |
| `--all --keeptree` | CLI 플래그 사용 | `.mockery.yaml`의 `packages` + `all: true` 사용 |
| `inpackage` | 수동 설정 | **자동 감지** (설정 제거됨) |
| 설정 방식 | CLI 플래그 중심 | **`.mockery.yaml` 설정 파일 중심** |
| Mock 구조체 이름 | `Doer` (인터페이스명 그대로) | `MockDoer` (`Mock` 접두사 추가) |
| 마이그레이션 | - | `mockery migrate` 명령어 제공 |

# 5. .mockery.yaml 설정 파일

v3에서는 CLI 플래그 대신 `.mockery.yaml` 설정 파일로 Mock 생성을 관리한다. 모든 모듈의 설정을 하나의 파일로 통합할 수 있다.

## 5.1 초기화

```bash
mockery init github.com/your/module
```

이 명령은 기본 `.mockery.yml` 파일을 생성한다.

## 5.2 기본 설정 예시

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

## 5.3 실전 설정 예시

아래는 이 블로그의 샘플 코드에서 사용하는 설정이다. 3개 모듈의 Mock 생성을 하나의 파일로 관리한다.

```yaml
# .mockery.yaml
all: false
dir: "{{.InterfaceDir}}"
filename: mocks_test.go
formatter: goimports
template: testify

packages:
  # downcaser - 인터페이스 파일 옆에 테스트 전용 Mock 생성
  github.com/kenshin579/tutorials-go/go-unit-test/mockery/downcaser:
    config:
      all: true

  # do_user - mocks/ 별도 디렉토리에 생성
  github.com/kenshin579/tutorials-go/go-unit-test/mockery/do_user/doer:
    config:
      dir: "{{.InterfaceDir}}/../mocks/doer"
      filename: "mock_{{.InterfaceName}}.go"
      pkgname: mocks
    interfaces:
      Doer:

  # message - mocks/ 별도 디렉토리에 생성
  github.com/kenshin579/tutorials-go/go-unit-test/mockery/message:
    config:
      dir: "{{.InterfaceDir}}/mocks"
      filename: "mock_{{.InterfaceName}}.go"
      pkgname: mocks
    interfaces:
      MessageService:
```

> 전체 코드: [.mockery.yaml](https://github.com/kenshin579/tutorials-go/blob/master/go-unit-test/mockery/.mockery.yaml)

## 5.4 실전 설정 예시 (고급)

대규모 프로젝트에서는 YAML 앵커, 재귀 탐색, 구조체명 커스터마이징 등을 활용할 수 있다.

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

## 5.5 주요 설정 옵션

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

## 5.6 인라인 디렉티브 (//mockery: 주석)

v3에서는 인터페이스 주석에 YAML 설정을 직접 작성할 수도 있다.

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

`.mockery.yaml`의 전역 설정보다 인라인 디렉티브가 우선 적용된다.

# 6. Expecter 패턴 (v3 기본 제공)

v3에서는 타입 안전한 `.EXPECT()` 메서드가 항상 생성된다. 기존 `On().Return()` 방식과 비교해보자.

## 6.1 기존 On().Return() 방식

메서드 이름을 **문자열**로 지정하므로, 오타가 있어도 컴파일 시점에 잡히지 않는다.

```go
func TestUserWithTestifyMock(t *testing.T) {
    mockDoer := &mocks.MockDoer{}
    testUser := &User{Doer: mockDoer}

    // 메서드 이름이 문자열 -> 오타 위험
    mockDoer.On("Do", 1, "abc").Return(nil).Once()

    testUser.Use()

    mockDoer.AssertExpectations(t)
}
```

## 6.2 v3 Expecter 방식

`EXPECT()` 메서드를 통해 **타입 안전**하게 기대 동작을 설정한다. IDE 자동완성도 지원된다.

```go
func TestUserWithExpecterPattern(t *testing.T) {
    mockDoer := &mocks.MockDoer{}
    testUser := &User{Doer: mockDoer}

    // v3 Expecter: 타입 안전한 메서드 호출
    mockDoer.EXPECT().Do(1, "abc").Return(nil).Once()

    testUser.Use()

    mockDoer.AssertExpectations(t)
}
```

Expecter에서도 `mock.Anything` 같은 매처를 사용할 수 있다.

```go
func TestExpecterWithMatchers(t *testing.T) {
    mockDoer := &mocks.MockDoer{}
    testUser := &User{Doer: mockDoer}

    mockDoer.EXPECT().Do(mock.Anything, mock.Anything).Return(nil).Once()

    testUser.Use()

    mockDoer.AssertExpectations(t)
}
```

> 전체 코드: [do_user/user/user_test.go](https://github.com/kenshin579/tutorials-go/blob/master/go-unit-test/mockery/do_user/user/user_test.go)

# 7. Argument Matching 패턴

testify/mock은 기대하는 인자를 유연하게 매칭할 수 있는 다양한 방법을 제공한다.

## 7.1 mock.Anything

어떤 값이든 매칭한다. 인자 값이 중요하지 않을 때 사용한다.

```go
mockDoer.On("Do", mock.Anything, mock.AnythingOfType("string")).Return(nil).Once()
```

- `mock.Anything`: 어떤 타입의 어떤 값이든 매칭
- `mock.AnythingOfType("string")`: 타입만 일치하면 매칭

## 7.2 mock.MatchedBy

커스텀 조건을 함수로 지정할 수 있다. 복잡한 매칭 조건이 필요할 때 유용하다.

```go
mockDoer.On("Do", 1,
    mock.MatchedBy(func(x string) bool {
        return strings.HasPrefix(x, "abc")
    })).Return(nil).Once()
```

여러 인자에 대해 각각 커스텀 매처를 적용할 수도 있다.

```go
myMock.On("DoSomething",
    mock.MatchedBy(func(arg1 string) bool {
        return strings.HasPrefix(arg1, "foo")
    }),
    mock.MatchedBy(func(arg2 int) bool {
        return arg2 > 10
    })).Return(true)
```

> 전체 코드: [mockery_test.go](https://github.com/kenshin579/tutorials-go/blob/master/go-unit-test/mockery/mockery_test.go)

## 7.3 호출 횟수 제어

Mock 메서드가 몇 번 호출될지 기대값을 설정할 수 있다.

```go
mockDoer.On("Do", mock.Anything, mock.Anything).Return(nil).Once()    // 정확히 1번
mockDoer.On("Do", mock.Anything, mock.Anything).Return(nil).Twice()   // 정확히 2번
mockDoer.On("Do", mock.Anything, mock.Anything).Return(nil).Times(3)  // 정확히 3번
```

## 7.4 Argument Matching 요약

| 매처 | 용도 | 예시 |
|------|------|------|
| 정확한 값 | 특정 값과 정확히 일치 | `On("Do", 1, "abc")` |
| `mock.Anything` | 어떤 값이든 허용 | `On("Do", mock.Anything, ...)` |
| `mock.AnythingOfType` | 타입만 일치하면 허용 | `On("Do", mock.AnythingOfType("int"), ...)` |
| `mock.MatchedBy` | 커스텀 조건 함수로 검증 | `On("Do", mock.MatchedBy(func(x int) bool { return x > 0 }))` |

# 8. 에러 시나리오 테스트

Mock을 활용하면 **성공/실패 경로를 분리하여 테스트**할 수 있다. `mockdatabase` 예제에서 보여주는 3가지 시나리오가 좋은 패턴이다.

```go
func Talk(o Database, message *string) error {
    err := o.connect()
    if err != nil {
        return errors.New("Connection failed")
    }
    err = o.sendMessage(message)
    if err != nil {
        return errors.New("Sending message failed")
    }
    return nil
}
```

| 시나리오 | connect() | sendMessage() | 기대 결과 |
|----------|-----------|---------------|-----------|
| 성공 | `nil` | `nil` | `nil` |
| 연결 실패 | `error` | (호출 안 됨) | `"Connection failed"` |
| 전송 실패 | `nil` | `error` | `"Sending message failed"` |

각 시나리오에서 Mock의 반환값만 다르게 설정하면, 하나의 함수에 대해 모든 경로를 쉽게 커버할 수 있다.

> 전체 코드: [mockdatabase/database_test.go](https://github.com/kenshin579/tutorials-go/blob/master/go-unit-test/mockery/mockdatabase/database_test.go)

# 9. 실무에서 Mock 남용 주의

Mock은 강력한 도구지만, 남용하면 테스트의 신뢰성이 오히려 떨어진다.

## 9.1 Mock을 쓰면 안 되는 경우

- **내부 구현 테스트**: 구현 세부사항을 Mock하면 리팩토링할 때마다 테스트가 깨진다
- **단순한 값 객체/유틸리티**: 로직이 단순한 함수는 실제 구현을 그대로 사용하는 것이 낫다
- **통합 테스트 영역**: DB 쿼리 정확성, API 응답 형식 등은 실제 의존성으로 검증해야 한다

## 9.2 Mock 남용의 위험 신호

- 테스트 코드가 프로덕션 코드보다 길다
- Mock 설정이 너무 복잡해서 테스트 의도를 파악하기 어렵다
- 리팩토링 시 프로덕션 코드보다 테스트 수정이 더 많다
- `On().Return()` 체인이 10줄 이상 이어진다

## 9.3 올바른 Mock 사용 가이드라인

- **외부 시스템 경계에서만 Mock 사용**: DB, 외부 API, 메시지 큐 등
- **행위 검증보다 상태 검증 우선**: `AssertCalled`보다 반환값/결과 검증이 더 유지보수하기 쉽다
- **테스트 더블 종류 구분**: Stub(반환값만), Mock(행위 검증), Fake(간소화된 구현) 중 적절한 것을 선택
- **통합 테스트와 병행**: Mock 단위 테스트만으로는 실제 동작을 보장할 수 없다 (testcontainers 등 활용)

```go
// 나쁜 예: 내부 구현까지 Mock
func TestService_Bad(t *testing.T) {
    mockRepo.EXPECT().FindByID("1").Return(&User{}, nil)
    mockRepo.EXPECT().Validate(&User{}).Return(nil)     // 내부 로직까지 Mock
    mockRepo.EXPECT().Transform(&User{}).Return(&DTO{}) // 구현 세부사항 노출
    // ...
}

// 좋은 예: 외부 경계만 Mock
func TestService_Good(t *testing.T) {
    mockRepo.EXPECT().FindByID("1").Return(&User{Name: "Frank"}, nil)
    result, err := service.GetUser("1")
    assert.Equal(t, "Frank", result.Name) // 결과(상태) 검증에 집중
}
```

# 참고

- [mockery 공식 문서](https://vektra.github.io/mockery/)
- [testify GitHub](https://github.com/stretchr/testify)
- [mockery GitHub](https://github.com/vektra/mockery)
- [예제 코드 - tutorials-go/go-unit-test/mockery](https://github.com/kenshin579/tutorials-go/tree/master/go-unit-test/mockery)
