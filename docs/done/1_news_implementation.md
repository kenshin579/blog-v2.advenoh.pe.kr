# IT Biweekly News 자동 수집 시스템 - 구현 문서

## 1. 프로젝트 구조

```
/scripts
  /news
    pyproject.toml        # Python 의존성 및 프로젝트 설정
    generate_news.py      # 메인 스크립트
    feed_parser.py        # RSS 파싱 모듈
    categorizer.py        # 카테고리 분류 모듈
    markdown_generator.py # Markdown 생성 모듈
    db_client.py          # Supabase DB 클라이언트

/config
  feeds.yaml              # RSS Feed 목록
  categories.yaml         # 카테고리 및 키워드 정의

/.github
  /workflows
    biweekly-news.yml     # GitHub Action 워크플로우
```

---

## 2. 설정 파일

### 2.1 feeds.yaml

```yaml
# config/feeds.yaml
feeds:
  - https://aws.amazon.com/blogs/aws/feed/
  - https://cloud.google.com/blog/rss
  - https://kubernetes.io/feed.xml
  - https://openai.com/blog/rss/
  - https://netflixtechblog.com/feed
```

> 소스 이름은 RSS Feed의 `title` 필드에서 자동 추출

### 2.2 categories.yaml

```yaml
# config/categories.yaml
categories:
  - name: Cloud & Infra
    emoji: "☁️"
    keywords:
      # Cloud
      - aws
      - gcp
      - azure
      - cloud
      - serverless
      - lambda
      - ec2
      - s3
      - 클라우드
      - 서버리스
      # Kubernetes
      - kubernetes
      - k8s
      - helm
      - kubectl
      - container
      - docker
      - pod
      - 쿠버네티스
      - 컨테이너
      - 도커
      # DevOps
      - ci/cd
      - jenkins
      - github actions
      - terraform
      - ansible
      - devops

  - name: AI / ML
    emoji: "🤖"
    keywords:
      - ai
      - ml
      - machine learning
      - deep learning
      - llm
      - gpt
      - openai
      - tensorflow
      - pytorch
      - 인공지능
      - 머신러닝
      - 딥러닝

  - name: Development
    emoji: "💻"
    keywords:
      # Backend
      - api
      - rest
      - graphql
      - microservice
      - spring
      - django
      - fastapi
      # Frontend
      - react
      - vue
      - angular
      - javascript
      - typescript
      - css
      # Database
      - database
      - sql
      - nosql
      - mongodb
      - postgresql
      - redis

  - name: Security
    emoji: "🔒"
    keywords:
      - security
      - vulnerability
      - cve
      - authentication
      - oauth
      - 보안

  - name: Misc
    emoji: "📌"
    keywords: []  # 기본 카테고리
```

---

## 3. Python 모듈 구현

### 3.1 pyproject.toml

```toml
[project]
name = "news-generator"
version = "0.1.0"
description = "IT Biweekly News Generator"
requires-python = ">=3.12"
dependencies = [
    "feedparser>=6.0.0",
    "pyyaml>=6.0",
    "supabase>=2.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "ruff>=0.1.0",
]

[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"
```

### 3.2 db_client.py

```python
"""Supabase DB 클라이언트 모듈"""
import os
from supabase import create_client, Client


class DBClient:
    def __init__(self):
        url = os.environ.get("BLOG_IT_NEWS_SUPABASE_URL")
        key = os.environ.get("BLOG_IT_NEWS_SUPABASE_API_KEY")
        self.client: Client = create_client(url, key)

    def get_existing_urls(self) -> set[str]:
        """이미 수집된 글의 URL 목록 조회"""
        response = self.client.table("collected_articles").select("url").execute()
        return {item["url"] for item in response.data}

    def save_articles(self, articles: list[dict], issue_date: str) -> None:
        """수집된 글 저장"""
        for article in articles:
            self.client.table("collected_articles").insert({
                "url": article["url"],
                "title": article["title"],
                "source_name": article["source_name"],
                "category": article["category"],
                "published_at": article["published_at"],
                "included_in_issue": issue_date,
            }).execute()
```

### 3.3 feed_parser.py

