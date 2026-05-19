# go-fx 의존성 주입: viper → yaml.v3 교체 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `go-clean-arch-v2` 샘플 코드의 viper 의존성을 yaml.v3 + 구조체 unmarshal로 교체하고, 블로그 글의 예제·시그니처·설명을 동일하게 갱신한다.

**Architecture:** `pkg/config`가 `Config` 구조체를 yaml로 unmarshal해 반환. database/main/registerHooks 모두 `*viper.Viper` 대신 `*config.Config`를 fx 그래프에서 주입받음. 블로그 글은 4개 위치(2.1, 2.3 × 2개, 2.4)의 코드 블록과 설명만 교체.

**Tech Stack:** Go 1.26 / uber/fx / echo v4 / gopkg.in/yaml.v3 / MySQL driver

**Spec:** `blog-v2.advenoh.pe.kr/docs/superpowers/specs/2026-05-19-go-fx-viper-to-yaml-design.md`

**저장소 2개에 걸친 작업:**
- `tutorials-go` (샘플 코드, master 브랜치 기반)
- `blog-v2.advenoh.pe.kr` (블로그 글, main 브랜치 기반, `docs/go-fx-viper-to-yaml` 브랜치는 이미 생성됨)

---

## Phase A — 샘플 코드 리팩터링 (`tutorials-go`)

### Task 1: 브랜치 생성 및 사전 검증

**Files:**
- Verify: `/Users/user/src/workspace_blog3/tutorials-go/project-layout/go-clean-arch-v2/`

- [ ] **Step 1: tutorials-go 작업 브랜치 생성**

```bash
cd /Users/user/src/workspace_blog3/tutorials-go
git checkout master
git pull origin master
git checkout -b refactor/go-fx-config-viper-to-yaml
```

Expected: `Switched to a new branch 'refactor/go-fx-config-viper-to-yaml'`

- [ ] **Step 2: viper 사용 위치 재확인**

Run:
```bash
grep -rn "viper" /Users/user/src/workspace_blog3/tutorials-go/project-layout/go-clean-arch-v2 --include="*.go"
```

Expected (3개 파일만):
- `cmd/main.go:17`, `cmd/main.go:24`, `cmd/main.go:50`
- `pkg/database/db.go:8`, `pkg/database/db.go:11`
- `pkg/config/config.go:6`, `pkg/config/config.go:13`, `pkg/config/config.go:14`

Diff 결과가 위와 다르면 STOP 하고 사용자에게 보고.

---

### Task 2: `config.yaml` 신규 생성

**Files:**
- Create: `/Users/user/src/workspace_blog3/tutorials-go/project-layout/go-clean-arch-v2/config.yaml`

- [ ] **Step 1: config.yaml 작성**

내용:
```yaml
debug: true
server:
  address: ":8080"
context:
  timeout: 2
database:
  host: localhost
  port: "3306"
  user: user
  pass: password
  name: article
```

- [ ] **Step 2: UTF-8 인코딩 확인**

Run: `file -I /Users/user/src/workspace_blog3/tutorials-go/project-layout/go-clean-arch-v2/config.yaml`

Expected: `text/plain; charset=utf-8` (또는 `text/plain; charset=us-ascii` - ASCII는 UTF-8 호환이라 OK)

---

### Task 3: `pkg/config/config.go` 재작성

**Files:**
- Modify (전체 교체): `/Users/user/src/workspace_blog3/tutorials-go/project-layout/go-clean-arch-v2/pkg/config/config.go`

- [ ] **Step 1: 파일 전체 교체**

신규 내용:
```go
package config

import (
	"os"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Debug    bool     `yaml:"debug"`
	Server   Server   `yaml:"server"`
	Context  Context  `yaml:"context"`
	Database Database `yaml:"database"`
}

type Server struct {
	Address string `yaml:"address"`
}

type Context struct {
	Timeout int `yaml:"timeout"` // seconds
}

type Database struct {
	Host string `yaml:"host"`
	Port string `yaml:"port"`
	User string `yaml:"user"`
	Pass string `yaml:"pass"`
	Name string `yaml:"name"`
}

func New() (*Config, error) {
	data, err := os.ReadFile("config.yaml")
	if err != nil {
		return nil, err
	}
	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}
```

- [ ] **Step 2: 파일이 컴파일 가능한지 확인**

