# RAG 기반 블로그 Q&A 챗봇 만들기 (3) - 토이 프로젝트 AI-Chat 구현 블로그 PRD

## 1. 개요

### 1.1 목적

RAG 시리즈 편 1(개념), 편 2(최적화)에서 다룬 이론과 기법을 실제 토이 프로젝트 **ai-chatbot.advenoh.pe.kr**에 적용한 과정을 블로그로 정리한다. 프로덕션 수준의 RAG 챗봇을 설계, 구현, 배포하기까지의 전체 여정을 다룬다.

### 1.2 시리즈 맥락

| 편 | 제목 | 핵심 내용 | 상태 |
|----|------|-----------|------|
| 1편 | LLM 적응 기법과 RAG 개념 | LLM 한계, Fine-tuning vs RAG, RAG 파이프라인, 기본 구현 | Draft 완료 |
| 2편 | 프롬프트 엔지니어링과 RAG 최적화 | Prompt 기법, Hybrid Search, Re-ranking, RAGAS 평가 | Draft 완료 |
| **3편** | **토이 프로젝트: AI-Chat 구현기** | **프로덕션 아키텍처, 멀티블로그 RAG, 배포** | **이번 PRD** |

### 1.3 대상 독자

- RAG 개념은 알지만 실제 프로젝트로 구현해보고 싶은 개발자
- FastAPI + Next.js 풀스택 구성에 관심 있는 개발자
- 개인 블로그에 AI 챗봇을 붙이고 싶은 개발자

### 1.4 관련 Repo

