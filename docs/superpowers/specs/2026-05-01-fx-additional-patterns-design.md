# Design: uber/fx 누락 패턴 추가 (group, Private, Populate)

- **작성일**: 2026-05-01
- **상태**: 승인 대기
- **관련 저장소**:
  - 코드: `tutorials-go/project-layout/go-clean-arch-v2`
  - 블로그 draft: `blog-v2.advenoh.pe.kr/docs/start/go-fx-의존성-주입/index.md`

## 1. 배경

블로그 draft `go-fx-의존성-주입/index.md`는 uber/fx의 핵심 API를 다루지만, fx를 활용한 실전 Go 프로젝트에서 자주 쓰이는 3가지 패턴이 빠져 있다.

누락된 패턴:

| API | 누락 정도 | 비고 |
|-----|-----------|------|
| `fx.ParamTags` + `group:` 태그 | **누락** | 동일 인터페이스 여러 구현을 모으는 핵심 패턴 |
| `fx.ResultTags` + `group:` 태그 | △ (`name:`만 다룸) | Provider 측 group 등록 |
| `fx.Populate` | **누락** | 테스트에서 인스턴스 추출 |
| `fx.Private` | **누락** | Module 내부 캡슐화 |

특히 `group:` 태그는 동일 인터페이스의 여러 구현체를 슬라이스로 받는 패턴으로, 플러그인성 컴포넌트(여러 Notifier, 여러 외부 서비스 클라이언트 등)를 다루는 프로젝트에서 사실상 표준이다. 누락 시 실전 코드를 읽을 때 가장 큰 공백.

## 2. 목표

1. 블로그가 fx의 실전 활용 패턴을 폭넓게 커버하도록 보강
2. tutorials-go의 fx_test.go가 블로그의 모든 코드 인용을 검증하는 단일 출처가 되도록 유지

**비목표**:
- 외부 프로젝트 코드 직접 인용
- `fx.Group`의 Soft/Flatten 같은 변형 패턴
- 기존 §2.9 의존성 그래프 다이어그램 갱신
- 블로그의 다른 절 리팩토링

## 3. 변경 범위

### 3.1 tutorials-go (코드 — 먼저 작성)

**파일**: `project-layout/go-clean-arch-v2/fx_test.go`

기존 7개 테스트 함수와 같은 스타일로 3개 추가:

1. `TestFx_Group_ValueGroups` — Notifier 인터페이스 + Email/Slack/SMS 3개 구현체를 `group:"notifiers"`로 모음
2. `TestFx_Populate` — fx.Populate 단일·복수 추출 예제 (fx.Invoke 클로저 방식과 비교)
3. `TestFx_Private` — Module 내부 전용 의존성 캡슐화, 외부 추출 시 에러 검증

### 3.2 blog-v2 (글 — 코드 통과 후 작성)

**파일**: `docs/start/go-fx-의존성-주입/index.md`

신규 절 3개 (의미별 분산 배치):

| 절 | 위치 | 주제 |
|----|------|------|
| §2.7.2 | §2.7.1 다음 | `fx.Group`으로 동일 인터페이스 여러 구현 모으기 |
| §2.7.3 | §2.7.2 다음 | `fx.Private`로 Module 캡슐화 |
| §2.8.3 | §2.8.2 다음 | `fx.Populate`로 인스턴스 추출 |

기존 절 보강:
- §3 마무리 요약: 새 패턴 3줄 추가
- §4 참고: Value Groups 문서, fx.Private 도입 release, fx.Populate API 링크 추가

## 4. tutorials-go 코드 상세

### 4.1 TestFx_Group_ValueGroups

```go
type Notifier interface {
    Send(msg string) string
}

type EmailNotifier struct{}
func (e *EmailNotifier) Send(msg string) string { return "email:" + msg }

type SlackNotifier struct{}
func (s *SlackNotifier) Send(msg string) string { return "slack:" + msg }

type SMSNotifier struct{}
func (s *SMSNotifier) Send(msg string) string { return "sms:" + msg }

type NotifierService struct {
    notifiers []Notifier
}

type NotifierParams struct {
    fx.In
    Notifiers []Notifier `group:"notifiers"`
}

func NewNotifierService(p NotifierParams) *NotifierService {
    return &NotifierService{notifiers: p.Notifiers}
}

func TestFx_Group_ValueGroups(t *testing.T) {
    var svc *NotifierService
    app := fxtest.New(t,
        fx.Provide(
            fx.Annotate(func() Notifier { return &EmailNotifier{} },
                fx.ResultTags(`group:"notifiers"`)),
            fx.Annotate(func() Notifier { return &SlackNotifier{} },
                fx.ResultTags(`group:"notifiers"`)),
            fx.Annotate(func() Notifier { return &SMSNotifier{} },
                fx.ResultTags(`group:"notifiers"`)),
            NewNotifierService,
        ),
        fx.Populate(&svc),
    )
    defer app.RequireStop()
    app.RequireStart()

    assert.Len(t, svc.notifiers, 3)
    var results []string
    for _, n := range svc.notifiers {
        results = append(results, n.Send("hi"))
    }
    assert.Contains(t, results, "email:hi")
    assert.Contains(t, results, "slack:hi")
    assert.Contains(t, results, "sms:hi")
}
```

