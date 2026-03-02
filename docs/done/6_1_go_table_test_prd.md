# Go 테이블 기반 테스트와 벤치마크 작성법 PRD

> 시리즈: Golang 블로그 주제 Phase 1 - 테스트 전략 (1/3)
> 참조: `6_golang_topic_prd.md` A-1

---

## 1. 개요

Go의 테스트 작성 기본기를 다루는 글. 테이블 기반 테스트(Table-Driven Test)는 Go 커뮤니티의 표준 테스트 패턴이며, 벤치마크는 성능 측정의 기본 도구이다.

**대상 독자**: Go 입문~초중급 개발자
**난이도**: 초중급
**예제 코드**: `tutorials-go/golang/testing/`

---

## 2. 블로그 구조

### 2.1 테이블 기반 테스트란?
- 왜 Table-Driven Test인가 (Go 커뮤니티 관례, Go 공식 위키 참조)
- 일반 테스트 vs 테이블 기반 테스트 비교
- 기본 구조: `[]struct` + `for range` + `t.Run()`

### 2.2 테이블 기반 테스트 작성법
- 기본 패턴: 테스트 케이스 구조체 정의
- `t.Run()`으로 서브테스트 만들기 (이름 지정, 개별 실행)
- 에러 케이스와 성공 케이스 분리
- 참고 코드: `avg_test.go` (평균 계산 함수 테이블 테스트)

### 2.3 Assertion 라이브러리 활용
- 표준 `testing` 패키지만으로 테스트하기
- `testify/assert` 활용 (Equal, NotNil, Error 등)
- `go-cmp` 소개 (`github.com/google/go-cmp`)
  - `reflect.DeepEqual`의 상위 호환 — 구조체 깊은 비교 전용
  - `cmp.Equal()`: 두 값이 같은지 비교
  - `cmp.Diff()`: 차이점을 읽기 쉬운 텍스트로 출력 (테스트 실패 시 디버깅 용이)
  - `cmpopts.IgnoreFields()`: 특정 필드 제외 비교 (createdAt, updatedAt 등)
  - `cmpopts.SortSlices()`: 슬라이스 순서 무관 비교
  - testify vs go-cmp 비교: testify는 올인원 assertion, go-cmp는 비교 로직에 집중
- 참고 코드: `assert_test.go`, `cmp_test.go` (신규 작성)

### 2.4 테스트 헬퍼와 유틸리티
- `t.Helper()` 함수 활용
- `t.Cleanup()` 정리 함수
- `t.Skip()` 조건부 스킵
- `t.Parallel()` 병렬 테스트 실행

### 2.5 벤치마크 작성법
- `func BenchmarkXxx(b *testing.B)` 기본 구조
- `b.N` 루프와 자동 반복 횟수 조정
- `b.ResetTimer()`, `b.StopTimer()`, `b.StartTimer()`
- `b.ReportAllocs()` — 메모리 할당 추적
- 벤치마크 실행: `go test -bench=. -benchmem`
- 결과 읽는 법 (ns/op, B/op, allocs/op)
- 참고 코드: `bench_test.go` (신규 작성 — avg.go 대상 기본 벤치마크)

### 2.6 서브벤치마크 (b.Run)
- `b.Run(name, func(b *testing.B))` 패턴으로 벤치마크 그룹화
- 입력 크기별 비교 벤치마크 (예: 입력 10개 vs 100개 vs 1000개)
- `go test -bench=BenchmarkAvg/size=100` — 특정 서브벤치마크만 실행
- 참고 코드: `bench_test.go` (서브벤치마크 예제 포함)

### 2.7 실전 팁
- 테스트 파일 구성 관례 (`_test.go` 접미사)
- 테스트 커버리지 확인: `go test -cover`, `go tool cover`
- CI에서 테스트 자동화

---

## 3. 샘플 코드 참조

| 파일 | 내용 |
|------|------|
| `golang/testing/avg.go` | 평균 계산 함수 구현 |
| `golang/testing/avg_test.go` | 테이블 기반 테스트 예제 |
| `golang/testing/assert_test.go` | testify/assert 활용 예제 |
| `golang/testing/cmp_test.go` | go-cmp 활용 예제 **(신규 작성)** |
| `golang/testing/bench_test.go` | 벤치마크 + 서브벤치마크 예제 **(신규 작성)** |
| `golang/testing/suite_test.go` | Test Suite 패턴 → [기존 블로그 글](https://blog-v2.advenoh.pe.kr/go/go-test-suite-lifecycle-메서드) 참조 |

---

## 4. 논의 사항 (결정 완료)

- [x] 벤치마크 예제 → `golang/testing/bench_test.go`에 **신규 작성** (기존 코드는 profiling/concurrency 디렉토리에 산재, testing 전용 예제 없음)
- [x] 서브벤치마크 (`b.Run`) → **다룬다** (현재 코드베이스에 b.Run 예제 0건, 입력 크기별 비교 패턴으로 작성)
- [x] `go-cmp` → **소개한다** (testify 외 대안으로, cmp.Diff/cmpopts 중심으로 `cmp_test.go` 신규 작성)
- [x] Test Suite → 기존 블로그 글 [Go Test Suite (Lifecycle 메서드)](https://blog-v2.advenoh.pe.kr/go/go-test-suite-lifecycle-메서드) **링크만 건다**
