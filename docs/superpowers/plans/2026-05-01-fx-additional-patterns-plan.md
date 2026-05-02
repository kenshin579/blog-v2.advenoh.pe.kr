# fx 누락 패턴 (group / Private / Populate) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** uber/fx의 `group:` 태그, `fx.Private`, `fx.Populate` 패턴을 tutorials-go에 테스트로 검증하고 블로그 draft에 새 절로 추가한다.

**Architecture:**
- 두 저장소 작업: `tutorials-go`(샘플 코드) + `blog-v2.advenoh.pe.kr`(블로그 글). 코드 먼저 통과시킨 후 블로그가 그 코드를 인용한다.
- tutorials-go: 기존 `project-layout/go-clean-arch-v2/fx_test.go`(308줄, 7개 테스트 함수)에 같은 스타일로 3개 함수 추가
- blog-v2: 기존 draft `docs/start/go-fx-의존성-주입/index.md`에 §2.7.2/§2.7.3/§2.8.3 신규 절 추가 + §3/§4 보강

**Tech Stack:**
- Go 1.26.0 (`tutorials-go/go.mod`)
- `go.uber.org/fx v1.24.0` (이미 설치됨, fx.Private v1.20+ 지원)
- `github.com/stretchr/testify/assert`, `go.uber.org/fx/fxtest`
- 블로그: Markdown + YAML frontmatter, mermaid 다이어그램

**Spec 참조:** `blog-v2.advenoh.pe.kr/docs/superpowers/specs/2026-05-01-fx-additional-patterns-design.md` (커밋 `1b08e33`)

---

## File Structure

### tutorials-go 저장소

| 파일 | 책임 | 변경 |
|------|------|------|
| `project-layout/go-clean-arch-v2/fx_test.go` | fx 패턴별 테스트 모음 | **수정**: 파일 끝에 3개 함수 추가 |

### blog-v2.advenoh.pe.kr 저장소 (현재 브랜치 `feat/fx-group-private-populate`)

| 파일 | 책임 | 변경 |
|------|------|------|
| `docs/start/go-fx-의존성-주입/index.md` | uber/fx 블로그 draft | **수정**: §2.7.2, §2.7.3, §2.8.3 신규 + §3, §4 보강 |
| `docs/superpowers/plans/2026-05-01-fx-additional-patterns-plan.md` | 본 plan 문서 | **이 문서** (추가 후 커밋) |

### 작업 순서 (의존성)

```
Task 0 (사실 검증)
  ↓
Task 1 → Task 2 → Task 3 (tutorials-go 코드, 직렬)
  ↓
[tutorials-go PR 생성·merge — plan 외부 단계]
  ↓
Task 4 → Task 5 → Task 6 → Task 7 (blog-v2 본문, 직렬)
  ↓
Task 8 (blog-v2 PR 준비)
```

> **중요**: Task 4 시작 전 tutorials-go 코드가 main에 merge되어야 함 (블로그가 GitHub master 링크를 인용). 단, 로컬 검증/draft 수준에서는 Task 1-3 완료 후 곧바로 Task 4-7로 진행해도 무방하다.

---

## Task 0: 사실 검증 및 tutorials-go 브랜치 생성

**Files:**
- Read: `/Users/user/src/workspace_blogv2/tutorials-go/go.mod`
- Read: `/Users/user/src/workspace_blogv2/tutorials-go/project-layout/go-clean-arch-v2/fx_test.go`

- [ ] **Step 1: tutorials-go fx 버전 확인**

Run:
```bash
cd /Users/user/src/workspace_blogv2/tutorials-go
grep "go.uber.org/fx" go.mod
```
Expected: `go.uber.org/fx v1.24.0` (또는 v1.20.0 이상). fx.Private은 v1.20+, fx.Populate는 v1.4+ 지원.

- [ ] **Step 2: fx 라이브러리에서 Private/Populate 시그니처 확인**

Run:
```bash
cd /Users/user/src/workspace_blogv2/tutorials-go
go doc go.uber.org/fx.Private | head -20
go doc go.uber.org/fx.Populate | head -10
```
Expected:
- `fx.Private`: `var Private = privateOption{}` 같은 sentinel option (`fx.Provide()` 안에 다른 Provide와 함께 넣으면 그 그룹 전체가 Module-private)
- `fx.Populate`: `func Populate(targets ...interface{}) Option`

이 결과를 메모해두고 Task 5 블로그 본문의 "버전 노트", "시그니처" 부분에 정확히 반영한다.

- [ ] **Step 3: tutorials-go 현재 git 상태 확인**

Run:
```bash
cd /Users/user/src/workspace_blogv2/tutorials-go
git status --short
git branch --show-current
```
Expected: working tree clean, 현재 `master` 또는 `main` 브랜치. 만약 dirty라면 사용자에게 보고하고 멈춤.

- [ ] **Step 4: tutorials-go feature 브랜치 생성**

Run:
```bash
cd /Users/user/src/workspace_blogv2/tutorials-go
git fetch origin
# default branch가 master/main 어느 쪽인지 확인 후 사용
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')
echo "Default branch: $DEFAULT_BRANCH"
git checkout $DEFAULT_BRANCH
git pull origin $DEFAULT_BRANCH
git checkout -b feat/fx-group-private-populate-examples
```
Expected: `Switched to a new branch 'feat/fx-group-private-populate-examples'`