**검증 포인트**: `fx.ResultTags(\`group:"notifiers"\`)`로 등록 → `fx.In` 구조체의 슬라이스 필드 `group:"notifiers"`로 수신

### 4.2 TestFx_Populate

```go
func TestFx_Populate(t *testing.T) {
    // 단일 인스턴스 추출
    var svc1 *UserService
    app1 := fxtest.New(t,
        fx.Provide(NewLogger, NewMysqlUserRepo, NewUserService),
        fx.Populate(&svc1),
    )
    defer app1.RequireStop()
    app1.RequireStart()
    assert.NotNil(t, svc1)

    // 여러 인스턴스 한꺼번에 추출
    var (
        svc2    *UserService
        logger2 Logger
    )
    app2 := fxtest.New(t,
        fx.Provide(NewLogger, NewMysqlUserRepo, NewUserService),
        fx.Populate(&svc2, &logger2),
    )
    defer app2.RequireStop()
    app2.RequireStart()
    assert.NotNil(t, svc2)
    assert.NotNil(t, logger2)
}
```

**기존 함수와 타입 재사용**: `Logger`, `UserRepository`, `UserService` 등 fx_test.go에 이미 정의된 타입 그대로 사용.

### 4.3 TestFx_Private

```go
type internalDB struct{ name string }

func newInternalDB() *internalDB { return &internalDB{name: "private-db"} }

type ModuleService struct{ db *internalDB }

func newModuleService(db *internalDB) *ModuleService {
    return &ModuleService{db: db}
}

func TestFx_Private(t *testing.T) {
    PrivateModule := fx.Module("private",
        fx.Provide(
            newInternalDB,
            fx.Private,        // 같은 Provide 그룹의 Provide는 Module 내부 전용
        ),
        fx.Provide(newModuleService), // ModuleService는 외부 노출
    )

    var svc *ModuleService
    app := fxtest.New(t,
        PrivateModule,
        fx.Populate(&svc),
    )
    defer app.RequireStop()
    app.RequireStart()
    assert.Equal(t, "private-db", svc.db.name)

    // 외부에서 *internalDB 직접 추출 시도 → 에러
    var leaked *internalDB
    err := fx.New(
        PrivateModule,
        fx.Populate(&leaked),
    ).Err()
    assert.Error(t, err)
}
```

**검증 포인트**: 동일 Module 안에 두 개의 `fx.Provide()`를 선언, 첫 번째 그룹은 `fx.Private`로 외부 비공개, 두 번째 그룹은 외부 공개. 외부 추출 시 에러 발생을 명시적으로 검증.

## 5. 블로그 글 상세

### 5.1 §2.7.2 fx.Group으로 동일 인터페이스 여러 구현 모으기

구성:
1. **동기**: `name:` 태그는 동일 타입의 **개별** 식별. 여러 구현체를 슬라이스로 한꺼번에 받으려면 `group:` 태그 필요.
2. **시나리오**: Notifier 인터페이스 + Email/Slack/SMS
3. **코드**: `TestFx_Group_ValueGroups` 인용 (Provider 등록 + fx.In 슬라이스)
4. **실전 적용 메모**: "여러 외부 서비스 클라이언트를 단일 인터페이스 슬라이스로 모으는 패턴이 대표적" (한 줄)
5. **`name:` vs `group:` 비교 표**:

| 패턴 | 용도 | 수신 측 |
|------|------|---------|
| `name:"X"` | 동일 타입, **개별** 식별 | 단일 필드 |
| `group:"Y"` | 동일 타입(또는 인터페이스), **모음** | 슬라이스 필드 |

### 5.2 §2.7.3 fx.Private로 Module 캡슐화

구성:
1. **동기**: `fx.Module`로 도메인을 분리해도 모든 Provide는 기본적으로 전역에 노출. `fx.Private`로 Module 내부 전용 의존성 가능.
2. **시나리오**: `*internalDB`는 Module 내부 전용, `*ModuleService`만 외부 노출
3. **코드**: `TestFx_Private` 인용
4. **언제 쓰는가**: 인프라 의존성(DB 핸들, 외부 클라이언트)이 다른 Module과 우연히 같은 인스턴스를 공유하는 걸 막을 때
5. **버전 노트**: `fx.Private` 도입 버전 (작성 시 검증)

