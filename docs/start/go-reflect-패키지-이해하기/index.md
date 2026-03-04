---
title: "Go Reflect 패키지 이해하기"
description: "Go의 reflect 패키지를 활용한 런타임 타입 검사, 값 수정, 동적 호출 방법과 실무 라이브러리 사용 사례, 성능 벤치마크를 다룹니다"
date: 2026-03-04
update: 2026-03-04
tags:
  - golang
  - go
  - reflect
  - reflection
  - runtime
  - deep-equal
  - benchmark
  - 고랭
  - 리플렉션
---

# Go Reflect 패키지 이해하기

> 전체 예제 코드는 GitHub에서 확인할 수 있다: [tutorials-go/golang/reflect](https://github.com/kenshin579/tutorials-go/tree/master/golang/reflect)

## 1. 들어가며

Go에서 **Reflection(리플렉션)**이란 런타임에 변수의 타입 정보를 검사하고 값을 조작하는 기능이다. 컴파일 타임에 타입이 확정되는 Go의 정적 타입 시스템을 넘어, 런타임에 동적으로 타입과 값을 다룰 수 있게 해준다.

Go 공식 블로그의 [The Laws of Reflection](https://go.dev/blog/laws-of-reflection)에서는 리플렉션의 세 가지 법칙을 다음과 같이 정의한다:

1. **Reflection goes from interface value to reflection object** — `reflect.TypeOf()`와 `reflect.ValueOf()`로 인터페이스 값에서 리플렉션 객체를 얻는다
2. **Reflection goes from reflection object to interface value** — `Interface()` 메서드로 리플렉션 객체에서 인터페이스 값을 복원한다
3. **To modify a reflection object, the value must be settable** — 값을 수정하려면 포인터를 통해 접근해야 한다

리플렉션은 `encoding/json`, GORM, Validator 등 다양한 라이브러리의 핵심 기술이다. 이 글에서는 `reflect` 패키지의 핵심 API를 예제와 함께 살펴보고, 실무에서의 활용 사례와 성능 특성을 알아본다.

## 2. reflect 핵심 API

### 2.1 Type, Value, Kind

`reflect` 패키지의 가장 기본적인 함수는 `TypeOf()`와 `ValueOf()`이다.

| 함수 | 반환 타입 | 설명 |
|---|---|---|
| `reflect.TypeOf(x)` | `reflect.Type` | 변수의 타입 정보 (이름, 크기, 메서드 등) |
| `reflect.ValueOf(x)` | `reflect.Value` | 변수의 값 정보 (읽기, 수정, 변환 등) |
| `Kind()` | `reflect.Kind` | 기본 타입 구분 (Struct, Slice, Map, Ptr 등) |

```go
// reflect_test.go
type Foo struct {
    x int
    y float64
    z string
}

foo := Foo{x: 1, y: 1.0, z: "str"}

fmt.Printf("foo: %v(%v)\n", reflect.ValueOf(foo), reflect.TypeOf(foo))
// foo: {1 1 str}(go_reflect.Foo)

fmt.Printf("x: %v(%v)\n", reflect.ValueOf(foo.x).Int(), reflect.TypeOf(foo.x))
// x: 1(int)
```

`Kind()`는 사용자 정의 타입과 기본 타입을 구분할 때 유용하다. 예를 들어 `type MyString string`의 `TypeOf()`는 `MyString`이지만, `Kind()`는 `reflect.String`을 반환한다.

```go
var f float64 = 1.3
typ := reflect.TypeOf(f)
val := reflect.ValueOf(f)

fmt.Println(typ.Name())                    // float64
fmt.Println(typ.Size())                    // 8
fmt.Println(typ.Kind() == reflect.Float64) // true
fmt.Println(val.Float())                   // 1.3
```

### 2.2 구조체 필드 순회와 태그 읽기

구조체의 필드 정보를 순회하며 이름, 타입, 값, 태그를 읽을 수 있다.

```go
// model/animal.go
type Cat struct {
    Name  string   `custom:"name"`
    Age   int      `custom:"age"`
    Child []string `custom:"child"`
}
```

`NumField()`로 필드 개수를 얻고, `Field(i)`로 각 필드에 접근한다. `Tag.Get()`으로 구조체 태그를 읽는다.

```go
// reflect_test.go
func IterateStructField(object interface{}) {
    elem := reflect.ValueOf(object).Elem()
    fieldNum := elem.NumField()
    for i := 0; i < fieldNum; i++ {
        field := elem.Field(i)
        fieldType := elem.Type().Field(i)
        fieldValue := field.Interface()
        tag := fieldType.Tag.Get("custom")

        fmt.Printf("Name: %s / Type: %s / Value: %v / Tag: %s\n",
            fieldType.Name, fieldType.Type, fieldValue, tag)
    }
}

cat := &Cat{Name: "nabi", Age: 5, Child: []string{"nyang", "kong"}}
IterateStructField(cat)
// Name: Name / Type: string / Value: nabi / Tag: name
// Name: Age / Type: int / Value: 5 / Tag: age
// Name: Child / Type: []string / Value: [nyang kong] / Tag: child
```

이름으로 특정 필드에 접근할 때는 `FieldByName()`을 사용한다.

```go
type ArticleRequest struct {
    Title string `json:"title" validate:"required"`
    Body  string `json:"body" validate:"required"`
}

a := ArticleRequest{Title: "title1", Body: "this is a test"}
uType := reflect.TypeOf(a)

if fName, ok := uType.FieldByName("Title"); ok {
    fmt.Println(fName.Type, fName.Name, fName.Tag)
    // string Title json:"title" validate:"required"
}
```

### 2.3 값 수정하기

리플렉션으로 값을 수정하려면 **포인터**를 통해 접근해야 한다. `CanSet()`으로 수정 가능 여부를 확인할 수 있다.

```go
// reflect_test.go
// 슬라이스 요소 수정 — 슬라이스 내부 요소는 직접 수정 가능
languages := []string{"golang", "java", "c++"}
sliceValue := reflect.ValueOf(languages)
value := sliceValue.Index(1)
value.SetString("ruby")
fmt.Println(languages) // [golang ruby c++]

// 일반 변수 수정 — 포인터 필요
x := 1
if v := reflect.ValueOf(x); v.CanSet() {
    v.SetInt(2) // 호출되지 않음 — 값 복사본이라 수정 불가
}
fmt.Println(x) // 1

// 포인터를 통한 수정
v := reflect.ValueOf(&x)
p := v.Elem() // Elem()으로 포인터가 가리키는 값에 접근
p.SetInt(3)
fmt.Println(x) // 3
```

리플렉션의 세 번째 법칙이 여기에 해당한다. `reflect.ValueOf(x)`는 값의 복사본을 다루므로 수정할 수 없고, `reflect.ValueOf(&x).Elem()`처럼 포인터를 통해야 원본 값을 수정할 수 있다.

### 2.4 동적 함수/메서드 호출

`reflect.ValueOf()`로 함수 값을 얻고, `Call()`로 동적 호출할 수 있다.

```go
// reflect_test.go
caption := "go is an open source programming language"

// 1. 직접 호출
title := TitleCase(caption)
fmt.Println(title) // Go Is An Open Source Programming Language

// 2. 동적 호출
titleFuncValue := reflect.ValueOf(TitleCase)
values := titleFuncValue.Call([]reflect.Value{reflect.ValueOf(caption)})
title = values[0].String()
fmt.Println(title) // Go Is An Open Source Programming Language
```

`MethodByName()`으로 구조체의 메서드를 이름으로 조회하여 호출할 수도 있다.

```go
// 범용 Len 함수 — 다양한 타입의 길이를 동적으로 구하기
func Len(x interface{}) int {
    value := reflect.ValueOf(x)
    switch reflect.TypeOf(x).Kind() {
    case reflect.Array, reflect.Chan, reflect.Map, reflect.Slice, reflect.String:
        return value.Len()
    default:
        if method := value.MethodByName("Len"); method.IsValid() {
            values := method.Call(nil)
            return int(values[0].Int())
        }
    }
    panic(fmt.Sprintf("'%v' does not have a length", x))
}

list1 := list.New()           // Len() == 0
mapStringInt := map[string]int{"A": 1, "B": 2}  // len() == 2
str := "one"                  // len() == 3

fmt.Println(Len(list1), Len(mapStringInt), Len(str))
// 0 2 3
```

## 3. reflect.DeepEqual과 비교 패턴

### 3.1 DeepEqual

`reflect.DeepEqual()`은 구조체, 슬라이스, 맵 등 복합 타입을 **깊은 비교(deep comparison)**할 때 사용한다. 두 값의 모든 필드와 요소를 재귀적으로 비교한다.

```go
s1 := BenchStruct{Name: "Go", Age: 10}
s2 := BenchStruct{Name: "Go", Age: 10}

// 필드별 비교
s1.Name == s2.Name && s1.Age == s2.Age // true

// DeepEqual로 비교
reflect.DeepEqual(s1, s2) // true
```

### 3.2 IsZero와 빈 구조체 감지

`reflect.Value.IsZero()`는 값이 해당 타입의 제로값인지 확인한다. 이를 활용하면 구조체의 모든 필드가 비어 있는지 확인할 수 있다.

```go
// reflect_test.go
func isAllFieldEmpty(inter any) bool {
    val := reflect.ValueOf(inter)
    if val.IsZero() {
        return true
    }

    switch val.Kind() {
    case reflect.Struct:
        for i := 0; i < val.NumField(); i++ {
            field := val.Field(i)
            zeroValue := reflect.Zero(field.Type())
            if reflect.DeepEqual(field.Interface(), zeroValue.Interface()) {
                continue
            }
            return false
        }
    }
    return true
}

type person struct {
    Name    string
    Age     int
    Address struct {
        City string
        Zip  int
    }
}

p1 := person{Address: struct{ City string; Zip int }{City: "seoul"}}
p2 := person{}

isAllFieldEmpty(p1) // false — City에 "seoul" 값이 있음
isAllFieldEmpty(p2) // true — 모든 필드가 제로값
```

### 3.3 테스트에서의 활용

`reflect.DeepEqual()`은 테스트에서 복잡한 구조체의 동등성을 비교할 때 특히 유용하다. `testify` 같은 라이브러리의 `assert.Equal()`도 내부적으로 `reflect.DeepEqual()`을 사용한다.

```go
// testify의 assert.Equal 내부 구현
func ObjectsAreEqual(expected, actual interface{}) bool {
    if expected == nil || actual == nil {
        return expected == actual
    }
    return reflect.DeepEqual(expected, actual)
}
```

## 4. 실무 라이브러리 사용 사례

많은 Go 라이브러리가 `reflect` 패키지를 핵심 기술로 사용한다. 공통 패턴은 **구조체 태그 파싱 + 필드 순회**이다.

### 4.1 encoding/json

`encoding/json`은 구조체 태그를 읽어 JSON 키를 결정한다.

```go
type User struct {
    Name  string `json:"name"`
    Email string `json:"email,omitempty"`
    Age   int    `json:"-"`  // JSON에서 제외
}

// 내부적으로 reflect를 사용하여:
// 1. 구조체 필드를 순회 (NumField, Field)
// 2. json 태그를 파싱 (Tag.Get("json"))
// 3. 필드 값을 읽어 JSON으로 변환 (Field.Interface())
```

### 4.2 GORM

GORM은 구조체를 데이터베이스 테이블에 매핑할 때 리플렉션을 사용한다.

```go
type Product struct {
    gorm.Model
    Code  string `gorm:"column:code;uniqueIndex"`
    Price uint   `gorm:"column:price"`
}

// GORM 내부에서:
// 1. 구조체 이름 → 테이블명 (reflect.TypeOf → "products")
// 2. 필드 이름 → 컬럼명 (FieldByName, Tag.Get("gorm"))
// 3. 필드 값 → SQL 파라미터 (Field.Interface())
```

### 4.3 go-playground/validator

`validator`는 구조체 태그 기반으로 유효성을 검증한다.

```go
type LoginRequest struct {
    Email    string `validate:"required,email"`
    Password string `validate:"required,min=8"`
}

validate := validator.New()
err := validate.Struct(loginReq)

// validator 내부에서:
// 1. 구조체 필드를 순회
// 2. validate 태그를 파싱 (Tag.Get("validate"))
// 3. 각 규칙(required, email, min 등)에 대해 필드 값 검증
```

이 세 라이브러리 모두 **구조체 태그를 파싱하고 필드를 순회하는 동일한 리플렉션 패턴**을 사용하고 있다.

## 5. 성능 벤치마크

리플렉션은 편리하지만 성능 비용이 따른다. Go 격언에도 **"리플렉션이 필요하다면 설계를 재고하라(Clear is better than clever)"**라는 말이 있다. 실제 벤치마크를 통해 직접 접근과 리플렉션의 성능 차이를 확인해 보자.

> 벤치마크 코드: [benchmark_test.go](https://github.com/kenshin579/tutorials-go/blob/master/golang/reflect/benchmark_test.go)

### 5.1 벤치마크 코드

```go
// benchmark_test.go
type BenchStruct struct {
    Name string
    Age  int
}

func (b BenchStruct) GetName() string {
    return b.Name
}

// 필드 읽기: 직접 접근 vs reflect
func BenchmarkFieldDirect(b *testing.B) {
    s := BenchStruct{Name: "Go", Age: 10}
    var name string
    for i := 0; i < b.N; i++ {
        name = s.Name
    }
    _ = name
}

func BenchmarkFieldReflect(b *testing.B) {
    s := BenchStruct{Name: "Go", Age: 10}
    v := reflect.ValueOf(s)
    var name string
    for i := 0; i < b.N; i++ {
        name = v.Field(0).String()
    }
    _ = name
}
```

### 5.2 벤치마크 결과

`go test -bench=. -benchmem` 실행 결과 (Apple M4 Pro 기준):

| 연산 | 직접 접근 | reflect | 배율 | 메모리 할당 |
|---|---|---|---|---|
| **필드 읽기** | 0.24 ns/op | 1.34 ns/op | **~6x** | 0 allocs |
| **메서드 호출** | 0.23 ns/op | 97.78 ns/op | **~425x** | 3 allocs/op |
| **구조체 생성** | 0.23 ns/op | 15.56 ns/op | **~68x** | 1 alloc/op |
| **동등 비교** | 0.23 ns/op | 22.60 ns/op | **~98x** | 0 allocs |

핵심 결론:

- **필드 읽기**는 약 6배 느리지만, 절대 시간은 1.34ns로 대부분의 애플리케이션에서 무시할 수 있는 수준이다
- **메서드 호출**은 약 425배 느리며 메모리 할당도 발생한다. 핫 루프에서는 피하는 것이 좋다
- **구조체 생성**은 약 68배 느리다. 대량 생성이 필요한 경우 직접 생성을 사용하자
- **DeepEqual**은 약 98배 느리다. 성능이 중요한 곳에서는 필드별 직접 비교가 유리하다

## 6. 마무리

`reflect` 패키지는 Go에서 런타임 타입 정보를 다루는 유일한 방법이다. 핵심 내용을 정리하면:

- `TypeOf()`와 `ValueOf()`로 타입과 값 정보를 얻는다
- 구조체 필드 순회와 태그 읽기는 라이브러리 개발의 핵심 패턴이다
- 값을 수정하려면 반드시 포인터를 통해 접근해야 한다
- `DeepEqual()`과 `IsZero()`는 테스트와 유효성 검증에 유용하다
- `encoding/json`, GORM, Validator 등 주요 라이브러리가 리플렉션을 활용한다
- 리플렉션은 성능 비용이 따르므로, 꼭 필요한 경우에만 사용하자

## 7. 참고

- [The Laws of Reflection - Go Blog](https://go.dev/blog/laws-of-reflection)
- [reflect 패키지 - Go 공식 문서](https://pkg.go.dev/reflect)
- [Go Proverbs](https://go-proverbs.github.io/)
- [tutorials-go/golang/reflect - GitHub](https://github.com/kenshin579/tutorials-go/tree/master/golang/reflect)
