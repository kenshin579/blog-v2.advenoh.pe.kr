# Go Embed Directive - 바이너리에 파일 내장하기 PRD

> 시리즈: Golang 블로그 주제 Phase 4 - 고급 기능 (2/3)
> 참조: `6_golang_topic_prd.md` D-2

---

## 1. 개요

Go 1.16에서 도입된 `//go:embed` 디렉티브를 활용하여 정적 파일을 바이너리에 내장하는 방법. HTML 템플릿, 설정 파일, SQL 마이그레이션 등을 단일 바이너리로 배포할 수 있다.

**대상 독자**: Go 기초를 아는 개발자
**난이도**: 중급
**예제 코드**: `tutorials-go/golang/embed-directive/`

---

## 2. 블로그 구조

### 2.1 왜 파일 임베딩이 필요한가?
- 기존 방식의 문제: 바이너리 + 외부 파일 함께 배포
- `go:embed` 등장 이전: `go-bindata`, `pkger` 등 서드파티 도구
- Go 1.16+ 표준 라이브러리로 해결

### 2.2 기본 사용법
- `import "embed"` 필수
- **문자열로 임베딩**: `//go:embed hello.txt` → `var s string`
- **바이트 슬라이스로 임베딩**: `//go:embed hello.txt` → `var b []byte`
- **파일시스템으로 임베딩**: `//go:embed hello.txt` → `var f embed.FS`
- 참고 코드: `embed_test.go`

### 2.3 디렉토리 임베딩
- 글로브 패턴: `//go:embed files/*`
- 여러 패턴 조합: `//go:embed templates/* static/*`
- `embed.FS`의 `ReadFile()`, `ReadDir()` 메서드
- 숨김 파일(`.` 접두사) 포함: `all:` 접두사
- 참고 코드: `embed_test.go` - `TestEmbed_AsDir`

### 2.4 실전 활용 사례
- **웹 서버 정적 파일**: `http.FS()`로 임베디드 파일 서빙
- **HTML 템플릿**: `template.ParseFS()`
- **SQL 마이그레이션 파일**: 스키마 파일 내장
- **설정 파일 기본값**: 기본 config.yaml 내장

### 2.5 제약사항과 주의점
- 패키지 레벨 변수에만 사용 가능 (로컬 변수 불가)
- 디렉티브와 변수 선언 사이에 빈 줄 불가
- 지원 타입: `string`, `[]byte`, `embed.FS`만 허용
- 빌드 시 파일이 존재해야 함 (없으면 컴파일 에러)

### 2.6 embed.FS vs os 패키지
- `embed.FS`는 `fs.FS` 인터페이스 구현
- 개발 시 os 패키지, 프로덕션에서 embed 전환 패턴
- `io/fs` 패키지와의 호환성

---

## 3. 샘플 코드 참조

| 파일 | 내용 |
|------|------|
| `golang/embed-directive/embed_test.go` | string, byte, FS, Dir 임베딩 4가지 패턴 |
| `golang/embed-directive/hello.txt` | 단일 파일 임베딩 대상 |
| `golang/embed-directive/files/` | 디렉토리 임베딩 대상 (file1.txt, file2.txt) |

---

## 4. 논의 사항

- [ ] 실전 활용 예제(웹 서버, SQL 마이그레이션)를 새로 작성할지
- [ ] `embed.FS` + `http.FileServer` 조합 예제 추가 여부
- [ ] 글 분량이 짧을 수 있음 → 다른 주제와 합칠지 (예: Build Ldflags)
- [ ] Go 1.22의 embed 관련 개선사항 언급 여부
