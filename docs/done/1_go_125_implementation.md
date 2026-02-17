# Go 1.25 변경사항 블로그 - 구현 문서

## 1. 샘플 코드 구현

### 1.1 디렉토리 및 패키지

- **경로**: `tutorials-go/golang/go1_25/`
- **패키지명**: `go1_25`
- **Go 버전**: go.mod의 go directive가 1.25 이상이어야 함
- **테스트 프레임워크**: `github.com/stretchr/testify/assert`

### 1.2 각 테스트 파일 구현 상세

#### `gomaxprocs_test.go`
```go
// runtime.GOMAXPROCS(0)으로 현재 값 조회
// runtime.SetDefaultGOMAXPROCS()로 기본값 복원
// GOMAXPROCS 값이 양수인지 확인
```

#### `flight_recorder_test.go`
```go
// trace.NewFlightRecorder() 생성
// recorder.Start() → goroutine 작업 수행 → recorder.WriteTo(buffer)
// 스냅샷 데이터가 비어있지 않은지 확인
```

#### `nil_pointer_test.go`
```go
// 잘못된 패턴: 에러 확인 전 nil 포인터 메서드 호출 → panic 발생 확인
// 올바른 패턴: 에러 확인 후 포인터 사용 → 정상 동작 확인
// os.Open("nonExistentFile") 활용
```

#### `synctest_test.go`
```go
// synctest.Test() 내에서 time.After 또는 time.NewTimer 사용
// synctest.Wait()로 goroutine 동기화
// 가상 시간에서 타이머가 즉시 만료됨을 확인
```

#### `waitgroup_go_test.go`
```go
// 기존 방식: wg.Add(1) + go func() { defer wg.Done(); ... }()
// 새 방식: wg.Go(func() { ... })
// 두 방식 모두 동일한 결과 생성 확인
// 슬라이스에 값 수집 후 비교
```

#### `reflect_type_assert_test.go`
```go
// reflect.ValueOf(42) → reflect.TypeAssert[int](v) 성공 확인
// 잘못된 타입으로 TypeAssert → ok=false 확인
// 기존 v.Interface().(int) 방식과 결과 동일 확인
```

#### `csrf_protection_test.go`
```go
// httptest.NewServer로 CrossOriginProtection 래핑된 핸들러 생성
// 동일 Origin 요청 → 200 OK
// 다른 Origin 요청 → 차단 확인
// GET 요청은 통과, POST 크로스오리진은 차단
```

#### `testing_attr_test.go`
```go
// t.Attr("version", "1.25") 호출
// t.Attr("category", "runtime") 호출
// 테스트 통과 확인 (속성은 -json 출력에서만 확인 가능)
```

#### `vet_hostport_test.go`
```go
// 잘못된 방식: fmt.Sprintf("%s:%d", host, port) → IPv6에서 문제
// 올바른 방식: net.JoinHostPort(host, strconv.Itoa(port))
// IPv4, IPv6 모두 테스트
// net.JoinHostPort가 IPv6 주소를 [::1]:8080 형태로 감싸는지 확인
```

### 1.3 Go 버전 요구사항

- `tutorials-go/go.mod`의 `go` directive를 `1.25` 이상으로 업데이트 필요
- `toolchain` directive도 `go1.25.0` 이상으로 설정
- 기존 테스트가 깨지지 않는지 확인 필요

---

## 2. 블로그 포스트 구현

### 2.1 파일 구조

```
blog-v2.advenoh.pe.kr/contents/go/go-1-25-변경사항-whats-new-in-go-1-25/
└── index.md
```

### 2.2 Frontmatter

```yaml
---
title: "Go 1.25 변경사항 총정리 (What's New in Go 1.25)"
description: "Go 1.25의 주요 변경사항을 정리합니다. 컨테이너 인식 GOMAXPROCS, Green Tea GC, testing/synctest, sync.WaitGroup.Go(), encoding/json/v2, Flight Recorder 등 런타임, 표준 라이브러리, 도구 개선 사항을 샘플 코드와 함께 알아봅니다."
date: 2026-02-14
update: 2026-02-14
tags:
  - golang
  - go
  - go1.25
  - new
  - green-tea-gc
  - json-v2
  - synctest
  - flight-recorder
  - runtime
  - 고랭
  - 새기능
---
```

### 2.3 본문 구성 규칙

- 각 섹션마다 **변경 배경 → 사용법 → 코드 예제** 순서로 작성
- 코드 예제는 tutorials-go 테스트 파일 내용을 인라인으로 포함
- 설명 위주 항목(GC, 컴파일러, crypto, 플랫폼 등)은 표나 목록으로 간결하게 정리
- 마지막에 핵심 요약 표 포함

### 2.4 코드 블록 형식

```markdown
```go
// 코드 예제
func example() {
    // ...
}
`` `
```

- 언어 태그는 `go` 사용
- 주석은 한국어로 작성
- 기존 방식 vs 새로운 방식 비교 시 두 코드 블록을 나란히 배치

---

## 3. 인코딩 및 빌드 검증

- 블로그 파일 작성 후 `file -I` 로 UTF-8 인코딩 확인
- `tutorials-go/` 에서 `go test ./golang/go1_25/...` 실행
- `blog-v2.advenoh.pe.kr/` 에서 `npm run build` 실행하여 빌드 성공 확인
