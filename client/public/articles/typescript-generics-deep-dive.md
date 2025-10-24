---
title: TypeScript 제네릭 심화 학습
date: 2024-10-10
excerpt: TypeScript 제네릭의 고급 사용법과 실전 예제를 통해 타입 안정성을 극대화합니다.
tags: [TypeScript, 제네릭, 고급]
series: TypeScript 마스터하기
seriesOrder: 2
---

## 제네릭의 힘

제네릭은 TypeScript의 가장 강력한 기능 중 하나입니다.

## 제네릭 제약 조건

타입 매개변수에 제약을 걸 수 있습니다:

```typescript
interface Lengthwise {
  length: number;
}

function logLength<T extends Lengthwise>(arg: T): T {
  console.log(arg.length);
  return arg;
}
```

## 제네릭 클래스

재사용 가능한 클래스 구현:

```typescript
class GenericStack<T> {
  private items: T[] = [];

  push(item: T) {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }
}
```