Run:
```bash
cd /Users/user/src/workspace_blog3/tutorials-go/project-layout/go-clean-arch-v2 && go build ./pkg/config/...
```

Expected: 에러 없음 (다른 패키지 의존성 때문에 전체 빌드는 아직 실패할 수 있음)

---

### Task 4: `pkg/database/db.go` 시그니처 변경

**Files:**
- Modify (전체 교체): `/Users/user/src/workspace_blog3/tutorials-go/project-layout/go-clean-arch-v2/pkg/database/db.go`

- [ ] **Step 1: 파일 전체 교체**

신규 내용:
```go
package database

import (
	"database/sql"
	"fmt"
	"net/url"

	"github.com/kenshin579/tutorials-go/project-layout/go-clean-arch-v2/pkg/config"
)

func New(cfg *config.Config) (*sql.DB, error) {
	fmt.Println("db config")
	d := cfg.Database
	connection := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s", d.User, d.Pass, d.Host, d.Port, d.Name)
	val := url.Values{}
	val.Add("parseTime", "1")
	val.Add("loc", "Asia/Seoul")
	dsn := fmt.Sprintf("%s?%s", connection, val.Encode())

	return sql.Open("mysql", dsn)
}
```

변경점:
- `import "github.com/spf13/viper"` 제거
- `import "...pkg/config"` 추가
- 함수 시그니처: `New(v *viper.Viper)` → `New(cfg *config.Config)`
- `v.GetString("database.xxx")` → `cfg.Database.Xxx`

- [ ] **Step 2: 패키지 단독 빌드 확인**

Run:
```bash
cd /Users/user/src/workspace_blog3/tutorials-go/project-layout/go-clean-arch-v2 && go build ./pkg/database/...
```

Expected: 에러 없음

---

### Task 5: `cmd/main.go` viper 제거

**Files:**
- Modify (전체 교체): `/Users/user/src/workspace_blog3/tutorials-go/project-layout/go-clean-arch-v2/cmd/main.go`

- [ ] **Step 1: 파일 전체 교체**

신규 내용:
```go
package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/kenshin579/tutorials-go/project-layout/go-clean-arch-v2/article"
	"github.com/kenshin579/tutorials-go/project-layout/go-clean-arch-v2/author"
	"github.com/kenshin579/tutorials-go/project-layout/go-clean-arch-v2/pkg/config"
	"github.com/kenshin579/tutorials-go/project-layout/go-clean-arch-v2/pkg/database"
	"github.com/kenshin579/tutorials-go/project-layout/go-clean-arch-v2/pkg/middleware"

	"github.com/labstack/echo"

	"go.uber.org/fx"

	_ "github.com/go-sql-driver/mysql"
)

func registerHooks(lifecycle fx.Lifecycle, e *echo.Echo, cfg *config.Config) {
	lifecycle.Append(
		fx.Hook{
			OnStart: func(context.Context) error {
				fmt.Println("Starting server")
				go e.Start(cfg.Server.Address)
				return nil
			},
			OnStop: func(context.Context) error {
				fmt.Println("Stopping server")
				return nil
			},
		},
	)
}

func NewEcho() *echo.Echo {
	e := echo.New()
	middle := middleware.InitMiddleware()
	e.Use(middle.CORS)
	return e
}

func ProvideBasicConfig(cfg *config.Config) time.Duration {
	return time.Duration(cfg.Context.Timeout) * time.Second
}

func main() {
	app := fx.New(
		fx.Provide(
			config.New,
			database.New,
			NewEcho,
			ProvideBasicConfig,

			article.NewArticleHandler,

			article.NewArticleUsecase,
			article.NewMysqlArticleRepository,

			author.NewMysqlAuthorRepository,
		),
		fx.Invoke(registerHooks),
	)

	startCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	if err := app.Start(startCtx); err != nil {
		log.Fatal(err)
	}

	<-app.Done()
}
```

변경점:
- `import "github.com/spf13/viper"` 제거
- `registerHooks` 마지막 인자: `v *viper.Viper` → `cfg *config.Config`
- `v.GetString("server.address")` → `cfg.Server.Address`
- `ProvideBasicConfig`: 무인자 + 전역 viper 호출 → `(cfg *config.Config)` 수신
- 끝부분 주석된 수동 DI 예제(L82-94) 삭제 (dead code)

