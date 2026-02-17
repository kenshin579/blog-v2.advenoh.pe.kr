# Go 1.25 변경사항 블로그 PRD

## 개요

Go 1.25의 주요 변경사항을 정리한 기술 블로그 포스트를 작성한다.
샘플 코드는 `tutorials-go/golang/`에, 블로그 포스트는 `blog-v2.advenoh.pe.kr/contents/go/`에 작성한다.

## 참고 자료

- https://go.dev/doc/go1.25
- https://go.dev/blog/go1.25

---

## 블로그 구성

### 블로그 메타 정보

- **폴더**: `blog-v2.advenoh.pe.kr/contents/go/go-1-25-변경사항-whats-new-in-go-1-25/index.md`
- **제목**: "Go 1.25 변경사항 총정리 (What's New in Go 1.25)"
- **태그**: golang, go, go1.25, new, green-tea-gc, json-v2, synctest, flight-recorder, runtime, 고랭, 새기능

### 목차 구성

#### 1. 개요
- Go 1.25 릴리스 소개 (2025년 8월 12일)
- 핵심 테마: 런타임 성능 대폭 개선 + 신규 패키지 + 실험적 기능 도입

#### 2. 런타임 변경사항

##### 2.1 컨테이너 인식 GOMAXPROCS
- Linux cgroup CPU 대역폭 제한을 자동 감지하여 GOMAXPROCS 설정
- Kubernetes 환경에서 CPU limit에 맞춤 (CPU requests는 미고려)
- 주기적 업데이트: 모든 OS에서 CPU 가용성 변경 감지 및 자동 조정
- `runtime.SetDefaultGOMAXPROCS()` 신규 함수
- 비활성화: `GOMAXPROCS=8` 또는 `GODEBUG=containermaxprocs=0,updatemaxprocs=0`

##### 2.2 실험적 Green Tea 가비지 컬렉터
- 소형 객체 마킹/스캔 성능 개선
- 지역성(locality) 및 CPU 확장성 향상
- GC 오버헤드 10~40% 감소 예상
- `GOEXPERIMENT=greenteagc go build`로 활성화

##### 2.3 Flight Recorder (추적 비행 레코더)
- 기존 `runtime/trace`는 크기가 크고 비용이 높아 드문 이벤트 디버깅에 부적합
- `trace.NewFlightRecorder()`로 메모리 링 버퍼에 연속 기록
- 중요 이벤트 발생 시 `WriteTo()`로 최근 몇 초만 스냅샷 저장
- 프로덕션 환경에서 낮은 오버헤드로 트레이싱 가능

##### 2.4 Panic 출력 변경
- 기존: `panic: PANIC [recovered]` → `panic: PANIC`
- 변경: `panic: PANIC [recovered, repanicked]`
- 디버깅 시 recover/repanic 흐름 추적 용이

##### 2.5 Linux VMA 이름 지정
- 커널이 지원 시 메모리 영역에 `[anon: Go: heap]` 등 주석 추가
- `/proc/PID/maps`에서 Go 메모리 영역 식별 가능
- 비활성화: `GODEBUG=decoratemappings=0`

#### 3. 컴파일러 개선

##### 3.1 nil 포인터 버그 수정
- Go 1.21~1.24에서 nil 포인터 사용 시 panic이 발생하지 않던 버그
- Go 1.25에서 올바르게 nil 포인터 panic 발생
- 코드 예제: 에러 확인 전 포인터 사용 → 수정 패턴

##### 3.2 DWARF5 디버그 정보
- 디버그 정보 크기 감소 및 링킹 시간 단축
- 대형 바이너리에서 특히 효과적
- 비활성화: `GOEXPERIMENT=nodwarf5`

##### 3.3 스택 기반 슬라이스 할당 확대
- 더 많은 상황에서 슬라이스 백킹 스토어를 스택에 할당
- 힙 할당 감소로 GC 부담 완화

#### 4. 표준 라이브러리 주요 변경

##### 4.1 testing/synctest - 동시성 코드 테스팅 (신규 패키지)
- `synctest.Test()`: 가상 시간에서 동시성 코드 실행
- `synctest.Wait()`: 모든 goroutine이 블록될 때까지 대기
- 시간을 건너뛰어 빠르고 결정적(deterministic) 테스트 가능
- 코드 예제: 타이머 기반 동시성 코드 테스트

