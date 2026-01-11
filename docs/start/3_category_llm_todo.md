# AI 기반 카테고리 분류 시스템 - TODO

## Phase 1: 환경 설정

- [ ] OpenAI API 키 발급 및 설정
  - [ ] [OpenAI Platform](https://platform.openai.com/api-keys)에서 API 키 생성
  - [ ] `~/.zshrc`에 `OPENAI_API_KEY` 환경변수 추가
  - [ ] 환경변수 적용 확인: `echo $OPENAI_API_KEY`

- [ ] 의존성 추가
  - [ ] `scripts/news/pyproject.toml`에 `openai>=1.0.0`, `pydantic>=2.0.0` 추가
  - [ ] 의존성 설치: `cd scripts/news && pip install -e .`

---

## Phase 2: AI 분류 모듈 구현

> **Note**: OpenAI SDK 최신 코드는 [Context7](https://context7.com/openai/openai-python)에서 확인

- [ ] `ai_categorizer.py` 파일 생성
  - [ ] `scripts/news/category/ai_categorizer.py` 생성
  - [ ] 상수 정의 (MODEL, BATCH_SIZE, TEMPERATURE)
  - [ ] SYSTEM_PROMPT 작성

- [ ] Pydantic 모델 정의 (구조화된 출력)
  - [ ] `CategoryType` - Literal 타입으로 카테고리 제한
  - [ ] `Classification` - 단일 분류 결과 모델
  - [ ] `ClassificationResponse` - 전체 응답 모델

- [ ] 핵심 함수 구현
  - [ ] `categorize_with_ai()` - 메인 분류 함수
  - [ ] `_classify_batch()` - `client.chat.completions.parse()` 사용
  - [ ] `_apply_classifications()` - 파싱된 응답 적용

- [ ] Fallback 로직 구현
  - [ ] `categorize_with_fallback()` - 에러 시 키워드 매칭 전환
  - [ ] 예외 처리 (API 실패, refusal 처리 등)

---

## Phase 3: main.py 통합

- [ ] main.py 수정
  - [ ] `categorize_with_fallback` import 추가
  - [ ] 기존 `categorize_articles` 호출을 `categorize_with_fallback`으로 변경
  - [ ] 분류 결과 로깅 추가

---

## Phase 4: 로컬 테스트

- [ ] 단위 테스트
  - [ ] API 연결 테스트
  - [ ] 분류 정확도 테스트 (샘플 데이터)
  - [ ] Fallback 동작 테스트

- [ ] 통합 테스트
  ```bash
  cd scripts/news
  python -c "
  from category.ai_categorizer import categorize_with_ai

  test_articles = [
      {'title': '2026년 프론트엔드 트렌드: 언어·인프라·AI', 'url': 'test1'},
      {'title': '클로드 코드로 3일 만에 서비스 복구', 'url': 'test2'},
      {'title': 'strcpy도 사용 금지', 'url': 'test3'},
  ]

  result = categorize_with_ai(test_articles)
  for r in result:
      print(f'{r[\"category\"]}: {r[\"title\"]}')
  "
  ```
  - [ ] 예상 결과 확인:
    - Development: 프론트엔드 트렌드
    - AI / ML: 클로드 코드
    - Security 또는 Development: strcpy

---

## Phase 5: GitHub Action 설정

- [ ] GitHub Secrets 추가
  - [ ] Repository Settings → Secrets and variables → Actions
  - [ ] `OPENAI_API_KEY` 시크릿 추가

- [ ] workflow 파일 수정
  - [ ] `.github/workflows/biweekly-news.yml`에 환경변수 추가
  ```yaml
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  ```

---

## Phase 6: 운영 테스트 및 배포

- [ ] workflow 수동 실행 테스트
  - [ ] GitHub Actions → Run workflow
  - [ ] PR 생성 확인
  - [ ] 분류 결과 검토

- [ ] 분류 정확도 검증
  - [ ] Misc 비율 확인 (목표: 10% 이하)
  - [ ] 잘못 분류된 글 확인
  - [ ] 필요시 프롬프트 조정

- [ ] 운영 배포
  - [ ] main 브랜치에 병합
  - [ ] 다음 스케줄 실행 모니터링

---

## 검증 체크리스트

- [ ] AI 분류가 정상 동작하는가?
- [ ] API 실패 시 fallback이 동작하는가?
- [ ] Misc 비율이 10% 이하인가?
- [ ] GitHub Action에서 정상 실행되는가?
- [ ] 비용이 예상 범위 내인가? (월 $0.01 이하)
