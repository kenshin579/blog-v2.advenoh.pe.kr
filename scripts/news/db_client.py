"""Supabase DB 클라이언트 모듈"""

import os

from supabase import create_client, Client


class DBClient:
    """Supabase 데이터베이스 클라이언트"""

    def __init__(self):
        url = os.environ.get("BLOG_IT_NEWS_SUPABASE_URL")
        key = os.environ.get("BLOG_IT_NEWS_SUPABASE_API_KEY")

        if not url or not key:
            raise ValueError(
                "BLOG_IT_NEWS_SUPABASE_URL and BLOG_IT_NEWS_SUPABASE_API_KEY "
                "environment variables are required"
            )

        self.client: Client = create_client(url, key)

    def get_existing_urls(self) -> set[str]:
        """이미 수집된 글의 URL 목록 조회"""
        response = self.client.table("collected_articles").select("url").execute()
        return {item["url"] for item in response.data}

    def save_articles(self, articles: list[dict], issue_date: str) -> None:
        """수집된 글 저장

        Args:
            articles: 저장할 글 목록
            issue_date: 뉴스레터 발행 날짜 (YYYY-MM-DD)
        """
        for article in articles:
            self.client.table("collected_articles").insert(
                {
                    "url": article["url"],
                    "title": article["title"],
                    "source_name": article["source_name"],
                    "category": article["category"],
                    "published_at": article["published_at"],
                    "included_in_issue": issue_date,
                }
            ).execute()
