"""RSS Feed 파싱 모듈"""

import re
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import urlparse

import feedparser
import requests
import yaml
from bs4 import BeautifulSoup
from dateutil import parser as date_parser

from .discovery import discover_feed

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
    # UTF-8 인코딩 명시 (일부 서버가 Content-Type 헤더에 인코딩을 지정하지 않으면
    # requests가 ISO-8859-1로 기본 가정하여 한글이 깨지는 문제 방지)
    response.encoding = "utf-8"
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


def extract_title_from_url(url: str) -> str:
    """URL 경로에서 제목 추출

    Args:
        url: 글 URL

    Returns:
        추출된 제목 (slug를 사람이 읽기 좋게 변환)
    """
    parsed = urlparse(url)
    path = parsed.path.rstrip("/")

    # 마지막 경로 요소 추출
    if path:
        slug = path.split("/")[-1]
        # 확장자 제거
        slug = re.sub(r"\.(html?|php|aspx?)$", "", slug, flags=re.IGNORECASE)
        # 하이픈/언더스코어를 공백으로 변환하고 타이틀 케이스로
        title = re.sub(r"[-_]", " ", slug).strip()
        if title:
            return title.title()

    return url


def get_domain_name(url: str) -> str:
    """URL에서 도메인 이름 추출

    Args:
        url: URL

    Returns:
        도메인 이름 (예: example.com -> Example)
    """
    parsed = urlparse(url)
    domain = parsed.netloc
    # www. 제거
    domain = re.sub(r"^www\.", "", domain)
    # TLD 제거하고 첫 부분만
    name = domain.split(".")[0]
    return name.title()


def parse_sitemap(sitemap_url: str, days: int = 14) -> list[dict]:
    """Sitemap에서 글 목록 추출 (RSS가 없는 경우 fallback)

    Args:
        sitemap_url: sitemap.xml URL
        days: 수집 기간

    Returns:
        글 목록
    """
    response = requests.get(
        sitemap_url, headers={"User-Agent": USER_AGENT}, timeout=30
    )
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "xml")

    articles = []
    cutoff_date = datetime.now() - timedelta(days=days)
    source_name = get_domain_name(sitemap_url)

    for url_tag in soup.find_all("url"):
        loc_tag = url_tag.find("loc")
        if not loc_tag:
            continue

        loc = loc_tag.text.strip()
        lastmod_tag = url_tag.find("lastmod")

        pub_date = None
        if lastmod_tag:
            try:
                pub_date = date_parser.parse(lastmod_tag.text.strip())
                # timezone-aware datetime을 naive로 변환
                if pub_date.tzinfo is not None:
                    pub_date = pub_date.replace(tzinfo=None)
                if pub_date < cutoff_date:
                    continue
            except Exception:
                pass

        articles.append(
            {
                "url": loc,
                "title": extract_title_from_url(loc),
                "source_name": source_name,
                "published_at": pub_date.isoformat() if pub_date else None,
                "tags": [],
                "rss_categories": [],
            }
        )

    return articles


def collect_all_feeds(config_path: str | None = None) -> list[dict]:
    """모든 Feed에서 글 수집

    메인 도메인 URL 또는 직접 RSS URL 모두 지원
    RSS가 없는 경우 sitemap fallback

    Args:
        config_path: 설정 파일 경로

    Returns:
        수집된 모든 글 목록
    """
    feed_urls = load_feeds(config_path)
    all_articles = []

    for url in feed_urls:
        try:
            # Feed URL 자동 탐지
            result = discover_feed(url)

            if result.feed_type == "rss":
                articles = parse_feed(result.discovered_url)
                print(f"[RSS] Collected {len(articles)} articles from {url}")
                if result.discovered_url != url:
                    print(f"       -> Discovered: {result.discovered_url}")
            elif result.feed_type == "sitemap":
                articles = parse_sitemap(result.discovered_url)
                print(f"[Sitemap] Collected {len(articles)} articles from {url}")
                print(f"          -> Using: {result.discovered_url}")
            else:
                print(f"[Warning] No feed found for {url}, skipping")
                continue

            all_articles.extend(articles)

        except Exception as e:
            print(f"[Error] Failed to parse {url}: {e}")

    return all_articles
