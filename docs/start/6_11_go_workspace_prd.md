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

## 2. 블로그 목차

### # 1. 들어가며
- 멀티 모듈 프로젝트에서의 로컬 개발 문제
- 기존 해결책: `go.mod`의 `replace` 디렉티브 (커밋 전 제거 필요)
- `go.work`의 등장 (Go 1.18): 프로젝트 레벨에서 로컬 모듈 참조 해결

### # 2. 기본 사용법
- `go work init` — workspace 초기화
- `go work use ./module-path` — 모듈 추가
- `go.work` 파일 구조 설명
- 참고 코드: `workspace/go.work`

### # 3. 예제: 공유 라이브러리 + 서비스 멀티 모듈
- **adder 모듈**: 공유 유틸리티 라이브러리 (독립 go.mod)
- **service 모듈**: 앱 (adder에 의존)
- `replace` 없이 `go.work`로 로컬 모듈 참조
- 실전적 예제: 공유 라이브러리 수정 → 서비스에서 즉시 반영되는 흐름
- 참고 코드: `adder/adder.go`, `service/main.go`

### # 4. Workspace 주요 명령어
- `go work init` — 초기화
- `go work use` — 모듈 추가
- `go work sync` — 의존성 동기화
- `go work edit` — go.work 수정
- `GOWORK=off` — workspace 비활성화

### # 5. 실전 팁과 주의사항
- `go.work`를 `.gitignore`에 포함할지 팀 합의 필요
- CI/CD에서는 보통 `GOWORK=off` 사용
- `go.work.sum` 파일의 역할

| 방식 | 장점 | 단점 |
|------|------|------|
| `replace` 디렉티브 | 설정 간단 | 커밋 전 제거 필요, CI 깨짐 위험 |
| `go.work` | 커밋 영향 없음, 로컬 전용 | Go 1.18+ 필요 |

### # 6. 마무리

### # 7. 참고

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

## 4. 논의 사항 (결정됨)

- [x] 더 실전적인 예제 추가 (공유 라이브러리 수정 → 서비스에 즉시 반영되는 흐름)
- [x] `workspace-oldway/` 비교 코드 불필요 — 블로그에서 `replace` 방식은 설명만으로 충분
- [x] 글이 짧아도 OK — 별도 글로 유지 (Embed Directive와 합치지 않음)
