"""RSS Feed 자동 탐지 모듈

메인 도메인 URL에서 RSS/Atom feed를 자동으로 찾아주는 기능 제공
"""

import re
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

# User-Agent 설정
USER_AGENT = "Mozilla/5.0 (compatible; ITNewsBot/1.0; +https://blog.advenoh.pe.kr)"

# 일반적인 feed 경로 목록
COMMON_FEED_PATHS = [
    "/feed",
    "/feed.xml",
    "/rss",
    "/rss.xml",
    "/atom.xml",
    "/index.xml",
    "/feed/atom",
    "/feed/rss",
    "/blog/feed",
    "/blog/rss",
    "/feeds/posts/default",  # Blogger
]

# Feed로 인식할 Content-Type
FEED_CONTENT_TYPES = [
    "application/rss+xml",
    "application/atom+xml",
    "application/xml",
    "text/xml",
]


def get_base_url(url: str) -> str:
    """URL에서 기본 도메인 URL 추출

    Args:
        url: 전체 URL

    Returns:
        기본 도메인 URL (예: https://example.com)
    """
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}"


def is_feed_url(url: str) -> bool:
    """URL이 유효한 RSS/Atom feed인지 확인

    Args:
        url: 확인할 URL

    Returns:
        feed 여부
    """
    try:
        response = requests.get(
            url, headers={"User-Agent": USER_AGENT}, timeout=10, allow_redirects=True
        )
        response.raise_for_status()

        content_type = response.headers.get("content-type", "").lower()

        # Content-Type으로 확인
        if any(t in content_type for t in FEED_CONTENT_TYPES):
            return True

        # XML 내용으로 확인 (rss 또는 feed 태그 존재 여부)
        content = response.text[:1000].lower()
        return "<rss" in content or "<feed" in content or "<atom" in content

    except Exception:
        return False


def find_feed_from_html(url: str) -> str | None:
    """HTML 페이지에서 RSS/Atom feed URL 추출

    <link rel="alternate" type="application/rss+xml" href="..."> 태그를 찾아 URL 반환

    Args:
        url: HTML 페이지 URL

    Returns:
        발견된 feed URL 또는 None
    """
    try:
        response = requests.get(
            url, headers={"User-Agent": USER_AGENT}, timeout=10, allow_redirects=True
        )
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        # RSS/Atom link 태그 검색
        for link_type in ["application/rss+xml", "application/atom+xml"]:
            link = soup.find("link", attrs={"rel": "alternate", "type": link_type})
            if link and link.get("href"):
                feed_url = urljoin(url, link["href"])
                return feed_url

        # type 없이 rel="alternate" 태그도 확인
        for link in soup.find_all("link", attrs={"rel": "alternate"}):
            href = link.get("href", "")
            if any(ext in href.lower() for ext in [".xml", "rss", "feed", "atom"]):
                return urljoin(url, href)

        return None

    except Exception:
        return None


def try_common_feed_paths(url: str) -> str | None:
    """일반적인 feed 경로들을 시도

    Args:
        url: 기본 URL

    Returns:
        발견된 feed URL 또는 None
    """
    base_url = get_base_url(url)

    for path in COMMON_FEED_PATHS:
        feed_url = urljoin(base_url, path)
        if is_feed_url(feed_url):
            return feed_url

    return None


def get_sitemap_from_robots(url: str) -> str | None:
    """robots.txt에서 sitemap URL 추출

    Args:
        url: 기본 URL

    Returns:
        sitemap URL 또는 None
    """
    base_url = get_base_url(url)
    robots_url = urljoin(base_url, "/robots.txt")

    try:
        response = requests.get(
            robots_url, headers={"User-Agent": USER_AGENT}, timeout=10
        )
        response.raise_for_status()

        # Sitemap: 라인 찾기
        for line in response.text.splitlines():
            if line.lower().startswith("sitemap:"):
                sitemap_url = line.split(":", 1)[1].strip()
                return sitemap_url

        return None

    except Exception:
        return None


def find_sitemap(url: str) -> str | None:
    """Sitemap URL 찾기

    Args:
        url: 기본 URL

    Returns:
        sitemap URL 또는 None
    """
    # 1. robots.txt에서 찾기
    sitemap_url = get_sitemap_from_robots(url)
    if sitemap_url:
        return sitemap_url

    # 2. 일반적인 sitemap 경로 시도
    base_url = get_base_url(url)
    common_sitemap_paths = [
        "/sitemap.xml",
        "/sitemap_index.xml",
        "/sitemap-index.xml",
        "/sitemap-news.xml",
    ]

    for path in common_sitemap_paths:
        sitemap_url = urljoin(base_url, path)
        try:
            response = requests.get(
                sitemap_url, headers={"User-Agent": USER_AGENT}, timeout=10
            )
            if response.status_code == 200 and "<urlset" in response.text.lower():
                return sitemap_url
        except Exception:
            continue

    return None


class DiscoveryResult:
    """Feed 탐지 결과"""

    def __init__(
        self, url: str, feed_type: str, discovered_url: str | None = None
    ):
        self.url = url
        self.feed_type = feed_type  # 'rss', 'sitemap', 'none'
        self.discovered_url = discovered_url

    def __repr__(self) -> str:
        return f"DiscoveryResult(url={self.url}, type={self.feed_type}, discovered={self.discovered_url})"


def discover_feed(url: str) -> DiscoveryResult:
    """메인 URL에서 RSS feed URL 자동 탐지

    탐지 순서:
    1. URL이 이미 feed인지 확인
    2. HTML에서 link 태그로 RSS URL 추출
    3. 일반적인 feed 경로 시도
    4. sitemap fallback

    Args:
        url: 탐지할 URL (메인 도메인 또는 feed URL)

    Returns:
        DiscoveryResult 객체
    """
    # 1. 이미 feed URL인지 확인
    if is_feed_url(url):
        return DiscoveryResult(url, "rss", url)

    # 2. HTML에서 link 태그 확인
    feed_url = find_feed_from_html(url)
    if feed_url and is_feed_url(feed_url):
        return DiscoveryResult(url, "rss", feed_url)

    # 3. 일반적인 feed 경로 시도
    feed_url = try_common_feed_paths(url)
    if feed_url:
        return DiscoveryResult(url, "rss", feed_url)

    # 4. sitemap fallback
    sitemap_url = find_sitemap(url)
    if sitemap_url:
        return DiscoveryResult(url, "sitemap", sitemap_url)

    # 탐지 실패
    return DiscoveryResult(url, "none", None)
