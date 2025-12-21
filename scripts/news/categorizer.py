"""카테고리 분류 모듈"""

from collections import Counter
from pathlib import Path

import yaml

# 최소 글 수 기준 (이 수 미만이면 Misc로 통합)
MIN_ARTICLES_PER_CATEGORY = 5


def load_categories(config_path: str | None = None) -> list[dict]:
    """카테고리 설정 파일 로드

    Args:
        config_path: 설정 파일 경로 (기본: config/categories.yaml)

    Returns:
        카테고리 목록
    """
    if config_path is None:
        config_path = Path(__file__).parent.parent.parent / "config" / "categories.yaml"

    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)
    return config.get("categories", [])


def categorize_article(
    title: str,
    tags: list[str],
    rss_categories: list[str],
    categories: list[dict],
) -> tuple[str, str]:
    """글 제목, RSS 태그, RSS 카테고리를 기반으로 카테고리 분류

    Args:
        title: 글 제목
        tags: RSS feed의 tags 필드 (각 사이트의 SEO 태그)
        rss_categories: RSS feed의 categories 필드
        categories: 분류 기준 카테고리 목록

    Returns:
        tuple[str, str]: (카테고리명, 이모지)
    """
    # 모든 정보를 하나의 텍스트로 결합
    text = (title + " " + " ".join(tags) + " " + " ".join(rss_categories)).lower()

    for category in categories:
        keywords = category.get("keywords", [])
        if keywords and any(keyword.lower() in text for keyword in keywords):
            return category["name"], category["emoji"]

    # 기본 카테고리 (Misc)
    misc = next((c for c in categories if c["name"] == "Misc"), None)
    if misc:
        return misc["name"], misc["emoji"]
    return "Misc", "📌"


def categorize_articles(
    articles: list[dict], config_path: str | None = None
) -> list[dict]:
    """모든 글에 카테고리 할당

    Args:
        articles: 분류할 글 목록
        config_path: 카테고리 설정 파일 경로

    Returns:
        카테고리가 할당된 글 목록
    """
    categories = load_categories(config_path)

    for article in articles:
        category_name, emoji = categorize_article(
            article["title"],
            article.get("tags", []),
            article.get("rss_categories", []),
            categories,
        )
        article["category"] = category_name
        article["category_emoji"] = emoji

    return articles


def merge_small_categories(articles: list[dict]) -> list[dict]:
    """글 수가 적은 카테고리는 Misc로 통합

    5개 미만의 글을 가진 카테고리는 Misc 카테고리로 병합하여
    Markdown 결과물이 너무 세분화되는 것을 방지

    Args:
        articles: 글 목록

    Returns:
        카테고리가 통합된 글 목록
    """
    # 카테고리별 글 수 집계
    category_counts = Counter(a["category"] for a in articles)

    for article in articles:
        if (
            article["category"] != "Misc"
            and category_counts[article["category"]] < MIN_ARTICLES_PER_CATEGORY
        ):
            article["category"] = "Misc"
            article["category_emoji"] = "📌"

    return articles
