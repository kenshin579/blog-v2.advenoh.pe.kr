# Supabase Pause 방지 구현 문서

## 1. 개요

Supabase Free tier의 7일 비활성 pause 정책을 우회하기 위해 6일마다 자동으로 DB에 쿼리를 실행하는 GitHub Action을 구현한다.

## 2. 구현 내용

### 2.1 GitHub Action Workflow 생성

**파일 경로:** `.github/workflows/supabase-keepalive.yml`

```yaml
name: Supabase Keepalive

on:
  schedule:
    # 6일마다 실행 (00:00 UTC)
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

          result = client.table('collected_articles').select('id').limit(1).execute()
          print(f'Keepalive ping successful: {len(result.data)} rows checked')
          "
```

### 2.2 핵심 로직

| 항목 | 값 |
|-----|---|
| 실행 주기 | 6일마다 (cron: `0 0 */6 * *`) |
| 실행 쿼리 | `SELECT id FROM collected_articles LIMIT 1` |
| 사용 시크릿 | `BLOG_IT_NEWS_SUPABASE_URL`, `BLOG_IT_NEWS_SUPABASE_API_KEY` |

### 2.3 사용하는 GitHub Secrets

기존 `biweekly-news.yml`에서 사용 중인 시크릿을 재사용:

- `BLOG_IT_NEWS_SUPABASE_URL`: Supabase 프로젝트 URL
- `BLOG_IT_NEWS_SUPABASE_API_KEY`: Supabase API 키

## 3. 테스트 방법

### 3.1 수동 실행 테스트

```bash
# GitHub CLI로 workflow 수동 실행
gh workflow run supabase-keepalive.yml

# 실행 결과 확인
gh run list --workflow=supabase-keepalive.yml
```

### 3.2 로그 확인

GitHub Actions 탭에서 실행 로그 확인:
- `Keepalive ping successful: X rows checked` 메시지 출력되면 성공

## 4. 모니터링

### 4.1 실패 시 알림

GitHub Actions는 기본적으로 실패 시 이메일 알림을 보냄.
추가 알림이 필요하면 Slack 연동 고려.

### 4.2 Pause 발생 시 대응

1. Supabase 대시보드에서 수동 unpause
2. 단순 SELECT로 부족하면 INSERT 로직 추가 (Option B)
