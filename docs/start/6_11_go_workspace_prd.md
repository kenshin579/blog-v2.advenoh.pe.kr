# Go Workspace로 멀티 모듈 프로젝트 관리하기 PRD

> 시리즈: Golang 블로그 주제 Phase 4 - 고급 기능 (3/3)
> 참조: `6_golang_topic_prd.md` E-1

---

## 1. 개요

Go 1.18에서 도입된 Go Workspace (`go.work`)를 활용한 멀티 모듈 개발. 하나의 프로젝트에서 여러 Go 모듈을 동시에 개발할 때 `replace` 디렉티브 없이 로컬 모듈을 참조하는 방법.

**대상 독자**: Go 모듈 시스템을 이해하는 개발자
**난이도**: 중급
**예제 코드**: `tutorials-go/golang/workspace/`

---

## 2. 블로그 구조

### 2.1 Go Workspace가 필요한 상황
- 멀티 모듈 프로젝트에서의 로컬 개발 문제
- 기존 해결책: `go.mod`의 `replace` 디렉티브 (커밋 전 제거 필요)
- `go.work`의 등장: 프로젝트 레벨에서 로컬 모듈 참조 해결

### 2.2 기본 사용법
- `go work init` - workspace 초기화
- `go work use ./module-path` - 모듈 추가
- `go.work` 파일 구조 설명
- 참고 코드: `workspace/go.work`

```
go 1.19
use ./adder
use service
```

### 2.3 예제: adder + service 멀티 모듈
- **adder 모듈**: 유틸리티 라이브러리 (독립 go.mod)
- **service 모듈**: 앱 (adder에 의존)
- Workspace 없이: `replace` 필요 → 커밋 시 제거 번거로움
- Workspace 사용: 자동으로 로컬 모듈 참조
- 참고 코드: `adder/adder.go`, `service/main.go`

### 2.4 Workspace 명령어
- `go work init` - 초기화
- `go work use` - 모듈 추가
- `go work sync` - 의존성 동기화
- `go work edit` - go.work 수정
- `GOWORK=off` - workspace 비활성화

### 2.5 실전 활용 패턴
- **모노레포**: 여러 서비스가 공유 라이브러리에 의존
- **라이브러리 개발**: 라이브러리 + 예제 앱 동시 개발
- **마이크로서비스**: 공통 proto/domain 모듈 공유
- `.gitignore`에 `go.work` 포함 여부 (팀 정책)

### 2.6 기존 방식과 비교

| 방식 | 장점 | 단점 |
|------|------|------|
| `replace` 디렉티브 | 설정 간단 | 커밋 전 제거 필요, CI 깨짐 위험 |
| `go.work` | 커밋 영향 없음, 로컬 전용 | Go 1.18+ 필요 |
| vendor | 오프라인 빌드 | 멀티 모듈 미지원 |

### 2.7 주의사항
- `go.work`는 버전 관리에 포함할지 팀 합의 필요
- CI/CD에서는 보통 `GOWORK=off` 사용
- `go.work.sum` 파일의 역할

---

## 3. 샘플 코드 참조

| 파일 | 내용 |
|------|------|
| `golang/workspace/go.work` | Workspace 정의 |
| `golang/workspace/adder/go.mod` | adder 모듈 정의 |
| `golang/workspace/adder/adder.go` | Add 함수 구현 |
| `golang/workspace/service/go.mod` | service 모듈 정의 |
| `golang/workspace/service/main.go` | adder 모듈 사용 |

---

## 4. 논의 사항

- [ ] 예제가 매우 단순함 → 더 실전적인 예제(공유 라이브러리 + 2개 서비스) 추가 필요 여부
- [ ] `golang/workspace-oldway/` (replace 방식)와의 비교 코드 포함 여부
- [ ] 모노레포에서의 Workspace 활용 사례를 tutorials-go 자체로 설명할지
- [ ] 글 분량이 짧을 수 있음 → Embed Directive와 합쳐서 "Go 빌드 도구 모음" 으로 만들지