- [ ] **Step 2: 패키지 빌드 확인**

Run:
```bash
cd /Users/user/src/workspace_blog3/tutorials-go/project-layout/go-clean-arch-v2 && go build ./cmd/...
```

Expected: 에러 없음

---

### Task 6: go.mod 정리

**Files:**
- Modify: `/Users/user/src/workspace_blog3/tutorials-go/go.mod`
- Modify: `/Users/user/src/workspace_blog3/tutorials-go/go.sum`

- [ ] **Step 1: go mod tidy 실행**

Run:
```bash
cd /Users/user/src/workspace_blog3/tutorials-go && go mod tidy
```

Expected: 에러 없음. (다른 디렉토리에서 viper를 쓰고 있다면 viper는 남아있을 수 있음 → 다음 step에서 확인)

- [ ] **Step 2: go.mod에서 viper 잔존 여부 확인**

Run:
```bash
cd /Users/user/src/workspace_blog3/tutorials-go && grep -rn "spf13/viper" --include="*.go" .
```

만약 **다른 디렉토리**에서 viper를 사용 중이라면 → go.mod에 viper는 남아있어야 정상.
**아무 곳에서도 사용하지 않는다면** → go.mod에서 viper가 제거되어야 정상.

확인:
```bash
grep "spf13/viper" /Users/user/src/workspace_blog3/tutorials-go/go.mod
```

- viper Go 코드가 0건 → go.mod에서 viper도 0건이어야 함
- viper Go 코드가 1건 이상 → go.mod에 viper 유지

---

### Task 7: 전체 빌드 및 viper 잔재 검증

- [ ] **Step 1: 전체 빌드**

Run:
```bash
cd /Users/user/src/workspace_blog3/tutorials-go/project-layout/go-clean-arch-v2 && go build ./...
```

Expected: 에러 없음

- [ ] **Step 2: v2 디렉토리 viper 잔재 0건 확인**

Run:
```bash
grep -rn "viper" /Users/user/src/workspace_blog3/tutorials-go/project-layout/go-clean-arch-v2 --include="*.go"
```

Expected: 출력 없음 (0건)

- [ ] **Step 3: go vet 확인**

Run:
```bash
cd /Users/user/src/workspace_blog3/tutorials-go/project-layout/go-clean-arch-v2 && go vet ./...
```

Expected: 에러 없음

---

### Task 8: tutorials-go 커밋

- [ ] **Step 1: 변경 파일 확인**

Run:
```bash
cd /Users/user/src/workspace_blog3/tutorials-go && git status
```

Expected (이런 형태):
- modified: `go.mod`
- modified: `go.sum`
- modified: `project-layout/go-clean-arch-v2/cmd/main.go`
- modified: `project-layout/go-clean-arch-v2/pkg/config/config.go`
- modified: `project-layout/go-clean-arch-v2/pkg/database/db.go`
- new file: `project-layout/go-clean-arch-v2/config.yaml`

- [ ] **Step 2: 파일 명시적 add 및 커밋**

```bash
cd /Users/user/src/workspace_blog3/tutorials-go && \
git add \
  go.mod \
  go.sum \
  project-layout/go-clean-arch-v2/config.yaml \
  project-layout/go-clean-arch-v2/cmd/main.go \
  project-layout/go-clean-arch-v2/pkg/config/config.go \
  project-layout/go-clean-arch-v2/pkg/database/db.go && \
git commit -m "$(cat <<'EOF'
[refactor] go-clean-arch-v2: viper → yaml.v3로 config 교체

* pkg/config: Config 구조체 + yaml.Unmarshal 기반으로 단순화
* pkg/database: New(v *viper.Viper) → New(cfg *config.Config)
* cmd/main: registerHooks/ProvideBasicConfig가 *config.Config 주입받도록 변경
* config.yaml 신규 (v1의 config.json을 YAML로 변환)
* dead code (수동 DI 주석) 정리

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: 커밋 확인**

Run: `cd /Users/user/src/workspace_blog3/tutorials-go && git log --oneline -1`

Expected: 위 메시지의 커밋이 보임

---

## Phase B — 블로그 글 수정 (`blog-v2.advenoh.pe.kr`)

블로그 글이 위치한 저장소는 이미 `docs/go-fx-viper-to-yaml` 브랜치로 전환되어 있고 스펙 문서 커밋이 1개 있음.

### Task 9: 브랜치 상태 확인

- [ ] **Step 1: 브랜치 및 상태 확인**

Run:
```bash
cd /Users/user/src/workspace_blog3/blog-v2.advenoh.pe.kr && git branch --show-current && git log --oneline -1
```

Expected:
- 브랜치: `docs/go-fx-viper-to-yaml`
- 최근 커밋: `[docs] fx 의존성 주입 글의 viper → yaml 교체 설계 문서 추가`

만약 다른 상태면 STOP하고 사용자에게 보고.

---

### Task 10: `2.1 Go에서 DI가 필요한 이유` 수동 DI 예제 수정

**Files:**
- Modify: `/Users/user/src/workspace_blog3/blog-v2.advenoh.pe.kr/docs/read/go-fx-의존성-주입/index.md` (L40-54)

- [ ] **Step 1: 코드 블록 전체 교체**

Edit old_string:
```
// 수동 DI: main()에서 직접 조립
v := config.New()
db, _ := database.New(v)

