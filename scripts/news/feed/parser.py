"""RSS Feed 파싱 모듈"""

from datetime import datetime, timedelta
from pathlib import Path

import feedparser
import requests
import yaml

# User-Agent 설정 (일부 사이트는 기본 User-Agent를 차단함)
USER_AGENT = "Mozilla/5.0 (compatible; ITNewsBot/1.0; +https://blog.advenoh.pe.kr)"


def load_feeds(config_path: str | None = None) -> list[str]:
    """Feed URL 목록 로드

    Args:
        config_path: 설정 파일 경로 (기본: config/feeds.yaml)

    Returns:
        RSS Feed URL 목록
    """
    if config_path is None:
        # scripts/news/feeds.yaml
        # feed/ -> news/
        config_path = Path(__file__).parent.parent / "feeds.yaml"

    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)
    return config.get("feeds", [])


def fetch_feed(feed_url: str) -> str:
    """User-Agent 설정과 함께 Feed 가져오기

    Args:
        feed_url: RSS Feed URL

    Returns:
        Feed 내용 문자열
    """
    response = requests.get(
        feed_url,
        headers={"User-Agent": USER_AGENT},
        timeout=30,
    )
    response.raise_for_status()
    return response.text


def parse_feed(feed_url: str, days: int = 14) -> list[dict]:
    """RSS Feed 파싱 및 최근 글 필터링

    Args:
        feed_url: RSS Feed URL
        days: 수집 기간 (기본: 14일)

    Returns:
        파싱된 글 목록
    """
    # User-Agent 설정과 함께 Feed 가져오기
    try:
        feed_content = fetch_feed(feed_url)
        feed = feedparser.parse(feed_content)
    except Exception:
        # 실패 시 기본 feedparser 사용
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

        articles.append(
            {
                "url": entry.get("link", ""),
                "title": entry.get("title", ""),
                "source_name": source_name,
                "published_at": pub_date.isoformat() if pub_date else None,
                "tags": tags,
                "rss_categories": rss_categories,
            }
        )

    return articles


def collect_all_feeds(config_path: str | None = None) -> list[dict]:
    """모든 Feed에서 글 수집

    Args:
        config_path: 설정 파일 경로

    Returns:
        수집된 모든 글 목록
    """
    feed_urls = load_feeds(config_path)
    all_articles = []

    for url in feed_urls:
        try:
            articles = parse_feed(url)
            all_articles.extend(articles)
            print(f"Collected {len(articles)} articles from {url}")
        except Exception as e:
            print(f"Error parsing {url}: {e}")

    return all_articles
