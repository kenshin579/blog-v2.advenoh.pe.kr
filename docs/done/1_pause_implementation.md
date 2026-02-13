# Supabase Pause 방지 개선 구현 문서

## 1. 개요

단순 SELECT keepalive가 pause를 방지하지 못하는 문제를 해결하기 위해 전용 `health` 테이블의 단일 row를 UPDATE하여 실제 쓰기 활동을 발생시킨다.

## 2. DB 스키마 변경

### 2.1 `health` 테이블 생성 (Supabase SQL Editor에서 수동 실행)

```sql
CREATE TABLE health (
  id INTEGER PRIMARY KEY DEFAULT 1,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT health_single_row CHECK (id = 1)
);

-- 초기 row 삽입 (이후 UPDATE만 수행)
INSERT INTO health (id, checked_at) VALUES (1, NOW());

-- RLS 정책
ALTER TABLE health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for service role"
  ON health
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

## 3. 워크플로우 수정

### 3.1 `.github/workflows/supabase-keepalive.yml`

**Ping Supabase** 스텝의 Python 스크립트를 아래로 교체:

```python
import os
from datetime import datetime, timezone
from supabase import create_client

url = os.environ['SUPABASE_URL']
key = os.environ['SUPABASE_KEY']
client = create_client(url, key)

# 1. health 테이블의 단일 row UPDATE (쓰기 활동)
now = datetime.now(timezone.utc).isoformat()
result = client.table('health').update({
    'checked_at': now
}).eq('id', 1).execute()
print(f'Health check updated: {result.data}')

# 2. collected_articles 테이블 읽기 확인
articles = client.table('collected_articles').select('id').limit(1).execute()
print(f'Articles table check: {len(articles.data)} rows found')

print('Keepalive completed successfully')
```

**변경 포인트:**
- `health` 테이블의 id=1 row를 UPDATE (쓰기 활동 발생)
- `checked_at` 타임스탬프가 매 실행 시 갱신됨
- 기존 `collected_articles` SELECT는 유지 (읽기 확인용)

### 3.2 cron 주기

현재 `*/2` (2일마다) 유지. 변경 없음.

## 4. 테스트 방법

```bash
# 수동 실행
gh workflow run supabase-keepalive.yml

# 실행 결과 확인
gh run list --workflow=supabase-keepalive.yml --limit 1

# 로그 확인 (최근 실행)
gh run view --log $(gh run list --workflow=supabase-keepalive.yml --limit 1 --json databaseId -q '.[0].databaseId')
```

**확인 사항:**
- `Health check updated:` 로그에 데이터 출력
- `Keepalive completed successfully` 출력
- Supabase 대시보드 > Table Editor > `health` 테이블의 `checked_at` 타임스탬프 갱신 확인
