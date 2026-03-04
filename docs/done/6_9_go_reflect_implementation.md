# Reflect 패키지 이해하기 - 구현 문서

> PRD: `6_9_go_reflect_prd.md`

---

## 1. 작업 범위

- 기존 코드(`tutorials-go/golang/reflect/`)에서 핵심 발췌하여 블로그 글 작성
- `benchmark_test.go` 신규 작성 (reflect vs 직접 접근 벤치마크)
- `reflect.DeepEqual` 예제 보강 필요 시 기존 테스트에 추가

---

## 2. 블로그 글 구성

### 2.1 글 위치

**경로**: `blog-v2.advenoh.pe.kr/docs/start/go-reflect-패키지-이해하기/index.md`

### 2.2 참조할 소스 코드 (핵심 발췌)

| 섹션 | 참조 파일/함수 | 발췌 포인트 |
|---|---|---|
| §2 Type, Value, Kind | `Example_Type_Value_정보_확인` | TypeOf, ValueOf, Kind 기본 사용법 |
| §3 구조체 필드/태그 | `Example_Struct_Type_Value_메타_정보_확인`, `TestCatFieldLoop` | NumField, FieldByName, Tag.Get |
| §4 값 수정 | `Example_Value_변경` | CanSet, Elem, SetString, SetInt |
| §5 동적 호출 | `Example_Method_동적_호출`, `Example_Len` | MethodByName, Call |
| §6 DeepEqual | `Test_isAllFieldEmptyForStruct` | DeepEqual, IsZero, 테스트 활용 |
| §7 실무 사례 | — (설명 위주) | encoding/json, GORM, Validator의 reflect 사용 패턴 |
| §8 벤치마크 | `benchmark_test.go` (신규) | 필드 읽기/메서드 호출/구조체 생성 비교 |

### 2.3 벤치마크 코드 (신규 작성)

**파일**: `tutorials-go/golang/reflect/benchmark_test.go`

```go
package reflect_test

import (
    "reflect"
    "testing"
)

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
    for i := 0; i < b.N; i++ {
        _ = s.Name
    }
}

func BenchmarkFieldReflect(b *testing.B) {
    s := BenchStruct{Name: "Go", Age: 10}
    v := reflect.ValueOf(s)
    for i := 0; i < b.N; i++ {
        _ = v.Field(0).String()
    }
}

// 메서드 호출: 직접 호출 vs reflect
func BenchmarkMethodDirect(b *testing.B) {
    s := BenchStruct{Name: "Go", Age: 10}
    for i := 0; i < b.N; i++ {
        _ = s.GetName()
    }
}

func BenchmarkMethodReflect(b *testing.B) {
    s := BenchStruct{Name: "Go", Age: 10}
    v := reflect.ValueOf(s)
    method := v.MethodByName("GetName")
    for i := 0; i < b.N; i++ {
        _ = method.Call(nil)
    }
}

// 구조체 생성: 리터럴 vs reflect.New
func BenchmarkCreateDirect(b *testing.B) {
    for i := 0; i < b.N; i++ {
        _ = BenchStruct{Name: "Go", Age: 10}
    }
}

func BenchmarkCreateReflect(b *testing.B) {
    t := reflect.TypeOf(BenchStruct{})
    for i := 0; i < b.N; i++ {
        _ = reflect.New(t).Elem()
    }
}
```

### 2.4 frontmatter

```yaml
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
```
