# scripts/news 개선 구현 문서

## 수정 파일 목록

| 파일 | 수정 내용 |
|------|----------|
| `scripts/news/markdown/generator.py` | `get_output_path()` 함수 경로 변경 |
| `scripts/news/main.py` | `merge_small_categories()` 호출 제거 |

---

## 1. 출력 경로 변경

### 파일: `scripts/news/markdown/generator.py`

**변경 전 (89-99줄):**
```python
def get_output_path(end_date: datetime) -> str:
    date_str = end_date.strftime("%Y-%m-%d")
    return f"contents/news/biweekly-news-{date_str}/index.md"
```

**변경 후:**
```python
def get_output_path(end_date: datetime, base_dir: str = "") -> str:
    date_str = end_date.strftime("%Y-%m-%d")
    if base_dir:
        return f"{base_dir}/contents/biweekly/news-{date_str}/index.md"
    return f"contents/biweekly/news-{date_str}/index.md"
```

### 파일: `scripts/news/main.py`

`main()` 함수에서 프로젝트 루트 경로를 계산하여 전달:

```python
# 스크립트 위치 기준 프로젝트 루트 계산
script_dir = Path(__file__).parent
project_root = script_dir.parent.parent

# get_output_path 호출 시 project_root 전달
output_path = get_output_path(end_date, str(project_root))
```

---

## 2. 카테고리 병합 제거

### 파일: `scripts/news/main.py`

**변경 전 (56-57줄):**
```python
# 4. 작은 카테고리 통합 (5개 미만 → Misc)
categorized = merge_small_categories(categorized)
```

**변경 후:**
해당 2줄 삭제

**import 정리 (12줄):**
```python
# 변경 전
from category import categorize_articles, merge_small_categories

# 변경 후
from category import categorize_articles
```