authorRepo := author.NewMysqlAuthorRepository(db)
articleRepo := article.NewMysqlArticleRepository(db)

timeout := time.Duration(v.GetInt("context.timeout")) * time.Second
articleUsecase := article.NewArticleUsecase(articleRepo, authorRepo, timeout)

e := NewEcho()
article.NewArticleHandler(e, articleUsecase)

e.Start(v.GetString("server.address"))
```

new_string:
```
// 수동 DI: main()에서 직접 조립
cfg, _ := config.New()
db, _ := database.New(cfg)

authorRepo := author.NewMysqlAuthorRepository(db)
articleRepo := article.NewMysqlArticleRepository(db)

timeout := time.Duration(cfg.Context.Timeout) * time.Second
articleUsecase := article.NewArticleUsecase(articleRepo, authorRepo, timeout)

e := NewEcho()
article.NewArticleHandler(e, articleUsecase)

e.Start(cfg.Server.Address)
```

- [ ] **Step 2: 변경 확인**

Run: `grep -n "v.Get\|viper" /Users/user/src/workspace_blog3/blog-v2.advenoh.pe.kr/docs/read/go-fx-의존성-주입/index.md | head -10`

Expected: 이 섹션(L40-54) 라인 번호의 매치 없음. 다른 라인은 아직 남아있음 (다음 task에서 처리)

---

### Task 11: `2.3` fx.Provide 블록 주석 수정

**Files:**
- Modify: `/Users/user/src/workspace_blog3/blog-v2.advenoh.pe.kr/docs/read/go-fx-의존성-주입/index.md` (L122-141 영역)

- [ ] **Step 1: fx.Provide 블록 주석 교체**

Edit old_string:
```
        config.New,              // *viper.Viper
        database.New,            // *sql.DB (viper 필요)
```

new_string:
```
        config.New,              // *config.Config
        database.New,            // *sql.DB (*config.Config 필요)
```

- [ ] **Step 2: 의존성 설명 문장 교체**

Edit old_string:
```
fx는 각 생성자의 매개변수 타입을 보고 의존성 순서를 자동으로 결정한다. 예를 들어 `database.New(v *viper.Viper)`는 `*viper.Viper`가 필요하므로 `config.New()`가 먼저 호출된다.
```

new_string:
```
fx는 각 생성자의 매개변수 타입을 보고 의존성 순서를 자동으로 결정한다. 예를 들어 `database.New(cfg *config.Config)`는 `*config.Config`가 필요하므로 `config.New()`가 먼저 호출된다.
```

---

### Task 12: `2.3` 생성자 시그니처 예제 수정

**Files:**
- Modify: `/Users/user/src/workspace_blog3/blog-v2.advenoh.pe.kr/docs/read/go-fx-의존성-주입/index.md` (L145-150 영역)

- [ ] **Step 1: 시그니처 예제 교체**

Edit old_string:
```
// pkg/config/config.go
func New() *viper.Viper { ... }

// pkg/database/db.go
func New(v *viper.Viper) (*sql.DB, error) { ... }
```

new_string:
```
// pkg/config/config.go
func New() (*config.Config, error) { ... }

