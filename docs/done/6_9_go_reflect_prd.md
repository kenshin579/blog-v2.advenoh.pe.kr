# Reflect 패키지 이해하기 PRD

> 시리즈: Golang 블로그 주제 Phase 4 - 고급 기능 (1/3)
> 참조: `6_golang_topic_prd.md` D-1

---

## 1. 개요

Go의 `reflect` 패키지를 활용한 런타임 타입 검사, 값 수정, 동적 메서드 호출. 리플렉션은 JSON 직렬화, ORM, Validator 등 다양한 라이브러리의 핵심 기술이다.

**대상 독자**: Go 기본 문법과 인터페이스를 아는 개발자
**난이도**: 중고급
**예제 코드**: `tutorials-go/golang/reflect/`

---

## 2. 블로그 목차

### # 1. 들어가며
- Reflection이란? 런타임에 타입 정보를 검사하고 조작하는 기능
- Go에서 왜 필요한가? (JSON 직렬화, ORM, Validator 등 라이브러리의 핵심 기술)
- Laws of Reflection (Go 블로그 공식 문서 참조)

### # 2. reflect 핵심 API
- #### 2.1 Type, Value, Kind
  - `reflect.TypeOf()` — 타입 정보 조회
  - `reflect.ValueOf()` — 값 정보 조회
  - `Kind()` — 기본 타입 구분 (Struct, Slice, Map 등)
- #### 2.2 구조체 필드 순회와 태그 읽기
  - `NumField()`, `Field(i)` — 필드 인덱스 접근
  - `FieldByName()` — 이름으로 필드 접근
  - 구조체 태그 읽기: `Tag.Get("json")`, `Tag.Get("custom")`
- #### 2.3 값 수정하기
  - `CanSet()` — 수정 가능 여부 확인
  - 포인터를 통한 수정: `Elem()` → `SetString()`, `SetInt()`
  - 주의: 비포인터 값은 수정 불가
- #### 2.4 동적 함수/메서드 호출
  - `MethodByName()` — 이름으로 메서드 조회
  - `Call([]reflect.Value)` — 동적 호출

### # 3. reflect.DeepEqual과 비교 패턴
- 구조체, 슬라이스, 맵 등 깊은 비교
- `IsZero()`로 빈 구조체/제로값 감지
- 테스트에서의 활용 패턴

### # 4. 실무 라이브러리 사용 사례
- `encoding/json` — 구조체 태그 기반 직렬화
- `gorm.io/gorm` — 구조체 → 테이블 매핑
- `go-playground/validator` — 태그 기반 유효성 검증
- 공통 패턴: 구조체 태그 파싱 + 필드 순회

### # 5. 성능 벤치마크
- reflect vs 직접 접근 성능 비교
  - 필드 읽기: `reflect.ValueOf().Field()` vs 직접 접근
  - 메서드 호출: `MethodByName().Call()` vs 직접 호출
  - 구조체 생성: `reflect.New()` vs 리터럴 생성
- 벤치마크 결과 표
- "리플렉션이 필요하다면 설계를 재고하라" (Go 격언)

### # 6. 마무리

### # 7. 참고

---

## 3. 샘플 코드 참조

| 파일 | 내용 |
|---|---|
| `golang/reflect/reflect_test.go` | 15+ 예제 (타입 검사, 필드 순회, 값 수정, 메서드 호출 등) |
| `golang/reflect/model/animal.go` | Cat, Dog 구조체 (커스텀 태그 포함) |
| `golang/reflect/benchmark_test.go` | 성능 벤치마크 (신규 작성 필요) |

---

## 4. 논의 사항 (결정됨)

- [x] 핵심만 추려서 블로그에 포함 (15개 중 핵심 패턴만 발췌)
- [x] `reflect.DeepEqual` 패턴 포함 (§6)
- [x] Generics와의 비교는 제외
- [x] 실무 라이브러리 사용 사례 추가 (§7: encoding/json, GORM, Validator)
- [x] 성능 벤치마크 추가 (§8: reflect vs 직접 접근)
