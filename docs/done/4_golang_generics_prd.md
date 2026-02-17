# Golang Generics 블로그 시리즈 PRD

## 개요

Go 언어의 Generics(Go 1.18+)를 체계적으로 스터디하면서 블로그 시리즈로 정리한다.
샘플 코드는 `tutorials-go/golang/generics/`에, 블로그 포스트는 `blog-v2.advenoh.pe.kr/contents/go/`에 작성한다.

**시리즈 구성**: 총 5편 (개요부터 실무 활용까지)

## 참고 자료

- [docs/start/4_golang_generics_chatgpt.md](./4_golang_generics_chatgpt.md) - ChatGPT 목차 초안
- https://go.dev/doc/tutorial/generics (공식 튜토리얼)
- https://go.dev/blog/intro-generics (공식 소개 블로그)
- https://go.dev/ref/spec#Type_parameter_declarations (스펙)
- https://pkg.go.dev/golang.org/x/exp/constraints (constraints 패키지)
- https://pkg.go.dev/slices (Go 1.21+ 표준 slices 패키지)
- https://pkg.go.dev/maps (Go 1.21+ 표준 maps 패키지)
- https://pkg.go.dev/cmp (Go 1.21+ 표준 cmp 패키지)

---

## 블로그 시리즈 구성

### 공통 사항

- **시리즈명**: `"Golang Generics"`
- **태그 공통**: golang, go, generics, 제네릭, 고랭
- **카테고리 폴더**: `blog-v2.advenoh.pe.kr/contents/go/`
- **frontmatter 형식**:
  ```yaml
  ---
  title: "제목"
  description: "설명"
  date: YYYY-MM-DD
  update: YYYY-MM-DD
  tags:
    - golang
    - go
    - generics
    - 제네릭
    - (편별 추가 태그)
  series: "Golang Generics"
  seriesOrder: N
  ---
  ```

---

### 1편: Generics 개요와 기본 문법

- **폴더**: `golang-generics-1-개요와-기본-문법/index.md`
- **제목**: "Golang Generics (1) - 개요와 기본 문법"
- **추가 태그**: type-parameter, interface, type-inference, 타입-파라미터, 타입-추론
- **seriesOrder**: 1

#### 목차

1. Generics란 무엇인가
   - 정의와 필요성
   - 중복 코드 문제 (타입별 함수 반복)
2. Go에서 Generics가 도입된 배경
   - Go 철학과 Generics의 관계 (simplicity vs abstraction)
   - Go 1.18 도입 과정
3. Generics 도입 전 Go의 한계
   - `interface{}` 기반 구현의 문제점
   - 타입 안전성 부족 (런타임 에러, 타입 캐스팅 비용)
   - 코드 예시: `interface{}` vs Generics 비교
4. Generics 기본 문법
   - Type parameter 선언 (`func name[T constraint](...)`)
   - Generic 함수
   - Generic struct
   - Generic method
5. 타입 추론 (Type Inference)
   - 명시적 타입 지정 vs 추론
   - 추론이 실패하는 경우

---

### 2편: Type Constraint 완벽 이해

- **폴더**: `golang-generics-2-type-constraint-완벽-이해/index.md`
- **제목**: "Golang Generics (2) - Type Constraint 완벽 이해"
- **추가 태그**: constraint, any, comparable, union-type, tilde, 타입-제약
- **seriesOrder**: 2

#### 목차

1. Constraint 개념
   - 왜 constraint가 필요한가
   - constraint = interface
2. 내장 Constraint
   - `any` (= `interface{}`)
   - `comparable` (== / != 연산 가능한 타입)
3. Union Type Constraint (`|` 연산자)
   - 여러 타입 묶기
   - 파이프 연산자로 타입 제한
4. `~` (Underlying Type Constraint)
   - tilde 문법 설명
   - 커스텀 타입(`type MyInt int`) 지원
5. 커스텀 Constraint 설계
   - interface 키워드로 constraint 정의
   - 숫자 타입 묶기 (Integer, Float)
   - constraint 합성 (Nested Constraint)
   - `constraints.Ordered` 활용 (`golang.org/x/exp/constraints`)
6. 재사용 가능한 Constraint 설계 전략

---

### 3편: 실전 예제 모음

- **폴더**: `golang-generics-3-실전-예제-모음/index.md`
- **제목**: "Golang Generics (3) - 실전 예제 모음"
- **추가 태그**: stack, queue, filter, map, reduce, data-structure, 자료구조
- **seriesOrder**: 3

#### 목차

