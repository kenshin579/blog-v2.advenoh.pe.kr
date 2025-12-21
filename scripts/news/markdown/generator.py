"""Markdown 생성 모듈"""

from collections import defaultdict
from datetime import datetime


def get_series_name(date: datetime) -> str:
    """날짜 기반 시리즈명 생성

    Args:
        date: 기준 날짜

    Returns:
        시리즈명 (예: "Frank's IT News 2025 상반기")
    """
    year = date.year
    half = "상반기" if date.month <= 6 else "하반기"
    return f"Frank's IT News {year} {half}"


def generate_markdown(
    articles: list[dict], start_date: datetime, end_date: datetime
) -> str:
    """Markdown 콘텐츠 생성

    Args:
        articles: 글 목록
        start_date: 수집 시작 날짜
        end_date: 수집 종료 날짜

    Returns:
        Markdown 콘텐츠 문자열
    """
    date_range = f"{start_date.strftime('%Y-%m-%d')} ~ {end_date.strftime('%Y-%m-%d')}"
    series_name = get_series_name(end_date)

    # 카테고리별 그룹핑
    by_category: dict[str, list[dict]] = defaultdict(list)
    for article in articles:
        category = article.get("category", "Misc")
        by_category[category].append(article)

    # Frontmatter
    frontmatter = f"""---
title: "Frank's IT Biweekly News ({date_range})"
description: "Frank's IT Biweekly News ({date_range})"
date: {end_date.strftime('%Y-%m-%d')}
update: {end_date.strftime('%Y-%m-%d')}
tags:
  - news
  - biweekly
  - tech
series: "{series_name}"
---"""

    # 본문
    body = """

## 개요

2주간의 주요 IT 뉴스를 카테고리별로 정리했습니다.

---
"""

    # 카테고리별 글 목록
    category_order = ["Cloud & Infra", "AI / ML", "Development", "Security", "Misc"]

    for category in category_order:
        if category not in by_category:
            continue

        items = by_category[category]
        emoji = items[0].get("category_emoji", "📌")

        body += f"\n## {emoji} {category}\n\n"
        for item in items:
            body += f"- [{item['title']}]({item['url']}) - {item['source_name']}\n"

    body += """
---

*이 글은 자동으로 생성되었습니다.*
"""

    return frontmatter + body


def get_output_path(end_date: datetime) -> str:
    """출력 파일 경로 생성

    Args:
        end_date: 수집 종료 날짜

    Returns:
        출력 파일 경로
    """
    date_str = end_date.strftime("%Y-%m-%d")
    return f"contents/news/biweekly-news-{date_str}/index.md"
