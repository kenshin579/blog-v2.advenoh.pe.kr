# Supabase Pause 방지 PRD

## 1. 문제 정의

### 1.1 현재 상황

| 항목 | 값 |
|-----|---|
| Supabase Plan | Free tier |
| Pause 조건 | **7일** 비활성 시 자동 pause |
| biweekly-news 실행 주기 | 매월 1일, 15일 (최대 **15일** 간격) |
| 문제 | 7일 < 15일 → **Supabase pause 발생 가능** |

### 1.2 영향 범위

Supabase가 pause되면:
- `scripts/news/db/client.py`의 DB 연결 실패
- biweekly-news GitHub Action 실패
- 중복 체크 불가 → 이전 뉴스 재수집 위험
- 수동으로 Supabase 대시보드에서 unpause 필요

### 1.3 관련 파일

```
.github/workflows/biweekly-news.yml  # 2주마다 실행
scripts/news/db/client.py            # Supabase 클라이언트
```

---

## 2. 원인 분석

### 2.1 Supabase Free Tier 정책

> "Free-tier projects are automatically paused after 7 days of inactivity to optimize cloud resources."
> — [Supabase Docs](https://supabase.com/docs/guides/troubleshooting/pausing-pro-projects-vNL-2a)

| Plan | Pause 정책 | Active Project 수 |
|------|-----------|------------------|
| Free | 7일 비활성 시 pause | 2개 |
| Pro ($25/월) | Pause 없음 | 무제한 |

### 2.2 타임라인 분석

```
매월 1일 실행 -------- 7일 경과 (Pause!) -------- 매월 15일 실행 (실패!)
     |                      |                          |
     └── Supabase 활동 ──────┴── 비활성 구간 ──────────┘
```

**최악의 케이스:**
- 1월 1일 실행 → 1월 8일 pause → 1월 15일 실행 시 DB 접근 불가

---

## 3. 해결 방안

### 3.1 Option A: Keepalive GitHub Action ✅ 선택

**방식:** 6일마다 Supabase에 간단한 쿼리를 실행하여 활성 상태 유지

#### 장점
- 무료
- 설정 간단
- 기존 인프라 활용

#### 단점
- 최근 일부 사용자 보고에 따르면 단순 SELECT로는 pause 방지가 안 될 수 있음
- 주기적 모니터링 필요

#### 구현 방법

**새 workflow 파일 생성:**

```yaml
# .github/workflows/supabase-keepalive.yml
name: Supabase Keepalive

on:
  schedule:
    # 6일마다 실행 (00:00 UTC)
    # 7일 pause 정책보다 짧은 주기
    - cron: '0 0 */6 * *'
  workflow_dispatch: # 수동 실행

jobs:
  keepalive:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: pip install supabase

      - name: Ping Supabase
        env:
          SUPABASE_URL: ${{ secrets.BLOG_IT_NEWS_SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.BLOG_IT_NEWS_SUPABASE_API_KEY }}
        run: |
          python -c "
          import os
          from supabase import create_client

          url = os.environ['SUPABASE_URL']
          key = os.environ['SUPABASE_KEY']
          client = create_client(url, key)

          # 활동을 위한 간단한 쿼리 (SELECT + INSERT)
          result = client.table('collected_articles').select('id').limit(1).execute()
          print(f'Keepalive ping successful: {len(result.data)} rows checked')
          "
```

### 3.2 Option B: 더 적극적인 Keepalive (대안)

최근 Supabase가 단순 SELECT로는 pause를 방지하지 않는다는 보고가 있음.
더 적극적인 활동이 필요할 수 있음:

```python
# keepalive 전용 테이블 사용
client.table('keepalive_pings').insert({
    'pinged_at': datetime.now().isoformat()
}).execute()

# 오래된 ping 기록 정리
client.table('keepalive_pings').delete().lt(
    'pinged_at',
    (datetime.now() - timedelta(days=30)).isoformat()
).execute()
```

**추가 테이블 스키마:**
```sql
CREATE TABLE keepalive_pings (
  id SERIAL PRIMARY KEY,
  pinged_at TIMESTAMP DEFAULT NOW()
);
```

### 3.3 Option C: Supabase Pro 업그레이드 (대안)

| 항목 | 값 |
|-----|---|
| 비용 | $25/월 |
| 장점 | Pause 없음, 더 큰 용량 |
| 단점 | 비용 발생 |

**Pro 플랜 혜택:**
- Database: 8GB (Free: 500MB)
- Storage: 100GB (Free: 1GB)
- Bandwidth: 250GB (Free: 2GB)
- **Auto-pause: 없음**

### 3.4 Option D: 대안 솔루션 검토 (대안)

Supabase 대신 다른 방식으로 중복 체크:

| 방식 | 장점 | 단점 |
|-----|-----|-----|
| GitHub Artifacts | 무료, GitHub 내 통합 | 90일 보존 제한 |
| JSON 파일 커밋 | 무료, 영구 보존 | Git 히스토리 증가 |
| SQLite + 커밋 | 무료, 쿼리 가능 | 동시성 문제 |
| Turso (SQLite 호스팅) | 무료 tier 있음 | 새 서비스 학습 |

---

## 4. 선택된 솔루션

### ✅ Option A: Keepalive GitHub Action

**결정 사항:**
- `supabase-keepalive.yml` workflow 생성
- 6일마다 SELECT 쿼리 실행으로 활성 상태 유지

**모니터링 계획:**
- 3개월간 keepalive 효과 모니터링
- pause 발생 시 Option B (INSERT 추가) 또는 Option C (Pro 업그레이드) 검토

---

## 5. 성공 지표

| 지표 | 목표 |
|-----|-----|
| Supabase pause 발생 | 0회/분기 |
| biweekly-news 실패율 | 0% (DB 관련) |
| keepalive 성공률 | 100% |

---

## 6. 관련 문서

- [3_pause_implementation.md](./3_pause_implementation.md) - 구현 상세
- [3_pause_todo.md](./3_pause_todo.md) - 작업 체크리스트

---

## 7. 참고 자료

- [Supabase Pause Prevention (GitHub)](https://github.com/travisvn/supabase-pause-prevention)
- [Prevent Supabase Pause with GitHub Actions (DEV)](https://dev.to/jps27cse/how-to-prevent-your-supabase-project-database-from-being-paused-using-github-actions-3hel)
- [Supabase Activity Scheduler (Natt.sh)](https://natt.sh/blog/2024-03-17-supabase-activity-scheduler)
- [Supabase Pricing](https://supabase.com/pricing)
- [Supabase Troubleshooting - Pausing](https://supabase.com/docs/guides/troubleshooting/pausing-pro-projects-vNL-2a)
