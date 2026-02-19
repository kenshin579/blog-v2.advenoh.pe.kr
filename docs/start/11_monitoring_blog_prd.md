# RAG 챗봇 모니터링 블로그 - PRD

## 1. 개요

### 1.1 목적
RAG 챗봇 모니터링 시스템(`8_chatbot_monitoring_prd.md`) 구현 후, 학습한 내용을 블로그 글로 정리한다.
LLM/RAG 애플리케이션 모니터링의 핵심 개념부터 실제 구현까지 다루는 실전 가이드를 작성한다.

### 1.2 대상 독자
- RAG 애플리케이션을 운영 중이거나 운영 예정인 개발자
- LLM 모니터링/Observability에 관심 있는 개발자
- LangSmith, LangFuse 등 LLM 관측 도구를 검토 중인 개발자

### 1.3 선행 조건
- `8_chatbot_monitoring_prd.md` 구현 완료 (피드백, 쿼리 로그, Admin 대시보드)
- LangSmith 트레이싱 연동 완료

### 1.4 관련 Repo
- **Repo**: [ai-chatbot.advenoh.pe.kr](https://github.com/kenshin579/ai-chatbot.advenoh.pe.kr)
- Backend: `backend/` (FastAPI)
- Frontend: `frontend/` (Next.js)

---

## 2. 블로그 구성

### 2.1 시리즈 구성

하나의 글로 작성한다. 분량이 많아지면 2편으로 분리할 수 있다.

| 편 | 제목 (안) | 주요 내용 |
|----|-----------|-----------|
| 1편 | RAG 챗봇 모니터링 - LangSmith와 사용자 피드백으로 품질 관리하기 | LLM 모니터링 개념, LangSmith 연동, 피드백 수집, Admin 대시보드 |
| 2편 (선택) | RAG 챗봇 모니터링 - 품질 지표 분석과 개선 사이클 | 지표 분석, 품질 개선 프로세스, 프로덕션 운영 팁 |

### 2.2 블로그 메타 정보

```yaml
---
title: "RAG 챗봇 모니터링 - LangSmith와 사용자 피드백으로 품질 관리하기"
description: "LLM 애플리케이션의 모니터링이 왜 필요한지, LangSmith 트레이싱과 사용자 피드백 시스템을 어떻게 구축하는지 실전 예제와 함께 정리합니다"
date: 2026-XX-XX
update: 2026-XX-XX
tags:
  - RAG
  - LangSmith
  - LLM
  - 모니터링
  - Observability
  - FastAPI
  - 챗봇
series: "RAG 챗봇 만들기"
---
```

- **카테고리**: `ai`
- **Draft 위치**: `docs/start/rag-chatbot-monitoring/index.md`
- **Publish 위치**: `contents/ai/rag-chatbot-monitoring/`

---

## 3. 블로그 목차

```
# 1. 왜 LLM 모니터링이 필요한가?
  ## 1.1 전통적인 API 모니터링과의 차이점
    - 전통 API: 응답 코드, 레이턴시, 에러율로 충분
    - LLM 앱: "200 OK인데 답변이 엉망" → 품질 모니터링 필수
  ## 1.2 RAG 파이프라인에서 모니터링해야 할 것들
    - Retrieval 품질: 관련 문서를 잘 찾았는가?
    - Generation 품질: 환각(Hallucination) 없이 답변했는가?
    - 응답 시간: Retrieval + Generation 각각의 소요 시간
    - 비용: 토큰 사용량과 API 비용
  ## 1.3 LLM Observability 도구 비교
    - LangSmith vs LangFuse vs Phoenix(Arize) vs Helicone
    - 선택 기준: 가격, LangChain 통합도, 셀프호스팅 여부

# 2. LangSmith 트레이싱 연동
  ## 2.1 LangSmith란?
    - LangChain 팀이 만든 LLM Observability 플랫폼
    - Trace, Run, Feedback 개념 설명
  ## 2.2 프로젝트에 LangSmith 연동하기
    - 환경변수 설정 (LANGCHAIN_TRACING_V2, LANGCHAIN_API_KEY 등)
    - LangChain 코드에서 자동 트레이싱되는 원리
  ## 2.3 LangSmith 대시보드 활용
    - Trace 뷰에서 RAG 파이프라인 단계별 확인
    - 토큰 사용량, 레이턴시 분석
    - 스크린샷과 함께 설명

# 3. 사용자 피드백 시스템 구축
  ## 3.1 왜 사용자 피드백이 중요한가?
    - 자동 평가의 한계 → 실제 사용자 만족도가 핵심
    - Binary feedback (👍👎) vs Likert scale vs 텍스트 피드백
  ## 3.2 피드백 아키텍처 설계
    - 전체 흐름도 (Mermaid 다이어그램)
    - message_id (run_id)를 통한 답변-피드백 연결
  ## 3.3 피드백 API 구현 (FastAPI)
    - POST /feedback 엔드포인트 구현
    - SQLite 저장 + LangSmith Feedback API 연동
    - 코드 예제와 설명
  ## 3.4 프론트엔드 피드백 UI
    - 👍👎 버튼 컴포넌트 구현 (React)
    - 피드백 전송 후 UX 처리 (토스트, 비활성화)

# 4. 쿼리 로그 시스템
  ## 4.1 로그 스키마 설계
    - query_logs 테이블: 질문, 답변, 소스, 응답시간, 검색 결과 유무
    - feedbacks 테이블: 피드백 데이터
    - SQLite 선택 이유 (개인 프로젝트 규모에 적합)
  ## 4.2 로깅 미들웨어 구현
    - /chat 엔드포인트에서 자동 로깅
    - 응답 시간 측정 (time.perf_counter)
    - 검색 실패 판별 로직

# 5. Admin 대시보드 구축
  ## 5.1 대시보드 설계
    - 표시할 지표 정리 (일별 질문 수, 피드백 점수, 인기 질문 등)
    - 와이어프레임 또는 실제 스크린샷
  ## 5.2 통계 API 구현
    - GET /admin/stats 엔드포인트
    - SQLite 집계 쿼리 예제
    - 토큰 인증 (간단한 ADMIN_TOKEN)
  ## 5.3 대시보드 UI 구현
    - recharts를 활용한 차트 컴포넌트
    - 주요 컴포넌트: StatsCard, QueryChart, TopQuestions
    - 실제 대시보드 스크린샷

# 6. 모니터링 지표 해석과 개선 사이클
  ## 6.1 핵심 모니터링 지표 (KPI)
    - 피드백 점수 (👍 비율)
    - 검색 실패율
    - 평균 응답 시간
    - 일별/주별 사용량 추이
  ## 6.2 지표 기반 개선 프로세스
    - 검색 실패율 높음 → 인덱싱 범위 확장, 청킹 전략 변경
    - 👎 비율 높음 → 프롬프트 튜닝, Re-ranking 도입
    - 응답 시간 느림 → 캐싱, 모델 변경
    - 피드백 루프 다이어그램 (Mermaid)

# 7. 마무리
  ## 7.1 전체 아키텍처 요약
    - 모니터링 시스템 전체 구성도 (Mermaid)
  ## 7.2 향후 개선 방향
    - LLM-as-a-Judge 자동 평가 도입
    - 알림 시스템 (Slack 연동)
    - A/B 테스트 (프롬프트 버전별 성능 비교)

# 참고
```

---

## 4. 작성 규칙

- **샘플 코드**: `ai-chatbot.advenoh.pe.kr` 리포의 실제 구현 코드를 참조/링크
- **다이어그램**: Mermaid 형식으로 작성 (ASCII art 금지)
- **스크린샷**: LangSmith 대시보드, Admin 대시보드 실제 화면 캡처 포함
- **Draft 위치**: `docs/start/rag-chatbot-monitoring/index.md`에 초안 작성
- **Publish**: 리뷰 후 `contents/ai/rag-chatbot-monitoring/`으로 이동

---

## 5. 필요한 이미지/다이어그램 목록

| 번호 | 유형 | 설명 |
|------|------|------|
| 1 | Mermaid | LLM 모니터링 vs 전통 API 모니터링 비교 |
| 2 | Mermaid | 피드백 시스템 전체 흐름도 (사용자 → API → SQLite + LangSmith) |
| 3 | 스크린샷 | LangSmith Trace 뷰 (RAG 파이프라인 단계별) |
| 4 | 스크린샷 | LangSmith Feedback 대시보드 |
| 5 | Mermaid | 쿼리 로그 ERD (query_logs, feedbacks 테이블) |
| 6 | 스크린샷 | Admin 대시보드 실제 화면 |
| 7 | Mermaid | 모니터링 지표 기반 개선 사이클 (피드백 루프) |
| 8 | Mermaid | 전체 모니터링 아키텍처 구성도 |

---

## 6. 구현 순서 (마일스톤)

| 단계 | 작업 | 산출물 |
|------|------|--------|
| M1 | `8_chatbot_monitoring_prd.md` 구현 완료 | 모니터링 시스템 동작 |
| M2 | LangSmith 대시보드 + Admin 대시보드 스크린샷 확보 | 블로그용 이미지 |
| M3 | 블로그 초안 작성 (섹션 1~4: 개념 + 구현) | `docs/start/rag-chatbot-monitoring/index.md` |
| M4 | 블로그 초안 작성 (섹션 5~7: 대시보드 + 개선 사이클 + 마무리) | 초안 완성 |
| M5 | PR 생성 + 리뷰 | 리뷰 완료 |
| M6 | `contents/ai/rag-chatbot-monitoring/`으로 이동 후 Publish | 블로그 게시 |

---

## 7. 참고 자료

- [LangSmith Documentation](https://docs.smith.langchain.com/)
- [LangSmith Feedback & Annotation](https://docs.smith.langchain.com/evaluation/how_to_guides/annotation)
- [LangFuse - Open Source LLM Observability](https://langfuse.com/)
- [Arize Phoenix - LLM Observability](https://phoenix.arize.com/)
- [Helicone - LLM Monitoring](https://www.helicone.ai/)
- [Building LLM-Powered Applications: Monitoring (Chip Huyen)](https://huyenchip.com/2023/04/11/llm-engineering.html)
- [recharts Documentation](https://recharts.org/)