- [ ] **Step 5: 기준 테스트 통과 확인 (회귀 base line)**

Run:
```bash
cd /Users/user/src/workspace_blogv2/tutorials-go/project-layout/go-clean-arch-v2
go test -v -run "TestFx_" ./...
```
Expected: 7개 테스트(`TestFx_Provide_Invoke`, `TestFx_Supply`, `TestFx_Module`, `TestFx_Decorate`, `TestFx_Annotate_Named`, `TestFx_Replace_Mock`, `TestFx_Lifecycle`) 모두 PASS.

만약 실패하면 사용자에게 보고하고 멈춤 — 이 plan은 이미 통과하는 base에 함수를 추가하는 것이므로, base 실패 시 진행 불가.

---

## Task 1: TestFx_Group_ValueGroups 추가

**Files:**
- Modify: `/Users/user/src/workspace_blogv2/tutorials-go/project-layout/go-clean-arch-v2/fx_test.go` (파일 끝, 308줄 다음에 추가)

**목적:** `fx.ResultTags(\`group:"notifiers"\`)`로 등록한 동일 인터페이스 여러 구현체를 `fx.In` 슬라이스 필드로 수신하는 패턴을 검증한다.

- [ ] **Step 1: fx_test.go 파일 끝에 도메인 타입 + 테스트 함수 추가**

Edit: 파일 끝(308줄 이후)에 다음 코드 블록을 추가한다:

```go

// --- fx.Group: 동일 인터페이스 여러 구현체 모으기 ---

type Notifier interface {
	Send(msg string) string
}

type EmailNotifier struct{}

func (e *EmailNotifier) Send(msg string) string { return "email:" + msg }

type SlackNotifier struct{}

func (s *SlackNotifier) Send(msg string) string { return "slack:" + msg }

type SMSNotifier struct{}

func (s *SMSNotifier) Send(msg string) string { return "sms:" + msg }

// fx.In의 group 태그로 같은 그룹의 모든 구현체를 슬라이스로 수신
type NotifierParams struct {
	fx.In
	Notifiers []Notifier `group:"notifiers"`
}

type NotifierService struct {
	notifiers []Notifier
}

func NewNotifierService(p NotifierParams) *NotifierService {
	return &NotifierService{notifiers: p.Notifiers}
}

func TestFx_Group_ValueGroups(t *testing.T) {
	var svc *NotifierService

	app := fxtest.New(t,
		fx.Provide(
			// fx.ResultTags로 같은 group에 여러 구현체 등록
			fx.Annotate(func() Notifier { return &EmailNotifier{} },
				fx.ResultTags(`group:"notifiers"`)),
			fx.Annotate(func() Notifier { return &SlackNotifier{} },
				fx.ResultTags(`group:"notifiers"`)),
			fx.Annotate(func() Notifier { return &SMSNotifier{} },
				fx.ResultTags(`group:"notifiers"`)),
			NewNotifierService,
		),
		fx.Invoke(func(s *NotifierService) {
			svc = s
		}),
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

> **참고**: 이번 task에서는 `fx.Populate(&svc)` 대신 `fx.Invoke(func(s *NotifierService) { svc = s })`를 사용한다. fx.Populate는 Task 2에서 도입할 예정이므로, 여기서는 기존 fx_test.go의 일관된 스타일(클로저 캡처)을 따른다.

- [ ] **Step 2: 테스트 실행하여 PASS 확인**

Run:
```bash
cd /Users/user/src/workspace_blogv2/tutorials-go/project-layout/go-clean-arch-v2
go test -v -run "TestFx_Group_ValueGroups" ./...
```
Expected: `--- PASS: TestFx_Group_ValueGroups`

만약 실패하면:
- "constructor returns multiple results, but only one tag was provided" → `fx.ResultTags`의 backtick 문자열 형태 확인
- "missing dependencies for function" → `fx.In` 구조체 필드 태그가 정확한지(`group:"notifiers"`) 확인
- "received nil" → `fx.Invoke`의 클로저 변수 캡처 확인

- [ ] **Step 3: 회귀 테스트 실행 (기존 7개 + 신규 1개 PASS 확인)**

Run:
```bash
cd /Users/user/src/workspace_blogv2/tutorials-go/project-layout/go-clean-arch-v2
go test -v -run "TestFx_" ./...
```
Expected: 8개 모두 PASS

- [ ] **Step 4: gofmt + vet 무경고 확인**

Run:
```bash
cd /Users/user/src/workspace_blogv2/tutorials-go/project-layout/go-clean-arch-v2
gofmt -l fx_test.go
go vet ./...
```
Expected: gofmt 출력 없음(차이 없음 의미), vet 무경고

- [ ] **Step 5: 커밋**

Run:
```bash
cd /Users/user/src/workspace_blogv2/tutorials-go
git add project-layout/go-clean-arch-v2/fx_test.go
git commit -m "$(cat <<'EOF'
test: fx Group(value groups) 패턴 테스트 추가