##### 4.2 encoding/json/v2 (실험적)
- `GOEXPERIMENT=jsonv2`로 활성화
- 인코딩: 동등 성능, 디코딩: 상당히 빠름
- 새 패키지: `encoding/json/v2`, `encoding/json/jsontext`
- 호환성 테스트 권장: `GOEXPERIMENT=jsonv2 go test ./...`

##### 4.3 sync.WaitGroup.Go() 메서드
- 기존 `wg.Add(1)` + `go func() { defer wg.Done() ... }()` 패턴 간소화
- `wg.Go(func() { ... })`로 goroutine 생성과 WaitGroup 관리 자동화
- 코드 예제: 기존 방식 vs 새로운 방식 비교

##### 4.4 reflect.TypeAssert - 제네릭 타입 단언
- `reflect.TypeAssert[T](v)`: 메모리 할당 없는 타입 단언
- 기존 `v.Interface().(T)` 대비 성능 향상

##### 4.5 net/http.CrossOriginProtection - CSRF 보호
- `http.CrossOriginProtection(handler)` 미들웨어
- Origin 헤더 검사를 통한 CSRF 보호 내장

##### 4.6 testing.T.Attr() - 테스트 속성
- `t.Attr("key", "value")`로 테스트 메타데이터 기록
- `-json` 플래그로 조회 가능

##### 4.7 crypto 성능 대폭 개선
- Ed25519 서명 (FIPS): 4배 빨라짐
- RSA 키 생성: 3배 빨라짐
- SHA-1 (SHA-NI 지원): 2배 빨라짐
- SHA-3 (Apple M 프로세서): 2배 빨라짐
- crypto/tls: SHA-1 서명 비허용 (RFC 9155)

##### 4.8 unicode 카테고리 확대
- `unicode.Cn` (미할당 코드포인트), `unicode.LC` (케이스 문자) 추가
- `unicode.CategoryAliases` 별칭 맵 지원

#### 5. 도구 변경사항

##### 5.1 go.mod ignore 지시문
- `ignore` 지시문으로 특정 디렉토리를 패턴 매칭(all, ./...)에서 제외
- 모듈 zip 파일에는 포함됨

##### 5.2 go doc -http
- 브라우저에서 로컬 문서 서버 시작
- 전체 프로젝트 API 문서를 웹에서 탐색

##### 5.3 go version -m -json
- BuildInfo를 JSON 형식으로 출력

##### 5.4 Vet 신규 분석기
- **waitgroup**: `sync.WaitGroup.Add`의 잘못된 호출 감지
- **hostport**: IPv6 주소를 `fmt.Sprintf`로 잘못 연결하는 패턴 감지 → `net.JoinHostPort` 사용 권장

##### 5.5 배포 바이너리 감소
- 핵심 도구만 포함, 나머지는 `go tool` 실행 시 필요에 따라 빌드

#### 6. 플랫폼 변경사항
- macOS: 최소 macOS 12 Monterey 이상 (이전 버전 지원 중단)
- Windows: `windows/arm` (32-bit) 마지막 지원 버전 (Go 1.26에서 제거 예정)
- Windows: 비동기 I/O 지원, `File ↔ Network Connection` 변환
- AMD64: `GOAMD64=v3` 이상에서 FMA 명령어 활용
- Loong64: Race detector 지원, C traceback, 내부 링크 모드
- RISC-V: plugin 빌드 모드, RVA23U64 프로필 지원

#### 7. 정리
- Go 1.25 핵심 요약 표
- Go 1.26 예고

---

## 샘플 코드 구성

### 디렉토리 구조

```
tutorials-go/golang/go1_25/
├── gomaxprocs_test.go        # 2.1 컨테이너 인식 GOMAXPROCS
├── flight_recorder_test.go   # 2.3 Flight Recorder
├── nil_pointer_test.go       # 3.1 nil 포인터 버그 수정 패턴
├── synctest_test.go          # 4.1 testing/synctest
├── waitgroup_go_test.go      # 4.3 sync.WaitGroup.Go()
├── reflect_type_assert_test.go # 4.4 reflect.TypeAssert
├── csrf_protection_test.go   # 4.5 net/http.CrossOriginProtection
├── testing_attr_test.go      # 4.6 testing.T.Attr()
├── vet_hostport_test.go      # 5.4 Vet hostport 분석기 (올바른 vs 잘못된 사용)
└── README.md                 # 예제 설명
```

