# go-fx 의존성 주입 글의 viper 예제를 yaml.v3로 교체

- **작성일**: 2026-05-19
- **대상 블로그 글**: `blog-v2.advenoh.pe.kr/docs/read/go-fx-의존성-주입/index.md`
- **대상 샘플 코드**: `tutorials-go/project-layout/go-clean-arch-v2/`

## 1. 배경 및 동기

기존 글의 fx 예제는 config 관리를 `spf13/viper`로 처리하고 있다. viper는 강력하지만 다음과 같은 이유로 단순 yaml 파싱으로 교체한다.

- 글의 핵심 주제는 **uber/fx 의존성 주입**이지 config 라이브러리 비교가 아니다.
- viper는 의존성이 비대하고 자동 watch 등 부수 기능이 많아 입문 예제로는 과한 도구다.
- 작은~중간 규모 프로젝트에서는 `gopkg.in/yaml.v3` + 구조체 unmarshal만으로 충분하다.
- 환경변수 override, 다중 소스 merge 같은 요구가 생기면 그때 koanf/viper를 도입하면 된다.

## 2. 변경 범위

### 2.1 샘플 코드 (`tutorials-go/project-layout/go-clean-arch-v2/`)

| 파일 | 변경 유형 |
|---|---|
| `config.yaml` | 신규 생성 (v1의 `config.json`을 YAML로 변환) |
| `pkg/config/config.go` | 재작성 (viper 제거, `Config` 구조체 + `yaml.Unmarshal`) |
| `pkg/database/db.go` | 시그니처 변경: `New(v *viper.Viper)` → `New(cfg *config.Config)` |
| `cmd/main.go` | viper import 제거, `registerHooks`/`ProvideBasicConfig` 시그니처 변경 |
| `go.mod`, `go.sum` | `github.com/spf13/viper` 제거, `gopkg.in/yaml.v3` 추가, `go mod tidy` |

### 2.2 블로그 글 (`docs/read/go-fx-의존성-주입/index.md`)

| 섹션 | 라인 | 변경 내용 |
|---|---|---|
| 2.1 Go에서 DI가 필요한 이유 | L41-54 | 수동 DI 예제에서 `v.GetInt`/`v.GetString` → `cfg.Context.Timeout`/`cfg.Server.Address` |
| 2.3 실전 프로젝트에 fx 적용 | L122-141 | `fx.Provide` 블록 주석과 의존성 설명 문장 변경 |
| 2.3 실전 프로젝트에 fx 적용 | L145-150 | 생성자 시그니처 예제 변경 |
| 2.4 Lifecycle 관리 | L169-184 | `registerHooks` 함수 시그니처 및 본문 변경 |

5.1의 Mermaid 다이어그램은 함수명 라벨이라 수정 불필요.

## 3. 상세 설계

### 3.1 신규 `config.yaml`

v1의 `config.json` 내용을 YAML로 변환하여 v2 디렉토리에 둔다. 기존 코드가 잘못된 경로(`project-layout/go-clean-arch/config.json`)를 참조하던 문제도 같이 정리된다.

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

### 3.2 `pkg/config/config.go`

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

설계 결정:
- `config.yaml` 경로는 작업 디렉토리 기준 상대 경로. 실행 위치는 v2 디렉토리.
- 에러는 panic 대신 반환 (fx가 `error`를 인식해 시작 시 보고).
- 환경변수 override는 포함하지 않음 (YAGNI — 옵션 A 채택).

### 3.3 `pkg/database/db.go`

```go
package database

import (
    "database/sql"
    "fmt"
    "net/url"

    "github.com/kenshin579/tutorials-go/project-layout/go-clean-arch-v2/pkg/config"
)

func New(cfg *config.Config) (*sql.DB, error) {
    d := cfg.Database
    connection := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s", d.User, d.Pass, d.Host, d.Port, d.Name)
    val := url.Values{}
    val.Add("parseTime", "1")
    val.Add("loc", "Asia/Seoul")
    dsn := fmt.Sprintf("%s?%s", connection, val.Encode())

    return sql.Open("mysql", dsn)
}
```

### 3.4 `cmd/main.go`

```go
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

func ProvideBasicConfig(cfg *config.Config) time.Duration {
    return time.Duration(cfg.Context.Timeout) * time.Second
}
```

- `github.com/spf13/viper` import 제거.
- `ProvideBasicConfig`가 fx 그래프에서 `*config.Config`를 자동 주입받도록 변경 (이전에는 viper 전역 호출).

### 3.5 블로그 글 변경 (Before / After 발췌)

**2.1 (수동 DI 예제)**
- Before: `v := config.New() / db, _ := database.New(v) / time.Duration(v.GetInt("context.timeout"))... / e.Start(v.GetString("server.address"))`
- After: `cfg, _ := config.New() / db, _ := database.New(cfg) / time.Duration(cfg.Context.Timeout) * time.Second / e.Start(cfg.Server.Address)`