* TestFx_Group_ValueGroups: Notifier 인터페이스 + Email/Slack/SMS 3구현체
* fx.ResultTags의 group: 태그로 등록 → fx.In 슬라이스로 수신
* 동일 인터페이스 여러 구현을 한꺼번에 주입받는 실전 패턴

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git status
```
Expected: 1 file changed, 커밋 후 working tree clean

---

## Task 2: TestFx_Populate 추가

**Files:**
- Modify: `/Users/user/src/workspace_blogv2/tutorials-go/project-layout/go-clean-arch-v2/fx_test.go` (파일 끝에 추가)

**목적:** `fx.Populate`가 단일 인스턴스 추출 / 여러 인스턴스 일괄 추출 두 형태로 동작함을 검증한다. Task 1에서 사용한 기존 타입(`UserService`, `Logger`)을 재사용.

- [ ] **Step 1: fx_test.go 파일 끝에 fx.Populate 테스트 함수 추가**

Edit: 파일 끝(Task 1에서 추가한 `TestFx_Group_ValueGroups` 다음)에 다음 코드 블록을 추가한다:

```go

// --- fx.Populate: fx 컨테이너에서 인스턴스를 외부 변수로 추출 ---

func TestFx_Populate(t *testing.T) {
	// 형태 1: 단일 인스턴스 추출
	var svc1 *UserService
	app1 := fxtest.New(t,
		fx.Provide(NewLogger, NewMysqlUserRepo, NewUserService),
		fx.Populate(&svc1),
	)
	defer app1.RequireStop()
	app1.RequireStart()

	assert.NotNil(t, svc1)
	assert.Equal(t, "user-1", svc1.repo.FindByID(1))

	// 형태 2: 여러 인스턴스를 한꺼번에 추출
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

> **참고**: `Logger`, `UserRepository`, `UserService`, `NewLogger`, `NewMysqlUserRepo`, `NewUserService`는 fx_test.go 15~47줄에 이미 정의된 타입/생성자이다. 그대로 재사용.

- [ ] **Step 2: 테스트 실행하여 PASS 확인**

Run:
```bash
cd /Users/user/src/workspace_blogv2/tutorials-go/project-layout/go-clean-arch-v2
go test -v -run "TestFx_Populate" ./...
```
Expected: `--- PASS: TestFx_Populate`

만약 실패하면:
- "fx.Populate: target must be a non-nil pointer" → `&svc1` 형태(주소) 확인
- "missing dependencies" → `fx.Provide`에 `NewLogger, NewMysqlUserRepo, NewUserService` 모두 포함되었는지 확인
- import 누락 시 `fx.Populate` 시그니처를 `go doc go.uber.org/fx.Populate`로 재확인

- [ ] **Step 3: 회귀 테스트 실행 (기존 8개 + 신규 1개 PASS 확인)**

Run:
```bash
cd /Users/user/src/workspace_blogv2/tutorials-go/project-layout/go-clean-arch-v2
go test -v -run "TestFx_" ./...
```
Expected: 9개 모두 PASS

- [ ] **Step 4: gofmt + vet 무경고 확인**

Run:
```bash
cd /Users/user/src/workspace_blogv2/tutorials-go/project-layout/go-clean-arch-v2
gofmt -l fx_test.go
go vet ./...
```
Expected: 출력 없음

- [ ] **Step 5: 커밋**

Run:
```bash
cd /Users/user/src/workspace_blogv2/tutorials-go
git add project-layout/go-clean-arch-v2/fx_test.go
git commit -m "$(cat <<'EOF'
test: fx.Populate 패턴 테스트 추가

* TestFx_Populate: 단일/복수 인스턴스 추출 두 형태 검증
* 기존 UserService/Logger 타입 재사용
* fx.Invoke 클로저 캡처 방식과 비교 가능한 형태

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git status
```
Expected: 1 file changed, working tree clean

---

## Task 3: TestFx_Private 추가

**Files:**
- Modify: `/Users/user/src/workspace_blogv2/tutorials-go/project-layout/go-clean-arch-v2/fx_test.go` (파일 끝에 추가)

**목적:** `fx.Private`로 등록한 의존성이 동일 Module 외부에 노출되지 않음을 검증한다. 정상 사용(외부에서 Module이 노출하는 인스턴스만 추출) + 비정상 사용(private 의존성 직접 추출 시도 → 에러) 두 케이스를 모두 검증.

- [ ] **Step 1: fx_test.go 파일 끝에 fx.Private 테스트 함수 추가**

Edit: 파일 끝(Task 2에서 추가한 `TestFx_Populate` 다음)에 다음 코드 블록을 추가한다:

```go

// --- fx.Private: Module 내부 전용 의존성 캡슐화 ---

type internalDB struct {
	name string
}

func newInternalDB() *internalDB {
	return &internalDB{name: "private-db"}
}

type ModuleService struct {
	db *internalDB
}

func newModuleService(db *internalDB) *ModuleService {
	return &ModuleService{db: db}
}

func TestFx_Private(t *testing.T) {
	// PrivateModule:
	//   - 첫 번째 fx.Provide()에 fx.Private을 마지막 인자로 넣어 *internalDB를 Module 내부 전용으로
	//   - 두 번째 fx.Provide()는 일반 노출. *ModuleService는 외부에서 추출 가능
	PrivateModule := fx.Module("private",
		fx.Provide(
			newInternalDB,
			fx.Private,
		),
		fx.Provide(newModuleService),
	)

	// 정상: ModuleService는 외부 노출 → 추출 성공
	var svc *ModuleService
	app := fxtest.New(t,
		PrivateModule,
		fx.Populate(&svc),
	)
	defer app.RequireStop()
	app.RequireStart()
	assert.Equal(t, "private-db", svc.db.name)

	// 비정상: *internalDB는 Module 내부 전용 → 외부 추출 시도 시 fx.New가 에러 반환
	var leaked *internalDB
	leakApp := fx.New(
		PrivateModule,
		fx.Populate(&leaked),
		fx.NopLogger, // 에러를 stdout으로 출력하지 않음
	)
	err := leakApp.Err()
	assert.Error(t, err, "internalDB는 Module 외부에서 보이지 않아야 한다")
	assert.Contains(t, err.Error(), "*main.internalDB",
		"에러 메시지에 외부 추출이 막힌 타입이 명시되어야 한다")
}
```

> **참고**:
> - `fx.Private`은 같은 `fx.Provide(...)` 호출 안에 다른 생성자와 함께 두면 그 그룹 전체를 Module-private으로 만든다(fx v1.20+).
> - 비정상 케이스에서 `fx.NopLogger`를 추가하여 테스트 출력에 fx 에러 메시지가 노이즈로 섞이지 않게 한다.
> - 비정상 케이스는 `fxtest.New` 대신 `fx.New`를 사용해야 한다 — `fxtest.New`는 시작 실패 시 `t.Fatal`을 호출하므로 에러 검증이 불가능하다.

- [ ] **Step 2: 테스트 실행하여 PASS 확인**

Run:
```bash
cd /Users/user/src/workspace_blogv2/tutorials-go/project-layout/go-clean-arch-v2
go test -v -run "TestFx_Private" ./...
```
Expected: `--- PASS: TestFx_Private`

만약 실패하면:
- 정상 케이스가 실패 (`*internalDB` 외부 노출됨) → `fx.Private`이 첫 번째 `fx.Provide()` 호출 안 첫 인자로 들어갔는지 확인
- 비정상 케이스에서 `assert.Error`가 fail (에러 발생 안 함) → fx 버전이 v1.20+ 인지 재확인 (`grep "go.uber.org/fx" /Users/user/src/workspace_blogv2/tutorials-go/go.mod`)
- "fx.Private undefined" 컴파일 에러 → fx 버전 미달, `go.mod`을 v1.20+ 로 업데이트 필요

- [ ] **Step 3: 회귀 테스트 실행 (기존 9개 + 신규 1개 PASS 확인)**

Run:
```bash
cd /Users/user/src/workspace_blogv2/tutorials-go/project-layout/go-clean-arch-v2
go test -v -run "TestFx_" ./...
```
Expected: 10개 모두 PASS

- [ ] **Step 4: gofmt + vet 무경고 확인**

Run:
```bash
cd /Users/user/src/workspace_blogv2/tutorials-go/project-layout/go-clean-arch-v2
gofmt -l fx_test.go
go vet ./...
```
Expected: 출력 없음

- [ ] **Step 5: 커밋**

Run:
```bash
cd /Users/user/src/workspace_blogv2/tutorials-go
git add project-layout/go-clean-arch-v2/fx_test.go
git commit -m "$(cat <<'EOF'
test: fx.Private 패턴 테스트 추가

* TestFx_Private: Module 내부 전용 의존성 캡슐화 검증
* 정상 케이스: 외부 노출되는 ModuleService 추출 성공
* 비정상 케이스: private *internalDB 외부 추출 시 fx.New가 에러 반환

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git status
```
Expected: 1 file changed, working tree clean

- [ ] **Step 6: tutorials-go 전체 회귀 테스트 (선택)**

Run:
```bash
cd /Users/user/src/workspace_blogv2/tutorials-go
go test ./project-layout/go-clean-arch-v2/...
```
Expected: 모든 테스트 PASS. 다른 패키지 테스트는 이번 변경과 무관하지만 영향이 없음을 확인.

- [ ] **Step 7: tutorials-go PR 생성 (수동/외부 단계)**

이 plan에서는 PR 생성을 자동화하지 않는다. 사용자에게 다음을 안내:

```
tutorials-go 작업 완료. PR 생성 명령:

cd /Users/user/src/workspace_blogv2/tutorials-go
git push -u origin feat/fx-group-private-populate-examples
gh pr create --title "test: fx Group/Private/Populate 패턴 예제 추가" --body "$(cat <<'EOF'
## Summary
- fx.Group(value groups) 패턴 (TestFx_Group_ValueGroups)
- fx.Populate 단일/복수 추출 (TestFx_Populate)
- fx.Private Module 캡슐화 (TestFx_Private)

블로그 글(`blog-v2.advenoh.pe.kr`의 `go-fx-의존성-주입`)에서 인용할 샘플 코드.

## Test plan
- [ ] go test -v -run "TestFx_" ./project-layout/go-clean-arch-v2/...
- [ ] go vet ./...
EOF
)"

PR merge 후 main의 commit hash를 메모. 블로그 본문에서 그 시점 코드를 인용한다.
```

---

## Task 4: 블로그 §2.7.2 fx.Group 절 추가

**Files:**
- Modify: `/Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr/docs/start/go-fx-의존성-주입/index.md`
- 작업 위치: 기존 §2.7.1 끝(현재 335줄, "## 2.8 테스트에서의 fx" 직전) 다음에 §2.7.2 신규 절 삽입

> **사전 확인**: blog-v2 git 브랜치가 `feat/fx-group-private-populate`인지 확인 (이미 spec 커밋된 브랜치).
>
> ```bash
> cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
> git branch --show-current
> ```
> Expected: `feat/fx-group-private-populate`

- [ ] **Step 1: index.md에서 §2.7.1과 §2.8 사이의 정확한 line number 확인**

Run:
```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
grep -n "^## 2\.\|^### 2\." docs/start/go-fx-의존성-주입/index.md
```
Expected 출력 형식 (line number는 글 작성 시점에 다를 수 있음):
```
... 
286:## 2.7 고급 패턴
288:### 2.7.1 fx.Annotate + Named 의존성
337:## 2.8 테스트에서의 fx
...
```

§2.7.1 절의 마지막 줄(예: 335줄, `## 2.8` 바로 위 빈 줄)을 메모.

- [ ] **Step 2: §2.7.2 신규 절 삽입**

§2.7.1의 마지막 줄 다음에 다음 마크다운을 삽입한다(Edit 도구 사용):

````markdown
### 2.7.2 fx.Group으로 동일 인터페이스 여러 구현체 모으기

`name:` 태그는 동일 타입을 **개별** 식별할 때 쓴다. 하지만 동일 인터페이스의 여러 구현체를 한꺼번에 주입받고 싶다면 — 예를 들어 모든 Notifier에게 알림을 발송하는 경우 — `name:`으로는 부족하다. 각 구현체에 다른 이름을 붙이고 수신 측에서 일일이 받아야 하기 때문이다.

`group:` 태그는 이 문제를 해결한다. 같은 그룹에 등록된 구현체들이 슬라이스로 한꺼번에 주입된다.

```go
// fx_test.go
type Notifier interface {
    Send(msg string) string
}

type EmailNotifier struct{}
func (e *EmailNotifier) Send(msg string) string { return "email:" + msg }

type SlackNotifier struct{}
func (s *SlackNotifier) Send(msg string) string { return "slack:" + msg }

type SMSNotifier struct{}
func (s *SMSNotifier) Send(msg string) string { return "sms:" + msg }
```

`fx.Annotate()`와 `fx.ResultTags()`로 각 생성자를 같은 그룹에 등록한다.

```go
// fx_test.go
fx.Provide(
    fx.Annotate(func() Notifier { return &EmailNotifier{} },
        fx.ResultTags(`group:"notifiers"`)),
    fx.Annotate(func() Notifier { return &SlackNotifier{} },
        fx.ResultTags(`group:"notifiers"`)),
    fx.Annotate(func() Notifier { return &SMSNotifier{} },
        fx.ResultTags(`group:"notifiers"`)),
    NewNotifierService,
)
```

수신 측은 `fx.In` 구조체에 `group:` 태그가 붙은 슬라이스 필드로 받는다.

```go
// fx_test.go
type NotifierParams struct {
    fx.In
    Notifiers []Notifier `group:"notifiers"`
}

type NotifierService struct {
    notifiers []Notifier
}

func NewNotifierService(p NotifierParams) *NotifierService {
    return &NotifierService{notifiers: p.Notifiers}
}
```

여러 외부 서비스 클라이언트를 단일 인터페이스 슬라이스로 모으는 패턴이 대표적인 실전 활용 예다. 새 구현체가 추가되어도 수신 측 코드는 변경되지 않는다.

`name:` vs `group:` 차이를 정리하면:

| 패턴 | 용도 | 수신 측 |
|------|------|---------|
| `name:"X"` | 동일 타입을 **개별** 식별 | 단일 필드 |
| `group:"Y"` | 동일 타입(또는 인터페이스)을 **모음** | 슬라이스 필드 |

````

> **주의**: 마지막 줄에 빈 줄을 하나 두어 다음 절(§2.7.3 또는 기존 §2.8)과 사이에 빈 줄이 1개만 있도록 한다.

- [ ] **Step 3: heading 번호 일관성 확인**

Run:
```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
grep -nE "^### 2\.7" docs/start/go-fx-의존성-주입/index.md
```
Expected:
```
288:### 2.7.1 fx.Annotate + Named 의존성
337:### 2.7.2 fx.Group으로 동일 인터페이스 여러 구현체 모으기
```
(line number는 다를 수 있음)

- [ ] **Step 4: 인코딩 검증**

Run:
```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
file -I docs/start/go-fx-의존성-주입/index.md
```
Expected: `text/plain; charset=utf-8`

만약 `charset=binary`가 나오면 Edit이 인코딩을 깨뜨린 것 — 사용자에게 보고하고 멈춤.

- [ ] **Step 5: 커밋**

Run:
```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
git add docs/start/go-fx-의존성-주입/index.md
git commit -m "$(cat <<'EOF'
docs(fx): §2.7.2 fx.Group으로 동일 인터페이스 여러 구현 모으기 추가

* Notifier(Email/Slack/SMS) 시나리오로 group: 태그 패턴 설명
* fx.ResultTags + fx.In 슬라이스 필드 매칭 코드
* name: vs group: 비교 표

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git status
```
Expected: 1 file changed, working tree clean

---

## Task 5: 블로그 §2.7.3 fx.Private 절 추가

**Files:**
- Modify: `/Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr/docs/start/go-fx-의존성-주입/index.md`
- 작업 위치: Task 4에서 추가한 §2.7.2 끝 다음

- [ ] **Step 1: §2.7.3 삽입 위치 확인**

Run:
```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
grep -nE "^### 2\.7|^## 2\.8" docs/start/go-fx-의존성-주입/index.md
```
Expected:
```
288:### 2.7.1 ...
337:### 2.7.2 ...
NNN:## 2.8 ...
```

§2.7.2의 마지막 줄과 `## 2.8` 사이에 §2.7.3을 삽입한다.

- [ ] **Step 2: Task 0 Step 2에서 확인한 fx.Private 도입 버전을 메모**

Task 0 Step 2의 `go doc` 결과에서 fx.Private 도입 버전을 확인했다. 일반적으로 fx.Private은 v1.20.0에서 도입되었다. 정확한 버전 번호를 다음 본문의 "버전 노트"에 반영한다.

만약 Task 0에서 명확한 버전 정보를 못 얻었다면, https://github.com/uber-go/fx/releases 페이지를 직접 확인 (또는 `git log --all --grep="Private"`로 fx 저장소 검색).

- [ ] **Step 3: §2.7.3 신규 절 삽입**

§2.7.2의 마지막 줄 다음에 다음 마크다운을 삽입한다:

````markdown
### 2.7.3 fx.Private로 Module 캡슐화

`fx.Module()`로 도메인을 분리해도 모든 `fx.Provide()`는 기본적으로 전역에 노출된다. Module 내부 전용으로만 쓰고 싶은 의존성은 `fx.Private`으로 막을 수 있다. 데이터베이스 핸들이나 외부 API 클라이언트 같은 인프라 의존성을 다른 Module이 우연히 같은 인스턴스를 공유하는 걸 막을 때 유용하다.

`fx.Private`은 같은 `fx.Provide()` 호출 안에 다른 생성자와 함께 넣으면 그 그룹 전체를 Module-private으로 만든다.

```go
// fx_test.go
type internalDB struct {
    name string
}

func newInternalDB() *internalDB {
    return &internalDB{name: "private-db"}
}

type ModuleService struct {
    db *internalDB
}

func newModuleService(db *internalDB) *ModuleService {
    return &ModuleService{db: db}
}

PrivateModule := fx.Module("private",
    fx.Provide(
        newInternalDB,
        fx.Private,        // 같은 fx.Provide() 그룹 전체를 Module 내부 전용으로
    ),
    fx.Provide(newModuleService), // ModuleService는 외부 노출
)
```

`*internalDB`는 `PrivateModule` 안의 `newModuleService`만 주입받을 수 있다. Module 외부에서 `*internalDB`를 직접 요청하면 fx는 의존성 그래프 구성 시점에 에러를 반환한다(`fx.Populate`는 §2.8.3에서 자세히 다룬다).

```go
// fx_test.go
// 외부에서 *internalDB 직접 추출 시도 → fx.New가 에러 반환
var leaked *internalDB
leakApp := fx.New(
    PrivateModule,
    fx.Populate(&leaked),
    fx.NopLogger,
)
// leakApp.Err() != nil
```

> **fx.Private은 v1.20.0+부터 사용 가능**하다. 이전 버전에서는 `fx.Module`로 격리하더라도 모든 Provide가 전역 그래프에 등록된다.

````

- [ ] **Step 4: 인코딩 검증**

Run:
```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
file -I docs/start/go-fx-의존성-주입/index.md
```
Expected: `text/plain; charset=utf-8`

- [ ] **Step 5: heading 번호 확인**

Run:
```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
grep -nE "^### 2\.7" docs/start/go-fx-의존성-주입/index.md
```
Expected:
```
288:### 2.7.1 ...
337:### 2.7.2 ...
NNN:### 2.7.3 fx.Private로 Module 캡슐화
```

- [ ] **Step 6: 커밋**

Run:
```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
git add docs/start/go-fx-의존성-주입/index.md
git commit -m "$(cat <<'EOF'
docs(fx): §2.7.3 fx.Private로 Module 캡슐화 추가

* Module 내부 전용 의존성 캡슐화 패턴 설명
* 정상/비정상 케이스 코드 (fx.Populate로 외부 추출 시도 → 에러)
* 도입 버전(v1.20.0+) 노트

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git status
```
Expected: 1 file changed, working tree clean

---

## Task 6: 블로그 §2.8.3 fx.Populate 절 추가

**Files:**
- Modify: `/Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr/docs/start/go-fx-의존성-주입/index.md`
- 작업 위치: 기존 §2.8.2 fx.Replace 끝 다음, 기존 §2.9 의존성 그래프 시각화 직전

- [ ] **Step 1: §2.8.3 삽입 위치 확인**

Run:
```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
grep -nE "^### 2\.8|^## 2\.9" docs/start/go-fx-의존성-주입/index.md
```
Expected:
```
NNN:### 2.8.1 fxtest.New
NNN:### 2.8.2 fx.Replace로 Mock 주입
NNN:## 2.9 의존성 그래프 시각화
```

§2.8.2 마지막 줄과 `## 2.9` 사이에 §2.8.3을 삽입.

- [ ] **Step 2: §2.8.3 신규 절 삽입**

다음 마크다운을 삽입한다:

````markdown
### 2.8.3 fx.Populate로 인스턴스 추출

지금까지는 `fx.Invoke(func(s *Svc) { svc = s })` 형태로 외부 변수에 인스턴스를 캡처했다. `fx.Populate`는 같은 일을 더 간결하게 한다.

```go
// fx_test.go
// 방식 1: fx.Invoke 클로저로 캡처 (앞서 사용한 방식)
var svc *UserService
app := fxtest.New(t,
    fx.Provide(NewLogger, NewMysqlUserRepo, NewUserService),
    fx.Invoke(func(s *UserService) {
        svc = s
    }),
)

// 방식 2: fx.Populate로 직접 추출
var svc2 *UserService
app2 := fxtest.New(t,
    fx.Provide(NewLogger, NewMysqlUserRepo, NewUserService),
    fx.Populate(&svc2),
)
```

여러 인스턴스를 한꺼번에 추출할 때 차이가 더 두드러진다.

```go
// fx_test.go
var (
    svc    *UserService
    logger Logger
)
app := fxtest.New(t,
    fx.Provide(NewLogger, NewMysqlUserRepo, NewUserService),
    fx.Populate(&svc, &logger),
)
```

선택 가이드는 단순하다.

| 상황 | 권장 |
|------|------|
| 인스턴스를 외부 변수로 꺼내는 게 목적 | `fx.Populate` |
| 추출 후 함수 호출이나 추가 검증을 같은 시점에 수행 | `fx.Invoke` |

````

- [ ] **Step 3: 인코딩 + heading 검증**

Run:
```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
file -I docs/start/go-fx-의존성-주입/index.md
grep -nE "^### 2\.8" docs/start/go-fx-의존성-주입/index.md
```
Expected:
- `charset=utf-8`
- 2.8.1, 2.8.2, 2.8.3 모두 표시

- [ ] **Step 4: 커밋**

Run:
```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
git add docs/start/go-fx-의존성-주입/index.md
git commit -m "$(cat <<'EOF'
docs(fx): §2.8.3 fx.Populate로 인스턴스 추출 추가

* fx.Invoke 클로저 방식과 나란히 비교
* 단일/복수 추출 코드 예제
* Populate vs Invoke 선택 가이드

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git status
```
Expected: 1 file changed, working tree clean

---

## Task 7: 블로그 §3 마무리 + §4 참고 보강

**Files:**
- Modify: `/Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr/docs/start/go-fx-의존성-주입/index.md`

**목적:** 신규 절 3개를 §3 요약 불릿과 §4 참고 링크에도 반영해 글 전체 일관성을 유지한다.

- [ ] **Step 1: 기존 §3 마무리 불릿 위치 찾기**

Run:
```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
grep -nE "^- \*\*fx\.|^# 3\.|^## 3\." docs/start/go-fx-의존성-주입/index.md
```

기존 마무리 불릿(예: `- **테스트**: fxtest.New + fx.Replace로 Mock 주입`) 다음 줄을 찾는다.

- [ ] **Step 2: §3 불릿 3개 추가**

Edit으로 다음 변경을 적용한다:

**찾을 문자열** (현재 §3 마무리 불릿 마지막 줄):
```
- **테스트**: fxtest.New + fx.Replace로 Mock 주입
```

**바꿀 문자열**:
```
- **테스트**: fxtest.New + fx.Replace로 Mock 주입
- **fx.Group**: 동일 인터페이스 여러 구현체를 슬라이스로 모아 주입
- **fx.Private**: Module 내부 의존성을 외부에 노출하지 않는 캡슐화
- **fx.Populate**: 테스트에서 fx 컨테이너 내부 인스턴스를 외부 변수로 추출
```

> **주의**: 위 "찾을 문자열"이 정확히 일치해야 Edit이 동작한다. 일치하지 않으면 Read로 실제 텍스트를 확인하고 그대로 사용.

- [ ] **Step 3: §4 참고 링크 위치 찾기**

Run:
```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
grep -nE "^# 4\.|^- \[fx\." docs/start/go-fx-의존성-주입/index.md
```

기존 §4의 마지막 링크 줄(`- [Go Dependency Injection - uber/fx](...)`)을 찾는다.

- [ ] **Step 4: §4 참고 링크 3개 추가**

Edit으로 §4의 마지막 링크 줄 다음에 다음 줄을 삽입:

**찾을 문자열**:
```
- [Go Dependency Injection - uber/fx](https://pkg.go.dev/go.uber.org/fx)
```

**바꿀 문자열**:
```
- [Go Dependency Injection - uber/fx](https://pkg.go.dev/go.uber.org/fx)
- [Value Groups (fx Docs)](https://uber-go.github.io/fx/value-groups/)
- [fx.Populate API](https://pkg.go.dev/go.uber.org/fx#Populate)
- [fx.Private 도입 (v1.20)](https://github.com/uber-go/fx/releases/tag/v1.20.0)
```

> **주의**: 위 fx.Private 도입 버전(`v1.20.0`)은 Task 0 Step 2에서 확인한 정확한 버전 태그로 교체. 만약 다른 버전이라면 그 버전의 GitHub release URL로 교체.

- [ ] **Step 5: frontmatter tags 보강 (선택)**

기존 frontmatter tags 목록(line 6~15)에 새 패턴 키워드를 추가하면 검색성이 좋아진다.

Run:
```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
sed -n '1,16p' docs/start/go-fx-의존성-주입/index.md
```

만약 적절히 들어갈 위치가 있다면(예: `- fxtest` 다음), 다음 항목 추가:
- `fx.Group`
- `fx.Private`
- `fx.Populate`

생략 가능 — 본문 내용이 우선이다.

- [ ] **Step 6: 인코딩 검증**

Run:
```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
file -I docs/start/go-fx-의존성-주입/index.md
```
Expected: `charset=utf-8`

- [ ] **Step 7: 글 전체 미리보기 (heading 트리)**

Run:
```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
grep -nE "^#{1,4} " docs/start/go-fx-의존성-주입/index.md
```

§2.7.1 / §2.7.2 / §2.7.3 / §2.8.1 / §2.8.2 / §2.8.3가 순서대로 표시되는지 확인. 누락되거나 번호가 어긋나면 수정.

- [ ] **Step 8: 커밋**

Run:
```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
git add docs/start/go-fx-의존성-주입/index.md
git commit -m "$(cat <<'EOF'
docs(fx): §3 요약·§4 참고 링크에 신규 패턴 반영

* §3 마무리에 fx.Group/Private/Populate 요약 불릿 추가
* §4 참고에 Value Groups 문서, fx.Populate API, fx.Private release 링크 추가

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git status
```
Expected: 1 file changed, working tree clean

---

## Task 8: blog-v2 PR 준비 (수동/외부 단계)

**Files:**
- 변경 없음 (이미 커밋된 변경을 push + PR)

- [ ] **Step 1: 브랜치의 모든 커밋 검토**

Run:
```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
git log --oneline main..feat/fx-group-private-populate
```
Expected: 최소 5개 커밋
- `1b08e33 docs: fx 누락 패턴 ... spec 작성` (Task 사전, 이미 커밋됨)
- (Task 4 §2.7.2 fx.Group 커밋)
- (Task 5 §2.7.3 fx.Private 커밋)
- (Task 6 §2.8.3 fx.Populate 커밋)
- (Task 7 §3/§4 보강 커밋)

기대치보다 적거나 많으면 git log로 상황 확인.

- [ ] **Step 2: 글 인코딩 + 다이어그램 깨짐 최종 확인**

Run:
```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
file -I docs/start/go-fx-의존성-주입/index.md
grep -c '```mermaid' docs/start/go-fx-의존성-주입/index.md
```
Expected:
- `charset=utf-8`
- 기존 mermaid 다이어그램 수만큼 출력 (이번 작업으로 추가/삭제 안 됨)

- [ ] **Step 3: PR 생성 명령 안내 (사용자 실행)**

이 plan은 PR 생성을 자동 실행하지 않는다. 사용자에게 다음 명령을 안내:

```
blog-v2 작업 완료. PR 생성 명령:

cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
git push -u origin feat/fx-group-private-populate
gh pr create --title "docs(fx): §2.7.2/§2.7.3/§2.8.3 fx Group/Private/Populate 추가" --body "$(cat <<'EOF'
## Summary
- §2.7.2 fx.Group으로 동일 인터페이스 여러 구현체 모으기 (Notifier 시나리오)
- §2.7.3 fx.Private로 Module 캡슐화
- §2.8.3 fx.Populate로 인스턴스 추출 (fx.Invoke 클로저와 비교)
- §3 마무리 요약, §4 참고 링크 보강
- spec 문서 동봉 (`docs/superpowers/specs/2026-05-01-fx-additional-patterns-design.md`)

샘플 코드 PR (tutorials-go): #TBD

## Test plan
- [ ] tutorials-go의 fx_test.go에서 신규 3개 테스트 PASS 확인
- [ ] 글 인코딩 charset=utf-8
- [ ] heading 번호 일관성 (2.7.1/2.7.2/2.7.3/2.8.1/2.8.2/2.8.3)
- [ ] 마크다운 빌드 시 mermaid 다이어그램 정상 렌더
EOF
)"
```

리뷰어: kenshin579 (CLAUDE.md 글로벌 정책)

---

## 주의 사항 (전체 작업 공통)

1. **외부 회사 프로젝트 코드/이름을 본문에 직접 인용 금지** (메모리 `feedback_no_company_specifics_in_blog.md`).
   - 모든 도메인 시나리오는 일반화된 형태(Notifier, internalDB, ModuleService 등)로 작성.
2. **CLAUDE.md 규칙 준수**:
   - main에 직접 커밋 금지 (이미 feature 브랜치에서 작업 중)
   - 한국어 콘텐츠는 UTF-8 인코딩 유지
   - PR/이슈 본문은 `gh` CLI + HEREDOC (MCP 도구의 `\n` 사용 금지)
3. **CLAUDE.md "샘플 코드 작성 규칙"**: 코드를 먼저 작성·테스트 통과 후 블로그 글 작성. Task 1~3 완료 → Task 4~7 순서 엄수.
4. **각 task 끝에서 working tree clean 확인**. 다음 task 시작 전 미커밋 변경이 없어야 한다.
