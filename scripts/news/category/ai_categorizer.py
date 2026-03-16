"""OpenAI GPT 기반 카테고리 분류 모듈"""

import os
from typing import Literal

from openai import OpenAI
from pydantic import BaseModel

from .categorizer import categorize_articles, load_categories

# 상수
MODEL = "gpt-4o-mini"  # gpt-5.1이 없으면 gpt-4o-mini 사용
BATCH_SIZE = 30
TEMPERATURE = 0.1

# 환경 변수 이름
ENV_API_KEY = "BLOGV2_OPENAI_API_KEY"

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
- AI / ML: 인공지능, 머신러닝, LLM, AI 코딩 도구(Copilot, Cursor, Claude Code, Gemini CLI, Gemini Code Assist 등), MCP(Model Context Protocol), AI 에이전트
- Development: 프로그래밍 언어, 프레임워크, 백엔드/프론트엔드, 데이터베이스, 코드 품질
- Security: 보안, 취약점, 인증, 암호화
- Misc: 위 카테고리에 해당하지 않는 글 (커리어, 에세이, 일반 뉴스 등)

주의사항:
- 제목의 핵심 주제를 파악하여 분류
- 여러 주제가 섞인 경우 가장 핵심적인 주제로 분류
- 확실하지 않은 경우 Misc로 분류"""


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

    # API 키 확인
    api_key = os.environ.get(ENV_API_KEY)
    if not api_key:
        raise ValueError(f"환경 변수 {ENV_API_KEY}가 설정되지 않았습니다.")

    client = OpenAI(api_key=api_key)
    categories = load_categories()
    category_map = {cat["name"]: cat["emoji"] for cat in categories}

    # 배치 처리
    for i in range(0, len(articles), BATCH_SIZE):
        batch = articles[i : i + BATCH_SIZE]
        _classify_batch(client, batch, category_map)

    return articles


def _classify_batch(
    client: OpenAI, articles: list[dict], category_map: dict
) -> None:
    """배치 단위로 AI 분류 수행 (in-place 수정)"""
    # User prompt 생성
    titles = "\n".join(
        f'{idx + 1}. "{a["title"]}"' for idx, a in enumerate(articles)
    )

    user_prompt = f"""다음 IT 뉴스 글들을 카테고리로 분류해주세요.

글 목록:
{titles}"""

    # API 호출 (Pydantic 모델로 자동 파싱)
    completion = client.beta.chat.completions.parse(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        response_format=ClassificationResponse,
        temperature=TEMPERATURE,
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
    category_map: dict,
) -> None:
    """파싱된 응답을 articles에 적용 (in-place 수정)"""
    for item in response.classifications:
        idx = item.index - 1  # 1-indexed → 0-indexed
        if 0 <= idx < len(articles):
            articles[idx]["category"] = item.category
            articles[idx]["category_emoji"] = category_map.get(item.category, "📌")

    # 분류되지 않은 글은 Misc로
    _set_all_misc(articles, category_map, only_missing=True)


def _set_all_misc(
    articles: list[dict], category_map: dict, only_missing: bool = False
) -> None:
    """글들을 Misc로 설정"""
    for article in articles:
        if only_missing and "category" in article:
            continue
        article["category"] = "Misc"
        article["category_emoji"] = category_map.get("Misc", "📌")


def categorize_with_fallback(articles: list[dict]) -> list[dict]:
    """AI 분류 실패 시 키워드 매칭으로 fallback"""
    try:
        return categorize_with_ai(articles)
    except Exception as e:
        print(f"[Warning] AI 분류 실패, 키워드 매칭으로 전환: {e}")
        return categorize_articles(articles)
