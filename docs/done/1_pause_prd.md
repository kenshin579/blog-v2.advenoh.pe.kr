# Supabase Pause 방지 개선 PRD (v2)

## 1. 문제 정의

### 1.1 현재 상황

| 항목 | 값 |
|-----|---|
| Supabase Plan | Free tier |
| Pause 조건 | **7일** 비활성 시 자동 pause |
| 현재 keepalive 주기 | 2일마다 (`cron: '0 0 */2 * *'`) |
| 실행 쿼리 | `SELECT id FROM collected_articles LIMIT 1` (읽기 전용) |
| 결과 | **여전히 pause 발생** |

### 1.2 원인 분석

기존 `3_pause_prd.md`에서 Option A(단순 SELECT)를 선택했고, 주기도 6일→2일로 단축했지만 Supabase 프로젝트가 계속 pause됨.

**Supabase의 "활성" 판단 기준 추정:**
- 단순 SELECT(읽기)는 "활성 사용"으로 인식되지 않을 가능성 높음
- Supabase가 실제 **쓰기 활동**(INSERT/UPDATE/DELETE)이 있어야 활성으로 판단하는 것으로 보임
- REST API를 통한 단순 ping만으로는 DB 엔진 레벨의 활동으로 인식되지 않을 수 있음

### 1.3 영향 범위

pause 발생 시:
- `scripts/news/db/client.py` DB 연결 실패
- biweekly-news GitHub Action 실패 (매월 1일, 15일)
- 중복 체크 불가 → 이전 뉴스 재수집 위험
- 수동 Supabase 대시보드 unpause 필요

### 1.4 관련 파일

```
.github/workflows/supabase-keepalive.yml  # 현재 keepalive (SELECT만 수행)
.github/workflows/biweekly-news.yml       # 뉴스 생성 (실제 DB 사용)
scripts/news/db/client.py                 # Supabase 클라이언트
```

---

## 2. 해결 방안

### 2.1 핵심 전략: health 테이블 + 실제 쓰기

단순 SELECT 대신 **전용 health 테이블의 단일 row를 UPDATE**하여 Supabase가 활성 사용으로 인식하도록 변경. 레코드가 계속 쌓이지 않고 1개의 row만 유지.

---

## 3. 작업 항목

### 3.1 Supabase에 `health` 테이블 생성

Supabase SQL Editor에서 아래 SQL 실행:

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

**테이블 설계 의도:**
- 단일 row만 유지 (`CHECK (id = 1)` 제약으로 보장)
- keepalive 시 UPDATE로 `checked_at` 타임스탬프만 갱신
- 데이터 누적 없이 쓰기 활동 발생

### 3.2 `supabase-keepalive.yml` 워크플로우 수정

**변경 전 (현재):**
```python
# 읽기만 수행
result = client.table('collected_articles').select('id').limit(1).execute()
```

**변경 후:**
```python
from datetime import datetime, timezone

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

**변경 요약:**

| 항목 | 변경 전 | 변경 후 |
|-----|--------|--------|
| 쿼리 종류 | SELECT (읽기) | UPDATE + SELECT (쓰기+읽기) |
| 대상 테이블 | `collected_articles` | `health` (쓰기) + `collected_articles` (읽기) |
| 실행 주기 | 2일마다 | 2일마다 (유지) |
| 데이터 관리 | 없음 | 단일 row 타임스탬프 갱신 (누적 없음) |

### 3.3 cron 주기 검토

현재 `*/2` (2일마다)를 유지. 쓰기 활동 추가로 효과가 있다면 추후 `*/3` 정도로 완화 가능.

---

## 4. 성공 지표

| 지표 | 목표 |
|-----|-----|
| Supabase pause 발생 | 0회/월 |
| keepalive workflow 성공률 | 100% |
| health 테이블 레코드 수 | 항상 1개 |
| biweekly-news DB 연결 실패 | 0회 |

---

## 5. 롤백 계획

UPDATE 방식에 문제 발생 시:
1. `supabase-keepalive.yml`을 이전 SELECT 방식으로 되돌림
2. `health` 테이블은 삭제하지 않아도 무방 (비즈니스 영향 없음)

---

## 6. 관련 문서

- [1_pause_implementation.md](./1_pause_implementation.md) - 구현 상세
- [1_pause_todo.md](./1_pause_todo.md) - 작업 체크리스트

## 7. 참고 자료

- [이전 PRD: docs/done/3_pause_prd.md](../done/3_pause_prd.md) - 기존 SELECT 방식 결정 배경
- [이전 구현: docs/done/3_pause_implementation.md](../done/3_pause_implementation.md)
- [Supabase Pause Prevention (GitHub)](https://github.com/travisvn/supabase-pause-prevention) - INSERT 방식 권장
- [Supabase Free Tier Pausing Docs](https://supabase.com/docs/guides/troubleshooting/pausing-pro-projects-vNL-2a)
