---
title: 모던 CSS 레이아웃 기법
date: 2024-10-12
excerpt: Grid와 Flexbox를 활용한 현대적인 CSS 레이아웃 구현 방법을 배웁니다.
tags: [CSS, 레이아웃, 프론트엔드]
---

## CSS Grid vs Flexbox

두 가지 강력한 레이아웃 시스템을 언제 사용해야 할까요?

## CSS Grid 기초

2차원 레이아웃을 위한 Grid:

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.item {
  grid-column: span 2;
}
```

## Flexbox 패턴

1차원 레이아웃을 위한 Flexbox:

```css
.flex-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
```

## 반응형 디자인

미디어 쿼리 없이 반응형 구현:

```css
.responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}
```