// pkg/database/db.go
func New(cfg *config.Config) (*sql.DB, error) { ... }
```

---

### Task 13: `2.4 Lifecycle 관리` registerHooks 수정

**Files:**
- Modify: `/Users/user/src/workspace_blog3/blog-v2.advenoh.pe.kr/docs/read/go-fx-의존성-주입/index.md` (L168-184 영역)

- [ ] **Step 1: registerHooks 코드 블록 교체**

Edit old_string:
```
// cmd/main.go
func registerHooks(lifecycle fx.Lifecycle, e *echo.Echo, v *viper.Viper) {
    lifecycle.Append(
        fx.Hook{
            OnStart: func(context.Context) error {
                fmt.Println("Starting server")
                go e.Start(v.GetString("server.address"))
                return nil
            },
            OnStop: func(context.Context) error {
                fmt.Println("Stopping server")
                return nil
            },
        },
    )
}
```

new_string:
```
// cmd/main.go
func registerHooks(lifecycle fx.Lifecycle, e *echo.Echo, cfg *config.Config) {
    lifecycle.Append(
        fx.Hook{
            OnStart: func(context.Context) error {
                fmt.Println("Starting server")
                go e.Start(cfg.Server.Address)
                return nil
            },
            OnStop: func(context.Context) error {
                fmt.Println("Stopping server")
                return nil
            },
        },
    )
}
```

---

### Task 14: 블로그 글 viper 잔재 및 인코딩 검증

- [ ] **Step 1: viper 잔재 0건 확인**

Run:
```bash
grep -ni "viper" /Users/user/src/workspace_blog3/blog-v2.advenoh.pe.kr/docs/read/go-fx-의존성-주입/index.md
```

Expected: 출력 없음 (0건)

만약 출력이 있으면 → 누락된 위치 확인 후 추가 수정

- [ ] **Step 2: 인코딩 확인**

Run:
```bash
file -I /Users/user/src/workspace_blog3/blog-v2.advenoh.pe.kr/docs/read/go-fx-의존성-주입/index.md
```

Expected: `text/plain; charset=utf-8`

만약 `charset=binary`라면 → CLAUDE.md의 heredoc 방식으로 재작성 필요

- [ ] **Step 3: 의존성 그래프 Mermaid 노드는 그대로 유지된지 확인**

Run:
```bash
grep -A 11 "5.1 의존성 그래프" /Users/user/src/workspace_blog3/blog-v2.advenoh.pe.kr/docs/read/go-fx-의존성-주입/index.md | head -15
```

Expected: `Config["config.New()"]` 노드가 유지되어 있음 (변경 없음)

---

### Task 15: 블로그 글 커밋

- [ ] **Step 1: 변경 확인**

Run:
```bash
cd /Users/user/src/workspace_blog3/blog-v2.advenoh.pe.kr && git status && git diff --stat
```

Expected:
- modified: `docs/read/go-fx-의존성-주입/index.md`
- (스펙 문서는 이전 커밋이라 status에 안 나옴)

- [ ] **Step 2: 명시적 add 및 커밋**

```bash
cd /Users/user/src/workspace_blog3/blog-v2.advenoh.pe.kr && \
git add docs/read/go-fx-의존성-주입/index.md && \
git commit -m "$(cat <<'EOF'
[docs] fx 의존성 주입 글: viper 예제를 yaml로 교체

* 2.1 수동 DI 예제: v.GetXxx → cfg.Xxx.Yyy
* 2.3 fx.Provide 주석/의존성 설명: *viper.Viper → *config.Config
* 2.3 생성자 시그니처 예제: viper.Viper → config.Config
* 2.4 registerHooks 시그니처/본문

샘플 코드(tutorials-go/project-layout/go-clean-arch-v2)와 정합 유지.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: 커밋 확인**

Run: `cd /Users/user/src/workspace_blog3/blog-v2.advenoh.pe.kr && git log --oneline -3`

Expected (위에서부터):
1. `[docs] fx 의존성 주입 글: viper 예제를 yaml로 교체`
2. `[docs] fx 의존성 주입 글의 viper → yaml 교체 설계 문서 추가`
3. main 커밋

---

## Phase C — 최종 종합 검증

### Task 16: 양쪽 저장소 최종 상태 확인

- [ ] **Step 1: tutorials-go 빌드 재확인**