1. Generic 자료구조 구현
   - Generic Stack
   - Generic Queue
2. Generic 유틸 함수
   - Min / Max 함수
   - Contains 함수
3. Slice 유틸 함수 (함수형 패턴)
   - Filter
   - Map
   - Reduce
4. Generic Map 헬퍼
   - Keys / Values 추출
   - Merge
5. 표준 라이브러리 활용 (Go 1.21+)
   - `slices` 패키지 (`slices.Sort`, `slices.Contains`, `slices.Filter` 등)
   - `maps` 패키지 (`maps.Keys`, `maps.Values`, `maps.Clone` 등)
   - `cmp` 패키지 (`cmp.Or`, `cmp.Compare` 등)

---

### 4편: Generics vs Interface 비교와 성능

- **폴더**: `golang-generics-4-interface-비교와-성능/index.md`
- **제목**: "Golang Generics (4) - Generics vs Interface 비교와 성능"
- **추가 태그**: interface, polymorphism, performance, benchmark, monomorphization, 다형성, 성능
- **seriesOrder**: 4

#### 목차

1. Generics vs Interface 비교
   - polymorphism 관점
   - 타입 안전성 관점
   - 설계 의도 관점
   - 언제 generics를 쓰고, 언제 interface를 쓰는가 (결정 트리)
2. Generics 내부 동작 원리
   - 컴파일 타임 vs 런타임
   - GCShape Stenciling + Dictionary 방식
   - monomorphization과의 차이 (Rust와 비교)
3. 성능 비교 벤치마크
   - interface 기반 vs Generics 기반 벤치마크
   - 메모리 할당 비교
4. 다른 언어와의 비교 (간략)
   - Java (Type Erasure)
   - Rust (Monomorphization)
   - C++ (Templates)

---

### 5편: 실무 패턴과 Best Practices

- **폴더**: `golang-generics-5-실무-패턴과-best-practices/index.md`
- **제목**: "Golang Generics (5) - 실무 패턴과 Best Practices"
- **추가 태그**: repository-pattern, best-practice, anti-pattern, migration, 실무
- **seriesOrder**: 5

#### 목차

1. 실무 설계 패턴
   - Generic Repository 패턴
   - Generic Utility 패키지
   - 타입 안전 컬렉션
2. 언제 Generics를 사용해야 하는가 (체크리스트)
   - 타입만 다른 동일 로직 반복?
   - 타입 안전성이 필요한가?
   - API 공개 라이브러리인가?
   - interface로 충분한가?
3. Anti-patterns
   - 과도한 추상화 (Unnecessary Generic)
   - interface + generic 혼합 남용
   - constraint 과설계
   - 가독성 저하
4. 기존 코드 마이그레이션 전략
   - `interface{}` → Generics 변환 방법
   - 단계적 리팩토링
   - 테스트 전략
5. 결론
   - Go에서 Generics의 역할
   - 추천 학습 순서

---

## 샘플 코드 구성

### 디렉토리 구조

`tutorials-go/golang/generics/` 단일 패키지 구조를 유지하면서 파일을 추가한다.
(기존 코드가 하위 폴더 없이 flat 구조로 통합되었으므로 동일 패턴을 따른다)

```
tutorials-go/golang/generics/
│
│  # ── 기존 파일 (유지) ──────────────────────────────
├── README.md
├── basic_generics_test.go          # (기존) interface{} vs generic, no generics → generic 함수 → 타입 제한자 → 커스텀 constraint  → 1편, 2편 참조
├── contraints_test.go              # (기존) constraints.Ordered, ~ tilde       → 2편 참조
├── generic_struct_test.go          # (기존) generic struct (Node), Map 함수    → 1편, 3편 참조
├── interface_constraint_test.go    # (기존) 인터페이스 기반 constraint + 타입 제한자 제약  → 2편 참조
│
│  # ── 추가 파일 (1편: 기본 문법) ─────────────────────
├── type_inference_test.go          # 타입 추론 (명시적 vs 추론, 추론 실패 케이스)
│
│  # ── 추가 파일 (2편: Type Constraint) ───────────────
├── comparable_test.go              # comparable 키워드 (== / != 연산)
├── custom_constraint_test.go       # 커스텀 constraint 설계 (합성, 재사용 전략)
│
│  # ── 추가 파일 (3편: 실전 예제) ─────────────────────
├── stack_test.go                   # Generic Stack 구현
├── queue_test.go                   # Generic Queue 구현
├── minmax_test.go                  # Min / Max / Contains 함수
├── slice_utils_test.go             # Filter, Map, Reduce
├── map_utils_test.go               # Keys, Values, Merge
├── stdlib_test.go                  # slices, maps, cmp 표준 패키지 활용
│
│  # ── 추가 파일 (4편: Interface 비교와 성능) ─────────
├── interface_vs_generic_test.go    # Generics vs Interface 기능 비교
├── bench_test.go                   # interface vs generic 벤치마크
│
│  # ── 추가 파일 (5편: 실무 패턴) ─────────────────────
├── repository_test.go              # Generic Repository 패턴
├── utility_test.go                 # Generic Utility 함수
└── migration_test.go               # interface{} → generics 마이그레이션 예시
```

