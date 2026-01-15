# AI 기반 카테고리 분류 시스템 PRD

## 1. 개요 (Overview)

기존 키워드 매칭 기반 카테고리 분류를 **OpenAI GPT 기반 AI 분류**로 전환하여 분류 정확도를 향상시키는 시스템.

### 1.1 현재 상황

| 항목 | 현재 상태 |
|-----|----------|
| 분류 방식 | 키워드 매칭 (`categorizer.py`) |
| Misc 비율 | 약 45% (부정확한 분류) |
| 문제점 | 키워드 누락, 문맥 이해 불가, 유지보수 부담 |

### 1.2 목표

- **Misc 비율**: 45% → 10% 이하
- **분류 정확도**: 90% 이상
- **유지보수**: 키워드 수동 추가 불필요

---

## 2. 기능 요구사항 (Functional Requirements)

### 2.1 AI 분류 모듈 구현

#### 파일 구조
```
scripts/news/
├── category/
│   ├── categorizer.py        # 기존 (fallback용 유지)
│   └── ai_categorizer.py     # 🆕 AI 분류 모듈
├── categories.yaml           # 카테고리 정의 (키워드 제거 가능)
└── main.py                   # AI 분류 호출로 변경
```

#### 핵심 함수
```python
# ai_categorizer.py

def categorize_with_ai(
    articles: list[dict],
    categories: list[str]
) -> list[dict]:
    """
    OpenAI API를 사용하여 글 목록을 카테고리로 분류

    Args:
        articles: 분류할 글 목록 [{"title": "...", "url": "..."}]
        categories: 사용 가능한 카테고리 목록

    Returns:
        카테고리가 할당된 글 목록
    """
```

### 2.2 OpenAI API 연동

#### 사용 모델

> **선택 모델**: `gpt-5.1` (2025년 하반기 출시)
> - GPT-4o 대비 환각 45% 감소, 문맥 이해력 향상
> - Instant 버전: 빠른 응답, 간단한 작업에 최적
> - Thinking 버전: 복잡한 추론 필요 시

| 모델 | 특징 | 권장 용도 |
|-----|------|----------|
| `gpt-5.1` | 균형 잡힌 성능, 빠른 응답 | ✅ 카테고리 분류 (권장) |
| `gpt-5.2` | 최신, 최고 성능 | 복잡한 추론 작업 |
| `gpt-4o-mini` | 저렴, 기본 성능 | Fallback용 |

#### API 호출 방식
```python
from openai import OpenAI

client = OpenAI()

response = client.chat.completions.create(
    model="gpt-5.1",
    messages=[
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt}
    ],
    response_format={"type": "json_object"},
    temperature=0.1  # 일관성 있는 분류
)
```

### 2.3 프롬프트 설계

#### System Prompt
```
당신은 IT 뉴스 카테고리 분류 전문가입니다.
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
- 확실하지 않은 경우 Misc로 분류
```

#### User Prompt
```
다음 IT 뉴스 글들을 카테고리로 분류해주세요.

글 목록:
1. "2026년 프론트엔드 트렌드 총정리: 언어·인프라·AI"
2. "파파고 vs 구글, AI가 보기엔 누가 더 번역을 잘할까?"
3. "인상적인 프로젝트 만들려면 FastAPI 꼭 써보세요"
...

JSON 형식으로 응답해주세요:
{
  "classifications": [
    {"index": 1, "category": "Development"},
    {"index": 2, "category": "AI / ML"},
    {"index": 3, "category": "Development"}
  ]
}
```

### 2.4 배치 처리

#### 비용 최적화
- **배치 크기**: 한 번에 최대 30개 글 처리
- **토큰 절약**: 글 제목만 전송 (URL, 본문 제외)
- **캐싱**: DB에 이미 분류된 URL은 재분류하지 않음 (기존 로직 활용)

```python
BATCH_SIZE = 30

def categorize_batch(articles: list[dict]) -> list[dict]:
    """배치 단위로 AI 분류 수행"""
    results = []
    for i in range(0, len(articles), BATCH_SIZE):
        batch = articles[i:i + BATCH_SIZE]
        classified = call_openai_api(batch)
        results.extend(classified)
    return results
```

### 2.5 에러 처리 및 Fallback

```python
def categorize_with_fallback(articles: list[dict]) -> list[dict]:
    """AI 분류 실패 시 키워드 매칭으로 fallback"""
    try:
        return categorize_with_ai(articles)
    except Exception as e:
        print(f"[Warning] AI 분류 실패, 키워드 매칭으로 전환: {e}")
        return categorize_articles(articles)  # 기존 함수
```

#### 예외 처리 시나리오
| 상황 | 처리 방식 |
|-----|----------|
| API 호출 실패 | 키워드 매칭 fallback |
| Rate limit | 재시도 (exponential backoff) |
| 응답 파싱 실패 | 해당 글만 Misc로 분류 |
| API 키 없음 | 키워드 매칭 fallback |

---

## 3. 환경 설정

### 3.1 환경 변수

```bash
# ~/.zshrc 또는 GitHub Secrets
export OPENAI_API_KEY="sk-..."
```

### 3.2 의존성 추가

```toml
# scripts/news/pyproject.toml
[project]
dependencies = [
    # 기존 의존성...
    "openai>=1.0.0",
]
```

### 3.3 GitHub Action 설정

