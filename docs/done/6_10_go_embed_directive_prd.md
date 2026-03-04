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

### 2.2 임베딩 문법

#### 단일 파일 임베딩
- `import "embed"` 필수
- **문자열로 임베딩**: `//go:embed hello.txt` → `var s string`
- **바이트 슬라이스로 임베딩**: `//go:embed hello.txt` → `var b []byte`
- **파일시스템으로 임베딩**: `//go:embed hello.txt` → `var f embed.FS`
- 참고 코드: `embed_test.go`

#### 디렉토리 임베딩
- 글로브 패턴: `//go:embed files/*`
- 여러 패턴 조합: `//go:embed templates/* static/*`
- `embed.FS`의 `ReadFile()`, `ReadDir()` 메서드
- 숨김 파일(`.` 접두사) 포함: `all:` 접두사
- 참고 코드: `embed_test.go` - `TestEmbed_AsDir`

### 2.3 실전 활용 예제

#### embed.FS + http.FileServer로 SPA 서빙
- `static/` 디렉토리에 HTML, CSS, JS 파일 임베딩
- `http.FileServer(http.FS(subFS))` 조합으로 정적 파일 서빙
- `fs.Sub()`로 하위 디렉토리 기준점 변경
- SPA fallback 패턴 (index.html 기본 응답)
- 참고 코드: `embed_webserver_test.go` (새로 작성)

```go
//go:embed static/*
var staticFiles embed.FS

func main() {
    subFS, _ := fs.Sub(staticFiles, "static")
    http.Handle("/", http.FileServer(http.FS(subFS)))
    http.ListenAndServe(":8080", nil)
}
```

#### HTML 템플릿 임베딩
- `templates/*.html` 패턴으로 템플릿 파일 임베딩
- `template.ParseFS()`로 임베디드 템플릿 파싱
- 참고 코드: `embed_template_test.go` (새로 작성)

```go
//go:embed templates/*.html
var templateFiles embed.FS

func handler(w http.ResponseWriter, r *http.Request) {
    tmpl := template.Must(template.ParseFS(templateFiles, "templates/*.html"))
    tmpl.ExecuteTemplate(w, "index.html", data)
}
```

#### 설정 파일 기본값 내장
- 기본 `config.yaml`을 바이너리에 내장
- 외부 파일 없으면 임베디드 기본값 사용하는 패턴
- 참고 코드: `embed_config_test.go` (새로 작성)

```go
//go:embed config/default.yaml
var defaultConfig []byte

func loadConfig(path string) ([]byte, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return defaultConfig, nil // 외부 파일 없으면 내장 기본값 사용
    }
    return data, nil
}
```

### 2.4 제약사항과 팁

#### 제약사항
- 패키지 레벨 변수에만 사용 가능 (로컬 변수 불가)
- 디렉티브와 변수 선언 사이에 빈 줄 불가
- 지원 타입: `string`, `[]byte`, `embed.FS`만 허용
- 빌드 시 파일이 존재해야 함 (없으면 컴파일 에러)

#### embed.FS vs os 패키지
- `embed.FS`는 `fs.FS` 인터페이스 구현
- 개발 시 os 패키지, 프로덕션에서 embed 전환 패턴
- `io/fs` 패키지와의 호환성

### 2.5 버전별 변경 이력
- **Go 1.16**: `//go:embed` 최초 도입 (string, []byte, embed.FS)
- **Go 1.18**: `all:` 접두사 공식 지원 (숨김 파일 포함, `all:static/*`)
- **Go 1.21**: `embed.FS.Open()`이 반환하는 파일에 `ReadAt` 메서드 추가 (`io.ReaderAt` 구현), `Stat()`의 `String()` 메서드 추가
- **Go 1.22~1.23**: embed 관련 변경사항 없음 (안정화 단계)
- 요약: Go 1.16에서 도입된 이후 큰 변경 없이 안정적으로 유지되고 있음

---

## 3. 샘플 코드 참조

| 파일 | 내용 |
|------|------|
| `golang/embed-directive/embed_test.go` | string, byte, FS, Dir 임베딩 4가지 패턴 |
| `golang/embed-directive/embed_webserver_test.go` | **[신규]** embed.FS + http.FileServer 웹 서버 예제 |
| `golang/embed-directive/embed_template_test.go` | **[신규]** HTML 템플릿 임베딩 예제 |
| `golang/embed-directive/embed_config_test.go` | **[신규]** 설정 파일 기본값 내장 예제 |
| `golang/embed-directive/hello.txt` | 단일 파일 임베딩 대상 |
| `golang/embed-directive/files/` | 디렉토리 임베딩 대상 (file1.txt, file2.txt) |
| `golang/embed-directive/static/` | **[신규]** 웹 서버 정적 파일 (index.html, style.css) |
| `golang/embed-directive/templates/` | **[신규]** HTML 템플릿 파일 |
| `golang/embed-directive/config/` | **[신규]** 기본 설정 파일 (default.yaml) |

---

## 4. 논의 사항 (리뷰 완료)

- [x] 실전 활용 예제(웹 서버, 템플릿, 설정 파일) → **새로 작성** (2.4절에 3개 예제 추가)
- [x] `embed.FS` + `http.FileServer` 조합 예제 → **추가** (예제 1에 포함)
- [x] 글 분량이 짧을 수 있음 → **짧아도 상관없음**, 단독 글로 진행
- [x] Go 1.22의 embed 관련 개선사항 → **Go 1.22에는 변경사항 없음**. 대신 Go 1.16~1.23 전체 변경 이력을 2.7절에 정리 (Go 1.21의 ReadAt 추가가 가장 최근 변경)
