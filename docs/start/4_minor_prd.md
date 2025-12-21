# scripts/news 개선 요구사항

## 개요

`scripts/news` 스크립트의 출력 경로 및 카테고리 분류 로직 개선이 필요합니다.

---

## 요구사항

### 1. 출력 폴더 위치 및 이름 변경

**현재 동작:**
```
scripts/news/contents/news/biweekly-news-2025-12-22/index.md
```

**변경 요청:**
```
contents/biweekly/news-2025-12-22/index.md
```

**수정 사항:**
- 출력 경로가 프로젝트 루트의 `contents/` 디렉토리 하위에 생성되어야 함
- 폴더 구조 변경: `news/biweekly-news-{date}` → `biweekly/news-{date}`

**수정 대상 파일:**
- `scripts/news/markdown/generator.py`의 `get_output_path()` 함수

---

### 2. 카테고리 분류 결과가 파일에 정확히 반영되지 않는 문제

**현재 동작:**
로그에서는 4개 카테고리로 분류됨:
```
Categorized articles:
  - Misc: 28
  - AI / ML: 17
  - Development: 4
  - Cloud & Infra: 2
```

그러나 실제 생성된 파일에는 2개 카테고리만 존재:
- AI / ML (17개)
- Misc (34개 - 나머지 모두 병합됨)

**원인 분석:**
`main.py` 56-57줄의 `merge_small_categories()` 함수가 5개 미만인 카테고리를 Misc로 병합:
```python
# 4. 작은 카테고리 통합 (5개 미만 → Misc)
categorized = merge_small_categories(categorized)
```

Development(4개)와 Cloud & Infra(2개)가 5개 미만이므로 Misc로 병합됨.

**변경 요청:**
카테고리 병합 기능을 제거하고, 분류된 카테고리를 파일에 그대로 반영

**해결 방안:**
- `main.py`에서 `merge_small_categories()` 호출을 제거
- 분류된 모든 카테고리가 그대로 출력되도록 변경

**수정 대상 파일:**
- `scripts/news/main.py` (56-57줄의 `merge_small_categories()` 호출 제거)

---

## 관련 문서

- 구현 상세: [4_minor_implementation.md](./4_minor_implementation.md)
- TODO 체크리스트: [4_minor_todo.md](./4_minor_todo.md)