```python
"""RSS Feed 파싱 모듈"""
import feedparser
import yaml
from datetime import datetime, timedelta


def load_feeds(config_path: str = "config/feeds.yaml") -> list[str]:
    """Feed URL 목록 로드"""
    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)
    return config.get("feeds", [])


def parse_feed(feed_url: str, days: int = 14) -> list[dict]:
    """RSS Feed 파싱 및 최근 글 필터링"""
    feed = feedparser.parse(feed_url)
    cutoff_date = datetime.now() - timedelta(days=days)
    articles = []

    # Feed title에서 소스 이름 추출
    source_name = feed.feed.get("title", feed_url)

    for entry in feed.entries:
        # 발행일 파싱
        published = entry.get("published_parsed") or entry.get("updated_parsed")
        if published:
            pub_date = datetime(*published[:6])
            if pub_date < cutoff_date:
                continue
        else:
            pub_date = None

        # SEO 태그 및 카테고리 추출
        tags = [tag.get("term", "") for tag in entry.get("tags", [])]
        rss_categories = [cat.get("term", "") for cat in entry.get("categories", [])]

        articles.append({
            "url": entry.get("link", ""),
            "title": entry.get("title", ""),
            "source_name": source_name,
            "published_at": pub_date.isoformat() if pub_date else None,
            "tags": tags,                    # RSS feed의 tags 필드 (SEO 태그)
            "rss_categories": rss_categories,  # RSS feed의 categories 필드
        })

    return articles


def collect_all_feeds(config_path: str = "config/feeds.yaml") -> list[dict]:
    """모든 Feed에서 글 수집"""
    feed_urls = load_feeds(config_path)
    all_articles = []

    for url in feed_urls:
        try:
            articles = parse_feed(url)
            all_articles.extend(articles)
        except Exception as e:
            print(f"Error parsing {url}: {e}")

    return all_articles
```

### 3.4 categorizer.py

```python
"""카테고리 분류 모듈"""
import yaml


def load_categories(config_path: str = "config/categories.yaml") -> list[dict]:
    """카테고리 설정 파일 로드"""
    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)
    return config.get("categories", [])


def categorize_article(
    title: str,
    tags: list[str],
    rss_categories: list[str],
    categories: list[dict]
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


def categorize_articles(articles: list[dict], config_path: str = "config/categories.yaml") -> list[dict]:
    """모든 글에 카테고리 할당"""
    categories = load_categories(config_path)

    for article in articles:
        category_name, emoji = categorize_article(
            article["title"],
            article.get("tags", []),
            article.get("rss_categories", []),  # RSS feed의 categories 활용
            categories
        )
        article["category"] = category_name
        article["category_emoji"] = emoji

    return articles


# 최소 글 수 기준 (이 수 미만이면 Misc로 통합)
MIN_ARTICLES_PER_CATEGORY = 5


def merge_small_categories(articles: list[dict]) -> list[dict]:
    """글 수가 적은 카테고리는 Misc로 통합

    5개 미만의 글을 가진 카테고리는 Misc 카테고리로 병합하여
    Markdown 결과물이 너무 세분화되는 것을 방지
    """
    from collections import Counter

    # 카테고리별 글 수 집계
    category_counts = Counter(a["category"] for a in articles)

    for article in articles:
        if article["category"] != "Misc" and category_counts[article["category"]] < MIN_ARTICLES_PER_CATEGORY:
            article["category"] = "Misc"
            article["category_emoji"] = "📌"

    return articles
```

### 3.5 markdown_generator.py

```python
"""Markdown 생성 모듈"""
from datetime import datetime
from collections import defaultdict


def get_series_name(date: datetime) -> str:
    """날짜 기반 시리즈명 생성"""
    year = date.year
    half = "상반기" if date.month <= 6 else "하반기"
    return f"Frank's IT News {year} {half}"


def generate_markdown(articles: list[dict], start_date: datetime, end_date: datetime) -> str:
    """Markdown 콘텐츠 생성"""
    date_range = f"{start_date.strftime('%Y-%m-%d')} ~ {end_date.strftime('%Y-%m-%d')}"
    series_name = get_series_name(end_date)

    # 카테고리별 그룹핑
    by_category = defaultdict(list)
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
    body = f"""
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

        body += f"\n## {emoji} {category}\n"
        for item in items:
            body += f"- [{item['title']}]({item['url']}) - {item['source_name']}\n"

    body += """
---

*이 글은 자동으로 생성되었습니다.*
"""

    return frontmatter + body


def get_output_path(end_date: datetime) -> str:
    """출력 파일 경로 생성"""
    date_str = end_date.strftime('%Y-%m-%d')
    return f"contents/news/biweekly-news-{date_str}/index.md"
```

