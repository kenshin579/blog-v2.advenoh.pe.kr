"""IT Biweekly News 생성 메인 스크립트

Usage:
    python scripts/news/main.py
"""

import os
import sys
from collections import Counter
from datetime import datetime, timedelta
from pathlib import Path

from category import categorize_articles, categorize_with_fallback
from db import DBClient
from feed import collect_all_feeds
from markdown import generate_markdown, get_output_path


def main():
    """메인 실행 함수"""
    # 날짜 계산 (2주 기간)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=14)

    print(f"Collecting news from {start_date.date()} to {end_date.date()}")

    # 1. RSS Feed에서 글 수집
    articles = collect_all_feeds()
    print(f"Collected {len(articles)} articles from feeds")

    if not articles:
        print("No articles collected from feeds")
        return

    # 2. DB에서 기존 URL 조회 및 필터링
    try:
        db = DBClient()
        existing_urls = db.get_existing_urls()
        new_articles = [a for a in articles if a["url"] not in existing_urls]
        print(f"Found {len(new_articles)} new articles (filtered {len(existing_urls)} existing)")
    except Exception as e:
        print(f"Error: Could not connect to DB: {e}")
        print("DB connection is required. Exiting.")
        sys.exit(1)

    if not new_articles:
        print("No new articles to process")
        return

    # 3. 카테고리 분류 (AI 우선, 실패 시 키워드 매칭)
    categorized = categorize_with_fallback(new_articles)
    print("Categorized articles:")
    category_counts = Counter(a["category"] for a in categorized)
    for cat, count in category_counts.most_common():
        print(f"  - {cat}: {count}")

    # 4. Markdown 생성
    markdown_content = generate_markdown(categorized, start_date, end_date)

    # 5. DB에 수집 결과 저장 (파일 저장 전에 먼저 수행)
    try:
        issue_date = end_date.strftime("%Y-%m-%d")
        db.save_articles(categorized, issue_date)
        print(f"Saved {len(categorized)} articles to database")
    except Exception as e:
        print(f"Error: Could not save to DB: {e}")
        sys.exit(1)

    # 6. 파일 저장 (DB 저장 성공 후)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent
    output_path = get_output_path(end_date, str(project_root))
    output_dir = Path(output_path).parent
    output_dir.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(markdown_content)

    print(f"Generated: {output_path}")

    # 7. GitHub Action 환경변수 설정
    github_env = os.environ.get("GITHUB_ENV")
    if github_env:
        with open(github_env, "a") as f:
            f.write(f"DATE={end_date.strftime('%Y-%m-%d')}\n")
            f.write(
                f"DATE_RANGE={start_date.strftime('%Y-%m-%d')} ~ {end_date.strftime('%Y-%m-%d')}\n"
            )

    print("Done!")


if __name__ == "__main__":
    main()
