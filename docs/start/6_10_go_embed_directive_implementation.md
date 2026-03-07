# Go Embed Directive - 구현 계획서

> PRD: `6_10_go_embed_directive_prd.md`

---

## 1. 샘플 코드 작성 (tutorials-go)

**위치**: `tutorials-go/golang/embed-directive/`

### 1.1 리소스 파일 생성

| 파일/디렉토리 | 내용 |
|---|---|
| `static/index.html` | 간단한 HTML 페이지 (제목 + 스타일 참조) |
| `static/style.css` | 기본 CSS 스타일 |
| `templates/index.html` | Go template 문법 포함한 HTML (`{{.Title}}` 등) |
| `config/default.yaml` | 샘플 설정 파일 (server.port, app.name 등) |

### 1.2 테스트 코드 작성

#### `embed_webserver_test.go` - embed.FS + http.FileServer
- `//go:embed static/*`로 정적 파일 임베딩
- `fs.Sub()`로 하위 디렉토리 기준점 변경
- `httptest.NewServer`로 테스트 서버 구동
- HTTP GET 요청으로 정적 파일 응답 검증 (status 200, content-type)

#### `embed_template_test.go` - HTML 템플릿 임베딩
- `//go:embed templates/*.html`로 템플릿 임베딩
- `template.ParseFS()`로 파싱
- `bytes.Buffer`에 렌더링 후 결과 검증

#### `embed_config_test.go` - 설정 파일 기본값 내장
- `//go:embed config/default.yaml`로 기본 설정 임베딩
- 외부 파일 있을 때 → 외부 파일 사용 검증
- 외부 파일 없을 때 → 임베디드 기본값 사용 검증

### 1.3 기존 코드 보완
- `embed_test.go`: 기존 4가지 패턴 테스트 유지 (변경 없음)

---

## 2. 블로그 글 작성

**위치**: `blog-v2.advenoh.pe.kr/docs/start/6_10_go_embed_directive/index.md`

### 2.1 글 구조

```
1. 왜 파일 임베딩이 필요한가?
   - 기존 배포 문제 (바이너리 + 외부 파일)
   - 서드파티 도구 시절 (go-bindata, pkger)
   - Go 1.16 표준 해결

2. 임베딩 문법
   2.1 단일 파일 임베딩
     - string, []byte, embed.FS 3가지 타입 예제
   2.2 디렉토리 임베딩
     - 글로브 패턴, 여러 패턴 조합
     - ReadFile(), ReadDir() 메서드
     - all: 접두사 (숨김 파일 포함)

3. 실전 활용 예제
   3.1 embed.FS + http.FileServer로 정적 파일 서빙
   3.2 HTML 템플릿 임베딩
   3.3 설정 파일 기본값 내장

4. 제약사항과 팁
   4.1 제약사항 (패키지 레벨 변수, 빈 줄 불가, 타입 제한, 빌드 시 파일 필수)
   4.2 embed.FS vs os 패키지 (fs.FS 인터페이스, 개발/프로덕션 전환 패턴)

5. 버전별 변경 이력
   - Go 1.16 → 1.18 → 1.21 → 1.22~1.23
```

### 2.2 Frontmatter

```yaml
title: "Go Embed Directive - 바이너리에 파일 내장하기"
description: "Go 1.16의 //go:embed 디렉티브로 정적 파일을 바이너리에 내장하는 방법과 실전 활용 예제"
date: 2026-03-XX
tags:
  - go
  - embed
  - golang
series: "Golang 시리즈"
```

### 2.3 코드 블록 규칙
- 블로그 내 코드는 핵심 부분만 인라인으로 포함
- 전체 코드는 GitHub 저장소 링크로 참조
- 링크 형식: `github.com/kenshin579/tutorials-go/golang/embed-directive/`

---

## 3. 핵심 구현 포인트

### embed.FS + http.FileServer 조합 패턴
```go
//go:embed static/*
var staticFiles embed.FS

// fs.Sub()로 "static/" 접두사 제거 → 클라이언트는 /style.css로 접근
subFS, _ := fs.Sub(staticFiles, "static")
http.Handle("/", http.FileServer(http.FS(subFS)))
```

### 개발/프로덕션 전환 패턴
```go
// fs.FS 인터페이스를 공통으로 사용
var contentFS fs.FS

if dev {
    contentFS = os.DirFS("./static")  // 개발: 파일시스템 직접 접근
} else {
    contentFS, _ = fs.Sub(staticFiles, "static")  // 프로덕션: 임베디드
}
```