> 참고: Green Tea GC(2.2), 컴파일러 개선(3.2~3.3), crypto(4.7), unicode(4.8), 도구(5.1~5.3, 5.5), 플랫폼(6장)은 코드 예제 없이 설명 위주로 작성한다.
> encoding/json/v2(4.2)는 실험적 기능이므로 개념 코드만 블로그에 포함한다.

### 각 테스트 파일 요구사항

| 파일 | 핵심 내용 |
|------|----------|
| `gomaxprocs_test.go` | `runtime.GOMAXPROCS(0)` 조회, `runtime.SetDefaultGOMAXPROCS()` 호출 |
| `flight_recorder_test.go` | `trace.NewFlightRecorder()` 생성, `WriteTo()` 스냅샷 저장 |
| `nil_pointer_test.go` | 에러 확인 전 포인터 사용 (잘못된 패턴) vs 에러 확인 후 사용 (올바른 패턴) |
| `synctest_test.go` | `synctest.Test()` + `synctest.Wait()` 사용, 가상 시간 기반 타이머 테스트 |
| `waitgroup_go_test.go` | 기존 `Add/Done` 패턴 vs `wg.Go()` 패턴 비교 |
| `reflect_type_assert_test.go` | `reflect.TypeAssert[int](v)` vs `v.Interface().(int)` 비교 |
| `csrf_protection_test.go` | `http.CrossOriginProtection` 미들웨어 적용, 크로스 오리진 요청 차단 확인 |
| `testing_attr_test.go` | `t.Attr("key", "value")` 사용하여 테스트 속성 기록 |
| `vet_hostport_test.go` | `fmt.Sprintf("%s:%d", host, port)` (잘못된) vs `net.JoinHostPort` (올바른) |

---

## 작업 순서

### Phase 1: 환경 준비
1. `tutorials-go/golang/go1_25/` 디렉토리 생성
2. Go 1.25 이상 환경 확인

### Phase 2: 샘플 코드 작성
3. 각 테스트 파일 작성 (위 테이블 순서대로)
4. `go test ./golang/go1_25/...` 로 전체 테스트 통과 확인

### Phase 3: 블로그 포스트 작성
5. `blog-v2.advenoh.pe.kr/contents/go/go-1-25-변경사항-whats-new-in-go-1-25/index.md` 작성
6. frontmatter 작성 (title, description, date, update, tags)
7. 목차 순서대로 본문 작성
8. 샘플 코드를 블로그 본문에 인라인으로 포함
9. 인코딩 확인 (`file -I`)

### Phase 4: 검증
10. 블로그 빌드 확인 (`npm run build`)
11. 튜토리얼 테스트 확인 (`go test ./golang/go1_25/...`)

---

## 참고: Go 1.25 핵심 변경사항 요약

| 카테고리 | 변경사항 | 영향도 |
|---------|---------|--------|
| 런타임 | 컨테이너 인식 GOMAXPROCS | ★★★ |
| 런타임 | Green Tea GC (실험적) | ★★★ |
| 런타임 | Flight Recorder | ★★☆ |
| 컴파일러 | nil 포인터 버그 수정 | ★★★ |
| 컴파일러 | 스택 기반 슬라이스 할당 확대 | ★★☆ |
| 표준 라이브러리 | `testing/synctest` 신규 패키지 | ★★★ |
| 표준 라이브러리 | `encoding/json/v2` (실험적) | ★★★ |
| 표준 라이브러리 | `sync.WaitGroup.Go()` | ★★★ |
| 표준 라이브러리 | `reflect.TypeAssert[T]()` | ★★☆ |
| 표준 라이브러리 | `net/http.CrossOriginProtection` | ★★☆ |
| 성능 | Ed25519 서명 4배 향상 | ★★☆ |
| 성능 | RSA 키 생성 3배 향상 | ★★☆ |
| 성능 | SHA-1/SHA-3 2배 향상 | ★★☆ |
| 도구 | `go.mod ignore` 지시문 | ★★☆ |
| 도구 | Vet 신규 분석기 (waitgroup, hostport) | ★★☆ |
| 플랫폼 | macOS 12 최소 요구 | ★★☆ |
| 플랫폼 | Windows 비동기 I/O | ★★☆ |
