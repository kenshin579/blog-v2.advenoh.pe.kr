---
title: "Go Workspace로 멀티 모듈 프로젝트 관리하기"
description: "Go 1.18에서 도입된 go.work를 활용하여 멀티 모듈 프로젝트를 효율적으로 개발하는 방법을 알아봅니다"
date: 2026-03-04
update: 2026-03-04
tags:
  - golang
  - go
  - workspace
  - go-work
  - multi-module
  - 고랭
  - 워크스페이스
---

# Go Workspace로 멀티 모듈 프로젝트 관리하기

> 전체 예제 코드는 GitHub에서 확인할 수 있다: [tutorials-go/golang/workspace](https://github.com/kenshin579/tutorials-go/tree/master/golang/workspace)

## 1. 들어가며

Go 프로젝트가 커지면 하나의 `go.mod`로 관리하기 어려워진다. 공유 라이브러리를 별도 모듈로 분리하면 코드 재사용과 버전 관리가 쉬워지지만, 로컬에서 여러 모듈을 동시에 개발할 때 문제가 생긴다.

예를 들어 `adder`라는 공유 라이브러리 모듈을 수정하고, 이를 사용하는 `service` 모듈에서 바로 테스트하고 싶다면 어떻게 해야 할까?

### 기존 방식: replace 디렉티브

Go Workspace가 나오기 전에는 `go.mod`에 `replace` 디렉티브를 추가하여 로컬 경로를 지정했다.

```go
// service/go.mod
module github.com/example/service

go 1.19

require github.com/example/adder v0.0.0

replace github.com/example/adder => ../adder
```

이 방식의 문제점은 **커밋 전에 `replace`를 제거해야 한다**는 것이다. 실수로 `replace`가 포함된 채 push하면 CI/CD가 깨지고, 다른 개발자의 환경에서도 빌드가 실패한다.

### go.work의 등장

Go 1.18에서 도입된 **Go Workspace**(`go.work`)는 이 문제를 해결한다. `go.work` 파일은 프로젝트 루트에 위치하며, 여러 모듈을 하나의 워크스페이스로 묶어 로컬 모듈 참조를 자동으로 처리한다. `go.mod`를 수정할 필요가 없으므로 커밋 시 영향이 없다.

## 2. 기본 사용법

### 2.1 Workspace 초기화

```bash
# 프로젝트 루트에서 workspace 초기화
go work init

# 로컬 모듈 추가
go work use ./adder
go work use ./service
```

### 2.2 go.work 파일 구조

위 명령을 실행하면 다음과 같은 `go.work` 파일이 생성된다.

```go
// go.work
go 1.19

use ./adder
use service
```

- `go 1.19` — 최소 Go 버전 지정
- `use` — 워크스페이스에 포함할 모듈 경로 (상대 경로)

`go.work`가 있는 디렉토리가 워크스페이스 루트가 되며, `use`로 지정된 모듈들은 서로 로컬 참조가 가능해진다.

## 3. 예제: 공유 라이브러리 + 서비스 멀티 모듈

실제 프로젝트 구조를 살펴보자. `adder` 공유 라이브러리와 이를 사용하는 `service` 두 개의 모듈로 구성된다.

```
workspace/
├── go.work          # 워크스페이스 정의
├── adder/
│   ├── go.mod       # 독립 모듈
│   └── adder.go     # Add 함수
└── service/
    ├── go.mod       # adder에 의존하는 모듈
    └── main.go      # adder.Add() 사용
```

### 3.1 adder 모듈 (공유 라이브러리)

```go
// adder/adder.go
package adder

func Add(x int, y int) int {
    return x + y
}
```

```go
// adder/go.mod
module github.com/kenshin579/tutorials-go/go-workspace/adder

go 1.19
```

### 3.2 service 모듈 (애플리케이션)

```go
// service/main.go
package main

import (
    "fmt"

    "github.com/kenshin579/tutorials-go/go-workspace/adder"
)

func main() {
    sum := adder.Add(1, 2)
    fmt.Println(sum) // 3
}
```

```go
// service/go.mod
module github.com/kenshin579/tutorials-go/go-workspace/service

go 1.19
```

`service/go.mod`에 `replace` 디렉티브가 없다는 점에 주목하자. `go.work`가 워크스페이스 루트에 존재하므로 Go 도구가 자동으로 `adder` 모듈의 로컬 경로를 인식한다.

### 3.3 로컬 개발 흐름

Workspace의 장점은 공유 라이브러리를 수정하면 서비스에서 **즉시 반영**된다는 점이다.

```bash
# 1. adder 모듈에 새 함수 추가
# adder/adder.go에 Multiply 함수 추가

# 2. service에서 바로 사용 가능 — 별도 publish나 replace 불필요
cd service
go run main.go
```

`go.mod`를 건드리지 않으므로 커밋 시 실수로 `replace`가 포함될 위험이 없다.

## 4. Workspace 주요 명령어

| 명령어 | 설명 |
|---|---|
| `go work init` | 현재 디렉토리에 `go.work` 파일 생성 |
| `go work use ./path` | 워크스페이스에 모듈 추가 |
| `go work sync` | 워크스페이스의 의존성을 각 모듈의 `go.sum`에 동기화 |
| `go work edit -dropuse ./path` | 워크스페이스에서 모듈 제거 |
| `GOWORK=off go build` | 워크스페이스를 무시하고 빌드 |

`go work sync`는 워크스페이스 내 모듈들의 의존성 버전을 맞추는 명령이다. 새로운 의존성을 추가한 후 실행하면 각 모듈의 `go.sum`이 업데이트된다.

## 5. 실전 팁과 주의사항

### 5.1 go.work를 .gitignore에 포함할지

`go.work`는 로컬 개발 환경 설정이므로 `.gitignore`에 포함하는 것이 일반적이다. 하지만 팀 전체가 동일한 워크스페이스 구조를 사용한다면 버전 관리에 포함할 수도 있다. 팀 합의가 필요한 부분이다.

```gitignore
# .gitignore
go.work
go.work.sum
```

### 5.2 CI/CD에서의 사용

CI/CD 환경에서는 `go.work`가 의도치 않게 빌드에 영향을 줄 수 있다. `GOWORK=off` 환경 변수를 설정하여 워크스페이스를 비활성화하는 것이 안전하다.

```bash
# CI/CD 파이프라인에서
GOWORK=off go build ./...
GOWORK=off go test ./...
```

### 5.3 replace vs go.work 비교

| 방식 | 장점 | 단점 |
|---|---|---|
| `replace` 디렉티브 | 설정 간단, Go 1.11+ | 커밋 전 제거 필요, CI 깨짐 위험 |
| `go.work` | 커밋 영향 없음, 로컬 전용 | Go 1.18+ 필요 |

Go 1.18 이상을 사용한다면 `go.work`를 사용하는 것이 훨씬 안전하고 편리하다.

## 6. 마무리

Go Workspace는 멀티 모듈 프로젝트의 로컬 개발을 크게 단순화한다. 핵심을 정리하면:

- `go.work`는 여러 로컬 모듈을 하나의 워크스페이스로 묶어준다
- `go.mod`의 `replace` 디렉티브 없이 로컬 모듈을 참조할 수 있다
- 공유 라이브러리 수정이 서비스에 즉시 반영된다
- CI/CD에서는 `GOWORK=off`로 비활성화하는 것이 안전하다

## 7. 참고

- [Go Workspaces - Go 공식 문서](https://go.dev/doc/tutorial/workspaces)
- [Get familiar with workspaces - Go Blog](https://go.dev/blog/get-familiar-with-workspaces)
- [tutorials-go/golang/workspace - GitHub](https://github.com/kenshin579/tutorials-go/tree/master/golang/workspace)
