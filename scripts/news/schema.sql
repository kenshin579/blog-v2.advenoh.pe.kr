-- Supabase DB 스키마
-- IT Biweekly News 자동 수집 시스템

-- collected_articles 테이블
CREATE TABLE IF NOT EXISTS collected_articles (
  id SERIAL PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  source_name TEXT NOT NULL,
  category TEXT,
  published_at TIMESTAMP,
  collected_at TIMESTAMP DEFAULT NOW(),
  included_in_issue TEXT  -- 포함된 뉴스레터 날짜 (e.g., "2025-03-14")
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_collected_articles_url ON collected_articles(url);
CREATE INDEX IF NOT EXISTS idx_collected_articles_issue ON collected_articles(included_in_issue);
CREATE INDEX IF NOT EXISTS idx_collected_articles_collected_at ON collected_articles(collected_at);
