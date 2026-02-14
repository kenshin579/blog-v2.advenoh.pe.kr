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

Go 1.25는 2025년 8월 12일에 릴리스되었다. 이번 버전의 핵심 테마는 **런타임 성능 대폭 개선**, **신규 패키지 도입**, **실험적 기능**이다. 컨테이너 환경에서의 GOMAXPROCS 자동 인식, 실험적 Green Tea 가비지 컬렉터, `testing/synctest` 패키지 신규 추가, `sync.WaitGroup.Go()` 등 실무에 바로 적용할 수 있는 변경사항이 많다.

> 참고 자료
> - [Go 1.25 Release Notes](https://go.dev/doc/go1.25)
> - [Go 1.25 is released](https://go.dev/blog/go1.25)

# 1.런타임 변경사항

## 1.1 컨테이너 인식 GOMAXPROCS

Go 1.25에서 가장 주목할 런타임 변경사항이다. Linux cgroup CPU 대역폭 제한을 자동으로 감지하여 `GOMAXPROCS`를 설정한다. Kubernetes 환경에서 CPU limit에 맞춰 자동 조정되므로, 기존에 수동으로 `GOMAXPROCS`를 설정하거나 `uber-go/automaxprocs` 같은 라이브러리를 사용하던 것이 불필요해진다.

**주요 특징:**
- Linux cgroup CPU 대역폭 제한 자동 감지
- Kubernetes CPU limit에 맞춤 (CPU requests는 미고려)
- 모든 OS에서 CPU 가용성 변경을 주기적으로 감지 및 자동 조정
- `runtime.SetDefaultGOMAXPROCS()` 신규 함수 추가

```go
func Test_GOMAXPROCS_현재값_조회(t *testing.T) {
	// GOMAXPROCS(0)은 현재 값을 변경하지 않고 반환
	current := runtime.GOMAXPROCS(0)
	assert.Positive(t, current, "GOMAXPROCS는 양수여야 한다")
	t.Logf("현재 GOMAXPROCS: %d", current)
}

func Test_SetDefaultGOMAXPROCS_기본값_복원(t *testing.T) {
	original := runtime.GOMAXPROCS(0)

	// GOMAXPROCS를 수동으로 변경
	runtime.GOMAXPROCS(2)
	assert.Equal(t, 2, runtime.GOMAXPROCS(0))

	// SetDefaultGOMAXPROCS()로 기본값(CPU 수 기반)으로 복원
	runtime.SetDefaultGOMAXPROCS()

	restored := runtime.GOMAXPROCS(0)
	t.Logf("복원된 GOMAXPROCS: %d (원래: %d)", restored, original)
	assert.Positive(t, restored, "복원된 값은 양수여야 한다")

	// 원래 값으로 되돌리기
	runtime.GOMAXPROCS(original)
}
```

비활성화가 필요한 경우 환경변수로 설정할 수 있다.

```bash
# 특정 값 고정
GOMAXPROCS=8

# GODEBUG로 비활성화
GODEBUG=containermaxprocs=0,updatemaxprocs=0
```

## 1.2 실험적 Green Tea 가비지 컬렉터

소형 객체의 마킹/스캔 성능을 개선한 새로운 GC 알고리즘이 실험적으로 도입되었다. 지역성(locality) 및 CPU 확장성을 향상시켜 **GC 오버헤드를 10~40% 감소**시킬 수 있다.

```bash
# 활성화
GOEXPERIMENT=greenteagc go build

# 또는 go test에서
GOEXPERIMENT=greenteagc go test ./...
```

> Go 1.26에서 Green Tea GC가 기본값으로 전환될 예정이다.

## 1.3 Flight Recorder (추적 비행 레코더)

기존 `runtime/trace`는 트레이스 데이터의 크기가 크고 비용이 높아 프로덕션 환경에서 상시 사용하기 어려웠다. Flight Recorder는 메모리 링 버퍼에 연속 기록하다가, 중요 이벤트 발생 시 최근 몇 초만 스냅샷으로 저장할 수 있다.

```go
func Test_FlightRecorder_스냅샷_저장(t *testing.T) {
	// FlightRecorder 생성 (최소 1초, 최대 1MB)
	fr := trace.NewFlightRecorder(trace.FlightRecorderConfig{
		MinAge:   1 * time.Second,
		MaxBytes: 1 << 20,
	})

	// 기록 시작
	err := fr.Start()
	assert.NoError(t, err)
	assert.True(t, fr.Enabled(), "FlightRecorder가 활성화되어야 한다")

	// goroutine 작업 수행 (트레이스 데이터 생성)
	done := make(chan struct{})
	go func() {
		time.Sleep(10 * time.Millisecond)
		close(done)
	}()
	<-done

	// 스냅샷 저장
	var buf bytes.Buffer
	n, err := fr.WriteTo(&buf)
	assert.NoError(t, err)
	assert.Positive(t, n, "스냅샷 데이터가 비어있지 않아야 한다")
	t.Logf("스냅샷 크기: %d bytes", n)

	// 기록 중지
	fr.Stop()
	assert.False(t, fr.Enabled(), "Stop 후 비활성화되어야 한다")
}
```

프로덕션 환경에서 낮은 오버헤드로 트레이싱이 가능하므로, 간헐적으로 발생하는 성능 문제를 디버깅할 때 유용하다.

## 1.4 Panic 출력 변경

panic이 recover된 후 다시 발생하면 출력이 더 명확해졌다.

```
# 기존 (Go 1.24)
panic: PANIC [recovered]
	panic: PANIC

# Go 1.25
panic: PANIC [recovered, repanicked]
```

디버깅 시 recover/repanic 흐름을 더 쉽게 추적할 수 있다.

## 1.5 Linux VMA 이름 지정

Linux 커널이 지원하는 경우, Go 런타임이 메모리 영역에 `[anon: Go: heap]` 같은 주석을 추가한다. `/proc/PID/maps`에서 Go 메모리 영역을 쉽게 식별할 수 있다.

```bash
# 비활성화
GODEBUG=decoratemappings=0
```

# 2.컴파일러 개선

## 2.1 nil 포인터 버그 수정

Go 1.21~1.24에서 nil 포인터를 사용해도 panic이 발생하지 않던 버그가 수정되었다. Go 1.25에서는 올바르게 nil 포인터 panic이 발생한다.

```go
func Test_NilPointer_잘못된_패턴_panic_발생(t *testing.T) {
	// Go 1.25에서 수정: nil 포인터 사용 시 올바르게 panic 발생
	assert.Panics(t, func() {
		f, _ := os.Open("존재하지않는파일.txt")
		// 에러 확인 없이 nil 포인터의 메서드 호출 → panic!
		_ = f.Name()
	}, "nil 포인터 메서드 호출 시 panic이 발생해야 한다")
}

func Test_NilPointer_올바른_패턴(t *testing.T) {
	// 올바른 패턴: 에러를 먼저 확인한 후 포인터 사용
	f, err := os.Open("존재하지않는파일.txt")
	if err != nil {
		t.Logf("예상된 에러: %v", err)
		return // 에러 발생 시 조기 반환
	}
	defer f.Close()

	// 에러가 없을 때만 포인터 사용
	name := f.Name()
	assert.NotEmpty(t, name)
}
```

기존에 에러를 확인하지 않고 포인터를 사용하는 코드가 있다면, Go 1.25 업그레이드 시 panic이 발생할 수 있으므로 점검이 필요하다.

## 2.2 DWARF5 디버그 정보

디버그 정보 형식이 DWARF5로 전환되어 **디버그 정보 크기가 감소**하고 **링킹 시간이 단축**된다. 대형 바이너리에서 특히 효과적이다.

```bash
# 비활성화
GOEXPERIMENT=nodwarf5 go build
```

## 2.3 스택 기반 슬라이스 할당 확대

더 많은 상황에서 슬라이스 백킹 스토어를 스택에 할당하여 힙 할당을 줄이고 GC 부담을 완화한다.

# 3.표준 라이브러리 주요 변경

## 3.1 testing/synctest - 동시성 코드 테스팅

Go 1.25에서 새로 추가된 `testing/synctest` 패키지는 동시성 코드를 **결정적(deterministic)으로 테스트**할 수 있게 해준다. 가상 시간을 사용하여 `time.Sleep`이나 타이머가 실제 시간을 기다리지 않고 즉시 진행된다.

**주요 함수:**
- `synctest.Test(t, func(*testing.T))`: 격리된 "버블" 안에서 테스트 실행
- `synctest.Wait()`: 버블 내 모든 goroutine이 블록될 때까지 대기

```go
func Test_Synctest_가상시간_타이머(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		// 가상 시간에서 1초 타이머 생성
		result := make(chan string, 1)

		go func() {
			time.Sleep(1 * time.Second) // 가상 시간에서는 즉시 진행
			result <- "완료"
		}()

		// 가상 시간 1초 진행 후 모든 goroutine 대기
		time.Sleep(1 * time.Second)
		synctest.Wait()

		select {
		case v := <-result:
			assert.Equal(t, "완료", v)
		default:
			t.Fatal("타이머가 만료되지 않았다")
		}
	})
}

func Test_Synctest_Wait_goroutine_동기화(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		ch := make(chan int, 3)

		// 여러 goroutine 시작
		go func() { ch <- 1 }()
		go func() { ch <- 2 }()
		go func() { ch <- 3 }()

		// 모든 goroutine이 블록될 때까지 대기
		synctest.Wait()

		// 채널에 3개의 값이 모두 들어있어야 함
		assert.Equal(t, 3, len(ch))
	})
}
```

기존에는 `time.Sleep`으로 임의의 시간을 기다리거나 복잡한 동기화 로직이 필요했던 테스트를 깔끔하게 작성할 수 있다.

## 3.2 encoding/json/v2 (실험적)

JSON 처리 성능이 대폭 개선된 `encoding/json/v2`가 실험적으로 도입되었다. 인코딩은 동등한 성능을 유지하면서 **디코딩 성능이 상당히 빨라졌다**.

```bash
# 활성화
GOEXPERIMENT=jsonv2 go build

# 호환성 테스트
GOEXPERIMENT=jsonv2 go test ./...
```

새 패키지:
- `encoding/json/v2`: 주요 구현
- `encoding/json/jsontext`: 저수준 JSON 텍스트 처리

기존 `encoding/json` 코드와의 호환성을 테스트한 후 도입하는 것을 권장한다.

## 3.3 sync.WaitGroup.Go()

기존의 `wg.Add(1)` + `go func() { defer wg.Done(); ... }()` 보일러플레이트를 `wg.Go()`로 한 줄로 대체할 수 있다.

```go
func Test_WaitGroup_기존방식_Add_Done(t *testing.T) {
	var wg sync.WaitGroup
	var counter atomic.Int64

	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			counter.Add(1)
		}()
	}

	wg.Wait()
	assert.Equal(t, int64(5), counter.Load())
}

func Test_WaitGroup_새방식_Go(t *testing.T) {
	// Go 1.25: wg.Go()로 Add(1) + goroutine 생성 + Done() 자동화
	var wg sync.WaitGroup
	var counter atomic.Int64

	for i := 0; i < 5; i++ {
		wg.Go(func() {
			counter.Add(1)
		})
	}

	wg.Wait()
	assert.Equal(t, int64(5), counter.Load())
}
```

`wg.Go()`는 내부적으로 `Add(1)`, goroutine 시작, 함수 종료 시 `Done()`을 자동으로 처리한다. 코드가 간결해지고 `Done()` 호출을 빠뜨리는 실수를 방지할 수 있다.

## 3.4 reflect.TypeAssert - 제네릭 타입 단언

`reflect.TypeAssert[T](v)`는 메모리 할당 없이 타입 단언을 수행하는 제네릭 함수다. 기존 `v.Interface().(T)` 방식과 동일한 결과를 반환하면서 성능이 향상되었다.

```go
func Test_TypeAssert_성공(t *testing.T) {
	v := reflect.ValueOf(42)

	// Go 1.25: 제네릭 타입 단언 (메모리 할당 없음)
	n, ok := reflect.TypeAssert[int](v)
	assert.True(t, ok)
	assert.Equal(t, 42, n)
}

func Test_TypeAssert_인터페이스_비교(t *testing.T) {
	v := reflect.ValueOf("hello")

	// 기존 방식: Interface()를 통한 타입 단언
	val1, ok1 := v.Interface().(string)

	// Go 1.25 방식: TypeAssert 제네릭 함수
	val2, ok2 := reflect.TypeAssert[string](v)

	// 두 방식 모두 동일한 결과
	assert.Equal(t, ok1, ok2)
	assert.Equal(t, val1, val2)
	assert.Equal(t, "hello", val2)
}
```

## 3.5 net/http.CrossOriginProtection - CSRF 보호

Go 1.25에서 HTTP 핸들러에 CSRF(Cross-Site Request Forgery) 보호를 쉽게 적용할 수 있는 `CrossOriginProtection`이 추가되었다.

**동작 방식:**
- GET, HEAD, OPTIONS 등 안전한 메서드는 항상 허용
- `Sec-Fetch-Site` 헤더와 `Origin` vs `Host` 비교로 크로스 오리진 감지
- 크로스 오리진 POST 요청은 403 Forbidden 반환

```go
func Test_CrossOriginProtection_크로스오리진_차단(t *testing.T) {
	cop := http.NewCrossOriginProtection()

	handler := cop.Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		io.WriteString(w, "OK")
	}))

	ts := httptest.NewServer(handler)
	defer ts.Close()

	// 크로스 오리진 POST 요청 (Sec-Fetch-Site: cross-site)
	req, _ := http.NewRequest("POST", ts.URL+"/api/data", strings.NewReader("{}"))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Origin", "https://evil.com")
	req.Header.Set("Sec-Fetch-Site", "cross-site")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	assert.Equal(t, http.StatusForbidden, resp.StatusCode, "크로스 오리진 POST는 차단되어야 한다")
}

func Test_CrossOriginProtection_신뢰_출처_허용(t *testing.T) {
	cop := http.NewCrossOriginProtection()
	cop.AddTrustedOrigin("https://trusted.com")

	handler := cop.Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		io.WriteString(w, "OK")
	}))

	ts := httptest.NewServer(handler)
	defer ts.Close()

	// 신뢰 출처에서의 POST 요청 → 허용
	req, _ := http.NewRequest("POST", ts.URL+"/api/data", strings.NewReader("{}"))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Origin", "https://trusted.com")
	req.Header.Set("Sec-Fetch-Site", "cross-site")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	assert.Equal(t, http.StatusOK, resp.StatusCode, "신뢰 출처는 허용되어야 한다")
}
```

## 3.6 testing.T.Attr() - 테스트 속성

테스트에 메타데이터를 기록할 수 있는 `t.Attr(key, value)` 메서드가 추가되었다. CI 시스템이나 테스트 프레임워크에서 테스트 분류와 필터링에 활용할 수 있다.

```go
func Test_Attr_테스트_속성_기록(t *testing.T) {
	t.Attr("version", "1.25")
	t.Attr("category", "runtime")
	t.Attr("priority", "high")

	t.Log("테스트 속성이 기록되었습니다")
}
```

`-json` 플래그로 실행하면 `=== ATTR` 형태로 출력된다.

```bash
$ go test -v -json ./...
# === ATTR Test_Attr_테스트_속성_기록 version 1.25
# === ATTR Test_Attr_테스트_속성_기록 category runtime
# === ATTR Test_Attr_테스트_속성_기록 priority high
```

## 3.7 crypto 성능 대폭 개선

| 항목 | 개선 |
|------|------|
| Ed25519 서명 (FIPS) | 4배 빨라짐 |
| RSA 키 생성 | 3배 빨라짐 |
| SHA-1 (SHA-NI 지원) | 2배 빨라짐 |
| SHA-3 (Apple M 프로세서) | 2배 빨라짐 |
| crypto/tls | SHA-1 서명 비허용 (RFC 9155) |

## 3.8 unicode 카테고리 확대

`unicode.Cn` (미할당 코드포인트)과 `unicode.LC` (케이스 문자) 카테고리가 추가되었고, `unicode.CategoryAliases` 별칭 맵도 지원한다.

# 4.도구 변경사항

## 4.1 go.mod ignore 지시문

`go.mod`에 `ignore` 지시문이 추가되어 특정 디렉토리를 `all`, `./...` 같은 패턴 매칭에서 제외할 수 있다.

```
module example.com/mymodule

go 1.25

ignore (
    vendor/legacy
    testdata/broken
)
```

## 4.2 go doc -http

`go doc -http` 명령으로 브라우저에서 로컬 문서 서버를 시작할 수 있다. 전체 프로젝트 API 문서를 웹에서 탐색할 수 있어 편리하다.

```bash
go doc -http :6060
```

## 4.3 go version -m -json

`BuildInfo`를 JSON 형식으로 출력할 수 있다.

```bash
go version -m -json ./myapp
```

## 4.4 Vet 신규 분석기

### waitgroup
`sync.WaitGroup.Add`의 잘못된 호출을 감지한다.

### hostport
IPv6 주소를 `fmt.Sprintf`로 잘못 연결하는 패턴을 감지하고, `net.JoinHostPort` 사용을 권장한다.

```go
func Test_HostPort_잘못된방식_Sprintf(t *testing.T) {
	// ❌ 잘못된 방식: IPv6 주소에서 문제 발생
	ipv6 := "::1"
	port := 8080

	// IPv6 주소가 대괄호로 감싸지지 않음
	result := fmt.Sprintf("%s:%d", ipv6, port)
	assert.Equal(t, "::1:8080", result) // 잘못된 결과!
}

func Test_HostPort_올바른방식_JoinHostPort(t *testing.T) {
	// ✅ 올바른 방식: net.JoinHostPort 사용
	ipv6 := "::1"
	port := 8080

	// IPv6 주소를 자동으로 대괄호로 감쌈
	result := net.JoinHostPort(ipv6, strconv.Itoa(port))
	assert.Equal(t, "[::1]:8080", result) // 올바른 결과
}
```

## 4.5 배포 바이너리 감소

Go 배포판에 핵심 도구만 포함하고, 나머지는 `go tool` 실행 시 필요에 따라 빌드한다.

# 5.플랫폼 변경사항

| 플랫폼 | 변경사항 |
|--------|---------|
| macOS | 최소 macOS 12 Monterey 이상 (이전 버전 지원 중단) |
| Windows | `windows/arm` (32-bit) 마지막 지원 버전 (Go 1.26에서 제거 예정) |
| Windows | 비동기 I/O 지원, `File ↔ Network Connection` 변환 |
| AMD64 | `GOAMD64=v3` 이상에서 FMA 명령어 활용 |
| Loong64 | Race detector 지원, C traceback, 내부 링크 모드 |
| RISC-V | plugin 빌드 모드, RVA23U64 프로필 지원 |

# 6.정리

Go 1.25는 런타임 성능, 표준 라이브러리, 개발 도구 전반에 걸친 의미 있는 개선이 이루어진 릴리스다.

| 카테고리 | 변경사항 | 영향도 |
|---------|---------|--------|
| 런타임 | 컨테이너 인식 GOMAXPROCS | ★★★ |
| 런타임 | Green Tea GC (실험적) | ★★★ |
| 런타임 | Flight Recorder | ★★☆ |
| 컴파일러 | nil 포인터 버그 수정 | ★★★ |
| 표준 라이브러리 | `testing/synctest` 신규 패키지 | ★★★ |
| 표준 라이브러리 | `encoding/json/v2` (실험적) | ★★★ |
| 표준 라이브러리 | `sync.WaitGroup.Go()` | ★★★ |
| 표준 라이브러리 | `reflect.TypeAssert[T]()` | ★★☆ |
| 표준 라이브러리 | `net/http.CrossOriginProtection` | ★★☆ |
| 도구 | `go.mod ignore` 지시문 | ★★☆ |
| 도구 | Vet 신규 분석기 | ★★☆ |
| 성능 | crypto 2~4배 향상 | ★★☆ |

특히 `sync.WaitGroup.Go()`와 `testing/synctest`는 일상적인 Go 개발에서 즉시 활용할 수 있는 기능이므로 적극적으로 도입해보자. Green Tea GC와 `encoding/json/v2`는 실험적 기능이지만, 성능 개선이 상당하므로 테스트 환경에서 미리 검증해보는 것을 권장한다.
