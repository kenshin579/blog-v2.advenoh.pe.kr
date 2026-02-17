# Go 1.26 변경사항 블로그 PRD

## 개요

Go 1.26의 주요 변경사항을 정리한 기술 블로그 포스트를 작성한다.
샘플 코드는 `tutorials-go/golang/`에, 블로그 포스트는 `blog-v2.advenoh.pe.kr/contents/go/`에 작성한다.

## 참고 자료

- https://go.dev/doc/go1.26
- https://go.dev/blog/go1.26
- https://antonz.org/go-1-26/

---

## 블로그 구성

### 블로그 메타 정보

- **폴더**: `blog-v2.advenoh.pe.kr/contents/go/go-1-26-변경사항-whats-new-in-go-1-26/index.md`
- **제목**: "Go 1.26 변경사항 총정리 (What's New in Go 1.26)"
- **태그**: golang, go, go1.26, new, green-tea-gc, cgo, simd, hpke, generics, errors, reflect, 고랭, 새기능

### 목차 구성

#### 1. 개요
- Go 1.26 릴리스 소개
- 핵심 테마: 성능 최적화 + 언어 개선 + 보안 강화

#### 2. 언어 변경사항

##### 2.1 new() 함수 확장 - 초기값 지정 가능
- 기존: `new(T)` → 제로값 포인터만 생성
- 변경: `new(expr)` → 표현식으로 초기값 지정 가능
- 코드 예제: 기존 방식 vs 새로운 방식 비교

##### 2.2 제네릭 타입 자기참조 (Recursive Type Constraints)
- 제네릭 타입이 자기 자신을 타입 파라미터로 참조 가능
- 코드 예제: Ordered 인터페이스, Tree 구조체

#### 3. 표준 라이브러리 주요 변경

##### 3.1 errors.AsType - 타입 안전한 오류 검사
- 기존 `errors.As()` vs 새로운 `errors.AsType[T]()`
- 제네릭 기반으로 타입 안전성 향상

##### 3.2 reflect 반복자 추가
- `Type.Fields()`, `Type.Methods()` 반복자
- range 루프로 필드/메서드 순회

##### 3.3 bytes.Buffer.Peek() 메서드
- 버퍼를 진행시키지 않고 다음 바이트 확인

##### 3.4 slog.NewMultiHandler()
- 여러 로그 핸들러 동시 사용

##### 3.5 io.ReadAll() 성능 최적화
- 2배 빠른 성능, 메모리 50% 감소

##### 3.6 fmt.Errorf() 최적화
- 포맷 없는 문자열의 할당 감소 (92% 빨라짐)

##### 3.7 testing.ArtifactDir()
- 테스트 아티팩트 저장 디렉토리

##### 3.8 signal.NotifyContext와 Context Cause
- 시그널 수신 정보를 컨텍스트 원인으로 포함

##### 3.9 netip.Prefix.Compare
- CIDR 표기법 서브넷 정렬 지원

#### 4. 성능 개선

##### 4.1 Green Tea 가비지 컬렉터 (기본 활성화)
- Go 1.25 실험 → Go 1.26 기본값
- GC 오버헤드 10-40% 감소
- 최신 CPU에서 추가 10% 개선

##### 4.2 cgo 호출 성능 30% 향상
- 프로세서 상태 관리 단순화

##### 4.3 소형 객체 메모리 할당 최적화
- 1-512바이트 객체 할당 최대 30% 향상

##### 4.4 스택 기반 슬라이스 할당 확대
- 더 많은 상황에서 슬라이스 백킹 스토어를 스택에 할당

#### 5. 보안 및 암호화

##### 5.1 crypto/hpke 패키지 (신규)
- RFC 9180 Hybrid Public Key Encryption

##### 5.2 암호화 API 개선 - io.Reader 제거
- `rand.Reader` 파라미터 불필요 → nil 전달 가능

##### 5.3 힙 베이스 주소 무작위화
- 64비트 플랫폼에서 메모리 주소 예측 방지

#### 6. 도구 개선

##### 6.1 go fix 재작성
- 분석 프레임워크 기반 modernizers
- `//go:fix inline` 지시자로 커스텀 마이그레이션

#### 7. 실험적 기능

##### 7.1 SIMD 연산 (simd/archsimd)
- amd64 아키텍처 벡터화 연산
- `GOEXPERIMENT=simd`로 활성화

##### 7.2 고루틴 누수 프로필 (goroutineleak)
- `GOEXPERIMENT=goroutineleakprofile`로 활성화
- `/debug/pprof/goroutineleak` 엔드포인트

##### 7.3 runtime/secret - 민감 데이터 안전 소거
- `GOEXPERIMENT=runtimesecret`로 활성화

#### 8. 기타 변경사항
- macOS: Go 1.26이 Monterey 지원 마지막 버전
- Windows: `windows/arm` (32비트) 제거
- RISC-V: race detector 지원
- net.Dialer: DialTCP, DialUDP 등 메서드 추가
- httptest.Server: example.com 자동 리다이렉트