```bash
cd /Users/user/src/workspace_blog3/tutorials-go/project-layout/go-clean-arch-v2 && go build ./... && echo BUILD_OK
```

Expected: `BUILD_OK`

- [ ] **Step 2: 양쪽 저장소의 viper 검색 결과 0건**

```bash
echo "=== tutorials-go (v2 only) ===" && \
grep -rn "viper" /Users/user/src/workspace_blog3/tutorials-go/project-layout/go-clean-arch-v2 --include="*.go" ; \
echo "=== blog post ===" && \
grep -ni "viper" /Users/user/src/workspace_blog3/blog-v2.advenoh.pe.kr/docs/read/go-fx-의존성-주입/index.md
```

Expected: 두 검색 모두 출력 없음

- [ ] **Step 3: 양쪽 브랜치/커밋 요약 출력 (PR 작성 전 점검)**

```bash
echo "=== tutorials-go ===" && \
cd /Users/user/src/workspace_blog3/tutorials-go && git log --oneline master..HEAD && \
echo "=== blog-v2 ===" && \
cd /Users/user/src/workspace_blog3/blog-v2.advenoh.pe.kr && git log --oneline main..HEAD
```

Expected:
- tutorials-go: `[refactor] go-clean-arch-v2: viper → yaml.v3로 config 교체` 1커밋
- blog-v2: 2커밋 (스펙 문서 + 블로그 글 수정)

---

## PR 생성 (수동 단계)

자동 PR 생성은 사용자 승인 후 별도 진행. 생성 시 형식 (CLAUDE.md 규칙: `gh pr create` + HEREDOC):

```bash
# tutorials-go
cd /Users/user/src/workspace_blog3/tutorials-go && \
git push -u origin refactor/go-fx-config-viper-to-yaml && \
gh pr create --title "[refactor] go-clean-arch-v2: viper → yaml.v3로 config 교체" --body "$(cat <<'EOF'
## Summary
- go-clean-arch-v2 샘플 코드의 viper 의존성을 yaml.v3로 교체
- Config 구조체 기반의 명시적 unmarshal로 단순화
- blog-v2의 'uber/fx로 의존성 주입 구현하기' 글과 정합

## Test plan
- [ ] go build ./... 통과
- [ ] go vet ./... 통과
- [ ] grep viper 0건 (v2 디렉토리)
EOF
)"

# blog-v2
cd /Users/user/src/workspace_blog3/blog-v2.advenoh.pe.kr && \
git push -u origin docs/go-fx-viper-to-yaml && \
gh pr create --title "[docs] fx 의존성 주입 글: viper 예제를 yaml로 교체" --body "$(cat <<'EOF'
## Summary
- 2.1 수동 DI 예제, 2.3 fx.Provide/시그니처, 2.4 registerHooks의 viper 호출을 yaml.v3 기반 Config 구조체 사용으로 교체
- tutorials-go의 샘플 코드 변경과 정합

## Test plan
- [ ] grep viper 0건
- [ ] file -I → charset=utf-8
EOF
)"
```

---

## 자체 리뷰 (Self-Review)

**1. Spec coverage:**
- Spec §2.1 (샘플 코드 변경 5개 파일) → Task 2, 3, 4, 5, 6 (커버됨)
- Spec §2.2 (블로그 글 4개 위치) → Task 10, 11, 12, 13 (커버됨)
- Spec §3 상세 설계 → Task 3, 4, 5에 코드 전체 포함
- Spec §4 작업 순서 → Phase A → B 순서로 반영
- Spec §5 검증 → Task 7, 14, 16에 분산
- Spec §6 위험 요소 → Task 1 사전 검증, Task 6 viper 잔존 체크, Task 14 인코딩 체크
- Spec §7 커밋 전략 → Task 8, 15에 반영
- Spec §8 범위 밖 → 계획에 포함시키지 않음 ✓

**2. Placeholder scan:** TBD/TODO/"이후 구현" 없음 ✓

**3. Type 일관성:**
- `Config` 구조체: 모든 task에서 동일 (Debug, Server, Context, Database)
- `cfg *config.Config` 시그니처: Task 4, 5, 13 모두 일관
- `cfg.Server.Address`, `cfg.Context.Timeout`, `cfg.Database.*` 필드명 일관 ✓

**4. 누락 없음:** spec의 모든 변경 항목이 task로 존재 ✓
