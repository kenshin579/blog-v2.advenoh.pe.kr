# AI 기반 카테고리 분류 시스템 - 구현 문서

> **Note**: OpenAI Python SDK 최신 코드는 [Context7](https://context7.com/openai/openai-python)에서 확인

## 1. 파일 구조

```
scripts/news/
├── category/
│   ├── __init__.py
│   ├── categorizer.py        # 기존 키워드 매칭 (fallback용)
│   └── ai_categorizer.py     # 🆕 AI 분류 모듈
├── categories.yaml           # 카테고리 정의
├── main.py                   # AI 분류 호출로 변경
└── pyproject.toml            # openai, pydantic 의존성 추가
```

---

## 2. ai_categorizer.py 구현

### 2.1 전체 구조 (Pydantic 모델 사용)

> OpenAI SDK v1.0+에서는 `client.chat.completions.parse()`와 Pydantic 모델을 사용하여
> 타입 안전한 구조화된 출력을 받을 수 있습니다.

```python
"""OpenAI GPT 기반 카테고리 분류 모듈"""

from typing import Literal
from pydantic import BaseModel
from openai import OpenAI

from .categorizer import categorize_articles, load_categories

# 상수
MODEL = "gpt-5.1"
BATCH_SIZE = 30
TEMPERATURE = 0.1

# 카테고리 타입 정의
CategoryType = Literal["Cloud & Infra", "AI / ML", "Development", "Security", "Misc"]


# Pydantic 모델 정의 (구조화된 출력)
class Classification(BaseModel):
    index: int
    category: CategoryType


class ClassificationResponse(BaseModel):
    classifications: list[Classification]


# 프롬프트
SYSTEM_PROMPT = """당신은 IT 뉴스 카테고리 분류 전문가입니다.
주어진 글 제목들을 분석하여 가장 적절한 카테고리로 분류해주세요.

분류 기준:
- Cloud & Infra: 클라우드(AWS/GCP/Azure), 인프라, DevOps, Kubernetes, Docker, CI/CD
- AI / ML: 인공지능, 머신러닝, LLM, AI 코딩 도구(Copilot, Cursor, Claude Code 등)
- Development: 프로그래밍 언어, 프레임워크, 백엔드/프론트엔드, 데이터베이스, 코드 품질
- Security: 보안, 취약점, 인증, 암호화
- Misc: 위 카테고리에 해당하지 않는 글 (커리어, 에세이, 일반 뉴스 등)

주의사항:
- 제목의 핵심 주제를 파악하여 분류
- 여러 주제가 섞인 경우 가장 핵심적인 주제로 분류
- 확실하지 않은 경우 Misc로 분류"""
```

### 2.2 핵심 함수 (Structured Output 사용)

```python
def categorize_with_ai(articles: list[dict]) -> list[dict]:
    """
    OpenAI API를 사용하여 글 목록을 카테고리로 분류

    Args:
        articles: 분류할 글 목록 [{"title": "...", "url": "..."}]

    Returns:
        카테고리가 할당된 글 목록
    """
    if not articles:
        return articles

    client = OpenAI()
    categories = load_categories()
    category_map = {cat["name"]: cat["emoji"] for cat in categories}

    # 배치 처리
    for i in range(0, len(articles), BATCH_SIZE):
        batch = articles[i:i + BATCH_SIZE]
        _classify_batch(client, batch, category_map)

    return articles


def _classify_batch(client: OpenAI, articles: list[dict], category_map: dict) -> None:
    """배치 단위로 AI 분류 수행 (in-place 수정)"""
    # User prompt 생성
    titles = "\n".join(
        f'{idx + 1}. "{a["title"]}"'
        for idx, a in enumerate(articles)
    )

    user_prompt = f"""다음 IT 뉴스 글들을 카테고리로 분류해주세요.

글 목록:
{titles}"""

    # API 호출 (Pydantic 모델로 자동 파싱)
    completion = client.chat.completions.parse(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        response_format=ClassificationResponse,
        temperature=TEMPERATURE
    )

    # 응답 처리
    message = completion.choices[0].message
    if message.parsed:
        _apply_classifications(message.parsed, articles, category_map)
    else:
        # 거부된 경우 모두 Misc로
        print(f"[Warning] AI 분류 거부: {message.refusal}")
        _set_all_misc(articles, category_map)


def _apply_classifications(
    response: ClassificationResponse,
    articles: list[dict],
    category_map: dict
) -> None:
    """파싱된 응답을 articles에 적용 (in-place 수정)"""
    for item in response.classifications:
        idx = item.index - 1  # 1-indexed → 0-indexed
        if 0 <= idx < len(articles):
            articles[idx]["category"] = item.category
            articles[idx]["category_emoji"] = category_map.get(item.category, "📌")

    # 분류되지 않은 글은 Misc로
    _set_all_misc(articles, category_map, only_missing=True)


def _set_all_misc(articles: list[dict], category_map: dict, only_missing: bool = False) -> None:
    """글들을 Misc로 설정"""
    for article in articles:
        if only_missing and "category" in article:
            continue
        article["category"] = "Misc"
        article["category_emoji"] = category_map.get("Misc", "📌")
```

### 2.3 Fallback 함수

```python
def categorize_with_fallback(articles: list[dict]) -> list[dict]:
    """AI 분류 실패 시 키워드 매칭으로 fallback"""
    try:
        return categorize_with_ai(articles)
    except Exception as e:
        print(f"[Warning] AI 분류 실패, 키워드 매칭으로 전환: {e}")
        return categorize_articles(articles)
```

---

## 3. main.py 수정

```python
# 기존 import
from category import categorize_articles

# 추가 import
from category.ai_categorizer import categorize_with_fallback

def main():
    # ... (기존 코드: RSS 수집, DB 필터링)

    # 카테고리 분류 (AI 우선, 실패 시 키워드 매칭)
    categorized = categorize_with_fallback(new_articles)
    print(f"분류 완료: {len(categorized)}개")

    # ... (기존 코드: Markdown 생성, DB 저장)
```

---

## 4. 환경 설정

### 4.1 의존성 추가

```toml
# scripts/news/pyproject.toml
[project]
dependencies = [
    "feedparser>=6.0.0",
    "requests>=2.31.0",
    "pyyaml>=6.0",
    "python-dateutil>=2.8.0",
    "beautifulsoup4>=4.12.0",
    "lxml>=5.0.0",
    "supabase>=2.0.0",
    "openai>=1.0.0",   # 🆕 추가
    "pydantic>=2.0.0", # 🆕 구조화된 출력용
]
```

### 4.2 환경 변수

```bash
# 로컬: ~/.zshrc
export OPENAI_API_KEY="sk-..."

# GitHub Action: Secrets
OPENAI_API_KEY=sk-...
```

### 4.3 GitHub Action 수정

```yaml
# .github/workflows/biweekly-news.yml
jobs:
  generate-news:
    runs-on: ubuntu-latest
    env:
      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

---

## 5. 에러 처리

| 상황 | 처리 방식 |
|-----|----------|
| API 호출 실패 | 키워드 매칭 fallback |
| Rate limit | 재시도 (exponential backoff) |
| 응답 파싱 실패 | 해당 글만 Misc로 분류 |
| API 키 없음 | 키워드 매칭 fallback |
| 잘못된 카테고리 응답 | Misc로 분류 |