#### 9. 정리
- Go 1.26 핵심 요약 표
- Go 1.27 예고 (제거 예정 GODEBUG 목록)

---

## 샘플 코드 구성

### 디렉토리 구조

```
tutorials-go/golang/go1_26/
├── new_expr_test.go           # 2.1 new() 함수 확장
├── recursive_generics_test.go # 2.2 제네릭 자기참조
├── errors_astype_test.go      # 3.1 errors.AsType
├── reflect_iter_test.go       # 3.2 reflect 반복자
├── buffer_peek_test.go        # 3.3 bytes.Buffer.Peek
├── slog_multi_test.go         # 3.4 slog.NewMultiHandler
├── io_readall_bench_test.go   # 3.5 io.ReadAll 벤치마크
├── fmt_errorf_bench_test.go   # 3.6 fmt.Errorf 벤치마크
├── artifact_dir_test.go       # 3.7 testing.ArtifactDir
├── signal_context_test.go     # 3.8 signal.NotifyContext
├── netip_compare_test.go      # 3.9 netip.Prefix.Compare
└── README.md                  # 예제 설명
```

> 참고: 성능 개선(4장), 보안(5장), 도구(6장), 실험적 기능(7장)은 코드 예제 없이 설명 위주로 작성한다.
> 단, SIMD(7.1)와 goroutine leak(7.2)은 개념 코드(pseudocode)만 블로그에 포함한다.

### 각 테스트 파일 요구사항

| 파일 | 핵심 내용 |
|------|----------|
| `new_expr_test.go` | `new(42)`, `new([]int{1,2,3})`, 구조체 필드에 `new(expr)` 활용 |
| `recursive_generics_test.go` | `Ordered[T Ordered[T]]` 인터페이스, `Tree[T]` 구현 |
| `errors_astype_test.go` | 커스텀 에러 정의, `errors.As` vs `errors.AsType` 비교 |
| `reflect_iter_test.go` | `Type.Fields()`, `Type.Methods()` range 순회 |
| `buffer_peek_test.go` | `Buffer.Peek()` 사용, 버퍼 위치 미변경 확인 |
| `slog_multi_test.go` | `NewMultiHandler` 로 여러 핸들러에 동시 출력 |
| `io_readall_bench_test.go` | `io.ReadAll` 벤치마크 |
| `fmt_errorf_bench_test.go` | `fmt.Errorf` 할당 벤치마크 |
| `artifact_dir_test.go` | `t.ArtifactDir()` 사용하여 테스트 산출물 저장 |
| `signal_context_test.go` | `signal.NotifyContext` + `context.Cause` 확인 |
| `netip_compare_test.go` | `netip.Prefix.Compare` 로 서브넷 정렬 |

---

## 작업 순서

### Phase 1: 환경 준비
1. `tutorials-go/go.mod`에서 Go 버전을 1.26으로 업데이트
2. `tutorials-go/golang/go1_26/` 디렉토리 생성

### Phase 2: 샘플 코드 작성
3. 각 테스트 파일 작성 (위 테이블 순서대로)
4. `go test ./golang/go1_26/...` 로 전체 테스트 통과 확인

### Phase 3: 블로그 포스트 작성
5. `blog-v2.advenoh.pe.kr/contents/go/go-1-26-변경사항-whats-new-in-go-1-26/index.md` 작성
6. frontmatter 작성 (title, description, date, update, tags)
7. 목차 순서대로 본문 작성
8. 샘플 코드를 블로그 본문에 인라인으로 포함
9. 인코딩 확인 (`file -I`)

### Phase 4: 검증
10. 블로그 빌드 확인 (`npm run build`)
11. 튜토리얼 테스트 확인 (`go test ./golang/go1_26/...`)

---

## 참고: Go 1.26 핵심 변경사항 요약

| 카테고리 | 변경사항 | 영향도 |
|---------|---------|--------|
| 언어 | `new(expr)` 초기값 지정 | ★★★ |
| 언어 | 제네릭 자기참조 | ★★☆ |
| 표준 라이브러리 | `errors.AsType[T]()` | ★★★ |
| 표준 라이브러리 | reflect 반복자 | ★★☆ |
| 표준 라이브러리 | `bytes.Buffer.Peek()` | ★★☆ |
| 표준 라이브러리 | `slog.NewMultiHandler()` | ★★☆ |
| 성능 | Green Tea GC 기본화 | ★★★ |
| 성능 | cgo 30% 향상 | ★★★ |
| 성능 | `io.ReadAll` 2배 빠름 | ★★☆ |
| 성능 | `fmt.Errorf` 92% 빠름 | ★★☆ |
| 보안 | `crypto/hpke` 신규 | ★★☆ |
| 보안 | 힙 주소 무작위화 | ★★☆ |
| 도구 | `go fix` 재작성 | ★★★ |
| 실험 | SIMD 연산 | ★★☆ |
| 실험 | 고루틴 누수 프로필 | ★★★ |
