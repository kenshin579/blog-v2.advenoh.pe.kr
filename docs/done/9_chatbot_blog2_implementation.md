# RAG 기반 블로그 Q&A 챗봇 - 블로그 편 2 Implementation

## 1. 블로그 개요

- **편**: 2편 (프롬프트 엔지니어링과 RAG 최적화)
- **카테고리**: `llm`
- **Draft 위치**: `docs/start/{글-제목}/index.md`
- **Publish 위치**: `contents/{카테고리}/{글-제목}/index.md`

---

## 2. 리서치 항목

| 주제 | 핵심 내용 | 참고 자료 |
|------|----------|----------|
| Zero/Few-shot | 예제 유무에 따른 프롬프트 전략 | OpenAI Cookbook |
| CoT | 단계별 추론 유도 방법 | Wei et al. 논문 |
| Role-specific | 시스템 프롬프트 설계 패턴 | OpenAI 가이드 |
| RAG 프롬프트 | 컨텍스트 활용 + "모를 때" 처리 | LangChain Prompts |
| Hybrid Search | BM25 + 벡터 검색 결합 | LangChain Retrievers |
| Re-ranking | Cohere Rerank, Cross-encoder | Cohere 문서 |
| RAFT | RAG + Fine-tuning 결합 학습 | Microsoft RAFT 논문 |
| RAGAS 평가 | Context Relevance, Faithfulness, Answer Correctness | RAGAS 문서 |
| 프롬프트 인젝션 | 방어 전략과 사례 | OWASP LLM Top 10 |

## 3. 다이어그램 (Mermaid)

- 프롬프트 엔지니어링 기법 분류 다이어그램
- Hybrid Search + Re-ranking 흐름 (키워드 + 벡터 → 결합 → Re-ranking)
- RAFT 학습 프로세스 (Oracle/Distractor 문서)
- RAGAS 평가 파이프라인

## 4. 코드 예제 (`tutorials-python/ai/rag/`에서 참조)

- 프롬프트 템플릿 예제
- Hybrid Search 구현
- RAGAS 평가 코드
- 평가 데이터셋 구성

---

## 5. 블로그 작성 규칙

- **코드**: 블로그 내 코드 블록은 핵심 부분만 발췌, 전체 코드는 GitHub 링크로 참조
- **다이어그램**: Mermaid 형식만 사용 (ASCII art 금지)
- **비교표**: 기술 비교 시 표(table) 형식 활용
- **인코딩**: UTF-8 필수, 작성 후 `file -I` 로 확인
- **frontmatter**: title, date, update, description, tags, category 포함

### 5.1 frontmatter 예시

```yaml
---
title: "RAG 기반 블로그 Q&A 챗봇 만들기 (2) - 프롬프트 엔지니어링과 RAG 최적화"
description: "프롬프트 엔지니어링 기법, Hybrid Search, Re-ranking, RAFT, RAGAS 평가 등 RAG 최적화 기법을 소개한다"
date: TBD
update: TBD
tags:
  - rag
  - prompt-engineering
  - langchain
  - ragas
  - hybrid-search
  - re-ranking
  - raft
category: llm
series: "RAG 기반 블로그 Q&A 챗봇 만들기"
---
```