**2.3 (fx.Provide 주석)**
- Before: `config.New, // *viper.Viper` / `database.New, // *sql.DB (viper 필요)`
- After: `config.New, // *config.Config` / `database.New, // *sql.DB (*config.Config 필요)`

**2.3 (의존성 설명 문장)**
- Before: `database.New(v *viper.Viper)는 *viper.Viper가 필요하므로 config.New()가 먼저 호출된다.`
- After: `database.New(cfg *config.Config)는 *config.Config가 필요하므로 config.New()가 먼저 호출된다.`

**2.3 (생성자 시그니처)**
- Before: `func New() *viper.Viper { ... }` / `func New(v *viper.Viper) (*sql.DB, error) { ... }`
- After: `func New() (*config.Config, error) { ... }` / `func New(cfg *config.Config) (*sql.DB, error) { ... }`

**2.4 (registerHooks)**
- Before: `func registerHooks(lifecycle fx.Lifecycle, e *echo.Echo, v *viper.Viper) { ... go e.Start(v.GetString("server.address")) ... }`
- After: `func registerHooks(lifecycle fx.Lifecycle, e *echo.Echo, cfg *config.Config) { ... go e.Start(cfg.Server.Address) ... }`

## 4. 작업 순서

```
1. config.yaml 생성
2. pkg/config/config.go 재작성
3. pkg/database/db.go 시그니처 변경
4. cmd/main.go 수정
5. go.mod 정리 (go mod tidy)
6. 빌드 검증 (go build ./...)
7. 블로그 글 index.md 수정 (2.1 / 2.3 / 2.4)
8. 인코딩 확인 (file -I)
```

코드 변경이 먼저 검증된 뒤에야 블로그 글을 수정한다. 글의 예제가 실제 코드와 어긋나는 상황을 방지한다.

## 5. 검증

| 항목 | 명령 | 통과 기준 |
|---|---|---|
| 컴파일 | `cd tutorials-go/project-layout/go-clean-arch-v2 && go build ./...` | 에러 없음 |
| 의존성 정리 | `go mod tidy` 후 diff 확인 | go.mod에 viper 없음, yaml.v3 있음 |
| viper 잔재 (코드) | `grep -rn viper tutorials-go/project-layout/go-clean-arch-v2` | 0건 |
| viper 잔재 (블로그) | `grep -n viper blog-v2.advenoh.pe.kr/docs/read/go-fx-의존성-주입/index.md` | 0건 |
| 한글 인코딩 | `file -I index.md` | `charset=utf-8` |

테스트:
- 별도 단위 테스트는 추가하지 않음 (단순 unmarshal).
- 실행 테스트는 MySQL 의존성으로 생략. 빌드 통과를 검증 기준으로 함.
- 기존 `fx_test.go`가 있다면 빌드 영향만 확인.

## 6. 위험 요소 및 대응

| 위험 | 대응 |
|---|---|
| v2 디렉토리 다른 파일이 `*viper.Viper`를 import | 사전 grep으로 확인, 발견 시 같이 수정 (현재 확인 결과 `cmd/main.go`, `pkg/config/config.go`, `pkg/database/db.go` 3개 파일만 영향) |
| `fx_test.go`가 config에 의존 | 파일 내용 사전 확인, 영향 시 같이 수정 |
| viper가 `go.sum`에 간접 의존성으로 남음 | `go mod tidy` 후 grep으로 재확인 |
| 블로그 글의 코드 예제와 실제 샘플 코드 불일치 | 코드 변경 후 빌드 검증 → 블로그 수정 순서 엄수 |

## 7. 커밋/PR 전략

`blog-v2.advenoh.pe.kr`와 `tutorials-go`는 별도 git 저장소이므로 각각 브랜치/커밋/PR을 분리한다.

- **tutorials-go**
  - 브랜치: `refactor/go-fx-config-viper-to-yaml`
  - 커밋 메시지: `[refactor] go-clean-arch-v2: viper → yaml.v3로 config 교체`
- **blog-v2.advenoh.pe.kr**
  - 브랜치: `docs/go-fx-viper-to-yaml`
  - 커밋 메시지: `[docs] fx 의존성 주입 글: viper 예제를 yaml로 교체`

PR은 양쪽 모두 `gh pr create` + HEREDOC 사용 (CLAUDE.md 규칙).

## 8. 범위 밖 (Out of Scope)

- viper 대안 비교 섹션 추가 (글의 주제에서 벗어남)
- 환경변수 override 지원
- koanf 등 다른 라이브러리 도입
- `go-clean-arch-v2` 디렉토리의 다른 리팩터링 (TODO 정리, dead code 제거 등)