- **Repo**: [ai-chatbot.advenoh.pe.kr](https://github.com/kenshin579/ai-chatbot.advenoh.pe.kr)
- **Backend**: `backend/` (FastAPI + LangChain + ChromaDB)
- **Frontend**: `frontend/` (Next.js 16 + React 19 + shadcn/ui)
- **Helm Charts**: `charts/ai-chatbot-fe/`, `charts/ai-chatbot-be/`

---

## 2. 블로그 구성

### 2.1 시리즈 구성

하나의 글로 작성한다. 분량이 많아지면 (3-1), (3-2)로 분리할 수 있다.

| 편 | 제목 (안) | 주요 내용 |
|----|-----------|-----------|
| 3편 | RAG 기반 블로그 Q&A 챗봇 만들기 (3) - 토이 프로젝트: AI-Chat 구현기 | 프로젝트 구조, 멀티블로그 RAG, 대화형 UI, Admin 대시보드, K8s 배포 |

### 2.2 블로그 메타 정보

```yaml
---
title: "RAG 기반 블로그 Q&A 챗봇 만들기 (3) - 토이 프로젝트: AI-Chat 구현기"
description: "편 1~2에서 다룬 RAG 이론을 실제 토이 프로젝트에 적용하여 멀티블로그 Q&A 챗봇을 구현하고, FastAPI + Next.js 풀스택 아키텍처와 K8s 배포까지의 과정을 정리한다"
date: 2026-XX-XX
update: 2026-XX-XX
tags:
  - rag
  - langchain
  - fastapi
  - nextjs
  - chromadb
  - chatbot
  - kubernetes
  - docker
  - argocd
  - shadcn-ui
category: llm
series: "RAG 기반 블로그 Q&A 챗봇 만들기"
---
```

- **Draft 위치**: `docs/start/rag-기반-블로그-qa-챗봇-만들기-3-토이-프로젝트-ai-chat-구현기/index.md`
- **Publish 위치**: `contents/llm/rag-기반-블로그-qa-챗봇-만들기-3-토이-프로젝트-ai-chat-구현기/`

---

## 3. 블로그 목차

```
# 1. 프로젝트 소개
  ## 1.1 무엇을 만들었나?
    - 블로그 콘텐츠에 질문하면 답변해주는 RAG 챗봇
    - 독립 사이트(ai-chatbot.advenoh.pe.kr) + 블로그 임베드 위젯 2가지 형태
    - 실제 동작 스크린샷 (독립 사이트, 블로그 임베드 채팅 창)
    - 데모 링크 (있다면)
  ## 1.2 왜 만들었나?
    - 편 1~2에서 학습한 RAG 이론을 실전에 적용
    - 블로그 글이 300개 이상 → 독자가 원하는 글을 찾기 어려움
    - LLM 기반 Q&A로 블로그 콘텐츠 접근성 향상
  ## 1.3 기술 스택
    - 표로 정리: Frontend(Next.js 16, React 19, shadcn/ui, Tailwind CSS 4)
    - Backend(FastAPI, LangChain, ChromaDB, OpenAI gpt-4o-mini)
    - Infra(Docker, K8s, ArgoCD, GitHub Actions)
    - DB(MySQL - 쿼리 로그/피드백, ChromaDB - 벡터 저장)

# 2. 전체 아키텍처
  ## 2.1 시스템 구성도
    - Mermaid 다이어그램: 3가지 클라이언트(ai-chatbot 사이트, blog-v2 위젯, investment 위젯) → 공통 Backend → ChromaDB/OpenAI/MySQL
    - K8s 클러스터 내 서비스 배치도
  ## 2.2 프로젝트 디렉토리 구조
    - 모노레포 구조: frontend/, backend/, scripts/
    - 각 디렉토리의 역할 설명
  ## 2.3 데이터 흐름
    - Mermaid sequence diagram: 질문 → 임베딩 → ChromaDB 검색 → LLM 답변 생성 → 응답

# 3. Backend 구현 (FastAPI + LangChain)
  ## 3.1 RAG 파이프라인 - 프로젝트 적용 포인트
    - 편 1~2에서 다룬 파이프라인 개념은 생략, "이 프로젝트에서 어떻게 적용했는가"에 집중
    - 파이프라인 전체 구조를 Mermaid로 한 번 보여주고, 각 모듈 파일 매핑만 간략히
      (document_loader.py → chunker.py → embedder.py → vector_store.py → retriever.py → chain.py)
    ### 3.1.1 블로그 마크다운 특화 처리
      - YAML frontmatter에서 title/date/tags/category 메타데이터 추출
      - 블로그별 contents 디렉토리 경로 설정
      - 일반 문서와 달리 블로그 마크다운에서 겪은 이슈 (코드블록 청킹, 한글 처리 등)
    ### 3.1.2 설정값 결정 과정
      - chunk_size=1000, chunk_overlap=200을 선택한 이유와 실험 결과
      - top_k=5 설정 근거
      - Hybrid Search ON/OFF 비교 (USE_HYBRID_SEARCH 환경변수)
    ### 3.1.3 대화 이력 기반 질문 재구성
      - 편 1~2에서 다루지 않은 내용: ContextualizeQ 체인
      - 멀티턴 대화에서 "이전 질문 맥락"을 반영한 질문 재작성
      - 구현 코드와 실제 동작 예시
  ## 3.2 멀티블로그 지원
    - config.py의 blog_collections 딕셔너리
    - blog_id → ChromaDB collection 매핑 구조
    - IT 블로그(blog-v2) + 투자 블로그(investment) 동시 지원
  ## 3.3 API 설계
    - POST /chat: 질문, blog_id, chat_history → 답변, 소스, message_id
    - POST /index/{blog_id}: 문서 재인덱싱 (Bearer token 인증)
    - POST /feedback: 사용자 피드백 저장
    - GET /admin/stats: 대시보드 통계
    - GET /health: 헬스체크
  ## 3.4 데이터베이스 설계
    - QueryLog 테이블: 질문/답변/소스/응답시간/검색결과유무
    - Feedback 테이블: message_id별 👍👎 피드백
    - Liquibase로 스키마 마이그레이션 관리

# 4. Frontend 구현

  ## 4.1 독립 사이트 (ai-chatbot.advenoh.pe.kr)
    - Next.js 16 + React 19 + shadcn/ui + Tailwind CSS 4
    - ChatWindow → MessageList + ChatInput 컴포넌트 구조
    - 메시지 상태 관리 (messages, loading, error)
    - 출처(Sources) 표시 UI (SourceLinks 컴포넌트)
    - BlogContext로 블로그 전환 (blog-v2 ↔ investment)
    - Admin 대시보드 (/admin): 통계 카드, 일별 쿼리 차트, 인기 질문 (recharts)

  ## 4.2 블로그 임베드 채팅 위젯
    ### 4.2.1 구현 방식
      - 각 블로그(blog-v2, investment)에 플로팅 채팅 버튼 + 채팅 창 직접 구현
      - layout.tsx에 ChatButton 컴포넌트 추가 → 모든 페이지에서 접근 가능
      - framer-motion으로 부드러운 열기/닫기 애니메이션
    ### 4.2.2 blog-v2 임베드
      - 컴포넌트: components/chat/ (ChatButton, ChatWindow, MessageList, ChatInput, SourceLinks)
      - API: lib/chat-api.ts → POST /chat (blog_id: "blog-v2")
      - 한국어 UI: "블로그 Q&A", "블로그에 대해 궁금한 것을 물어보세요?"
      - 피드백 시스템 포함 (thumbs up/down + message_id 추적)
    ### 4.2.3 investment 블로그 임베드
      - 동일한 컴포넌트 구조 (blog-v2와 유사)
      - API: chat-api.ts → POST /chat (blog_id: "investment")
      - 한국어 UI: "투자 블로그 Q&A", "투자에 대해 궁금한 것을 물어보세요?"
    ### 4.2.4 독립 사이트 vs 임베드 위젯 비교
      - 공통: 동일한 Backend API 사용, 멀티턴 대화, 출처 표시
      - 차이: 독립 사이트는 Admin 대시보드/블로그 전환 제공, 위젯은 blog_id 고정
      - 위젯 장점: 블로그 읽는 중 바로 질문 가능 (컨텍스트 전환 불필요)

  ## 4.3 피드백 UI
    - 답변 하단 thumbs up/down 버튼
    - 피드백 전송 상태 관리 (idle → sending → done)
    - POST /feedback API 호출 (message_id, blog_id, question, rating)

# 5. 운영 & 개선
  ## 6.1 실제 사용 데이터 분석
    - Admin 대시보드에서 확인한 사용 패턴
    - 자주 묻는 질문 TOP 5
    - 검색 실패율과 피드백 결과
  ## 6.2 발견한 문제와 해결
    - 예: 한글 청킹 이슈, 긴 문서 검색 품질, 응답 속도 등
    - 편 2 기법 적용 결과는 간단히 언급 + 편 2 링크 (이론 재설명 금지)
  ## 6.3 향후 개선 계획
    - Streaming 응답
    - 멀티모달 지원 (이미지 포함 문서)
    - LangSmith 모니터링 고도화

# 6. 마무리
  ## 6.1 시리즈 회고
    - 편 1~3 전체 여정 요약
    - 이론(편 1~2) → 실전(편 3)으로의 전환에서 배운 점
  ## 6.2 토이 프로젝트 팁
    - 개인 프로젝트에 RAG 적용 시 고려사항
    - 비용 최적화 (gpt-4o-mini, text-embedding-3-small 등)
    - ChromaDB vs 유료 벡터DB 선택 기준

# 참고
```

---

## 4. 작성 규칙

### 4.1 코드 작성 규칙
- 샘플 코드는 `ai-chatbot.advenoh.pe.kr` 리포의 실제 구현 코드를 참조/인용
- 코드 블록에 파일 경로 주석 포함 (예: `# backend/app/rag/chain.py`)
- 핵심 코드만 발췌하고 GitHub 링크로 전체 코드 안내

### 4.2 다이어그램 규칙
- Mermaid 형식으로 작성 (ASCII art 금지)
- flowchart, sequence, ER diagram 등 적절한 타입 선택

### 4.3 1~2편과의 중복 방지
- **금지**: 편 1~2에서 이미 설명한 개념/이론을 다시 설명하지 않는다
  - 예: RAG 정의, 청킹 전략 종류, Hybrid Search 원리, 프롬프트 기법 비교 등
- **허용**: "편 1 참조" 링크와 함께 **이 프로젝트에서의 구현 결정/차이점**만 서술
  - 예: "청킹 전략은 편 1 참조. 이 프로젝트에서는 chunk_size=1000으로 설정했는데, 블로그 글 평균 길이가 X자이기 때문이다"
- 3편만의 고유 내용에 집중: 멀티블로그 구조, 블로그 임베드 위젯, API/DB 설계, 배포, 운영 데이터

### 4.4 스타일
- 구현 과정 중심 서술 (왜 이 기술을 선택했는지, 어떤 문제가 있었는지)
- 이론 반복 최소화 → "편 1/2 참조" 링크로 대체
- 실제 동작 스크린샷 적극 활용

---

## 5. 필요한 이미지/다이어그램 목록

| 번호 | 유형 | 설명 |
|------|------|------|
| 1 | 스크린샷 | AI-Chat 독립 사이트 채팅 화면 (질문 → 답변 + 출처) |
| 2 | 스크린샷 | 블로그 선택 UI (blog-v2 ↔ investment) |
| 3 | 스크린샷 | blog-v2 블로그에 임베드된 플로팅 채팅 위젯 |
| 4 | 스크린샷 | investment 블로그에 임베드된 플로팅 채팅 위젯 |
| 5 | Mermaid | 전체 시스템 아키텍처 (독립 사이트 + 블로그 위젯 2개 → 공통 Backend) |
| 6 | Mermaid | RAG 파이프라인 데이터 흐름 (sequence diagram) |
| 7 | Mermaid | 멀티블로그 collection 분리 구조 |
| 8 | 스크린샷 | Admin 대시보드 (통계 카드, 차트, 인기 질문) |
| 9 | 스크린샷 | 피드백 UI (thumbs up/down 버튼 동작) |

---

## 6. 구현 순서 (마일스톤)

| 단계 | 작업 | 산출물 |
|------|------|--------|
| M1 | ai-chatbot 프로젝트 코드 리뷰 & 정리 | 블로그에 인용할 핵심 코드 스니펫 목록 |
| M2 | 스크린샷 확보 (채팅 UI, Admin, 피드백) | 블로그용 이미지 파일 |
| M3 | 블로그 초안 작성 (섹션 1~3: 소개 + 아키텍처 + Backend) | Draft index.md 전반부 |
| M4 | 블로그 초안 작성 (섹션 4~6: Frontend + 운영/개선 + 마무리) | Draft index.md 완성 |
| M5 | 편 1~2 시리즈 네비게이션 업데이트 | 1, 2편에 3편 링크 추가 |
| M6 | PR 생성 + 리뷰 | 리뷰 완료 |
| M7 | `contents/llm/`으로 이동 후 Publish | 블로그 게시 |

---

## 7. 편 1~2 업데이트 사항

3편 게시 시 기존 편에 다음 내용 추가:

### 7.1 편 1 수정
- 시리즈 네비게이션에 편 3 링크 추가:
  ```
  > - **편 3**: [토이 프로젝트: AI-Chat 구현기](../rag-기반-블로그-qa-챗봇-만들기-3-토이-프로젝트-ai-chat-구현기)
  ```

### 7.2 편 2 수정
- 시리즈 네비게이션에 편 3 링크 추가 (동일)

---

## 8. 참고 자료

- [ai-chatbot.advenoh.pe.kr GitHub](https://github.com/kenshin579/ai-chatbot.advenoh.pe.kr)
- [LangChain Documentation](https://python.langchain.com/)
- [ChromaDB Documentation](https://docs.trychroma.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