### 5.3 §2.8.3 fx.Populate로 인스턴스 추출

구성:
1. **동기**: 기존에는 `fx.Invoke(func(s *Svc) { svc = s })`로 캡처. `fx.Populate`로 더 간결.
2. **나란히 비교 코드**: Invoke 방식 vs Populate 방식
3. **여러 인스턴스 추출**: `fx.Populate(&svc, &logger)`
4. **선택 가이드**:
   - **Populate**: "인스턴스 꺼내기"가 목적
   - **Invoke**: 추출 후 함수 호출이나 추가 검증이 필요할 때

### 5.4 §3 마무리 (기존 절 수정)

기존 불릿 목록에 3줄 추가:
- **fx.Group**: 동일 인터페이스 여러 구현체를 슬라이스로 모아 주입
- **fx.Private**: Module 내부 의존성을 외부에 노출하지 않는 캡슐화
- **fx.Populate**: 테스트에서 fx 컨테이너 내부 인스턴스를 외부 변수로 추출

### 5.5 §4 참고 (기존 절 수정)

추가 링크:
- [Value Groups (fx Docs)](https://uber-go.github.io/fx/value-groups/)
- `fx.Private` 도입 release 태그 (작성 시 GitHub release 검색)
- [fx.Populate API](https://pkg.go.dev/go.uber.org/fx#Populate)

## 6. 검증

### 6.1 코드 검증

```bash
cd tutorials-go/project-layout/go-clean-arch-v2
go test -run "TestFx_Group_ValueGroups|TestFx_Populate|TestFx_Private" -v
go test ./...        # 회귀
go vet ./...         # 무경고
```

**합격 조건**:
- 신규 3개 테스트 PASS
- 기존 7개 fx_test 테스트 PASS 유지
- vet 무경고

### 6.2 사실 검증 (블로그 작성 전)

작성 직전에 다음을 직접 확인하고 본문에 정확한 값을 기재:
- `fx.Private` 도입 버전 (go.mod의 fx 버전 + GitHub releases 검색)
- `fx.Populate(targets ...interface{}) Option` 시그니처
- `group:` 태그 동작 (fx.In 구조체 외 인 라인 ParamTags 형식 가능 여부)

기존 §2.5/§2.6도 도입 버전 명시 패턴을 따르므로 일관성 유지.

### 6.3 블로그 형식 검증

```bash
file -I docs/start/go-fx-의존성-주입/index.md   # charset=utf-8
```

- Heading 번호 스타일 일관성 (`content-heading-style` 스킬 자동 활성화)
- 새 표는 §2.2 표 형식과 일치
- 신규 다이어그램 없음

## 7. 작업 순서

```
1. fx.Private 도입 버전 + Populate 시그니처 사실 검증
   ↓
2. tutorials-go fx_test.go에 3개 함수 추가
   ↓
3. go test 통과 + vet 무경고
   ↓
4. 블로그 §2.7.2/§2.7.3/§2.8.3 본문 작성 (코드는 통과한 테스트에서 인용)
   ↓
5. §3 마무리, §4 참고 보강
   ↓
6. 인코딩 + heading 스타일 검증
   ↓
7. 두 저장소 별개 feature 브랜치 + PR
```

## 8. Git 워크플로우

CLAUDE.md 규칙 준수:
- 브랜치
  - `tutorials-go`: `feat/fx-group-private-populate-examples`
  - `blog-v2`: `feat/fx-group-private-populate` (이슈 번호 있으면 `feat/#N-...`)
- main 직접 커밋 금지
- 코드 PR 먼저 merge → 블로그 PR (블로그가 참조하는 GitHub 코드가 main에 있어야 안전)
- PR 생성은 `gh pr create` + HEREDOC

## 9. 위험 및 완화

| 위험 | 완화 |
|------|------|
| `fx.Private` 도입 버전 정보 부정확 | 작성 직전 GitHub release 검색으로 확정 |
| `group:` 태그가 fx 버전에 따라 동작 차이 | go-clean-arch-v2의 go.mod fx 버전을 명시하고 그 버전에서 검증 |
| 블로그 코드와 GitHub 실제 코드 불일치 | 블로그 작성 전 코드 PR merge → 그 시점 main 코드를 인용 |
| 인코딩 깨짐 (한글 새 절 추가) | 추가 후 `file -I`로 charset=utf-8 확인 |

## 10. 범위 밖 (YAGNI)

- `fx.Group`의 Soft/Flatten 변형
- 외부 프로젝트 코드 직접 인용
- 의존성 그래프 다이어그램 갱신
- 블로그 다른 절 리팩토링
- fxevent 커스텀 로거 등 실전에서도 거의 안 쓰는 API
