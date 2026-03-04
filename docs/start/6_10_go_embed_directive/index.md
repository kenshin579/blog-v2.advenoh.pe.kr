---
title: "Go Embed Directive - 바이너리에 파일 내장하기"
description: "Go 1.16에서 도입된 //go:embed 디렉티브를 활용하여 HTML, CSS, 설정 파일 등을 바이너리에 내장하는 방법을 알아봅니다. embed.FS + http.FileServer 조합, 템플릿 임베딩, 설정 파일 기본값 패턴 등 실전 활용 예제를 다룹니다."
date: 2026-03-04
update: 2026-03-04
tags:
  - golang
  - go
  - embed
  - go-embed
  - embed-directive
  - 고랭
  - 임베딩
---

Go로 웹 서버를 배포할 때 바이너리 파일 하나만 복사하면 끝나는 경험을 해본 적이 있는가? Go 1.16에서 도입된 `//go:embed` 디렉티브를 사용하면 **HTML, CSS, 설정 파일, SQL 마이그레이션 파일** 등을 빌드 시점에 바이너리에 내장할 수 있다. 이 글에서는 기본 문법부터 실전 활용 예제까지 정리한다.

> 이 글의 전체 샘플 코드는 [GitHub](https://github.com/kenshin579/tutorials-go/tree/master/golang/embed-directive)에서 확인할 수 있다.

# 1.왜 파일 임베딩이 필요한가?

Go 1.16 이전에는 바이너리에 정적 파일을 포함하려면 **서드파티 도구**에 의존해야 했다.

- `go-bindata`: 파일을 Go 소스 코드로 변환
- `pkger`: `go generate` 기반 파일 패킹

이런 도구들은 빌드 파이프라인에 추가 단계가 필요했고, 코드 리뷰 시 자동 생성된 파일이 섞이는 문제가 있었다.

Go 1.16부터는 **`embed` 표준 패키지**로 이 문제를 깔끔하게 해결했다. `//go:embed` 디렉티브 한 줄이면 컴파일러가 파일을 바이너리에 포함시킨다.

# 2.임베딩 문법

## 2.1 단일 파일 임베딩

`embed` 패키지를 임포트하고, `//go:embed` 디렉티브로 파일을 지정한다. 대상 변수 타입에 따라 3가지 방식을 사용할 수 있다.

```go
import "embed"

// 문자열로 임베딩
//go:embed hello.txt
var s string

// 바이트 슬라이스로 임베딩
//go:embed hello.txt
var b []byte

// 파일시스템으로 임베딩
//go:embed hello.txt
var f embed.FS
```

`string`과 `[]byte`는 파일 내용을 직접 담는다. `embed.FS`는 파일시스템 인터페이스를 제공하여 `ReadFile()` 등의 메서드로 접근한다. 참고로, `embed.FS` 타입을 직접 사용하지 않고 `string`이나 `[]byte`만 사용하는 경우에는 `import _ "embed"`로 blank import하면 된다.

```go
func TestEmbed_AsString(t *testing.T) {
    fmt.Println(s) // "hello"
}

func TestEmbed_AsFile(t *testing.T) {
    data, _ := f.ReadFile("hello.txt")
    fmt.Println(string(data)) // "hello"
}
```

## 2.2 디렉토리 임베딩

글로브 패턴으로 디렉토리 전체를 임베딩할 수 있다.

```go
// 단일 디렉토리
//go:embed files/*
var files embed.FS

// 여러 패턴 조합
//go:embed templates/* static/*
var assets embed.FS
```

`embed.FS`의 `ReadFile()`과 `ReadDir()` 메서드로 파일에 접근한다.

```go
func TestEmbed_AsDir(t *testing.T) {
    file1, _ := files.ReadFile("files/file1.txt")
    fmt.Println(string(file1))

    file2, _ := files.ReadFile("files/file2.txt")
    fmt.Println(string(file2))
}
```

기본적으로 `.`이나 `_`로 시작하는 숨김 파일은 제외된다. 포함하려면 `all:` 접두사를 사용한다.

```go
//go:embed all:static/*
var allFiles embed.FS
```

# 3.실전 활용 예제

## 3.1 embed.FS + http.FileServer로 정적 파일 서빙

`embed.FS`와 `http.FileServer`를 조합하면 **정적 파일을 바이너리에 내장한 웹 서버**를 만들 수 있다. 핵심은 `fs.Sub()`로 하위 디렉토리를 기준점으로 변경하는 것이다.

```go
//go:embed static/*
var staticFiles embed.FS

func main() {
    // "static/" 접두사 제거 → 클라이언트는 /index.html, /style.css로 접근
    subFS, _ := fs.Sub(staticFiles, "static")
    http.Handle("/", http.FileServer(http.FS(subFS)))
    http.ListenAndServe(":8080", nil)
}
```

`fs.Sub()` 없이 사용하면 클라이언트가 `/static/index.html`로 접근해야 한다. `fs.Sub()`를 쓰면 `/index.html`로 직접 접근할 수 있다.

테스트로 동작을 검증한다.

```go
func TestEmbed_FileServer_ServesHTML(t *testing.T) {
    subFS, err := fs.Sub(staticFiles, "static")
    assert.NoError(t, err)

    server := httptest.NewServer(http.FileServer(http.FS(subFS)))
    defer server.Close()

    resp, err := http.Get(server.URL + "/index.html")
    assert.NoError(t, err)
    defer resp.Body.Close()

    assert.Equal(t, http.StatusOK, resp.StatusCode)
    assert.Contains(t, resp.Header.Get("Content-Type"), "text/html")
}
```

## 3.2 HTML 템플릿 임베딩

`template.ParseFS()`를 사용하면 임베디드 파일에서 직접 Go 템플릿을 파싱할 수 있다.

```go
//go:embed templates/*.html
var templateFiles embed.FS

func TestEmbed_Template_ParseFS(t *testing.T) {
    tmpl, err := template.ParseFS(templateFiles, "templates/*.html")
    assert.NoError(t, err)

    data := struct {
        Title   string
        Message string
    }{
        Title:   "Hello Embed",
        Message: "This is rendered from an embedded template.",
    }

    var buf bytes.Buffer
    err = tmpl.ExecuteTemplate(&buf, "index.html", data)
    assert.NoError(t, err)

    result := buf.String()
    assert.Contains(t, result, "Hello Embed")
}
```

## 3.3 설정 파일 기본값 내장

바이너리에 기본 설정 파일을 내장하고, 외부 파일이 없을 때 fallback으로 사용하는 패턴이다.

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

이 패턴은 **배포 환경에서 설정 파일이 누락되어도 애플리케이션이 기본값으로 동작**할 수 있게 해준다.

```go
func TestEmbed_Config_FallbackToDefault(t *testing.T) {
    // 존재하지 않는 경로 → 임베디드 기본값 사용
    data, err := loadConfig("/nonexistent/config.yaml")
    assert.NoError(t, err)
    assert.Contains(t, string(data), "port: 8080")
    assert.Contains(t, string(data), "name: my-app")
}
```

# 4.제약사항과 팁

## 4.1 제약사항

| 제약사항 | 설명 |
|---|---|
| 패키지 레벨 변수만 가능 | 함수 내 로컬 변수에는 사용 불가 |
| 빈 줄 불가 | 디렉티브와 변수 선언 사이에 빈 줄이 있으면 컴파일 에러 |
| 타입 제한 | `string`, `[]byte`, `embed.FS` 3가지만 허용 |
| 빌드 시 파일 필수 | 지정한 파일이 없으면 컴파일 에러 |

```go
// ❌ 컴파일 에러: 디렉티브와 변수 사이에 빈 줄
//go:embed hello.txt

var s string

// ✅ 올바른 사용
//go:embed hello.txt
var s string
```

## 4.2 embed.FS vs os 패키지

`embed.FS`는 `fs.FS` 인터페이스를 구현한다. 이를 활용하면 **개발 환경에서는 파일시스템 직접 접근, 프로덕션에서는 임베디드 파일 사용**으로 전환하는 패턴을 만들 수 있다.

```go
var contentFS fs.FS

if dev {
    contentFS = os.DirFS("./static")           // 개발: 핫 리로드 가능
} else {
    contentFS, _ = fs.Sub(staticFiles, "static") // 프로덕션: 임베디드
}

// 이후 코드는 동일하게 contentFS 사용
http.Handle("/", http.FileServer(http.FS(contentFS)))
```

# 5.버전별 변경 이력

| 버전 | 변경사항 |
|---|---|
| **Go 1.16** | `//go:embed` 최초 도입 (`string`, `[]byte`, `embed.FS`) |
| **Go 1.18** | `all:` 접두사 공식 지원 (숨김 파일 포함, `all:static/*`) |
| **Go 1.21** | `embed.FS.Open()`이 반환하는 파일에 `ReadAt` 메서드 추가 (`io.ReaderAt` 구현), `Stat()`의 `String()` 메서드 추가 |
| **Go 1.22~1.23** | embed 관련 변경사항 없음 (안정화 단계) |

Go 1.16에서 도입된 이후 큰 변경 없이 안정적으로 유지되고 있다. 대부분의 사용 사례에서 Go 1.16의 기본 기능만으로 충분하다.

# 마무리

`//go:embed` 디렉티브는 Go의 **"단일 바이너리 배포"** 철학을 한층 강화해준다. 정적 파일, 템플릿, 설정 파일을 바이너리에 포함시키면 배포가 단순해지고, 파일 누락으로 인한 런타임 에러를 방지할 수 있다.

## 참고

- [Go embed 패키지 공식 문서](https://pkg.go.dev/embed)
- [Go 1.16 Release Notes - Embedding Files](https://go.dev/doc/go1.16#library-embed)
- [Go by Example: Embed Directive](https://gobyexample.com/embed-directive)
