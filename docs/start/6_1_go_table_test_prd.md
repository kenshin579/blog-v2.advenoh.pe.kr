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
- 참고 코드: `assert_test.go`

### 2.4 테스트 헬퍼와 유틸리티
- `t.Helper()` 함수 활용
- `t.Cleanup()` 정리 함수
- `t.Skip()` 조건부 스킵
- `t.Parallel()` 병렬 테스트 실행

### 2.5 벤치마크 작성법
- `func BenchmarkXxx(b *testing.B)` 기본 구조
- `b.N` 루프와 자동 반복 횟수 조정
- `b.ResetTimer()`, `b.StopTimer()`, `b.StartTimer()`
- 벤치마크 실행: `go test -bench=. -benchmem`
- 결과 읽는 법 (ns/op, B/op, allocs/op)

### 2.6 실전 팁
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
| `golang/testing/suite_test.go` | Test Suite 패턴 (기존 블로그 참조) |

---

## 4. 논의 사항

- [ ] 벤치마크 예제를 새로 작성할지, 기존 코드에서 추출할지
- [ ] `testing.B` 서브벤치마크 (`b.Run`) 패턴도 다룰지
- [ ] `go-cmp` 라이브러리도 소개할지 (testify 외 대안)
- [ ] Test Suite는 기존 블로그 글이 있으므로 링크만 걸 것
