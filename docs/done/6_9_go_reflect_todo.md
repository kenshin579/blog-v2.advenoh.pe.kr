# Reflect 패키지 이해하기 - TODO

> PRD: `6_9_go_reflect_prd.md`
> 구현 문서: `6_9_go_reflect_implementation.md`

---

## Phase 1: 벤치마크 코드 작성

- [x] `golang/reflect/benchmark_test.go` 작성
  - [x] 필드 읽기: 직접 접근 vs reflect
  - [x] 메서드 호출: 직접 호출 vs reflect
  - [x] 구조체 생성: 리터럴 vs reflect.New
- [x] `go test -bench=. -benchmem` 실행 및 결과 확인
- [x] 기존 테스트 통과 확인 (`go test ./golang/reflect/...`)

## Phase 2: 블로그 글 작성

- [x] `docs/start/go-reflect-패키지-이해하기/index.md` 초안 작성
  - [x] frontmatter 작성 (title, description, date, tags)
  - [x] §1 들어가며 (Reflection 소개, Laws of Reflection)
  - [x] §2 reflect 핵심 API
    - [x] §2.1 Type, Value, Kind
    - [x] §2.2 구조체 필드 순회와 태그 읽기
    - [x] §2.3 값 수정하기
    - [x] §2.4 동적 함수/메서드 호출
  - [x] §3 reflect.DeepEqual과 비교 패턴
  - [x] §4 실무 라이브러리 사용 사례 (encoding/json, GORM, Validator)
  - [x] §5 성능 벤치마크 (벤치마크 결과 표 포함)
  - [x] §6 마무리
  - [x] §7 참고
- [x] 코드 블록에 tutorials-go GitHub 링크 참조
- [x] `file -I`로 UTF-8 인코딩 확인
