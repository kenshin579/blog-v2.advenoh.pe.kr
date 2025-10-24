---
title: TypeScript 고급 타입 시스템 완벽 가이드
date: 2024-10-20
excerpt: TypeScript의 고급 타입 시스템을 활용하여 더 안전하고 표현력 있는 코드를 작성하는 방법을 알아봅니다.
tags: [TypeScript, 타입시스템, 프로그래밍]
series: TypeScript 마스터하기
seriesOrder: 1
---

## 소개

TypeScript는 JavaScript에 정적 타입을 추가한 언어입니다. 이 글에서는 고급 타입 시스템을 깊이 있게 다룹니다.

## 유니온 타입과 인터섹션 타입

유니온 타입은 여러 타입 중 하나를 나타냅니다:

```typescript
type ID = string | number;

function printId(id: ID) {
  console.log(`Your ID is: ${id}`);
}
```

인터섹션 타입은 여러 타입을 결합합니다:

```typescript
interface Colorful {
  color: string;
}

interface Circle {
  radius: number;
}

type ColorfulCircle = Colorful & Circle;
```

## 제네릭 타입

제네릭을 사용하면 재사용 가능한 컴포넌트를 만들 수 있습니다:

```typescript
function identity<T>(arg: T): T {
  return arg;
}

const output = identity<string>("myString");
```

## 조건부 타입

조건부 타입을 사용하면 타입 수준에서 조건 로직을 표현할 수 있습니다:

```typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<string>; // true
type B = IsString<number>; // false
```