### 3.6 generate_news.py (메인 스크립트)

```python
"""IT Biweekly News 생성 메인 스크립트"""
import os
from datetime import datetime, timedelta
from pathlib import Path

from feed_parser import collect_all_feeds
from categorizer import categorize_articles, merge_small_categories
from markdown_generator import generate_markdown, get_output_path
from db_client import DBClient


def main():
    # 날짜 계산 (2주 기간)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=14)

    print(f"Collecting news from {start_date.date()} to {end_date.date()}")

    # 1. RSS Feed에서 글 수집
    articles = collect_all_feeds()
    print(f"Collected {len(articles)} articles from feeds")

    # 2. DB에서 기존 URL 조회 및 필터링
    db = DBClient()
    existing_urls = db.get_existing_urls()
    new_articles = [a for a in articles if a["url"] not in existing_urls]
    print(f"Found {len(new_articles)} new articles")

    if not new_articles:
        print("No new articles to process")
        return

    # 3. 카테고리 분류
    categorized = categorize_articles(new_articles)

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
    issue_date = end_date.strftime('%Y-%m-%d')
    db.save_articles(categorized, issue_date)

    # 8. GitHub Action 환경변수 설정
    if os.environ.get("GITHUB_ENV"):
        with open(os.environ["GITHUB_ENV"], "a") as f:
            f.write(f"DATE={end_date.strftime('%Y-%m-%d')}\n")
            f.write(f"DATE_RANGE={start_date.strftime('%Y-%m-%d')} ~ {end_date.strftime('%Y-%m-%d')}\n")


if __name__ == "__main__":
    main()
```

---

## 4. GitHub Action 워크플로우

```yaml
# .github/workflows/biweekly-news.yml
name: IT Biweekly News Generator

on:
  schedule:
    # 매월 1일, 15일 09:00 KST (00:00 UTC)
    - cron: '0 0 1,15 * *'
  workflow_dispatch: # 수동 실행

jobs:
  generate-news:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: pip install -e ./scripts/news

      - name: Generate news article
        env:
          BLOG_IT_NEWS_SUPABASE_URL: ${{ secrets.BLOG_IT_NEWS_SUPABASE_URL }}
          BLOG_IT_NEWS_SUPABASE_API_KEY: ${{ secrets.BLOG_IT_NEWS_SUPABASE_API_KEY }}
        run: python scripts/news/generate_news.py

      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v6
        with:
          title: "[News] IT Biweekly News - ${{ env.DATE_RANGE }}"
          body: |
            자동 생성된 IT Biweekly News 아티클입니다.

            리뷰 후 merge 해주세요.
          branch: news/biweekly-${{ env.DATE }}
          labels: news, auto-generated
          commit-message: "[News] Add IT Biweekly News ${{ env.DATE_RANGE }}"
```

---

## 5. Supabase DB 스키마

```sql
-- collected_articles 테이블
CREATE TABLE collected_articles (
  id SERIAL PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  source_name TEXT NOT NULL,
  category TEXT,
  published_at TIMESTAMP,
  collected_at TIMESTAMP DEFAULT NOW(),
  included_in_issue TEXT
);

-- 인덱스
CREATE INDEX idx_collected_articles_url ON collected_articles(url);
CREATE INDEX idx_collected_articles_issue ON collected_articles(included_in_issue);
```

---

## 6. 환경 변수

| 변수명 | 설명 |
|--------|------|
| `BLOG_IT_NEWS_SUPABASE_URL` | Supabase 프로젝트 URL |
| `BLOG_IT_NEWS_SUPABASE_API_KEY` | Supabase API 키 |

**설정 방법:**
- 로컬 개발: `~/.zshrc`에 `export` 추가
- GitHub Action: Repository Secrets에 등록
