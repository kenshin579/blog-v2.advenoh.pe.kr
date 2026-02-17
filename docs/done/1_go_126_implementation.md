# Go 1.26 변경사항 블로그 - 구현 문서

## 1. 환경 준비

### Go 버전 업데이트
- `tutorials-go/go.mod`의 go directive를 `go 1.26`으로 변경
- toolchain도 `go1.26.x`로 업데이트

### 디렉토리 생성
```
tutorials-go/golang/go1_26/
```

---

## 2. 샘플 코드 구현

모든 파일은 `package go1_26_test`로 작성하며, 외부 의존성 없이 표준 라이브러리만 사용한다.

### 2.1 new_expr_test.go
```go
// 기본 타입 포인터 생성
p := new(42)           // *int
s := new("hello")      // *string

// 슬라이스 포인터
ps := new([]int{1, 2, 3})

// 구조체 필드에 활용
type Config struct {
    Timeout *int
}
c := Config{Timeout: new(30)}
```

### 2.2 recursive_generics_test.go
```go
type Ordered[T Ordered[T]] interface {
    Less(T) bool
}

type MyInt int
func (a MyInt) Less(b MyInt) bool { return a < b }

// Tree, Min/Max 등 활용 예제
```

### 2.3 errors_astype_test.go
```go
type AppError struct {
    Code    int
    Message string
}
func (e *AppError) Error() string { return e.Message }

// 기존: errors.As
var target *AppError
if errors.As(err, &target) { ... }

// 신규: errors.AsType (타입 안전)
if target, ok := errors.AsType[*AppError](err); ok { ... }
```

### 2.4 reflect_iter_test.go
```go
typ := reflect.TypeFor[http.Client]()
for f := range typ.Fields() {
    fmt.Println(f.Name, f.Type)
}
for m := range typ.Methods() {
    fmt.Println(m.Name)
}
```

### 2.5 buffer_peek_test.go
```go
buf := bytes.NewBufferString("hello world")
peeked, _ := buf.Peek(5)
// peeked == "hello", buf 위치 변경 없음
assert(buf.Len() == 11)
```

### 2.6 slog_multi_test.go
```go
var buf1, buf2 bytes.Buffer
h1 := slog.NewTextHandler(&buf1, nil)
h2 := slog.NewJSONHandler(&buf2, nil)
multi := slog.NewMultiHandler(h1, h2)
logger := slog.New(multi)
logger.Info("test message")
// buf1, buf2 모두 로그 출력 확인
```

### 2.7 io_readall_bench_test.go
```go
func BenchmarkReadAll(b *testing.B) {
    data := bytes.Repeat([]byte("x"), 1024*1024)
    for b.Loop() {
        io.ReadAll(bytes.NewReader(data))
    }
}
```

### 2.8 fmt_errorf_bench_test.go
```go
func BenchmarkErrorfNoFormat(b *testing.B) {
    for b.Loop() {
        _ = fmt.Errorf("simple error")
    }
}
func BenchmarkErrorfWithFormat(b *testing.B) {
    for b.Loop() {
        _ = fmt.Errorf("error: %s", "detail")
    }
}
```

### 2.9 artifact_dir_test.go
```go
func TestArtifactDir(t *testing.T) {
    dir := t.ArtifactDir()
    os.WriteFile(filepath.Join(dir, "output.txt"), []byte("test result"), 0644)
}
```

### 2.10 signal_context_test.go
```go
ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
defer stop()
// context.Cause(ctx) 로 시그널 정보 확인
```

### 2.11 netip_compare_test.go
```go
prefixes := []netip.Prefix{
    netip.MustParsePrefix("192.168.1.0/24"),
    netip.MustParsePrefix("10.0.0.0/8"),
    netip.MustParsePrefix("172.16.0.0/12"),
}
slices.SortFunc(prefixes, netip.Prefix.Compare)
```

---

## 3. 블로그 포스트 구현

### 파일 경로
```
blog-v2.advenoh.pe.kr/contents/go/go-1-26-변경사항-whats-new-in-go-1-26/index.md
```

### frontmatter
```yaml
---
title: "Go 1.26 변경사항 총정리 (What's New in Go 1.26)"
description: "Go 1.26 변경사항 총정리 (What's New in Go 1.26)"
date: 2026-02-14
update: 2026-02-14
tags:
  - golang
  - go
  - go1.26
  - new
  - green-tea-gc
  - cgo
  - simd
  - hpke
  - generics
  - errors
  - reflect
  - 고랭
  - 새기능
---
```

### 본문 작성 규칙
- 각 섹션에 코드 예제를 인라인으로 포함 (```go 코드블록)
- 기존 방식 vs 새로운 방식 비교 형식 적극 활용
- 성능 수치는 공식 문서 기반으로 정확히 기재
- 실험적 기능은 `GOEXPERIMENT` 활성화 방법 명시
- 참고 링크는 포스트 하단에 배치

### 블로그 본문 구조
1. **개요**: 릴리스 날짜, 핵심 테마 3줄 요약
2. **언어 변경**: 코드 before/after 비교
3. **표준 라이브러리**: 각 항목별 코드 예제 + 간단 설명
4. **성능 개선**: 수치 중심 설명 (코드 없음, Green Tea GC 아키텍처 간략 설명)
5. **보안/암호화**: crypto/hpke 사용 예시, API 변경 before/after
6. **도구 개선**: `go fix` 사용법, modernizer 목록
7. **실험적 기능**: GOEXPERIMENT 플래그 + pseudocode
8. **기타**: 플랫폼별 변경 표
9. **정리**: 핵심 요약 표 + Go 1.27 제거 예정 목록