```yaml
# .github/workflows/biweekly-news.yml
env:
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

---

## 4. 구현 세부사항

### 4.1 카테고리 정의 수정

```yaml
# categories.yaml (간소화)
categories:
  - name: Cloud & Infra
    emoji: "☁️"
    description: "클라우드, 인프라, DevOps, Kubernetes, Docker"

  - name: AI / ML
    emoji: "🤖"
    description: "인공지능, 머신러닝, LLM, AI 코딩 도구"

  - name: Development
    emoji: "💻"
    description: "프로그래밍, 프레임워크, 데이터베이스, 코드 품질"

  - name: Security
    emoji: "🔒"
    description: "보안, 취약점, 인증"

  - name: Misc
    emoji: "📌"
    description: "기타 (커리어, 에세이, 일반 뉴스)"
```

> **Note**: `keywords` 필드는 fallback용으로 유지하거나 제거 가능

### 4.2 main.py 수정

```python
# main.py (변경 부분)

from category import categorize_articles  # 기존
from category.ai_categorizer import categorize_with_ai  # 🆕

def main():
    # ... (기존 코드: RSS 수집, DB 필터링)

    # 3. 카테고리 분류 (AI 사용)
    try:
        categorized = categorize_with_ai(new_articles)
        print("AI 분류 완료")
    except Exception as e:
        print(f"AI 분류 실패, 키워드 매칭 사용: {e}")
        categorized = categorize_articles(new_articles)

    # ... (기존 코드: Markdown 생성, DB 저장)
```

### 4.3 응답 파싱

```python
import json

def parse_ai_response(response_text: str, articles: list[dict]) -> list[dict]:
    """AI 응답을 파싱하여 articles에 카테고리 할당"""
    data = json.loads(response_text)
    classifications = data.get("classifications", [])

    for item in classifications:
        idx = item["index"] - 1  # 1-indexed → 0-indexed
        if 0 <= idx < len(articles):
            articles[idx]["category"] = item["category"]
            articles[idx]["category_emoji"] = get_emoji(item["category"])

    # 분류되지 않은 글은 Misc로
    for article in articles:
        if "category" not in article:
            article["category"] = "Misc"
            article["category_emoji"] = "📌"

    return articles
```

---

## 5. 테스트 계획

### 5.1 단위 테스트

```python
# tests/test_ai_categorizer.py

def test_categorize_development_article():
    articles = [{"title": "FastAPI로 REST API 만들기", "url": "..."}]
    result = categorize_with_ai(articles)
    assert result[0]["category"] == "Development"

def test_categorize_ai_article():
    articles = [{"title": "클로드 코드로 개발하기", "url": "..."}]
    result = categorize_with_ai(articles)
    assert result[0]["category"] == "AI / ML"

def test_fallback_on_api_error():
    # API 키 없이 호출 시 fallback 동작 확인
    ...
```

### 5.2 통합 테스트

```bash
# 실제 데이터로 테스트
cd scripts/news
python -c "
from category.ai_categorizer import categorize_with_ai

test_articles = [
    {'title': '2026년 프론트엔드 트렌드: 언어·인프라·AI', 'url': 'test1'},
    {'title': '클로드 코드로 3일 만에 서비스 복구', 'url': 'test2'},
    {'title': 'strcpy도 사용 금지', 'url': 'test3'},
]

result = categorize_with_ai(test_articles)
for r in result:
    print(f'{r[\"category\"]}: {r[\"title\"]}')
"
```

---

## 6. 비용 분석

### 6.1 예상 비용

| 항목 | 계산 | 비용 |
|-----|------|------|
| 2주당 글 수 | ~30개 | - |
| 입력 토큰 | 프롬프트 500 + 제목 30×20 = 1,100 | - |
| 출력 토큰 | JSON 응답 ~500 | - |
| gpt-5.1 비용 | 입력 + 출력 (예상) | ~$0.005 |
| **월간 비용** | 2회 × $0.005 | **~$0.01** |

> **Note**: GPT-5.1 가격은 공식 발표 기준으로 업데이트 필요

### 6.2 비용 절감 방안

1. **배치 처리**: 개별 호출 대신 한 번에 여러 글 처리
2. **캐싱**: 동일 URL 재분류 방지 (DB 활용)
3. **Fallback 전략**: API 실패 시 gpt-4o-mini로 대체

---

## 7. 마이그레이션 계획

### 7.1 단계별 진행

| 단계 | 작업 | 상태 |
|-----|------|------|
| 1 | PRD 작성 | ✅ 완료 |
| 2 | `ai_categorizer.py` 모듈 구현 | 🔲 예정 |
| 3 | 프롬프트 최적화 및 테스트 | 🔲 예정 |
| 4 | `main.py` 통합 | 🔲 예정 |
| 5 | GitHub Action 환경변수 추가 | 🔲 예정 |
| 6 | 실제 데이터로 테스트 | 🔲 예정 |
| 7 | 운영 배포 | 🔲 예정 |

### 7.2 롤백 계획

- AI 분류 실패 시 자동으로 키워드 매칭 fallback
- `categories.yaml`의 keywords 유지하여 언제든 복구 가능
- 환경변수 `USE_AI_CATEGORIZER=false`로 비활성화 가능

---

## 8. 성공 지표

| 지표 | 현재 | 목표 |
|-----|------|------|
| Misc 비율 | 45% | 10% 이하 |
| 분류 정확도 (수동 검토) | ~60% | 90% 이상 |
| API 비용 (월) | $0 | $0.01 이하 |
| 분류 소요 시간 | 즉시 | 5초 이내 |

---

## 9. 참고 자료

- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [OpenAI Python SDK](https://github.com/openai/openai-python)
- [Introducing GPT-5.1 | OpenAI](https://openai.com/index/gpt-5-1/)
- [JSON Mode](https://platform.openai.com/docs/guides/json-mode)
- 기존 분류 로직: `scripts/news/category/categorizer.py`
- 카테고리 정의: `scripts/news/categories.yaml`
