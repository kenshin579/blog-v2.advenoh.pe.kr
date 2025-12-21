"""IT Biweekly News 생성 메인 스크립트"""

import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

# 프로젝트 루트를 PYTHONPATH에 추가
sys.path.insert(0, str(Path(__file__).parent))

from categorizer import categorize_articles, merge_small_categories
from db_client import DBClient
from feed_parser import collect_all_feeds
from markdown_generator import generate_markdown, get_output_path


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
        print(f"Warning: Could not connect to DB, processing all articles: {e}")
        new_articles = articles
        db = None

    if not new_articles:
        print("No new articles to process")
        return

    # 3. 카테고리 분류
    categorized = categorize_articles(new_articles)
    print("Categorized articles:")
    from collections import Counter
    category_counts = Counter(a["category"] for a in categorized)
    for cat, count in category_counts.most_common():
        print(f"  - {cat}: {count}")

    # 4. 작은 카테고리 통합 (5개 미만 → Misc)
    categorized = merge_small_categories(categorized)

    # 5. Markdown 생성
    markdown_content = generate_markdown(categorized, start_date, end_date)

    # 6. 파일 저장
    output_path = get_output_path(end_date)
    output_dir = Path(output_path).parent
    output_dir.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(markdown_content)

    print(f"Generated: {output_path}")

    # 7. DB에 수집 결과 저장
    if db:
        try:
            issue_date = end_date.strftime("%Y-%m-%d")
            db.save_articles(categorized, issue_date)
            print(f"Saved {len(categorized)} articles to database")
        except Exception as e:
            print(f"Warning: Could not save to DB: {e}")

    # 8. GitHub Action 환경변수 설정
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
