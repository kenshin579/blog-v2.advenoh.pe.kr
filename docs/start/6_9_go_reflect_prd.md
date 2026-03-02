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

## 2. 블로그 구조

### 2.1 Reflection이란?
- 런타임에 타입 정보를 검사하고 조작하는 기능
- Go에서 왜 필요한가? (제네릭 이전의 다형성, 동적 처리)
- reflect의 3가지 핵심: `Type`, `Value`, `Kind`
- Laws of Reflection (Go 블로그 공식 문서 참조)

### 2.2 Type과 Value 검사
- `reflect.TypeOf()` - 타입 정보 조회
- `reflect.ValueOf()` - 값 정보 조회
- `Kind()` - 기본 타입 구분 (Struct, Slice, Map 등)
- 참고 코드: `reflect_test.go` - `Example_Type_Value_정보_확인`

### 2.3 구조체 필드 순회
- `NumField()`, `Field(i)` - 필드 인덱스 접근
- `FieldByName()` - 이름으로 필드 접근
- 구조체 태그 읽기: `Tag.Get("json")`, `Tag.Get("custom")`
- 참고 코드: `Example_Struct_Type_Value_메타_정보_확인`, `TestCatFieldLoop`

### 2.4 값 수정하기
- `CanSet()` - 수정 가능 여부 확인
- 포인터를 통한 수정: `Elem()` → `SetString()`, `SetInt()`
- 주의: 비포인터 값은 수정 불가
- 참고 코드: `Example_Value_변경`

### 2.5 동적 메서드 호출
- `MethodByName()` - 이름으로 메서드 조회
- `Call([]reflect.Value)` - 동적 호출
- 범용 Len 함수 예제: Array, Slice, Map, String 지원
- 참고 코드: `Example_Method_동적_호출`, `Example_Len`

### 2.6 동적 자료구조 생성
- `reflect.MakeSlice()` - 슬라이스 동적 생성
- `reflect.MakeMap()` - 맵 동적 생성
- `Append()`, `SetMapIndex()` - 요소 추가
- 참고 코드: `Test_MakeMap`, `Test_MakeMapWithSize2`

### 2.7 실전 활용 패턴
- **선택적 JSON 직렬화**: 특정 필드만 포함/제외
- **Nullable 타입 처리**: `null.Float`, `null.String` 감지
- **빈 구조체 감지**: `IsZero()`로 모든 필드 체크
- 참고 코드: `Test_SelectFields`, `Test_Nullable_Struct`, `Test_isAllFieldEmptyForStruct`

### 2.8 주의사항과 대안
- 성능 비용: 리플렉션은 일반 코드 대비 느림
- 타입 안전성 상실: 컴파일 타임 검사 불가
- Generics(Go 1.18+)로 대체 가능한 경우
- "리플렉션이 필요하다면 설계를 재고하라" (Go 격언)

---

## 3. 샘플 코드 참조

| 파일 | 내용 |
|------|------|
| `golang/reflect/reflect_test.go` | 15+ 예제 (타입 검사, 필드 순회, 값 수정, 메서드 호출 등) |
| `golang/reflect/model/animal.go` | Cat, Dog 구조체 (커스텀 태그 포함) |

---

## 4. 논의 사항

- [ ] 예제가 15개 이상으로 많음 → 핵심만 추려서 블로그에 포함할지, 전체를 다룰지
- [ ] `reflect.DeepEqual` 활용 패턴도 포함할지
- [ ] Generics와의 비교 섹션을 상세히 다룰지
- [ ] 실무 라이브러리(GORM, Validator)에서 reflect 사용 사례 분석 포함 여부
- [ ] 성능 벤치마크 (reflect vs 직접 접근) 추가 여부