### 테스트 파일 공통 규칙

- testify/suite 패턴 사용 (기존 코드 스타일 준수)
- 한국어 주석으로 교육적 설명 포함
- 벤치마크 테스트는 `bench_test.go`로 명명
- Example 함수 패턴 활용 (`func Example_XXX()`)

### 각 편별 테스트 파일 요구사항

| 편 | 파일 | 핵심 테스트 내용 |
|----|------|-----------------|
| 1편 | `basic_generics_test.go`, `generic_struct_test.go`, `type_inference_test.go` | interface{} vs generic, 타입별 중복 → generic 함수, struct/method, 타입 추론 |
| 2편 | `contraints_test.go`, `interface_constraint_test.go`, `comparable_test.go`, `custom_constraint_test.go` | any, comparable, union, ~tilde, 인터페이스 기반 constraint, 커스텀 설계 |
| 3편 | `stack_test.go`, `queue_test.go`, `minmax_test.go`, `slice_utils_test.go`, `map_utils_test.go`, `stdlib_test.go` | Stack, Queue, Min/Max, Filter/Map/Reduce, 표준 라이브러리 |
| 4편 | `interface_vs_generic_test.go`, `bench_test.go` | interface vs generics 기능 비교, 벤치마크 |
| 5편 | `repository_test.go`, `utility_test.go`, `migration_test.go` | Repository 패턴, 유틸리티, 마이그레이션 예시 |

---

## 작업 순서 (편별)

각 편은 독립적으로 아래 순서를 따른다.

### Phase 1: 샘플 코드 작성
1. `tutorials-go/golang/generics/` 에 테스트 파일 추가 (단일 패키지 구조 유지)
2. 기존 파일과 함수명/타입명 충돌 없는지 확인
3. `go test -v ./golang/generics/...` 로 테스트 통과 확인

### Phase 2: 블로그 포스트 작성
4. `blog-v2.advenoh.pe.kr/contents/go/{폴더명}/index.md` 생성
5. frontmatter 작성 (series, seriesOrder 포함)
6. 본문 작성 (개념 설명 + 코드 예제 인라인)
7. 인코딩 확인 (`file -I`)

### Phase 3: 검증
8. 블로그 빌드 확인 (`npm run build`)
9. 테스트 재확인 (`go test ./golang/generics/...`)

### Phase 4: PR 생성
10. feature 브랜치 생성 (편당 또는 묶어서)
    - `feature/{issue-number}-golang-generics-{N}`
11. PR 생성 및 리뷰 요청

---

## 진행 우선순위

**필수 (Core)**: 1편 ~ 3편
- 기초 문법부터 실전 예제까지 핵심 내용
- Generics를 처음 배우는 사람이 가장 필요로 하는 내용

**심화 (Advanced)**: 4편
- Interface 비교, 내부 동작, 성능 분석은 중급 이상 내용

**마무리 (Wrap-up)**: 5편
- 실무 패턴과 Best Practices로 전체 지식 통합

---

## 기존 코드 활용

`tutorials-go/golang/generics/`에 이미 존재하는 예제 (단일 패키지 `go_generics`로 통합 완료):
- `basic_generics_test.go` - `interface{}` vs generics 비교 (`foo1` vs `foo2`), 단계별 학습 (no generics → generic 함수 → 타입 제한자 → 커스텀 constraint 합성) → 1편, 2편에서 참조
- `contraints_test.go` - `constraints.Ordered`, `~` tilde, `MyInt` 커스텀 타입 → 2편에서 참조
- `generic_struct_test.go` - Generic struct (`Node[T]`), Generic `Map` 함수 → 1편, 3편에서 참조
- `interface_constraint_test.go` - 인터페이스 기반 constraint, 타입 제한자 제약 (`Stringer`) → 2편에서 참조

기존 코드는 유지하면서, 동일 패키지 내에 새 파일을 추가한다.
